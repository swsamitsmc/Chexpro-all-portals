// @ts-nocheck
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import passport from 'passport';
import rateLimit from 'express-rate-limit';
import prisma from './config/prisma';
import logger from './config/logger';

// Import routes
import authRoutes from './routes/auth';
import dashboardRoutes from './routes/dashboard';
import ordersRoutes from './routes/orders';
import clientsRoutes from './routes/clients';
import vendorsRoutes from './routes/vendors';
import qaRoutes from './routes/qa';
import adjudicationRoutes from './routes/adjudication';
import teamRoutes from './routes/team';

// Import middleware
import { errorHandler } from './middleware/errorHandler';

const app = express();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
});
app.use('/api/', limiter);

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Passport initialization
app.use(passport.initialize());

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/clients', clientsRoutes);
app.use('/api/vendors', vendorsRoutes);
app.use('/api/qa', qaRoutes);
app.use('/api/adjudication', adjudicationRoutes);
app.use('/api/team', teamRoutes);

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Error handler
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 3001;

const server = app.listen(PORT, () => {
  logger.info(`Admin Portal API running on port ${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  await prisma.$disconnect();
  server.close(() => {
    logger.info('HTTP server closed');
  });
});

export default app;