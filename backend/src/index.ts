import 'express-async-errors';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';

import { env } from './config/env';
import { logger } from './config/logger';
import './config/prisma'; // initialize DB connection
import './config/redis';  // initialize Redis connection
import './config/passport';

import { apiLimiter } from './middleware/rateLimiter';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';

// Import Routes
import authRoutes from './routes/auth';
import dashboardRoutes from './routes/dashboard';
import orderRoutes from './routes/orders';
import applicantRoutes from './routes/applicants';
import applicantPortalRoutes from './routes/applicantPortal';
import packageRoutes from './routes/packages';
import servicesRoutes from './routes/services';
import clientRoutes from './routes/client';
import userRoutes from './routes/users';
import documentRoutes from './routes/documents';
import reportRoutes from './routes/reports';
import notificationRoutes from './routes/notifications';
import analyticsRoutes from './routes/analytics';
import adverseActionRoutes from './routes/adverseActions';
import adjudicationRoutes from './routes/adjudication';
import monitoringRoutes from './routes/monitoring';
import disputeRoutes from './routes/disputes';
import billingRoutes from './routes/billing';
import vendorWebhookRoutes from './routes/vendorWebhooks';

const app = express();
const httpServer = createServer(app);

// ============================================================
// SOCKET.IO - Real-time updates
// ============================================================
export const io = new SocketIOServer(httpServer, {
  cors: {
    origin: env.frontendUrl,
    credentials: true,
  },
});

io.on('connection', (socket) => {
  logger.debug(`WebSocket client connected: ${socket.id}`);

  socket.on('join:order', (orderId: string) => {
    socket.join(`order:${orderId}`);
  });

  socket.on('join:client', (clientId: string) => {
    socket.join(`client:${clientId}`);
  });

  socket.on('disconnect', () => {
    logger.debug(`WebSocket client disconnected: ${socket.id}`);
  });
});

// ============================================================
// GLOBAL MIDDLEWARE
// ============================================================
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: env.isProduction ? undefined : false,
}));

app.use(cors({
  origin: env.frontendUrl,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Client-ID'],
}));

app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

if (env.isDevelopment) {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined', {
    stream: { write: (msg) => logger.info(msg.trim()) },
  }));
}

// ============================================================
// HEALTH CHECK
// ============================================================
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: env.nodeEnv,
    version: '1.0.0',
  });
});

// ============================================================
// API ROUTES
// ============================================================
app.use('/api/v1', apiLimiter);

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/dashboard', dashboardRoutes);
app.use('/api/v1/orders', orderRoutes);
app.use('/api/v1/applicants', applicantRoutes);
app.use('/api/v1/applicant-portal', applicantPortalRoutes);
app.use('/api/v1/packages', packageRoutes);
app.use('/api/v1/services', servicesRoutes);
app.use('/api/v1/client', clientRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/documents', documentRoutes);
app.use('/api/v1/reports', reportRoutes);
app.use('/api/v1/notifications', notificationRoutes);
app.use('/api/v1/analytics', analyticsRoutes);
app.use('/api/v1/adverse-actions', adverseActionRoutes);
app.use('/api/v1/adjudication', adjudicationRoutes);
app.use('/api/v1/monitoring', monitoringRoutes);
app.use('/api/v1/disputes', disputeRoutes);

// Public routes (no auth)
app.use('/api/v1/public', disputeRoutes);
app.use('/api/v1/billing', billingRoutes);
app.use('/api/v1/webhooks', vendorWebhookRoutes);

// ============================================================
// ERROR HANDLING
// ============================================================
app.use(notFoundHandler);
app.use(errorHandler);

// ============================================================
// START SERVER
// ============================================================
const PORT = env.port;

httpServer.listen(PORT, () => {
  logger.info(`🚀 ChexPro Portal API running on port ${PORT}`);
  logger.info(`   Environment: ${env.nodeEnv}`);
  logger.info(`   Frontend URL: ${env.frontendUrl}`);
  logger.info(`   Health: http://localhost:${PORT}/health`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received — shutting down gracefully');
  httpServer.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});

export default app;
