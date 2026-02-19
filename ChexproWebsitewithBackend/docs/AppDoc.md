# ChexPro Application Integration Guide

**Document Version:** 1.0  
**Date:** February 2026  
**Purpose:** Guide for connecting new applications to the ChexPro platform  

---

## Table of Contents

1. [Overview](#1-overview)
2. [Authentication Integration](#2-authentication-integration)
3. [API Integration](#3-api-integration)
4. [Database Integration](#4-database-integration)
5. [SSO Provider Setup](#5-sso-provider-setup)
6. [Frontend Integration](#6-frontend-integration)
7. [Security Requirements](#7-security-requirements)
8. [Code Examples](#8-code-examples)
9. [Testing Your Integration](#9-testing-your-integration)
10. [Troubleshooting](#10-troubleshooting)

---

## 1. Overview

### 1.1 Purpose
This document provides comprehensive guidance for integrating new applications with the ChexPro background screening platform. It covers authentication, API usage, database access, and security requirements.

### 1.2 Architecture Overview

```
+-------------------+     +-------------------+     +-------------------+
| New Application   |     | ChexPro Platform  |     | External Services |
+-------------------+     +-------------------+     +-------------------+
        |                         |                         |
        | 1. Authentication      |                         |
        |------------------------>|                         |
        |                         |                         |
        | 2. API Requests         |                         |
        |------------------------>|                         |
        |                         | 3. Database Operations  |
        |                         |------------------------>|
        |                         |                         |
        | 4. Response             |                         |
        |<------------------------|                         |
```

### 1.3 Integration Options

| Method | Use Case | Complexity |
|--------|----------|------------|
| API Integration | External apps needing data access | Low |
| SSO Integration | Apps requiring same user identity | Medium |
| Database Sharing | Apps needing direct data access | High |
| Frontend Extension | Adding features to existing UI | Medium |

---

## 2. Authentication Integration

### 2.1 Available Authentication Methods

ChexPro supports three authentication methods:

| Method | Type | Best For |
|--------|------|----------|
| Local | Email/Password | Simple integrations |
| Zitadel | OIDC | Modern cloud apps |
| Keycloak | SAML/OIDC | Enterprise environments |

### 2.2 Local Authentication Integration

**Endpoint:** `POST /api/auth/login`

**Request:**
```javascript
// Step 1: Get CSRF token
const csrfResponse = await fetch('http://localhost:3000/api/auth/csrf-token', {
  credentials: 'include'  // Important for cookies
});
const { csrfToken } = await csrfResponse.json();

// Step 2: Login
const loginResponse = await fetch('http://localhost:3000/api/auth/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-CSRF-Token': csrfToken
  },
  credentials: 'include',
  body: JSON.stringify({
    username: 'user@example.com',
    password: 'securePassword123',
    rememberMe: true
  })
});

const result = await loginResponse.json();
// Result: { status: 'Logged in', userId: 'uuid' }
```

**Session Cookie:** After successful login, an `httpOnly` session cookie is automatically set.

### 2.3 Zitadel OIDC Integration

**Configuration:**
```env
# In your new application's .env
VITE_ZITADEL_ISSUER=http://localhost:8080
VITE_ZITADEL_CLIENT_ID=your-new-app-client-id
VITE_ZITADEL_REDIRECT_URI=http://localhost:your-port/callback
VITE_ZITADEL_LOGOUT_URI=http://localhost:your-port/logout
```

**Frontend Setup:**
```javascript
// Install the Zitadel React package
// npm install @zitadel/react

// In your auth configuration file
import { createZitadelAuth } from '@zitadel/react';

const zitadelAuth = createZitadelAuth({
  issuer: process.env.VITE_ZITADEL_ISSUER,
  clientId: process.env.VITE_ZITADEL_CLIENT_ID,
  redirectUri: process.env.VITE_ZITADEL_REDIRECT_URI,
  postLogoutRedirectUri: process.env.VITE_ZITADEL_LOGOUT_URI,
  scopes: ['openid', 'profile', 'email', 'roles'],
});

// Login redirect
async function login() {
  await zitadelAuth.authorize();
}

// Handle callback
async function handleCallback() {
  const user = await zitadelAuth.userManager.signinRedirectCallback();
  return {
    accessToken: user.access_token,
    idToken: user.id_token,
    user: {
      id: user.profile.sub,
      email: user.profile.email,
      name: user.profile.name,
      roles: user.profile.roles || []
    }
  };
}
```

**Backend Verification:**
```javascript
// In your backend API middleware
import { zitadelAuth, verifyZitadelToken } from './middleware/zitadelAuth.js';

// Protect a route
app.get('/api/protected', zitadelAuth, (req, res) => {
  // req.user contains the authenticated user
  res.json({ user: req.user });
});

// Or verify token manually
app.post('/api/verify-token', async (req, res) => {
  const { token } = req.body;
  try {
    const payload = await verifyZitadelToken(token);
    res.json({ valid: true, user: payload });
  } catch (error) {
    res.status(401).json({ valid: false, error: error.message });
  }
});
```

### 2.4 Keycloak SSO Integration

**Configuration:**
```env
# In your new application's .env
KEYCLOAK_URL=http://localhost:8081
KEYCLOAK_REALM=chexpro
KEYCLOAK_CLIENT_ID=your-new-app
KEYCLOAK_CLIENT_SECRET=your-client-secret
```

**Backend Middleware:**
```javascript
import { keycloakAuth, requireRoles } from './middleware/keycloakAuth.js';

// Protect routes with Keycloak auth
app.get('/api/dashboard', keycloakAuth, (req, res) => {
  res.json({ user: req.user });
});

// Require specific roles
app.get('/api/admin', 
  keycloakAuth, 
  requireRoles(['admin']), 
  (req, res) => {
    res.json({ message: 'Admin access granted' });
  }
);
```

### 2.5 JWT Token Authentication

For API-only integrations, use JWT tokens:

**Obtaining a Token:**
```javascript
// After login, exchange session for JWT
const response = await fetch('/api/auth/token', {
  method: 'POST',
  credentials: 'include'
});
const { accessToken, refreshToken } = await response.json();
```

**Using the Token:**
```javascript
// Include in all API requests
fetch('/api/dashboard/stats', {
  headers: {
    'Authorization': `Bearer ${accessToken}`
  }
});
```

**Token Refresh:**
```javascript
const response = await fetch('/api/auth/refresh', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${refreshToken}`
  }
});
const { accessToken: newAccessToken } = await response.json();
```

---

## 3. API Integration

### 3.1 Base Configuration

**Base URL:**
- Development: `http://localhost:3000`
- Production: `https://api.yourdomain.com`

**Required Headers:**
```javascript
const headers = {
  'Content-Type': 'application/json',
  'X-CSRF-Token': csrfToken,  // For POST/PUT/DELETE
  'Authorization': `Bearer ${token}`  // For protected routes
};
```

### 3.2 Public Endpoints

These endpoints require no authentication:

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/form/csrf-token` | GET | Get CSRF token |
| `/api/form/contact` | POST | Submit contact form |
| `/api/form/demo` | POST | Submit demo request |

**Example - Contact Form:**
```javascript
async function submitContact(formData) {
  // Get CSRF token
  const csrfRes = await fetch(`${API_BASE}/api/form/csrf-token`);
  const { csrfToken } = await csrfRes.json();
  
  // Submit form
  const response = await fetch(`${API_BASE}/api/form/contact`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-CSRF-Token': csrfToken
    },
    body: JSON.stringify({
      firstName: formData.firstName,
      lastName: formData.lastName,
      email: formData.email,
      phone: formData.phone,
      companyName: formData.companyName,
      message: formData.message
    })
  });
  
  return response.json();
}
```

### 3.3 Protected Endpoints

These endpoints require authentication:

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/dashboard/stats` | GET | Session/JWT | Dashboard statistics |
| `/api/dashboard/recent-orders` | GET | Session/JWT | Recent orders |
| `/api/dashboard/reports` | GET | Session/JWT | Screening reports |
| `/api/dashboard/orders` | POST | Session/JWT | Create order |
| `/api/mfa/status` | GET | JWT | MFA status |
| `/api/mfa/setup` | GET | JWT | MFA setup |

**Example - Dashboard Access:**
```javascript
async function getDashboardStats(token) {
  const response = await fetch(`${API_BASE}/api/dashboard/stats`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  if (response.status === 401) {
    // Token expired, redirect to login
    throw new Error('Authentication required');
  }
  
  return response.json();
}
```

### 3.4 Operational Endpoints

These endpoints require Bearer token authorization:

| Endpoint | Method | Token Required | Description |
|----------|--------|----------------|-------------|
| `/health` | GET | HEALTH_CHECK_TOKEN | Health check |
| `/api/docs` | GET | HEALTH_CHECK_TOKEN | API documentation |
| `/api/metrics` | GET | METRICS_TOKEN | Performance metrics |

**Example - Health Check:**
```javascript
async function checkHealth(healthCheckToken) {
  const response = await fetch(`${API_BASE}/health`, {
    headers: {
      'Authorization': `Bearer ${healthCheckToken}`
    }
  });
  
  return response.json();
  // { status: 'ok', timestamp: '2026-02-17T...' }
}
```

### 3.5 Rate Limits

| Endpoint Category | Limit | Window |
|-------------------|-------|--------|
| Global | 100 requests | 15 minutes |
| Contact Form | 3 requests | 5 minutes |
| Demo Form | 2 requests | 10 minutes |
| Login | 5 attempts | 5 minutes |
| MFA Verify | 5 attempts | 15 minutes |
| Dashboard | 30 requests | 1 minute |

**Handling Rate Limits:**
```javascript
async function apiCall(url, options = {}) {
  const response = await fetch(url, options);
  
  if (response.status === 429) {
    const retryAfter = response.headers.get('Retry-After') || 900;
    throw new Error(`Rate limited. Retry after ${retryAfter} seconds`);
  }
  
  return response;
}
```

---

## 4. Database Integration

### 4.1 Database Schema Overview

**Core Tables:**
```sql
-- Users and Authentication
users (id, username, email, password_hash, active, created_at)
sessions (session_id, user_id, expires_at)
persistent_tokens (user_id, token_hash, expires_at)

-- Business Data
clients (id, company_name, contact_email, subscription_tier, api_key)
candidates (id, client_id, first_name, last_name, email, phone)
bg_orders (id, client_id, candidate_id, status, services, due_date)
screening_reports (id, order_id, report_type, findings, risk_level)

-- Support
support_requests (id, client_id, request_type, priority, status)
batch_invites (id, client_id, batch_name, status, total_invites)
```

### 4.2 Database Connection

**Configuration:**
```javascript
// Using MySQL2 with connection pooling
import mysql from 'mysql2/promise';

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  connectionLimit: 10,
  queueLimit: 50
});

export default pool;
```

**Usage Example:**
```javascript
// Query with parameterized statements (prevents SQL injection)
const [rows] = await pool.query(
  'SELECT * FROM clients WHERE id = ? AND active = ?',
  [clientId, true]
);
```

### 4.3 Creating a New Client

To integrate a new application as a client:

```sql
-- 1. Create client record
INSERT INTO clients (id, company_name, contact_email, subscription_tier, api_key, active)
VALUES (UUID(), 'New App Name', 'contact@newapp.com', 'basic', 'generated-api-key', true);

-- 2. Create associated user
INSERT INTO users (id, username, email, password_hash, active, client_id)
VALUES (UUID(), 'newapp_user', 'user@newapp.com', '$2b$10$...', true, 'client-uuid');

-- 3. Retrieve API key for authentication
SELECT api_key FROM clients WHERE id = 'client-uuid';
```

### 4.4 API Key Authentication

For server-to-server integration:

```javascript
// Middleware for API key authentication
async function apiKeyAuth(req, res, next) {
  const apiKey = req.headers['x-api-key'];
  
  if (!apiKey) {
    return res.status(401).json({ error: 'API key required' });
  }
  
  const [clients] = await pool.query(
    'SELECT id, company_name FROM clients WHERE api_key = ? AND active = true',
    [apiKey]
  );
  
  if (clients.length === 0) {
    return res.status(401).json({ error: 'Invalid API key' });
  }
  
  req.client = clients[0];
  next();
}
```

---

## 5. SSO Provider Setup

### 5.1 Setting Up Zitadel for New Application

**Step 1: Create Application in Zitadel Console**

1. Navigate to Zitadel Console: `http://localhost:8080/ui/console`
2. Go to your project > Applications > New
3. Select "Web Application"
4. Configure:
   - Name: `New Application`
   - Redirect URIs: `http://localhost:your-port/callback`
   - Post Logout URIs: `http://localhost:your-port/logout`
   - Auth Method: `PKCE` (recommended) or `Client Secret Basic`

**Step 2: Note Configuration Values**
```
Client ID: 123456789012345678
Client Secret: (if confidential client)
```

**Step 3: Configure Your Application**
```env
VITE_ZITADEL_ISSUER=http://localhost:8080
VITE_ZITADEL_CLIENT_ID=123456789012345678
VITE_ZITADEL_REDIRECT_URI=http://localhost:3001/callback
VITE_ZITADEL_LOGOUT_URI=http://localhost:3001/logout
```

**Step 4: Create Roles (Optional)**
1. Go to Project > Roles
2. Create roles: `employer`, `candidate`, `admin`
3. Assign roles to users

### 5.2 Setting Up Keycloak for New Application

**Step 1: Create Client in Keycloak**

1. Navigate to Keycloak Admin: `http://localhost:8081/admin`
2. Select realm: `chexpro`
3. Go to Clients > Create
4. Configure:
   - Client ID: `new-application`
   - Client Protocol: `openid-connect`
   - Access Type: `confidential` (for server apps) or `public` (for SPAs)

**Step 2: Configure Settings**
```
Valid Redirect URIs: http://localhost:your-port/*
Web Origins: http://localhost:your-port
```

**Step 3: Get Client Secret**
1. Go to Credentials tab
2. Copy the secret

**Step 4: Configure Your Application**
```env
KEYCLOAK_URL=http://localhost:8081
KEYCLOAK_REALM=chexpro
KEYCLOAK_CLIENT_ID=new-application
KEYCLOAK_CLIENT_SECRET=your-client-secret
```

### 5.3 Role Mapping

**Zitadel Roles:**
```javascript
// Roles are returned in the ID token and access token
const roles = user.profile.roles || [];

// Check role
if (roles.includes('admin')) {
  // Grant admin access
}
```

**Keycloak Roles:**
```javascript
// Roles are in realm_access.roles
const roles = tokenPayload.realm_access?.roles || [];

// Check role
if (roles.includes('admin')) {
  // Grant admin access
}
```

---

## 6. Frontend Integration

### 6.1 Using ChexPro Components

**Install Shared Dependencies:**
```bash
npm install react-router-dom framer-motion react-i18next
```

**Copy UI Components:**
Copy from `frontend/src/components/ui/`:
- `button.jsx` - Button component
- `card.jsx` - Card component
- `input.jsx` - Input component
- `toast.jsx` - Toast notifications

### 6.2 Implementing Authentication Context

```javascript
// AuthContext.jsx for your new app
import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for existing session
    checkAuth();
  }, []);

  async function checkAuth() {
    try {
      const response = await fetch('/api/auth/me', {
        credentials: 'include'
      });
      
      if (response.ok) {
        const { user } = await response.json();
        setUser(user);
      }
    } finally {
      setIsLoading(false);
    }
  }

  async function login(username, password) {
    const csrfRes = await fetch('/api/auth/csrf-token');
    const { csrfToken } = await csrfRes.json();
    
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': csrfToken
      },
      credentials: 'include',
      body: JSON.stringify({ username, password })
    });

    if (!response.ok) {
      throw new Error('Login failed');
    }

    await checkAuth();
  }

  async function logout() {
    await fetch('/api/auth/logout', {
      method: 'POST',
      credentials: 'include'
    });
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
```

### 6.3 Protected Route Component

```javascript
// ProtectedRoute.jsx
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';

export function ProtectedRoute({ children, requiredRoles = [] }) {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} />;
  }

  const hasRequiredRoles = requiredRoles.every(
    role => user.roles?.includes(role)
  );

  if (!hasRequiredRoles) {
    return <div>Access denied</div>;
  }

  return children;
}
```

### 6.4 API Client Setup

```javascript
// apiClient.js
const API_BASE = process.env.VITE_API_BASE_URL || 'http://localhost:3000';

class ApiClient {
  constructor() {
    this.csrfToken = null;
  }

  async getCsrfToken() {
    if (this.csrfToken) return this.csrfToken;
    
    const response = await fetch(`${API_BASE}/api/form/csrf-token`, {
      credentials: 'include'
    });
    const { csrfToken } = await response.json();
    this.csrfToken = csrfToken;
    return csrfToken;
  }

  async request(endpoint, options = {}) {
    const { method = 'GET', body, requireCsrf = false } = options;
    
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers
    };

    if (requireCsrf || method !== 'GET') {
      headers['X-CSRF-Token'] = await this.getCsrfToken();
    }

    const response = await fetch(`${API_BASE}${endpoint}`, {
      method,
      headers,
      credentials: 'include',
      body: body ? JSON.stringify(body) : undefined
    });

    if (response.status === 429) {
      throw new Error('Rate limited');
    }

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Request failed');
    }

    return response.json();
  }

  // Convenience methods
  get(endpoint) {
    return this.request(endpoint);
  }

  post(endpoint, body) {
    return this.request(endpoint, { method: 'POST', body, requireCsrf: true });
  }

  put(endpoint, body) {
    return this.request(endpoint, { method: 'PUT', body, requireCsrf: true });
  }

  delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE', requireCsrf: true });
  }
}

export const api = new ApiClient();
```

---

## 7. Security Requirements

### 7.1 Mandatory Security Controls

All integrated applications must implement:

| Control | Requirement | Implementation |
|---------|-------------|----------------|
| HTTPS | Required in production | TLS 1.2+ |
| CSRF | All state-changing requests | Token validation |
| Input Validation | All user inputs | Sanitization + validation |
| Rate Limiting | All endpoints | Configured per endpoint |
| Error Handling | No sensitive data in errors | Generic messages |
| Logging | Security events | Audit trail |

### 7.2 Cookie Security

```javascript
// Required cookie settings
const cookieOptions = {
  httpOnly: true,      // Prevent XSS access
  secure: true,        // HTTPS only (production)
  sameSite: 'strict',  // Prevent CSRF
  maxAge: 3600000,     // 1 hour
  path: '/',
  domain: '.yourdomain.com'  // For subdomain sharing
};
```

### 7.3 Content Security Policy

```javascript
// Recommended CSP headers
const cspDirectives = {
  'default-src': ["'self'"],
  'script-src': ["'self'"],
  'style-src': ["'self'", "'unsafe-inline'"],
  'img-src': ["'self'", 'data:', 'https:'],
  'connect-src': ["'self'", 'https://api.yourdomain.com'],
  'font-src': ["'self'"],
  'frame-ancestors': ["'none'"],
  'form-action': ["'self'"]
};
```

### 7.4 Input Validation Rules

```javascript
// Example validation schema
const validationRules = {
  email: {
    format: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    maxLength: 255,
    required: true
  },
  phone: {
    format: /^[\d\s-()+.]{10,20}$/,
    required: false
  },
  message: {
    maxLength: 2000,
    minLength: 1,
    required: true
  }
};

function validateInput(data, rules) {
  const errors = [];
  
  for (const [field, rule] of Object.entries(rules)) {
    const value = data[field];
    
    if (rule.required && !value) {
      errors.push(`${field} is required`);
      continue;
    }
    
    if (value && rule.format && !rule.format.test(value)) {
      errors.push(`${field} has invalid format`);
    }
    
    if (value && rule.maxLength && value.length > rule.maxLength) {
      errors.push(`${field} exceeds maximum length`);
    }
  }
  
  return errors;
}
```

---

## 8. Code Examples

### 8.1 Complete Integration Example

**Backend (Express.js):**
```javascript
// server.js for new application
import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { keycloakAuth, requireRoles } from '@chexpro/auth-middleware';

const app = express();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS.split(','),
  credentials: true
}));
app.use(cookieParser());
app.use(express.json());

// Rate limiting
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
}));

// Public routes
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Protected routes
app.get('/api/data', keycloakAuth, async (req, res) => {
  // Access ChexPro API with user's token
  const response = await fetch('http://localhost:3000/api/dashboard/stats', {
    headers: {
      'Authorization': `Bearer ${req.user.tokenPayload.access_token}`
    }
  });
  
  const data = await response.json();
  res.json(data);
});

// Admin routes
app.post('/api/admin/config', 
  keycloakAuth, 
  requireRoles(['admin']), 
  async (req, res) => {
    // Admin-only operation
    res.json({ success: true });
  }
);

app.listen(3001, () => {
  console.log('New application running on port 3001');
});
```

**Frontend (React):**
```javascript
// App.jsx for new application
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './AuthContext';
import { ProtectedRoute } from './ProtectedRoute';
import HomePage from './pages/HomePage';
import DashboardPage from './pages/DashboardPage';
import LoginPage from './pages/LoginPage';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            } 
          />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
```

### 8.2 Webhook Integration

**Receive webhooks from ChexPro:**
```javascript
// Webhook endpoint in your application
import crypto from 'crypto';

app.post('/webhooks/chexpro', express.raw({ type: 'application/json' }), (req, res) => {
  const signature = req.headers['x-chexpro-signature'];
  const payload = req.body;
  
  // Verify signature
  const expectedSignature = crypto
    .createHmac('sha256', process.env.CHEXPRO_WEBHOOK_SECRET)
    .update(payload)
    .digest('hex');
  
  if (signature !== expectedSignature) {
    return res.status(401).json({ error: 'Invalid signature' });
  }
  
  const event = JSON.parse(payload);
  
  // Handle different event types
  switch (event.type) {
    case 'order.completed':
      handleOrderComplete(event.data);
      break;
    case 'report.ready':
      handleReportReady(event.data);
      break;
    default:
      console.log('Unknown event type:', event.type);
  }
  
  res.json({ received: true });
});
```

---

## 9. Testing Your Integration

### 9.1 Authentication Testing

```bash
# Test CSRF token endpoint
curl http://localhost:3000/api/form/csrf-token

# Test login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -H "X-CSRF-Token: <token>" \
  -d '{"username":"testuser","password":"testpass"}' \
  -c cookies.txt

# Test protected endpoint
curl http://localhost:3000/api/dashboard/stats \
  -b cookies.txt
```

### 9.2 API Testing

```javascript
// Test script
const API_BASE = 'http://localhost:3000';

async function testIntegration() {
  console.log('Testing ChexPro Integration...\n');
  
  // 1. Health check
  try {
    const health = await fetch(`${API_BASE}/health`, {
      headers: { 'Authorization': 'Bearer test-token' }
    });
    console.log('Health check:', health.status);
  } catch (e) {
    console.error('Health check failed:', e.message);
  }
  
  // 2. CSRF token
  let csrfToken;
  try {
    const csrf = await fetch(`${API_BASE}/api/form/csrf-token`);
    const data = await csrf.json();
    csrfToken = data.csrfToken;
    console.log('CSRF token obtained:', csrfToken.substring(0, 10) + '...');
  } catch (e) {
    console.error('CSRF token failed:', e.message);
  }
  
  // 3. Contact form
  try {
    const contact = await fetch(`${API_BASE}/api/form/contact`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': csrfToken
      },
      body: JSON.stringify({
        firstName: 'Test',
        lastName: 'User',
        email: 'test@example.com',
        message: 'Integration test'
      })
    });
    console.log('Contact form:', contact.status);
  } catch (e) {
    console.error('Contact form failed:', e.message);
  }
  
  console.log('\nIntegration test complete!');
}

testIntegration();
```

### 9.3 Load Testing

```bash
# Using Apache Bench
ab -n 100 -c 10 http://localhost:3000/health

# Using k6
k6 run --vus 10 --duration 30s script.js
```

---

## 10. Troubleshooting

### 10.1 Common Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| CORS errors | Origin not allowed | Add to ALLOWED_ORIGINS |
| CSRF token invalid | Token expired/mismatch | Refresh token before request |
| 401 Unauthorized | Session expired | Re-authenticate |
| 429 Too Many Requests | Rate limit exceeded | Wait and retry |
| JWT verification failed | Wrong secret/issuer | Check configuration |

### 10.2 Debug Mode

Enable debug logging:
```env
LOG_LEVEL=debug
DEBUG_MODE=true
```

### 10.3 Support Contacts

| Issue Type | Contact |
|------------|---------|
| API Issues | api-support@chexpro.com |
| Authentication | auth-support@chexpro.com |
| Security | security@chexpro.com |

---

## Appendix A: Environment Variables Reference

### New Application Required Variables

```env
# Server Configuration
NODE_ENV=development
PORT=3001
LOG_LEVEL=info

# Security
SESSION_SECRET=your-session-secret-min-32-chars
CSRF_SECRET=your-csrf-secret-min-32-chars

# ChexPro Integration
CHEXPRO_API_URL=http://localhost:3000
CHEXPRO_API_KEY=your-api-key
CHEXPRO_WEBHOOK_SECRET=your-webhook-secret

# SSO Configuration (choose one)
# Zitadel
ZITADEL_ISSUER=http://localhost:8080
ZITADEL_CLIENT_ID=your-client-id
ZITADEL_CLIENT_SECRET=your-client-secret

# Keycloak
KEYCLOAK_URL=http://localhost:8081
KEYCLOAK_REALM=chexpro
KEYCLOAK_CLIENT_ID=your-client-id
KEYCLOAK_CLIENT_SECRET=your-client-secret

# Database (if direct access needed)
DB_HOST=localhost
DB_PORT=3306
DB_USER=your-db-user
DB_PASSWORD=your-db-password
DB_DATABASE=chexpro_db

# CORS
ALLOWED_ORIGINS=http://localhost:3001,http://localhost:3000
```

---

## Appendix B: API Response Formats

### Success Response
```json
{
  "status": "Success",
  "description": "Operation completed successfully",
  "data": { ... }
}
```

### Error Response
```json
{
  "error": "Error type",
  "message": "Detailed error message",
  "details": { ... }  // Only in development
}
```

### Validation Error
```json
{
  "errors": [
    {
      "msg": "Invalid value",
      "param": "email",
      "location": "body"
    }
  ]
}
```

---

**Document Prepared By:** Development Team  
**Last Updated:** February 2026  
**Next Review:** Quarterly

**Confidentiality Notice:** This document contains confidential and proprietary information. Distribution is restricted to authorized personnel only.