/**
 * Auto-Escalation Worker
 * 
 * Runs periodically (every 15 minutes) and on-demand to check for orders
 * that need escalation based on:
 * - SLA breaches
 * - Manual escalation triggers
 * - Automatic escalation rules
 * 
 * Actions:
 * - Creates escalation records
 * - Sends notifications via email (using SMTP config)
 * - Creates admin notifications
 */

import nodemailer from 'nodemailer';
import prisma from '../config/prisma';
import config from '../config/env';
import logger from '../config/logger';
import { publishToChannel, PUBSUB_CHANNELS } from './index';

interface EscalationRecord {
  orderId: string;
  ruleId: string;
  ruleName: string;
  triggeredAt: Date;
  escalationLevel: number;
  recipients: string[];
}

interface EscalationSummary {
  timestamp: Date;
  ordersEscalated: number;
  emailsSent: number;
  escalations: EscalationRecord[];
}

// Email transporter - configured from env
let emailTransporter: nodemailer.Transporter | null = null;

function getEmailTransporter(): nodemailer.Transporter {
  if (!emailTransporter) {
    emailTransporter = nodemailer.createTransport({
      host: config.smtpHost,
      port: config.smtpPort,
      secure: config.smtpPort === 465,
      auth: {
        user: config.smtpUser,
        pass: config.smtpPass,
      },
    });
  }
  return emailTransporter;
}

export async function processAutoEscalation(): Promise<EscalationSummary> {
  logger.info('Starting auto-escalation cycle');
  
  const startTime = Date.now();
  const escalations: EscalationRecord[] = [];
  let emailsSent = 0;

  // Get active escalation rules
  const escalationRules = await prisma.escalationRule.findMany({
    where: { isActive: true },
    orderBy: { createdAt: 'asc' },
  });

  logger.info(`Found ${escalationRules.length} active escalation rules`);

  // Process SLA-based escalations
  const slaBreaches = await prisma.sLAAlert.findMany({
    where: {
      alertType: 'breached',
      acknowledged: false,
    },
  });

  // Get SLA configs with auto-escalate enabled
  const autoEscalateConfigs = await prisma.sLAConfig.findMany({
    where: {
      isActive: true,
      autoEscalate: true,
    },
  });

  // Check breached orders against escalation rules
  for (const breach of slaBreaches) {
    for (const rule of escalationRules) {
      if (rule.triggerType === 'sla_breach') {
        const shouldEscalate = await checkEscalationTrigger(rule, breach.orderId);
        
        if (shouldEscalate) {
          const escalation = await processEscalation(rule, breach.orderId);
          escalations.push(escalation);
          
          // Send email notification
          const emailSent = await sendEscalationEmail(escalation);
          if (emailSent) emailsSent++;
          
          // Create admin notification
          await createAdminNotification(escalation);
        }
      }
    }
  }

  const summary: EscalationSummary = {
    timestamp: new Date(),
    ordersEscalated: escalations.length,
    emailsSent,
    escalations,
  };

  const duration = Date.now() - startTime;
  logger.info(`Auto-escalation completed in ${duration}ms`, {
    ordersEscalated: summary.ordersEscalated,
    emailsSent: summary.emailsSent,
  });

  // Publish escalation event
  await publishToChannel(PUBSUB_CHANNELS.SLA_ALERT, {
    type: 'escalation_completed',
    timestamp: summary.timestamp,
    ordersEscalated: summary.ordersEscalated,
  });

  return summary;
}

async function checkEscalationTrigger(
  rule: {
    id: string;
    name: string;
    triggerType: string;
    triggerConfig: unknown;
    delayMinutes: number;
  },
  orderId: string
): Promise<boolean> {
  // Check delay - don't escalate immediately after breach
  if (rule.delayMinutes > 0) {
    const alert = await prisma.sLAAlert.findFirst({
      where: { orderId },
      orderBy: { createdAt: 'desc' },
    });

    if (alert) {
      const breachTime = alert.createdAt.getTime();
      const now = Date.now();
      const delayMs = rule.delayMinutes * 60 * 1000;
      
      if (now - breachTime < delayMs) {
        return false; // Not enough time has passed
      }
    }
  }

  // Check if already escalated for this rule recently
  const recentEscalation = await prisma.adminNotification.findFirst({
    where: {
      actionUrl: `/orders/${orderId}`,
      type: 'escalation',
      createdAt: {
        gte: new Date(Date.now() - 60 * 60 * 1000), // Last hour
      },
    },
  });

  if (recentEscalation) {
    return false; // Already escalated recently
  }

  return true;
}

async function processEscalation(
  rule: {
    id: string;
    name: string;
    escalationPath: unknown;
    notifyOnEscalation: boolean;
  },
  orderId: string
): Promise<EscalationRecord> {
  // Parse escalation path - could be emails or admin user IDs
  const path = rule.escalationPath as { emails?: string[]; userIds?: string[] } | null;
  const recipients = path?.emails || [];

  logger.info(`Processing escalation for order ${orderId}`, {
    ruleId: rule.id,
    ruleName: rule.name,
    recipients: recipients.length,
  });

  return {
    orderId,
    ruleId: rule.id,
    ruleName: rule.name,
    triggeredAt: new Date(),
    escalationLevel: 1,
    recipients,
  };
}

