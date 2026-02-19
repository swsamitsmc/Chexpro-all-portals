/**
 * Vendor Health Check Worker
 * 
 * Runs every 60 seconds to check vendor API health status.
 * Uses the vendor's healthCheckUrl field (not apiEndpoint).
 * 
 * Actions on failure:
 * - If health check fails, mark vendor as OFFLINE status
 * - Creates VendorIssue with critical severity
 * - Sends notifications to relevant admins
 */

import axios, { AxiosError } from 'axios';
import prisma from '../config/prisma';
import logger from '../config/logger';
import { publishToChannel, PUBSUB_CHANNELS } from './index';

interface HealthCheckResult {
  vendorId: string;
  vendorName: string;
  status: 'online' | 'offline' | 'degraded';
  latencyMs: number | null;
  errorMessage: string | null;
  checkedAt: Date;
}

interface HealthCheckSummary {
  timestamp: Date;
  vendorsChecked: number;
  vendorsOnline: number;
  vendorsOffline: number;
  vendorsDegraded: number;
  results: HealthCheckResult[];
}

export async function processVendorHealthChecks(): Promise<HealthCheckSummary> {
  logger.info('Starting vendor health check cycle');
  
  const startTime = Date.now();
  const results: HealthCheckResult[] = [];
  
  // Get all active vendors with a health check URL
  const vendors = await prisma.vendor.findMany({
    where: {
      status: { in: ['active', 'offline', 'maintenance'] },
      healthCheckUrl: { not: null },
    },
    select: {
      id: true,
      name: true,
      displayName: true,
      status: true,
      healthCheckUrl: true,
      contactEmail: true,
      supportEmail: true,
    },
  });

  logger.info(`Found ${vendors.length} vendors to check`);

  for (const vendor of vendors) {
    if (!vendor.healthCheckUrl) {
      continue;
    }

    const result = await checkVendorHealth(vendor);
    results.push(result);
    
    // Update vendor status if needed
    await updateVendorStatus(result);
    
    // Create vendor issue if vendor just went offline
    if (result.status === 'offline' && vendor.status !== 'offline') {
      await createVendorIssue(result);
    }
  }

  const summary: HealthCheckSummary = {
    timestamp: new Date(),
    vendorsChecked: results.length,
    vendorsOnline: results.filter(r => r.status === 'online').length,
    vendorsOffline: results.filter(r => r.status === 'offline').length,
    vendorsDegraded: results.filter(r => r.status === 'degraded').length,
    results,
  };

  const duration = Date.now() - startTime;
  logger.info(`Vendor health check completed in ${duration}ms`, {
    vendorsChecked: summary.vendorsChecked,
    vendorsOnline: summary.vendorsOnline,
    vendorsOffline: summary.vendorsOffline,
    vendorsDegraded: summary.vendorsDegraded,
  });

  // Publish status change to channel for real-time updates
  await publishToChannel(PUBSUB_CHANNELS.VENDOR_STATUS_CHANGED, {
    type: 'health_check_completed',
    timestamp: summary.timestamp,
    summary: {
      online: summary.vendorsOnline,
      offline: summary.vendorsOffline,
      degraded: summary.vendorsDegraded,
    },
  });

  return summary;
}

