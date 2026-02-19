import { redisClient } from '../config/redis';
import logger from '../config/logger';

export interface RedisEvent {
  type: string;
  payload: Record<string, unknown>;
}

export const publish = async (channel: string, data: RedisEvent): Promise<void> => {
  try {
    const message = JSON.stringify(data);
    await redisClient.publish(channel, message);
    logger.info(`Published event to ${channel}:`, data);
  } catch (error) {
    logger.error(`Failed to publish to ${channel}:`, error);
    throw error;
  }
};

export const publishCandidateRegistered = async (data: {
  orderId: string;
  userId: string;
  email: string;
}): Promise<void> => {
  await publish('candidate:registered', { type: 'candidate:registered', payload: data });
};

export const publishWizardCompleted = async (data: {
  orderId: string;
  applicantId: string;
  submittedAt: string;
}): Promise<void> => {
  await publish('candidate:wizard_completed', { type: 'candidate:wizard_completed', payload: data });
};

export const publishOrderStatusChanged = async (data: {
  orderId: string;
  status: string;
  previousStatus: string;
}): Promise<void> => {
  await publish('order:statusChanged', { type: 'order:statusChanged', payload: data });
};