async function sendEscalationEmail(escalation: EscalationRecord): Promise<boolean> {
  if (escalation.recipients.length === 0) {
    return false;
  }

  try {
    const transporter = getEmailTransporter();
    
    const mailOptions: nodemailer.SendMailOptions = {
      from: config.smtpFrom,
      to: escalation.recipients.join(', '),
      subject: `[ESCALATION] Order ${escalation.orderId} requires immediate attention`,
      html: `
        <h2>Order Escalation Alert</h2>
        <p><strong>Order ID:</strong> ${escalation.orderId}</p>
        <p><strong>Rule:</strong> ${escalation.ruleName}</p>
        <p><strong>Triggered At:</strong> ${escalation.triggeredAt.toISOString()}</p>
        <p>This order has triggered an escalation and requires immediate attention.</p>
        <p>Please log in to the admin portal to review and take action.</p>
        <hr>
        <p style="color: #666; font-size: 12px;">
          This is an automated message from ChexPro Admin Portal.
        </p>
      `,
    };

    await transporter.sendMail(mailOptions);
    
    logger.info(`Escalation email sent for order ${escalation.orderId}`, {
      recipients: escalation.recipients,
    });
    
    return true;
  } catch (error) {
    logger.error(`Failed to send escalation email for order ${escalation.orderId}`, {
      error: error instanceof Error ? error.message : 'Unknown error',
      recipients: escalation.recipients,
    });
    return false;
  }
}

async function createAdminNotification(escalation: EscalationRecord): Promise<void> {
  try {
    // Find admins who should receive this notification
    // Could use escalation path userIds or role-based
    const adminUsers = await prisma.adminUser.findMany({
      where: {
        role: { in: ['super_admin', 'operations_manager'] },
        status: 'active',
      },
      take: 5,
    });

    // Create notifications for each admin
    for (const admin of adminUsers) {
      await prisma.adminNotification.create({
        data: {
          adminId: admin.id,
          type: 'escalation',
          title: `Order Escalation: ${escalation.orderId}`,
          message: `Order ${escalation.orderId} has triggered escalation rule "${escalation.ruleName}" and requires immediate attention.`,
          priority: 'high',
          actionUrl: `/orders/${escalation.orderId}`,
          metadata: {
            orderId: escalation.orderId,
            ruleId: escalation.ruleId,
            ruleName: escalation.ruleName,
          },
        },
      });
    }

    logger.info(`Created admin notifications for order ${escalation.orderId}`, {
      adminCount: adminUsers.length,
    });
  } catch (error) {
    logger.error(`Failed to create admin notification for order ${escalation.orderId}`, {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

/**
 * Manual trigger for escalating a specific order
 */
export async function manuallyEscalateOrder(
  orderId: string,
  reason: string,
  escalationPath: string[]
): Promise<EscalationRecord | null> {
  // Find or create manual escalation rule
  let rule = await prisma.escalationRule.findFirst({
    where: {
      triggerType: 'manual',
      isActive: true,
    },
  });

  if (!rule) {
    // Create a default manual escalation rule
    rule = await prisma.escalationRule.create({
      data: {
        name: 'Manual Escalation',
        description: 'Default rule for manual escalations',
        isActive: true,
        triggerType: 'manual',
        triggerConfig: {},
        escalationPath: { emails: [] },
        delayMinutes: 0,
        notifyOnEscalation: true,
      },
    });
  }

  const escalation: EscalationRecord = {
    orderId,
    ruleId: rule.id,
    ruleName: rule.name,
    triggeredAt: new Date(),
    escalationLevel: 1,
    recipients: escalationPath,
  };

  // Send emails
  if (escalationPath.length > 0) {
    const emailSent = await sendEscalationEmail(escalation);
    if (emailSent) {
      logger.info(`Manual escalation email sent for order ${orderId}`, {
        reason,
        recipients: escalationPath,
      });
    }
  }

  // Create admin notifications
  await createAdminNotification(escalation);

  return escalation;
}

/**
 * Get escalation history for an order
 */
export async function getEscalationHistory(orderId: string): Promise<{
  notifications: Array<{
    id: string;
    type: string;
    title: string;
    createdAt: Date;
  }>;
}> {
  const notifications = await prisma.adminNotification.findMany({
    where: {
      actionUrl: `/orders/${orderId}`,
      type: 'escalation',
    },
    orderBy: { createdAt: 'desc' },
    take: 10,
  });

  return {
    notifications: notifications.map(n => ({
      id: n.id,
      type: n.type,
      title: n.title,
      createdAt: n.createdAt,
    })),
  };
}
