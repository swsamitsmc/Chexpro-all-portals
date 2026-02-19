import { subscriber } from '../config/redis';
import { prisma } from '../config/prisma';
import logger from '../config/logger';

interface Server {
  to: (room: string) => {
    emit: (event: string, data: unknown) => void;
  };
}

let io: Server | null = null;

export const setSocketIO = (socketIO: Server): void => {
  io = socketIO;
};

const createNotification = async (
  userId: string,
  type: string,
  title: string,
  message: string,
  orderId?: string
): Promise<void> => {
  try {
    await prisma.notification.create({
      data: {
        userId,
        type,
        title,
        message,
        orderId,
        isRead: false,
      },
    });
    logger.info(`Created notification for user ${userId}: ${title}`);
  } catch (error) {
    logger.error('Error creating notification:', error);
  }
};

const emitToCandidate = (candidateId: string, event: string, data: unknown): void => {
  if (io) {
    io.to(`candidate:${candidateId}`).emit(event, data);
    logger.info(`Emitted ${event} to candidate:${candidateId}`);
  }
};

export const subscribeToChannels = async (): Promise<void> => {
  try {
    await subscriber.subscribe('order:statusChanged', (err) => {
      if (err) {
        logger.error('Failed to subscribe to order:statusChanged:', err);
      }
    });

    await subscriber.subscribe('report:ready', (err) => {
      if (err) {
        logger.error('Failed to subscribe to report:ready:', err);
      }
    });

    await subscriber.subscribe('adverse_action:initiated', (err) => {
      if (err) {
        logger.error('Failed to subscribe to adverse_action:initiated:', err);
      }
    });

    await subscriber.subscribe('order:requiresAction', (err) => {
      if (err) {
        logger.error('Failed to subscribe to order:requiresAction:', err);
      }
    });

    subscriber.on('message', async (channel, message) => {
      try {
        const data = JSON.parse(message);
        logger.info(`Received message on ${channel}:`, data);

        switch (channel) {
          case 'order:statusChanged': {
            const { orderId, status, candidateId } = data.payload;
            if (candidateId) {
              await createNotification(
                candidateId,
                'status_update',
                'Status Update',
                `Your background check status has been updated to ${status}`,
                orderId
              );
              emitToCandidate(candidateId, 'orderStatusChanged', { orderId, status });
            }
            break;
          }

          case 'report:ready': {
            const { orderId, candidateId } = data.payload;
            if (candidateId) {
              await createNotification(
                candidateId,
                'report_ready',
                'Report Ready',
                'Your background check report is now available',
                orderId
              );
              emitToCandidate(candidateId, 'checkComplete', { orderId });
            }
            break;
          }

          case 'adverse_action:initiated': {
            const { orderId, candidateId } = data.payload;
            if (candidateId) {
              await createNotification(
                candidateId,
                'adverse_action',
                'Important Notice',
                'There is an important notice regarding your background check',
                orderId
              );
              emitToCandidate(candidateId, 'newNotification', { orderId, type: 'adverse_action' });
            }
            break;
          }

          case 'order:requiresAction': {
            const { orderId, candidateId, message } = data.payload;
            if (candidateId) {
              await createNotification(
                candidateId,
                'requires_action',
                'Action Required',
                message || 'Action is required for your background check',
                orderId
              );
              emitToCandidate(candidateId, 'orderStatusChanged', { orderId, status: 'requires_action' });
            }
            break;
          }

          default:
            logger.warn(`Unknown channel: ${channel}`);
        }
      } catch (error) {
        logger.error('Error processing Redis message:', error);
      }
    });

    logger.info('Subscribed to Redis channels');
  } catch (error) {
    logger.error('Error subscribing to Redis channels:', error);
    throw error;
  }
};
