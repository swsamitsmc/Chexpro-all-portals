// Load environment variables from .env file
import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import formRoutes from './routes/forms.js';
import authRoutes from './routes/auth.js';
import { initializeDatabase } from './config/db.js';

const app = express();
const PORT = process.env.PORT || 3000;

// --- Middleware ---

// Security headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

// Enable CORS for specific origins only
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? [process.env.FRONTEND_URL] 
    : ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true
};
app.use(cors(corsOptions));

// Parse incoming JSON requests.
app.use(express.json());

// --- API Routes ---

// All form-related routes will be prefixed with /api/form
app.use('/api/form', formRoutes);
// Auth-related routes for cookie demo
app.use('/api/auth', authRoutes);

// Health check endpoint to verify the server is running
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok' });
});

// --- Error Handling Middleware ---
app.use((err, req, res, next) => {
  console.error(err.stack); // Log the error stack for debugging
  if (process.env.NODE_ENV === 'production') {
    res.status(500).send('Something broke!'); // Generic error in production
  } else {
    res.status(500).send(err.stack); // Detailed error in development
  }
});

// --- Start Server ---
app.listen(PORT, async () => {
    console.log(`Backend server is running on http://localhost:${PORT}`);
    await initializeDatabase();
});