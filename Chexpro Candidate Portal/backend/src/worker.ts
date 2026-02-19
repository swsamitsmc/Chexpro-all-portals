import Bull from 'bull';
import { prisma } from './config/prisma';
import { env } from './config/env';
import logger from './config/logger';
import { sendWizardReminderEmail } from './services/emailService';
import { subscribeToChannels } from './services/redisSubscriber';
import { connectRedis } from './config/redis';

const candidateQueue = new Bull('candidate-notifications', {
  redis: env.redisUrl,
});

const sendReminderEmail = async () => {
  try {
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

    const incompleteApplicants = await prisma.applicant.findMany({
      where: {
        portalCompleted: false,
        createdAt: { lt: threeDaysAgo },
      },
      include: {
        user: true,
        order: {
          include: { client: true },
        },
      },
    });

    for (const applicant of incompleteApplicants) {
      if (!applicant.user || !applicant.order) continue;

      const daysRemaining = 14 - Math.floor(
        (Date.now() - applicant.createdAt.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (daysRemaining > 0) {
        await sendWizardReminderEmail(applicant.user.email, {
          companyName: applicant.order.client?.companyName || 'Unknown',
          daysRemaining,
          wizardUrl: `${env.frontendUrl}/wizard/${applicant.orderId}`,
        });

        logger.info(`Sent reminder email to ${applicant.user.email}`);
      }
    }
  } catch (error) {
    logger.error('Error sending reminder emails:', error);
  }
};

const expireInvitations = async () => {
  try {
    const now = new Date();

    await prisma.candidateInvitation.updateMany({
      where: {
        tokenExpiresAt: { lt: now },
        registrationCompletedAt: null,
      },
      data: {
        tokenExpiresAt: now,
      },
    });

    logger.info('Expired invitations processed');
  } catch (error) {
    logger.error('Error expiring invitations:', error);
  }
};

const sendNotificationEmail = async () => {
  logger.info('Processing notification email job');
};

candidateQueue.process('send-reminder-email', sendReminderEmail);
candidateQueue.process('expire-invitations', expireInvitations);
candidateQueue.process('send-notification-email', sendNotificationEmail);

const startScheduledJobs = async () => {
  await candidateQueue.add('send-reminder-email', {}, { repeat: { cron: '0 9 * * *' } });
  await candidateQueue.add('expire-invitations', {}, { repeat: { cron: '0 * * * *' } });

  logger.info('Scheduled jobs started');
};

const start = async (): Promise<void> => {
  try {
    await prisma.$connect();
    logger.info('Database connected');

    await connectRedis();
    logger.info('Redis connected');

    await subscribeToChannels();

    await startScheduledJobs();

    logger.info('Worker started');
  } catch (error) {
    logger.error('Failed to start worker:', error);
    process.exit(1);
  }
};

process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully');
  await candidateQueue.close();
  await prisma.$disconnect();
  process.exit(0);
});

start();
