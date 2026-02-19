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
- **Framework**: React v19.1.1
- **Build Tool**: Vite v7.3.1
- **Language**: JavaScript + JSX
- **Styling**: Tailwind CSS v3.4.14
- **Animation**: Framer Motion v12.23.12
- **Routing**: React Router DOM v6.30.1
- **UI Library**: ShadCN (Radix UI)
- **Internationalization**: react-i18next v15.6.1
- **Cookie Management**: js-cookie v3.0.5
- **Error Boundaries**: React Error Boundaries

## 3. Error Boundaries

### 3.1. Implementation
Error boundaries are implemented in `frontend/src/components/ErrorBoundary.jsx` to catch JavaScript errors anywhere in the component tree and display a fallback UI.

```jsx
import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-fallback">
          <h2>Something went wrong</h2>
          <p>{this.state.error?.message}</p>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
```

### 3.2. Usage Pattern
Wrap page components with ErrorBoundary to prevent entire application crashes:
```jsx
<ErrorBoundary>
  <Suspense fallback={<PageLoader />}>
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/about" element={<AboutUsPage />} />
    </Routes>
  </Suspense>
</ErrorBoundary>
```

### 3.3. Error Tracking
- Errors are logged to console during development
- Production error tracking configured via `errorTracking.js` utility
- Integration with monitoring services for production alerts

## 4. Routing

### 4.1. React Router DOM Setup
The routing is configured in `frontend/src/App.jsx` using React Router DOM v6 with lazy loading:

```jsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import PageLoader from './components/ui/PageLoader';

const HomePage = lazy(() => import('./pages/HomePage'));
const AboutUsPage = lazy(() => import('./pages/AboutUsPage'));
const ContactUsPage = lazy(() => import('./pages/ContactUsPage'));
// ... other page imports

function App() {
  return (
    <BrowserRouter>
      <ErrorBoundary>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/about" element={<AboutUsPage />} />
            <Route path="/contact" element={<ContactUsPage />} />
            <Route path="/compliance" element={<CompliancePage />} />
            <Route path="/services" element={<ServicesPage />} />
            <Route path="/resources" element={<ResourcesPage />} />
            <Route path="/privacy" element={<PrivacyPolicyPage />} />
            <Route path="/terms" element={<TermsOfServicePage />} />
            <Route path="/data-security" element={<DataSecurityPage />} />
            <Route path="/fcra-compliance" element={<FCRACompliancePage />} />
            <Route path="/request-demo" element={<RequestDemoPage />} />
            <Route path="/client-login" element={<ClientLoginPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Suspense>
      </ErrorBoundary>
    </BrowserRouter>
  );
}

export default App;
```

### 4.2. Route Protection
Route protection implemented via middleware and authentication guards:
- `jwtAuth.js` middleware handles authentication checks
- Protected routes redirect to login when unauthenticated
- Role-based access control for admin routes

### 4.3. Route Change Tracking
Using `RouteChangeTracker.jsx` for analytics and navigation tracking:
- Google Analytics integration
- Page view event tracking
- User navigation flow monitoring

### 4.4. Lazy Loading Strategy
All pages are lazy-loaded to optimize initial bundle size:
- Reduces initial load time
- Code splitting per route
- Improves performance on slow connections

## 5. State Management

### 5.1. State Management Approach
ChexPro uses a combination of React's built-in state management solutions:

#### Local Component State
```jsx
const [isLoading, setIsLoading] = useState(false);
const [formData, setFormData] = useState(initialState);
```

#### useReducer for Complex State
```jsx
const [state, dispatch] = useReducer(reducer, initialState);
```

#### Context API for Global State
- `AppContext` for application-wide state
- `AuthContext` for authentication state
- `LanguageContext` for i18n state

### 5.2. Custom Hooks
ChexPro implements several custom hooks for reusable state logic:

**Cookie Management Hooks:**
- `useCookieConsent.js` - Manages cookie consent state
- `useCookieManager.js` - Handles cookie operations
- `useCookiePreferences.js` - User preferences for cookies

**Page Transitions:**
- `usePageTransition.jsx` - Handles page transition animations

**Form Handling:**
- `useFormValidation.js` - Form validation logic
- Custom hooks in `inputValidation.js` middleware

**Analytics:**
- `useGAPageTracking.jsx` - Google Analytics page tracking

### 5.3. Centralized Configuration
State configuration managed through:
- `appConfig.js` - Application-wide configuration
- `envConfig.js` - Environment-specific settings
- `appConfig.js` - React environment variables

### 5.4. Performance Optimization
- Memoization with `useMemo` and `useCallback`
- `React.memo` for component optimization
- Lazy loading for code splitting

