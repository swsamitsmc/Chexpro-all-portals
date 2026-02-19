import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { env } from './config/env';
import logger from './config/logger';
import { prisma } from './config/prisma';
import { connectRedis } from './config/redis';
import { errorHandler } from './middleware/errorHandler';
import { apiLimiter } from './middleware/rateLimiter';
import { subscribeToChannels, setSocketIO } from './services/redisSubscriber';

import authRouter from './routes/auth';
import wizardRouter from './routes/wizard';
import checksRouter from './routes/checks';
import documentsRouter from './routes/documents';
import profileRouter from './routes/profile';
import notificationsRouter from './routes/notifications';
import statusRouter from './routes/status';

const app = express();
const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: env.frontendUrl,
    credentials: true,
  },
});

app.locals.io = io;

setSocketIO(io);

app.use(helmet());
app.use(cors({ origin: env.frontendUrl, credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

if (env.nodeEnv !== 'production') {
  app.use(morgan('dev'));
}

app.use('/api/v1', apiLimiter);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'candidate-api' });
});

app.use('/api/v1/auth', authRouter);
app.use('/api/v1/wizard', wizardRouter);
app.use('/api/v1/checks', checksRouter);
app.use('/api/v1/documents', documentsRouter);
app.use('/api/v1/profile', profileRouter);
app.use('/api/v1/notifications', notificationsRouter);
app.use('/api/v1/status', statusRouter);

io.on('connection', (socket) => {
  logger.info('Socket connected:', socket.id);

  socket.on('join-candidate-room', ({ candidateId }) => {
    socket.join(`candidate:${candidateId}`);
    logger.info(`Socket ${socket.id} joined candidate room: ${candidateId}`);
  });

  socket.on('join-check-room', ({ orderId }) => {
    socket.join(`order:${orderId}`);
    logger.info(`Socket ${socket.id} joined order room: ${orderId}`);
  });

  socket.on('disconnect', () => {
    logger.info('Socket disconnected:', socket.id);
  });
});

app.use(errorHandler);

const start = async (): Promise<void> => {
  try {
    await prisma.$connect();
    logger.info('Database connected');

    await connectRedis();
    logger.info('Redis connected');

    await subscribeToChannels();

    httpServer.listen(env.port, () => {
      logger.info(`Server running on port ${env.port}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

start();

export { app, io };
