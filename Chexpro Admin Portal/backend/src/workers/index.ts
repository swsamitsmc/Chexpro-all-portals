/**
 * ChexPro Admin Portal - Worker Process Entry Point
 * 
 * This file initializes:
 * - Bull queue for async job processing
 * - Redis pub/sub for cross-portal communication
 * - All job processors (vendor health check, SLA breach, auto-escalation)
 * 
 * Run with: npm run worker
 */

import Bull from 'bull';
import Redis from 'ioredis';
import config from '../config/env';
import logger from '../config/logger';
import { processVendorHealthChecks } from './vendorHealthCheck';
import { processSLABreachDetection } from './slaBreachDetection';
import { processAutoEscalation } from './autoEscalation';

// ============================================================
// Queue Definitions
// ============================================================

// Main job queue using Bull - connects to Redis
export const vendorHealthQueue = new Bull('vendor-health-checks', config.redisUrl, {
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 5000,
    },
    removeOnComplete: 100,
    removeOnFail: 200,
  },
});

export const slaBreachQueue = new Bull('sla-breach-detection', config.redisUrl, {
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 10000,
    },
    removeOnComplete: 100,
    removeOnFail: 200,
  },
});

export const escalationQueue = new Bull('auto-escalation', config.redisUrl, {
  defaultJobOptions: {
    attempts: 2,
    backoff: {
      type: 'fixed',
      delay: 30000,
    },
    removeOnComplete: 100,
    removeOnFail: 100,
  },
});

export const notificationQueue = new Bull('notifications', config.redisUrl, {
  defaultJobOptions: {
    attempts: 2,
    removeOnComplete: 50,
    removeOnFail: 100,
  },
});

// ============================================================
// Redis Pub/Sub for Cross-Portal Communication
// ============================================================

