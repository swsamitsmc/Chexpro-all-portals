# ChexPro Website Technical Documentation

## 1. Introduction & Purpose

### 1.1. Project Overview
The ChexPro website is a modern, responsive platform designed to:
- **Generate Leads**: Via Contact and Demo Request forms.
- **Provide Information**: Detail services, compliance, resources, and contact options.
- **Enable Self-Service**: A client login portal for managing background checks and reports.

### 1.2. Target Audience
- **Potential Clients**: Businesses, landlords, staffing firms.
- **Existing Clients**: US Employers (manage checks), Candidates (view reports).
- **ChexPro Team**: Access internal tools.

## 2. Frontend Technology Stack

### 2.1. Core Technologies
- **Framework**: React v18.2.0
- **Build Tool**: Vite
- **Language**: JavaScript + JSX
- **Styling**: Tailwind CSS v3.3.3
- **Animation**: Framer Motion v10.16.4
- **Routing**: React Router DOM v6.16.0
- **UI Library**: ShadCN (Radix UI)
- **Internationalization**: react-i18next
- **Cookie Management**: js-cookie
- **Error Boundaries**: React Error Boundaries

### 2.2. Routing
- **Library**: React Router DOM v6.16.0
- **Setup**: `src/App.jsx` with lazy-loaded pages.

### 2.3. State Management
- `useState`, `useReducer`, and the Context API are used for state management
- Custom hooks for cookie management, internationalization, and form handling
- Centralized configuration management

### 2.4. Styling
- Tailwind CSS v3.3.3 with custom theming in `src/index.css`.

## 3. Backend Architecture

### 3.1. Framework and Language
- **Framework**: Node.js with Express.js
- **Language**: JavaScript

### 3.2. API Design
- **Protocol**: RESTful API
- **Endpoints**:
  - `POST /api/form/contact`: Submits the contact form
  - `POST /api/form/demo`: Submits the demo request form
  - `POST /api/auth/login`: User authentication
  - `POST /api/auth/logout`: User logout
  - `GET /health`: Health check endpoint (authenticated)
  - `GET /api/metrics`: Performance metrics (authenticated)
  - `GET /api/docs`: API documentation

### 3.3. Security (SOC2 Compliant)
- **Input Validation**: `express-validator` with comprehensive sanitization
- **Rate Limiting**: Granular rate limiting per endpoint
- **CSRF Protection**: Token-based CSRF protection for all forms
- **XSS Protection**: HTML escaping using `he` library
- **Session Management**: Secure session storage with database persistence
- **Password Security**: bcrypt hashing with salt rounds
- **Authentication**: Database-backed user authentication
- **Authorization**: Role-based access control
- **Logging**: Winston-based structured logging
- **Error Handling**: Environment-specific error responses
- **Security Headers**: Helmet.js for comprehensive security headers
- **IP Whitelisting**: Configurable IP restrictions for admin endpoints
- **Environment Variables**: All sensitive data externalized

### 3.4. Database Integration
- **Database**: MySQL 8.0+
- **Connection**: mysql2 with connection pooling
- **Schema**: Automated schema initialization
- **Tables**: users, persistent_tokens, email_recipients
- **Migrations**: SQL-based schema management

### 3.5. Monitoring & Performance
- **Performance Metrics**: Request/response time tracking
- **Error Tracking**: Comprehensive error logging and statistics
- **Health Monitoring**: Application and database health checks
- **Memory Monitoring**: Process memory usage tracking
- **Email Monitoring**: SMTP delivery tracking with retry mechanisms

## 4. Development & Deployment Workflow

### 4.1. Local Development
- **Frontend**:
  ```bash
  cd frontend
  npm install
  npm run dev
  ```
- **Backend**:
  ```bash
  cd server
  npm install
  npm start
  ```

### 4.2. Git Workflow
- **Repository**: Private GitHub repository.
- **Branching**: GitHub Flow (`feat/`, `fix/` branches, PRs to `main`).
- **Commits**: Conventional Commits style (`type(scope): subject`).

