// Load environment variables from .env file
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const formRoutes = require('./routes/forms');

const app = express();
const PORT = process.env.PORT || 3000;

// --- Middleware ---

// Enable CORS for all routes. This allows your React frontend
// to make requests to this backend during local development.
app.use(cors());

// Parse incoming JSON requests.
app.use(express.json());

// --- API Routes ---

// All form-related routes will be prefixed with /api/form
app.use('/api/form', formRoutes);

// Health check endpoint to verify the server is running
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok' });
});

// --- Start Server ---
app.listen(PORT, () => {
    console.log(`Backend server is running on http://localhost:${PORT}`);
});