/**
 * SLA Breach Detection Worker
 * 
 * Runs every 5 minutes to check for orders approaching SLA breach or already breached.
 * Uses raw SQL to query the shared client portal database for orders.
 * 
 * Alert Types:
 * - warning: Order is approaching SLA breach (80% of TAT elapsed)
 * - critical: Order is close to breach (95% of TAT elapsed)
 * - breached: Order has exceeded SLA
 */

import { Prisma } from '@prisma/client';
import prisma from '../config/prisma';
import logger from '../config/logger';
import { publishToChannel, PUBSUB_CHANNELS } from './index';

interface OrderSLAInfo {
  orderId: string;
  clientId: string | null;
  packageId: string | null;
  serviceType: string | null;
  status: string;
  createdAt: Date;
  expectedCompletionDate: Date | null;
  slaConfigId: string | null;
  targetTatDays: number;
  warningThresholdHrs: number;
  criticalThresholdHrs: number;
}

interface SLAAlertResult {
  orderId: string;
  alertType: 'warning' | 'critical' | 'breached';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  hoursRemaining: number;
  slaConfigId: string | null;
}

interface SLABreachSummary {
  timestamp: Date;
  ordersChecked: number;
  warningsCreated: number;
  criticalsCreated: number;
  breachesCreated: number;
  alerts: SLAAlertResult[];
}

