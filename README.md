# ChexPro Website with Secure Backend

This project is a modern, responsive website for ChexPro, a fictional company providing background screening services. It features a React-based frontend with internationalization support and a Node.js (Express) backend with comprehensive security, database integration, and monitoring capabilities.

## Features

- **Responsive Design:** Fully responsive and mobile-friendly layout
- **Modern Tech Stack:** Built with React, Vite, Tailwind CSS, and Framer Motion
- **Internationalization:** Support for 4 languages (English, Spanish, French, Hindi)
- **Component-Based Architecture:** Organized into reusable components with error boundaries
- **Enterprise Security:** SOC2-compliant security with CSRF protection, rate limiting, and input sanitization
- **Database Integration:** MySQL database with user management and persistent sessions
- **Authentication System:** Secure login with bcrypt hashing and session management
- **Performance Monitoring:** Built-in metrics tracking and error monitoring
- **SMTP Integration:** Reliable email delivery with retry mechanisms

## Project Structure

```
/
├── docs/                      # Documentation files
│   ├── DEPLOYMENT.md         # Deployment guide
│   ├── PROJECT_HANDOVER.md   # SOC2-compliant handover document
│   └── ToDo.md              # Issue tracking (all resolved)
├── frontend/                  # React frontend application
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   ├── pages/           # Page components
│   │   ├── i18n/           # Internationalization files
│   │   ├── hooks/          # Custom React hooks
│   │   └── config/         # Configuration files
│   └── package.json
└── server/                    # Node.js backend service
    ├── routes/              # API routes (auth, forms)
    ├── utils/               # Utility functions
    ├── config/              # Database and app configuration
    ├── sql/                 # Database schema
    └── package.json
```

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm
- MySQL 8.0 or higher
- SMTP server access

### Installation

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   ```

2. **Install frontend dependencies:**
   ```bash
   cd frontend
   npm install
   ```

3. **Install backend dependencies:**
   ```bash
   cd ../server
   npm install
   ```

### Configuration

1. **Create a `.env` file in the `server` directory.**
2. **Add the following environment variables:**

   ```bash
   # Server Configuration
   NODE_ENV=development
   PORT=3000
   
   # Security (REPLACE WITH ACTUAL VALUES)
   SESSION_SECRET=<REPLACE_WITH_32_CHAR_SECRET>
   CSRF_SECRET=<REPLACE_WITH_32_CHAR_SECRET>
   HEALTH_CHECK_TOKEN=<REPLACE_WITH_SECURE_TOKEN>
   METRICS_TOKEN=<REPLACE_WITH_SECURE_TOKEN>
   
   # Database Configuration (REPLACE WITH ACTUAL VALUES)
   DB_HOST=<REPLACE_WITH_DB_HOST>
   DB_USER=<REPLACE_WITH_DB_USER>
   DB_PASSWORD=<REPLACE_WITH_DB_PASSWORD>
   DB_NAME=<REPLACE_WITH_DB_NAME>
   DB_QUEUE_LIMIT=10
   
   # SMTP Server Settings (REPLACE WITH ACTUAL VALUES)
   SMTP_HOST=<REPLACE_WITH_SMTP_HOST>
   SMTP_PORT=<REPLACE_WITH_SMTP_PORT>
   SMTP_SECURE=<REPLACE_WITH_TRUE_OR_FALSE>
   SMTP_USER=<REPLACE_WITH_SMTP_USER>
   SMTP_PASS=<REPLACE_WITH_SMTP_PASSWORD>
   
   # Email Recipients (REPLACE WITH ACTUAL VALUES)
   CONTACT_RECIPIENT=<REPLACE_WITH_CONTACT_EMAIL>
   DEMO_RECIPIENT=<REPLACE_WITH_DEMO_EMAIL>
   ```

3. **Create a `.env` file in the `frontend` directory:**

   ```bash
   VITE_API_BASE_URL=<REPLACE_WITH_API_URL>
   VITE_GA_MEASUREMENT_ID=<REPLACE_WITH_GA_ID>
   VITE_ENABLE_ANALYTICS=<REPLACE_WITH_TRUE_OR_FALSE>
   VITE_ENABLE_MARKETING=<REPLACE_WITH_TRUE_OR_FALSE>
   ```

### Database Setup

1. **Create MySQL database:**
   ```sql
   CREATE DATABASE chexpro_db;
   ```

2. **Database schema will be initialized automatically on first server start.**

### Running the Application

1. **Validate configuration:**
   ```bash
   cd server
   npm run validate-config
   ```

2. **Start the backend server:**
   ```bash
   cd server
   npm start
   ```

3. **Start the frontend development server:**
   ```bash
   cd ../frontend
   npm run dev
   ```

The frontend will be available at `http://localhost:5173` and the backend at `http://localhost:3000`.

## Available Scripts

### Frontend
- `npm run dev` - Starts the development server
- `npm run build` - Builds the application for production
- `npm run preview` - Previews the production build
- `npm run lint` - Runs ESLint

### Backend
- `npm start` - Starts the backend server
- `npm run validate-config` - Validates environment configuration
- `npm run lint` - Runs ESLint

## API Endpoints

- `POST /api/form/contact` - Submit contact form
- `POST /api/form/demo` - Submit demo request form
- `POST /api/auth/login` - User authentication
- `POST /api/auth/logout` - User logout
- `GET /health` - Health check endpoint
- `GET /api/metrics` - Performance metrics (authenticated)
- `GET /api/docs` - API documentation

## Security Features

- **CSRF Protection:** All forms protected against cross-site request forgery
- **Rate Limiting:** Prevents brute force and DoS attacks
- **Input Sanitization:** All user inputs sanitized and validated
- **Session Management:** Secure session handling with database storage
- **Password Security:** bcrypt hashing for all passwords
- **Error Handling:** Environment-specific error responses
- **Logging:** Comprehensive security event logging

## Internationalization

The application supports 4 languages:
- English (en)
- Spanish (es)
- French (fr)
- Hindi (hi)

Language files are located in `frontend/src/i18n/locales/`.

## Monitoring

- **Performance Metrics:** Request/response times, memory usage
- **Error Tracking:** Comprehensive error logging and statistics
- **Health Checks:** Application and database health monitoring

## Deployment

Refer to `docs/DEPLOYMENT.md` for detailed deployment instructions and `docs/PROJECT_HANDOVER.md` for SOC2-compliant handover documentation.
