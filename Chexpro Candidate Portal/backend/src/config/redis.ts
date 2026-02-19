import { createClient } from 'redis';
import { env } from './env';
import logger from './logger';

const redisClient = createClient({
  url: env.redisUrl,
});

const subscriber = createClient({
  url: env.redisUrl,
});

redisClient.on('error', (err) => {
  logger.error('Redis Client Error:', err);
});

redisClient.on('connect', () => {
  logger.info('Redis Client connected');
});

redisClient.on('reconnecting', () => {
  logger.warn('Redis Client reconnecting...');
});

subscriber.on('error', (err) => {
  logger.error('Redis Subscriber Error:', err);
});

subscriber.on('connect', () => {
  logger.info('Redis Subscriber connected');
});

subscriber.on('reconnecting', () => {
  logger.warn('Redis Subscriber reconnecting...');
});

const connectRedis = async (): Promise<void> => {
  try {
    await redisClient.connect();
    await subscriber.connect();
    logger.info('Both Redis clients connected successfully');
  } catch (error) {
    logger.error('Failed to connect Redis clients:', error);
    throw error;
  }
};

export { redisClient, subscriber, connectRedis };