## 5. Dependencies

### 5.1. Frontend Dependencies
```json
{
  "dependencies": {
    "@radix-ui/react-accordion": "^1.1.2",
    "@radix-ui/react-alert-dialog": "^1.0.5",
    "@radix-ui/react-avatar": "^1.0.3",
    "@radix-ui/react-checkbox": "^1.0.4",
    "@radix-ui/react-dialog": "^1.0.5",
    "@radix-ui/react-dropdown-menu": "^2.0.5",
    "@radix-ui/react-label": "^2.0.2",
    "@radix-ui/react-navigation-menu": "^1.1.4",
    "@radix-ui/react-slider": "^1.1.2",
    "@radix-ui/react-slot": "^1.0.2",
    "@radix-ui/react-tabs": "^1.0.4",
    "@radix-ui/react-toast": "^1.1.5",
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.0.0",
    "framer-motion": "^10.16.4",
    "i18next": "^23.15.2",
    "i18next-browser-languagedetector": "^8.0.0",
    "js-cookie": "^3.0.5",
    "lucide-react": "^0.292.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-helmet-async": "^2.0.5",
    "react-i18next": "^15.0.2",
    "react-router-dom": "^6.16.0",
    "tailwind-merge": "^1.14.0",
    "tailwindcss-animate": "^1.0.7"
  },
  "devDependencies": {
    "@types/node": "^20.8.3",
    "@types/react": "^18.2.15",
    "@types/react-dom": "^18.2.7",
    "@vitejs/plugin-react": "^4.0.3",
    "autoprefixer": "^10.4.16",
    "eslint": "^8.57.1",
    "eslint-config-react-app": "^7.0.1",
    "husky": "^9.1.6",
    "lint-staged": "^15.2.10",
    "postcss": "^8.4.31",
    "tailwindcss": "^3.3.3",
    "terser": "^5.39.0",
    "vite": "^7.0.6"
  }
}
```

## 6. Internationalization

### 6.1. Supported Languages
- English (en) - Default
- Spanish (es)
- French (fr)
- Hindi (hi)

### 6.2. Translation Files
Located in `frontend/src/i18n/locales/`:
- `en.json` - English translations
- `es.json` - Spanish translations
- `fr.json` - French translations
- `hi.json` - Hindi translations

### 6.3. Language Detection
- Browser language detection
- User preference persistence
- Fallback to English

## 7. Security Compliance

### 7.1. SOC2 Compliance Features
- Comprehensive audit logging
- Access control and authentication
- Data encryption in transit and at rest
- Input validation and sanitization
- Error handling without information disclosure
- Session management with secure tokens
- Regular security monitoring

### 7.2. Security Headers
- Content Security Policy (CSP)
- X-Frame-Options
- X-Content-Type-Options
- Referrer-Policy
- Permissions-Policy

## 8. Performance Optimization

### 8.1. Frontend Optimizations
- Lazy loading of components
- Code splitting
- Image optimization
- Bundle size optimization

### 8.2. Backend Optimizations
- Database connection pooling
- Response caching
- Compression middleware
- Request/response monitoring
```

### 5.2. Backend Dependencies
```json
{
  "dependencies": {
    "bcrypt": "^5.1.1",
    "cors": "^2.8.5",
    "dotenv": "^16.4.5",
    "express": "^4.19.2",
    "express-rate-limit": "^7.3.1",
    "express-session": "^1.18.0",
    "express-validator": "^7.1.0",
    "he": "^1.2.0",
    "helmet": "^7.1.0",
    "mysql2": "^3.11.3",
    "nodemailer": "^6.9.14",
    "winston": "^3.14.2"
  },
  "devDependencies": {
    "eslint": "^8.57.1",
    "husky": "^9.1.6",
    "lint-staged": "^15.2.10"
  }
}
```