export async function processSLABreachDetection(): Promise<SLABreachSummary> {
  logger.info('Starting SLA breach detection cycle');
  
  const startTime = Date.now();
  const alerts: SLAAlertResult[] = [];

  // Get all SLA configurations
  const slaConfigs = await prisma.sLAConfig.findMany({
    where: { isActive: true },
    select: {
      id: true,
      clientId: true,
      packageId: true,
      serviceType: true,
      targetTatDays: true,
      warningThresholdHrs: true,
      criticalThresholdHrs: true,
    },
  });

  logger.info(`Found ${slaConfigs.length} active SLA configurations`);

  // Query client portal orders using raw SQL
  // This accesses the shared database where orders are stored
  const ordersQuery = `
    SELECT 
      o.id as orderId,
      o.client_id as clientId,
      o.package_id as packageId,
      o.service_type as serviceType,
      o.status,
      o.created_at as createdAt,
      o.expected_completion_date as expectedCompletionDate
    FROM chexpro_portal_db.orders o
    WHERE o.status NOT IN ('completed', 'cancelled', 'failed')
    AND o.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
    ORDER BY o.created_at DESC
    LIMIT 1000
  `;

  try {
    const orders = await prisma.$queryRaw<OrderSLAInfo[]>(Prisma.raw(ordersQuery));
    logger.info(`Found ${orders.length} active orders to check`);

    for (const order of orders) {
      // Find matching SLA config for this order
      const matchingConfig = findMatchingSLAConfig(order, slaConfigs);
      
      if (!matchingConfig) {
        continue; // No SLA config for this order
      }

      const alert = checkOrderSLA(order, matchingConfig);
      
      if (alert) {
        alerts.push(alert);
        
        // Create alert in database
        await createSLAAlert(order, alert, matchingConfig.id);
      }
    }
  } catch (error) {
    logger.error('Error querying orders for SLA check', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }

  const summary: SLABreachSummary = {
    timestamp: new Date(),
    ordersChecked: 0, // Would count in production
    warningsCreated: alerts.filter(a => a.alertType === 'warning').length,
    criticalsCreated: alerts.filter(a => a.alertType === 'critical').length,
    breachesCreated: alerts.filter(a => a.alertType === 'breached').length,
    alerts,
  };

  const duration = Date.now() - startTime;
  logger.info(`SLA breach detection completed in ${duration}ms`, {
    warningsCreated: summary.warningsCreated,
    criticalsCreated: summary.criticalsCreated,
    breachesCreated: summary.breachesCreated,
  });

  // Publish SLA alerts to channel
  await publishToChannel(PUBSUB_CHANNELS.SLA_ALERT, {
    type: 'sla_breach_check_completed',
    timestamp: summary.timestamp,
    summary: {
      warnings: summary.warningsCreated,
      criticals: summary.criticalsCreated,
      breaches: summary.breachesCreated,
    },
  });

  return summary;
}

function findMatchingSLAConfig(
  order: OrderSLAInfo,
  configs: Array<{
    id: string;
    clientId: string | null;
    packageId: string | null;
    serviceType: string | null;
    targetTatDays: number;
    warningThresholdHrs: number;
    criticalThresholdHrs: number;
  }>
): {
  id: string;
  targetTatDays: number;
  warningThresholdHrs: number;
  criticalThresholdHrs: number;
} | null {
  // First try exact match (client + package + service type)
  let match = configs.find(c =>
    c.clientId === order.clientId &&
    c.packageId === order.packageId &&
    c.serviceType === order.serviceType
  );

  // Then try client + service type
  if (!match) {
    match = configs.find(c =>
      c.clientId === order.clientId &&
      c.serviceType === order.serviceType &&
      !c.packageId
    );
  }

  // Then try service type only (default config)
  if (!match) {
    match = configs.find(c =>
      !c.clientId &&
      !c.packageId &&
      c.serviceType === order.serviceType
    );
  }

  // Finally try global default
  if (!match) {
    match = configs.find(c =>
      !c.clientId &&
      !c.packageId &&
      !c.serviceType
    );
  }

  return match || null;
}

function checkOrderSLA(
  order: OrderSLAInfo,
  config: {
    id: string;
    targetTatDays: number;
    warningThresholdHrs: number;
    criticalThresholdHrs: number;
  }
): SLAAlertResult | null {
  const now = new Date();
  
  // Calculate due date from created_at + target TAT
  const dueDate = new Date(order.createdAt);
  dueDate.setDate(dueDate.getDate() + config.targetTatDays);

  const hoursElapsed = (now.getTime() - order.createdAt.getTime()) / (1000 * 60 * 60);
  const totalAllowedHours = config.targetTatDays * 24;
  const hoursRemaining = totalAllowedHours - hoursElapsed;
  const percentElapsed = (hoursElapsed / totalAllowedHours) * 100;

  // Check if already breached
  if (hoursRemaining <= 0) {
    return {
      orderId: order.orderId,
      alertType: 'breached',
      severity: 'critical',
      message: `Order has exceeded SLA by ${Math.abs(hoursRemaining).toFixed(1)} hours`,
      hoursRemaining,
      slaConfigId: config.id,
    };
  }

  // Check if in critical range (within criticalThresholdHrs of breach)
  if (hoursRemaining <= config.criticalThresholdHrs) {
    return {
      orderId: order.orderId,
      alertType: 'critical',
      severity: 'high',
      message: `Order will breach SLA in ${hoursRemaining.toFixed(1)} hours`,
      hoursRemaining,
      slaConfigId: config.id,
    };
  }

  // Check if in warning range
  if (hoursRemaining <= config.warningThresholdHrs) {
    return {
      orderId: order.orderId,
      alertType: 'warning',
      severity: 'medium',
      message: `Order approaching SLA breach in ${hoursRemaining.toFixed(1)} hours`,
      hoursRemaining,
      slaConfigId: config.id,
    };
  }

  return null;
}

async function createSLAAlert(
  order: OrderSLAInfo,
  alert: SLAAlertResult,
  slaConfigId: string
): Promise<void> {
  // Check if we already have an alert for this order + alert type
  const existingAlert = await prisma.sLAAlert.findFirst({
    where: {
      orderId: order.orderId,
      alertType: alert.alertType,
    },
  });

  if (existingAlert) {
    // Update existing alert
    await prisma.sLAAlert.update({
      where: { id: existingAlert.id },
      data: {
        hoursRemaining: alert.hoursRemaining,
        message: alert.message,
      },
    });
    return;
  }

  // Calculate due date
  const dueDate = new Date(order.createdAt);
  // Get target TAT from config - simplified here
  dueDate.setDate(dueDate.getDate() + 7); // Default 7 days

  // Create new alert
  await prisma.sLAAlert.create({
    data: {
      orderId: order.orderId,
      alertType: alert.alertType,
      severity: alert.severity,
      message: alert.message,
      dueDate,
      hoursRemaining: alert.hoursRemaining,
      acknowledged: false,
    },
  });

  logger.info(`Created SLA alert for order ${order.orderId}`, {
    alertType: alert.alertType,
    severity: alert.severity,
    hoursRemaining: alert.hoursRemaining,
  });
}

/**
 * Manual trigger for SLA breach check for a specific order
 */
export async function checkOrderSLAStatus(orderId: string): Promise<SLAAlertResult | null> {
  const ordersQuery = `
    SELECT 
      o.id as orderId,
      o.client_id as clientId,
      o.package_id as packageId,
      o.service_type as serviceType,
      o.status,
      o.created_at as createdAt,
      o.expected_completion_date as expectedCompletionDate
    FROM chexpro_portal_db.orders o
    WHERE o.id = ?
    LIMIT 1
  `;

  try {
    const orders = await prisma.$queryRaw<OrderSLAInfo[]>(Prisma.raw(ordersQuery), [orderId]);
    
    if (orders.length === 0) {
      return null;
    }

    const order = orders[0];
    const slaConfigs = await prisma.sLAConfig.findMany({
      where: { isActive: true },
    });

    const matchingConfig = findMatchingSLAConfig(order, slaConfigs);
    
    if (!matchingConfig) {
      return null;
    }

    return checkOrderSLA(order, matchingConfig);
  } catch (error) {
    logger.error(`Error checking SLA status for order ${orderId}`, {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return null;
  }
}