// Separate Redis connection for pub/sub (avoids blocking main operations)
const redisPubSub = new Redis(config.redisUrl, {
  maxRetriesPerRequest: 3,
  retryStrategy(times) {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
});

// Channel definitions for inter-portal communication
export const PUBSUB_CHANNELS = {
  // Admin portal publishes to these channels
  ORDER_STATUS_CHANGED: 'admin:order:status-changed',
  VENDOR_STATUS_CHANGED: 'admin:vendor:status-changed',
  SLA_ALERT: 'admin:sla:alert',
  
  // Admin portal subscribes to these channels (from client portal)
  NEW_ORDER_RECEIVED: 'client:order:new',
  ORDER_COMPLETED: 'client:order:completed',
  CLIENT_UPDATED: 'client:client:updated',
};

// ============================================================
// Queue Event Handlers
// ============================================================

function setupQueueEventHandlers(): void {
  // Vendor Health Check Queue
  vendorHealthQueue.on('completed', (job, result) => {
    logger.info(`Vendor health check job ${job.id} completed`, {
      jobId: job.id,
      result,
    });
  });

  vendorHealthQueue.on('failed', (job, error) => {
    logger.error(`Vendor health check job ${job.id} failed`, {
      jobId: job.id,
      error: error.message,
      stack: error.stack,
    });
  });

  // SLA Breach Detection Queue
  slaBreachQueue.on('completed', (job, result) => {
    logger.info(`SLA breach detection job ${job.id} completed`, {
      jobId: job.id,
      ordersChecked: result?.ordersChecked || 0,
      breachesFound: result?.breachesFound || 0,
    });
  });

  slaBreachQueue.on('failed', (job, error) => {
    logger.error(`SLA breach detection job ${job.id} failed`, {
      jobId: job.id,
      error: error.message,
    });
  });

  // Escalation Queue
  escalationQueue.on('completed', (job, result) => {
    logger.info(`Auto-escalation job ${job.id} completed`, {
      jobId: job.id,
      escalationsTriggered: result?.length || 0,
    });
  });

  escalationQueue.on('failed', (job, error) => {
    logger.error(`Auto-escalation job ${job.id} failed`, {
      jobId: job.id,
      error: error.message,
    });
  });

  // Notification Queue
  notificationQueue.on('completed', (job) => {
    logger.debug(`Notification job ${job.id} sent`, { jobId: job.id });
  });

  notificationQueue.on('failed', (job, error) => {
    logger.error(`Notification job ${job.id} failed`, {
      jobId: job.id,
      error: error.message,
    });
  }
  );
}

// ============================================================
// Redis Pub/Sub Subscriptions
// ============================================================

function setupPubSubSubscriptions(): void {
  // Subscribe to client portal events
  const subscriber = redisPubSub.duplicate();
  
  subscriber.on('message', (channel: string, message: string) => {
    logger.debug(`Received pub/sub message`, { channel, message });
    
    try {
      const payload = JSON.parse(message);
      
      switch (channel) {
        case PUBSUB_CHANNELS.NEW_ORDER_RECEIVED:
          logger.info('New order received from client portal', { orderId: payload.orderId });
          // Could trigger notifications or refresh order queue
          break;
          
        case PUBSUB_CHANNELS.ORDER_COMPLETED:
          logger.info('Order completed in client portal', { orderId: payload.orderId });
          // Could update internal tracking
          break;
          
        case PUBSUB_CHANNELS.CLIENT_UPDATED:
          logger.info('Client updated in client portal', { clientId: payload.clientId });
          // Could refresh client data cache
          break;
          
        default:
          logger.debug(`Unknown pub/sub channel: ${channel}`);
      }
    } catch (error) {
      logger.error('Failed to process pub/sub message', {
        channel,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  // Subscribe to channels
  subscriber.subscribe(
    PUBSUB_CHANNELS.NEW_ORDER_RECEIVED,
    PUBSUB_CHANNELS.ORDER_COMPLETED,
    PUBSUB_CHANNELS.CLIENT_UPDATED,
    (err) => {
      if (err) {
        logger.error('Failed to subscribe to pub/sub channels', {
          error: err.message,
        });
      } else {
        logger.info('Subscribed to client portal pub/sub channels');
      }
    }
  );
}

// ============================================================
// Publish Helper (for cross-portal communication)
// ============================================================

export async function publishToChannel(
  channel: string,
  payload: Record<string, unknown>
): Promise<void> {
  try {
    await redisPubSub.publish(channel, JSON.stringify(payload));
    logger.debug(`Published to channel: ${channel}`, payload);
  } catch (error) {
    logger.error(`Failed to publish to channel: ${channel}`, {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

// ============================================================
// Job Processor Registration
// ============================================================

function registerJobProcessors(): void {
  // Vendor Health Check Processor
  vendorHealthQueue.process(async (job) => {
    logger.info('Processing vendor health check job', { jobId: job.id });
    return await processVendorHealthChecks();
  });

  // SLA Breach Detection Processor
  slaBreachQueue.process(async (job) => {
    logger.info('Processing SLA breach detection job', { jobId: job.id });
    return await processSLABreachDetection();
  });

  // Auto-Escalation Processor
  escalationQueue.process(async (job) => {
    logger.info('Processing auto-escalation job', { jobId: job.id });
    return await processAutoEscalation();
  });

  logger.info('Job processors registered');
}

// ============================================================
// Scheduled Jobs Setup
// ============================================================

let vendorHealthInterval: NodeJS.Timeout | null = null;
let slaBreachInterval: NodeJS.Timeout | null = null;
let autoEscalationInterval: NodeJS.Timeout | null = null;

function setupScheduledJobs(): void {
  // Vendor health check every 60 seconds
  vendorHealthInterval = setInterval(async () => {
    try {
      await vendorHealthQueue.add({}, { jobId: `health-check-${Date.now()}` });
    } catch (error) {
      logger.error('Failed to queue vendor health check', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }, 60000); // 60 seconds

  // SLA breach detection every 5 minutes
  slaBreachInterval = setInterval(async () => {
    try {
      await slaBreachQueue.add({}, { jobId: `sla-breach-${Date.now()}` });
    } catch (error) {
      logger.error('Failed to queue SLA breach detection', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }, 300000); // 5 minutes = 300000ms

  // Auto-escalation check every 15 minutes
  autoEscalationInterval = setInterval(async () => {
    try {
      await escalationQueue.add({}, { jobId: `escalation-${Date.now()}` });
    } catch (error) {
      logger.error('Failed to queue auto-escalation', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }, 900000); // 15 minutes

  // Run initial jobs on startup
  setTimeout(async () => {
    try {
      await vendorHealthQueue.add({}, { jobId: `health-check-initial-${Date.now()}` });
      await slaBreachQueue.add({}, { jobId: `sla-breach-initial-${Date.now()}` });
      await escalationQueue.add({}, { jobId: `escalation-initial-${Date.now()}` });
    } catch (error) {
      logger.error('Failed to queue initial jobs', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }, 5000); // Wait 5 seconds after startup

  logger.info('Scheduled jobs configured');
}

// ============================================================
// Graceful Shutdown Handler
// ============================================================

function setupGracefulShutdown(): void {
  const shutdown = async (signal: string) => {
    logger.info(`Received ${signal}, initiating graceful shutdown...`);

    // Stop scheduling new jobs
    if (vendorHealthInterval) clearInterval(vendorHealthInterval);
    if (slaBreachInterval) clearInterval(slaBreachInterval);
    if (autoEscalationInterval) clearInterval(autoEscalationInterval);

    // Close queue connections
    try {
      await vendorHealthQueue.close();
      await slaBreachQueue.close();
      await escalationQueue.close();
      await notificationQueue.close();
      logger.info('All queues closed');
    } catch (error) {
      logger.error('Error closing queues', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }

    // Close Redis connections
    try {
      await redisPubSub.quit();
      logger.info('Redis connections closed');
    } catch (error) {
      logger.error('Error closing Redis', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }

    logger.info('Graceful shutdown complete');
    process.exit(0);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

// ============================================================
// Main Entry Point
// ============================================================

async function main(): Promise<void> {
  logger.info('='.repeat(60));
  logger.info('ChexPro Admin Portal Worker Starting...');
  logger.info(`Environment: ${config.nodeEnv}`);
  logger.info(`Redis: ${config.redisUrl}`);
  logger.info('='.repeat(60));

  // Setup queue event handlers
  setupQueueEventHandlers();

  // Register job processors
  registerJobProcessors();

  // Setup pub/sub subscriptions
  setupPubSubSubscriptions();

  // Setup scheduled jobs
  setupScheduledJobs();

  // Setup graceful shutdown
  setupGracefulShutdown();

  logger.info('Worker process initialized successfully');
}

// Start the worker
main().catch((error) => {
  logger.error('Fatal error in worker process', {
    error: error.message,
    stack: error.stack,
  });
  process.exit(1);
});