## 6. Styling

### 6.1. Tailwind CSS Configuration
Tailwind CSS v3.4.14 with custom theme configuration in `tailwind.config.js`:

```javascript
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          // ... custom color palette
        },
        secondary: {
          // ... secondary colors
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        heading: ['Poppins', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
      },
    },
  },
  plugins: [
    require('tailwindcss-animate'),
  ],
}
```

### 6.2. Component Styling Approach
Using Radix UI primitives with Tailwind CSS:
- `clsx` and `tailwind-merge` for class composition
- `class-variance-authority` for variant management

Example component:
```jsx
import { cva } from 'class-variance-authority';
import { cn } from '../lib/utils';

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground",
        outline: "border border-input bg-background",
        ghost: "hover:bg-accent",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md",
        lg: "h-11 rounded-md",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

const Button = React.forwardRef(({ className, variant, size, ...props }, ref) => {
  return (
    <button
      className={cn(buttonVariants({ variant, size, className }))}
      ref={ref}
      {...props}
    />
  );
});
```

### 6.3. Global Styles
Global styles in `src/index.css`:
- Tailwind directives (@tailwind base, components, utilities)
- Custom CSS variables for theming
- Global font definitions
- Reset and normalization styles

### 6.4. Responsive Design
- Mobile-first approach
- Breakpoint definitions in Tailwind config
- Responsive utility classes (sm, md, lg, xl, 2xl)
- Touch-friendly interactive elements

### 6.5. Animation
Framer Motion integration for complex animations:
```jsx
import { motion } from 'framer-motion';

const AnimatedSection = ({ children }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -20 }}
    transition={{ duration: 0.3 }}
  >
    {children}
  </motion.div>
);
```

Page transitions managed via `PageTransition.jsx` component.

## 7. Backend Architecture

### 7.1. Framework and Language
- **Framework**: Node.js with Express.js
- **Language**: JavaScript (ES Modules)
- **Runtime**: Node.js v18+
- **Process Manager**: PM2

### 7.2. Project Structure
```
server/
├── index.js              # Application entry point
├── package.json          # Dependencies and scripts
├── eslint.config.js      # ESLint configuration
├── config/
│   ├── db.js            # Database configuration
│   └── tokens.js        # Token management
├── middleware/
│   ├── jwtAuth.js       # JWT authentication
│   ├── security.js      # Security headers and middleware
│   ├── validation.js    # Request validation
│   └── inputValidation.js # Form input sanitization
├── routes/
│   ├── auth.js          # Authentication routes
│   ├── dashboard.js     # Dashboard routes
│   ├── forms.js         # Form submission routes
│   └── mfa.js           # Multi-factor authentication
├── utils/
│   ├── apiResponse.js   # Standardized API responses
│   ├── apiDocs.js       # API documentation generator
│   ├── cache.js         # Caching utilities
│   ├── cspConfig.js     # CSP configuration
│   ├── dbInit.js        # Database initialization
│   ├── emailConfig.js   # Email/SMTP configuration
│   ├── emailRetry.js    # Email retry logic
│   ├── envValidator.js   # Environment validation
│   ├── errorTracking.js # Error tracking and logging
│   ├── mfa.js           # MFA utilities
│   ├── performance.js   # Performance monitoring
│   ├── queryCache.js     # Query caching
│   └── userManager.js    # User management utilities
├── scripts/
│   ├── createDemoUser.js # Create demo user script
│   ├── populateSampleData.js # Sample data population
│   └── validateConfig.js  # Configuration validation
└── sql/
    └── schema.sql       # Database schema
```

### 7.3. API Design

#### 7.3.1. RESTful API Structure
- **Protocol**: HTTP/HTTPS
- **Format**: JSON
- **Base URL**: `/api`

#### 7.3.2. API Endpoints

**Authentication Routes (`/routes/auth.js`):**
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `POST /api/auth/refresh` - Refresh access token
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update user profile
- `POST /api/auth/mfa/enable` - Enable MFA
- `POST /api/auth/mfa/verify` - Verify MFA code

**Form Routes (`/routes/forms.js`):**
- `POST /api/form/contact` - Contact form submission
- `POST /api/form/demo` - Demo request form
- `POST /api/form/newsletter` - Newsletter signup
- `GET /api/form/submissions` - View submissions (admin)

**Dashboard Routes (`/routes/dashboard.js`):**
- `GET /api/dashboard/stats` - Dashboard statistics
- `GET /api/dashboard/recent` - Recent activity
- `GET /api/dashboard/users` - User management

**MFA Routes (`/routes/mfa.js`):**
- `POST /api/mfa/setup` - Setup MFA
- `POST /api/mfa/verify` - Verify MFA
- `POST /api/mfa/disable` - Disable MFA