async function checkVendorHealth(vendor: {
  id: string;
  name: string;
  displayName: string | null;
  status: string;
  healthCheckUrl: string | null;
}): Promise<HealthCheckResult> {
  const startTime = Date.now();
  
  try {
    // Make health check request with 10 second timeout
    const response = await axios.get(vendor.healthCheckUrl!, {
      timeout: 10000,
      validateStatus: (status) => status < 500, // Accept any 2xx or 4xx
    });

    const latencyMs = Date.now() - startTime;
    const httpStatus = response.status;

    // Determine status based on response
    let status: 'online' | 'offline' | 'degraded' = 'online';
    let errorMessage: string | null = null;

    if (httpStatus >= 200 && httpStatus < 300) {
      // Check if response indicates degraded state
      if (response.data?.status === 'degraded' || response.data?.healthy === false) {
        status = 'degraded';
        errorMessage = response.data?.message || 'Vendor reported degraded status';
      }
      // Otherwise status is online
    } else if (httpStatus >= 400 && httpStatus < 500) {
      // Client errors - vendor is online but returning errors
      status = 'degraded';
      errorMessage = `HTTP ${httpStatus}: ${response.statusText}`;
    } else {
      // Server errors (5xx)
      status = 'offline';
      errorMessage = `HTTP ${httpStatus}: ${response.statusText}`;
    }

    return {
      vendorId: vendor.id,
      vendorName: vendor.displayName || vendor.name,
      status,
      latencyMs,
      errorMessage,
      checkedAt: new Date(),
    };
  } catch (error) {
    const latencyMs = Date.now() - startTime;
    const axiosError = error as AxiosError;
    
    let errorMessage: string;
    if (axiosError.code === 'ECONNABORTED' || axiosError.code === 'ETIMEDOUT') {
      errorMessage = 'Health check request timed out';
    } else if (axiosError.code === 'ECONNREFUSED') {
      errorMessage = 'Connection refused - vendor may be down';
    } else if (axiosError.code === 'ENOTFOUND') {
      errorMessage = 'Health check URL not found';
    } else {
      errorMessage = axiosError.message || 'Unknown error during health check';
    }

    logger.warn(`Vendor health check failed for ${vendor.name}`, {
      vendorId: vendor.id,
      error: errorMessage,
      latencyMs,
    });

    return {
      vendorId: vendor.id,
      vendorName: vendor.displayName || vendor.name,
      status: 'offline',
      latencyMs,
      errorMessage,
      checkedAt: new Date(),
    };
  }
}

async function updateVendorStatus(result: HealthCheckResult): Promise<void> {
  const currentVendor = await prisma.vendor.findUnique({
    where: { id: result.vendorId },
    select: { status: true },
  });

  if (!currentVendor) return;

  // Map health check status to vendor status
  let newStatus: 'active' | 'offline' | 'maintenance' | 'degraded' | 'inactive' | 'suspended' = 'active';
  
  switch (result.status) {
    case 'online':
      // Restore to active if was offline
      newStatus = 'active';
      break;
    case 'degraded':
      // Keep as active but could add a degraded flag
      newStatus = 'active';
      break;
    case 'offline':
      newStatus = 'offline';
      break;
  }

  // Only update if status changed
  if (currentVendor.status !== newStatus) {
    await prisma.vendor.update({
      where: { id: result.vendorId },
      data: { status: newStatus },
    });

    logger.info(`Vendor status updated: ${result.vendorName} -> ${newStatus}`, {
      vendorId: result.vendorId,
      previousStatus: currentVendor.status,
      newStatus,
      healthCheckStatus: result.status,
    });
  }
}

async function createVendorIssue(result: HealthCheckResult): Promise<void> {
  // Check if there's already an open critical issue for this vendor
  const existingIssue = await prisma.vendorIssue.findFirst({
    where: {
      vendorId: result.vendorId,
      status: { in: ['open', 'in_progress'] },
      severity: 'critical',
    },
  });

  if (existingIssue) {
    // Update existing issue with new failure
    await prisma.vendorIssue.update({
      where: { id: existingIssue.id },
      data: {
        description: `Health check failure: ${result.errorMessage || 'Unknown error'}. Previous failure: ${existingIssue.description.slice(0, 200)}`,
        affectedOrders: existingIssue.affectedOrders + 1,
        updatedAt: new Date(),
      },
    });
    return;
  }

  // Create new critical issue
  await prisma.vendorIssue.create({
    data: {
      vendorId: result.vendorId,
      issueType: 'api_failure',
      description: `Vendor health check failed: ${result.errorMessage || 'Unknown error'}. Latency: ${result.latencyMs}ms`,
      severity: 'critical',
      status: 'open',
      affectedOrders: 0, // Could query for actual affected orders
    },
  });

  logger.warn(`Created critical vendor issue for ${result.vendorName}`, {
    vendorId: result.vendorId,
    error: result.errorMessage,
  });

  // TODO: Send notifications to vendor contacts
  // This could add jobs to the notification queue
}

/**
 * Manual trigger for vendor health check (can be called from API)
 */
export async function checkSingleVendor(vendorId: string): Promise<HealthCheckResult | null> {
  const vendor = await prisma.vendor.findUnique({
    where: { id: vendorId },
    select: {
      id: true,
      name: true,
      displayName: true,
      status: true,
      healthCheckUrl: true,
    },
  });

  if (!vendor || !vendor.healthCheckUrl) {
    logger.warn(`Vendor not found or no health check URL: ${vendorId}`);
    return null;
  }

  const result = await checkVendorHealth(vendor);
  await updateVendorStatus(result);

  return result;
}