### 7.4. Security (SOC2 Compliant)

#### 7.4.1. Input Validation
- **Library**: `express-validator`
- **Sanitization**: HTML escaping using `he` library
- **SQL Injection Prevention**: Parameterized queries
- **XSS Prevention**: Input sanitization and output encoding

#### 7.4.2. Rate Limiting
```javascript
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: { error: 'Too many requests, please try again later' }
});

// Stricter limits for auth endpoints
const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // 5 failed attempts per hour
  message: { error: 'Too many login attempts, please try again later' }
});
```

#### 7.4.3. CSRF Protection
- Token-based CSRF protection for all forms
- Double submit cookie pattern
- CSRF tokens validated on every state-changing request

#### 7.4.4. Session Management
```javascript
const session = require('express-session');
const sessionStore = require('./sessionStore');

app.use(session({
  secret: process.env.SESSION_SECRET,
  store: sessionStore,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));
```

#### 7.4.5. Password Security
- **Hashing**: bcrypt with salt rounds (10)
- **Strength Requirements**: Minimum 8 characters, mixed case, numbers, special chars
- **Breach Detection**: Check against known breached passwords

#### 7.4.6. Authentication & Authorization
- **JWT Tokens**: Access and refresh token pattern
- **Role-Based Access Control (RBAC)**:
  - `admin` - Full system access
  - `manager` - Department management
  - `user` - Standard user access
  - `client` - Client portal access

#### 7.4.7. Security Headers (Helmet.js)
```javascript
const helmet = require('helmet');
const csp = require('./utils/cspConfig');

app.use(helmet());
app.use(helmet.contentSecurityPolicy(csp));
app.use(helmet.hsts({
  maxAge: 31536000,
  includeSubDomains: true,
  preload: true
}));
```

#### 7.4.8. IP Whitelisting
- Configurable IP restrictions for admin endpoints
- Environment variable: `ADMIN_IP_WHITELIST`
- CIDR notation support

### 7.5. Database Integration

#### 7.5.1. Database Configuration
- **Database**: MySQL 8.0+
- **Connection Pool**: mysql2 with connection pooling
- **Pool Settings**:
  - `connectionLimit`: 10
  - `waitForConnections`: true
  - `queueLimit`: 0

#### 7.5.2. Database Schema
Located in `sql/schema.sql`:

```sql
-- Users table
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('admin', 'manager', 'user', 'client') DEFAULT 'user',
  mfa_enabled BOOLEAN DEFAULT FALSE,
  mfa_secret VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Persistent tokens for "remember me"
CREATE TABLE persistent_tokens (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  token_hash VARCHAR(255) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Email recipients for notifications
CREATE TABLE email_recipients (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  type ENUM('contact', 'demo', 'newsletter') NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### 7.5.3. Database Initialization
- **Auto-initialization**: Database schema created on first run
- **Manual initialization**: `npm run db:init`
- **Validation**: `npm run validate-config`

### 7.6. Monitoring & Performance

#### 7.6.1. Performance Monitoring
- **Request Tracking**: Response time for each endpoint
- **Memory Usage**: Process memory monitoring
- **Database Queries**: Slow query logging

#### 7.6.2. Error Tracking
- **Logging**: Winston logger with multiple transports
- **Error Codes**: Standardized error code system
- **Stats**: Error statistics and trending

#### 7.6.3. Health Checks
- **Endpoint**: `GET /health`
- **Response**: Application and database status
- **Auth**: Optional token-based authentication

#### 7.6.4. Metrics Endpoint
- **Endpoint**: `GET /api/metrics`
- **Auth**: Requires `METRICS_TOKEN`
- **Data**:
  - Request counts
  - Response times
  - Error rates
  - Memory usage
  - Database connection stats

## 8. Dependencies

### 8.1. Frontend Dependencies

```json
{
  "dependencies": {
    "@portabletext/react": "^6.0.2",
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
    "@sanity/client": "^7.14.1",
    "@sanity/image-url": "^2.0.3",
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.0.0",
    "dompurify": "^3.2.6",
    "framer-motion": "^12.23.12",
    "i18next": "^25.3.2",
    "js-cookie": "^3.0.5",
    "lucide-react": "^0.537.0",
    "marked": "^12.0.2",
    "react": "^19.1.1",
    "react-dom": "^19.1.1",
    "react-helmet-async": "^2.0.5",
    "react-i18next": "^15.6.1",
    "react-router-dom": "^6.30.1",
    "tailwind-merge": "^3.3.1",
    "tailwindcss-animate": "^1.0.7"
  },
  "devDependencies": {
    "@eslint/js": "^9.32.0",
    "@sanity/cli": "^5.8.1",
    "@types/node": "^24.2.0",
    "@types/react": "^19.1.9",
    "@types/react-dom": "^19.1.7",
    "@vitejs/plugin-react": "^5.0.0",
    "autoprefixer": "^10.4.16",
    "eslint": "^8.57.1",
    "eslint-config-react-app": "^7.0.1",
    "eslint-plugin-react": "^7.37.5",
    "eslint-plugin-react-refresh": "^0.4.20",
    "husky": "^9.1.7",
    "lint-staged": "^16.1.4",
    "postcss": "^8.4.31",
    "tailwindcss": "^3.4.14",
    "terser": "^5.39.0",
    "vite": "^7.1.0"
  }
}
```

### 8.2. Backend Dependencies

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

## 9. Internationalization

### 9.1. Supported Languages
- English (en) - Default
- Spanish (es)
- French (fr)
- Hindi (hi)

### 9.2. Translation Files
Located in `frontend/src/i18n/locales/`:
- `en.json` - English translations
- `es.json` - Spanish translations
- `fr.json` - French translations
- `hi.json` - Hindi translations

### 9.3. Language Detection
- Browser language detection
- User preference persistence
- Fallback to English

## 10. Security Compliance

### 10.1. SOC2 Compliance Features
- Comprehensive audit logging
- Access control and authentication
- Data encryption in transit and at rest
- Input validation and sanitization
- Error handling without information disclosure
- Session management with secure tokens
- Regular security monitoring

### 10.2. Security Headers
- Content Security Policy (CSP)
- X-Frame-Options
- X-Content-Type-Options
- Referrer-Policy
- Permissions-Policy

## 11. Performance Optimization

### 11.1. Frontend Optimizations
- Lazy loading of components
- Code splitting
- Image optimization
- Bundle size optimization
- Terser minification for production builds

### 11.2. Backend Optimizations
- Database connection pooling
- Response caching
- Compression middleware
- Request/response monitoring

## 12. Deployment

### 12.1. GitHub Actions Workflow
The project uses GitHub Actions for secure deployment to OCI:

**Workflow Steps:**
1. **Checkout Code**: Clone repository
2. **Install OCI CLI**: Configure OCI access
3. **Whitelist Runner IP**: Add GitHub runner IP to OCI NSG
4. **Deploy via SSH**: Execute deployment script on OCI server
5. **Revoke Access**: Remove IP whitelist rule

**Required Secrets:**
- `OCI_CLI_USER` - OCI user OCID
- `OCI_CLI_TENANCY` - OCI tenancy OCID
- `OCI_CLI_FINGERPRINT` - API key fingerprint
- `OCI_CLI_KEY_CONTENT` - Private key content
- `OCI_CLI_REGION` - OCI region
- `OCI_NSG_OCID` - Network security group OCID
- `OCI_SSH_HOST` - Server SSH host
- `OCI_SSH_USER` - SSH username
- `OCI_SSH_PRIVATE_KEY` - SSH private key

### 12.2. Deployment Script
```bash
# Navigate to build directory
cd /var/www/chexpro-frontend-build

# Pull latest code
git reset --hard origin/master
git pull origin master

# Build frontend
cd frontend
npm install --legacy-peer-deps
npm run build

# Deploy frontend
rsync -av --delete dist/ /var/www/chexpro-frontend/

# Deploy backend
cd ../server
rsync -av --delete --exclude 'node_modules/' . /var/www/chexpro-backend/

# Restart backend
cd /var/www/chexpro-backend
npm install --production
pm2 reload chexpro-backend --update-env
```

## 13. Cookie Management

### 13.1. Cookie Consent
The application uses a cookie consent management system:
- **Consent Types**: Essential, Analytics, Marketing
- **User Preferences**: Stored in cookies
- **Compliance**: GDPR compliant

### 13.2. Cookie Categories

**Essential Cookies:**
- Session ID
- CSRF tokens
- Authentication tokens
- Security tokens

**Analytics Cookies:**
- Google Analytics tracking
- Page view tracking
- User behavior analytics

**Marketing Cookies:**
- Third-party marketing tools
- Remarketing pixels
- Conversion tracking

## 14. Google Analytics Integration

### 14.1. GA4 Setup
- **Measurement ID**: `VITE_GA_MEASUREMENT_ID`
- **Tracking**: Page views and events
- **User Tracking**: Anonymous user tracking

### 14.2. Implementation
- **G-Tag**: Google Analytics 4 snippet
- **Page Tracking**: Automatic on route change
- **Event Tracking**: User interactions and conversions
