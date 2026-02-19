# Zitadel Identity Provider Integration

This document describes how to set up and configure Zitadel for ChexPro authentication.

## Overview

Zitadel provides enterprise-grade authentication with:
- OpenID Connect (OIDC) compliance
- Multi-factor authentication (MFA)
- Role-based access control (RBAC)
- Self-hosted or cloud deployment options

## Prerequisites

- Docker and Docker Compose
- Node.js 18+
- Git

## Quick Start (Local Development)

### Step 1: Copy Environment Files

```bash
# Copy Zitadel Docker environment
cp .env.zitadel.example .env.zitadel

# Copy frontend environment (if not already done)
cd frontend
cp .env.example .env

# Copy backend environment (if not already done)
cd ../server
cp .env.template .env
cd ..
```

### Step 2: Start Zitadel with Docker

```bash
# Start Zitadel and dependencies
docker-compose -f docker-compose.zitadel.yml up -d

# Verify Zitadel is running
curl http://localhost:8080/healthz
```

You should see a JSON response indicating Zitadel is healthy.

### Step 3: Initialize Zitadel

```bash
# Make the init script executable (Linux/Mac)
chmod +x scripts/zitadel-init.sh

# Run the initialization script
./scripts/zitadel-init.sh
```

On Windows, run the script using Git Bash or WSL:
```bash
bash scripts/zitadel-init.sh
```

The script will:
1. Wait for Zitadel to be ready
2. Create the ChexPro organization
3. Create the ChexPro project
4. Create frontend and backend applications
5. Set up roles (employer, candidate, admin)
6. Output client IDs for configuration

### Step 4: Configure Environment Variables

#### Frontend (.env)

Update with values from the initialization script output:
```
VITE_ZITADEL_ISSUER=http://localhost:8080
VITE_ZITADEL_CLIENT_ID=<from zitadel-init.sh output>
VITE_ZITADEL_REDIRECT_URI=http://localhost:5173/callback
VITE_ZITADEL_LOGOUT_URI=http://localhost:5173/logout
```

#### Backend (.env)

Update server/.env:
```
ZITADEL_ISSUER=http://localhost:8080
ZITADEL_CLIENT_ID=<from zitadel-init.sh output>
ZITADEL_ENABLED=true
```

### Step 5: Start Development Servers

```bash
# Terminal 1 - Frontend
cd frontend
npm install
npm run dev

# Terminal 2 - Backend
cd server
npm install
npm run dev
```

### Step 6: Test Authentication

1. Open http://localhost:5173/login
2. Click "Sign In with Zitadel" or "Continue with"
3. You should be redirected to Zitadel login
4. Use admin credentials:
   - Username: admin
   - Password: Password123!
5. After login, you'll be redirected back to /dashboard

## Zitadel Console Access

### Default Admin Credentials

- **Username:** admin
- **Password:** Password123! (change in production)

Access the console at: http://localhost:8080/ui/console

### Creating Users Manually

1. Access Zitadel Console at http://localhost:8080/ui/console
2. Log in with admin credentials
3. Navigate to Users → Create User
4. Fill in user details and assign roles

## Role-Based Access Control

### Pre-configured Roles

| Role | Description | Portal Access |
|------|-------------|---------------|
| `employer` | Employer user | Employer Portal |
| `candidate` | Job candidate | Candidate Portal |
| `admin` | Administrator | All portals |

### Assigning Roles

Roles can be assigned via:
1. Zitadel Console → Users → [User] → Roles
2. Organization → Projects → ChexPro → Roles
3. API call with admin privileges

## API Endpoints

### Frontend Authentication

| Endpoint | Description |
|----------|-------------|
| `/callback` | OAuth callback handler |
| `/logout` | Logout handler |

### Backend API

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/zitadel/discovery` | GET | None | OIDC discovery document |
| `/api/zitadel/me` | GET | Zitadel | Get current user info |
| `/api/zitadel/roles` | GET | Zitadel | Get user roles |
| `/api/zitadel/verify` | POST | None | Verify access token |
| `/api/zitadel/employer/dashboard` | GET | Employer | Employer dashboard |
| `/api/zitadel/candidate/dashboard` | GET | Candidate | Candidate dashboard |
| `/api/zitadel/admin/*` | GET/POST | Admin | Admin endpoints |

## Frontend Integration

### Using the Auth Hook

```jsx
import { useZitadelAuth, useHasRole } from '../hooks/useZitadelAuth';

function MyComponent() {
  const { user, isAuthenticated, login, logout } = useZitadelAuth();
  const isEmployer = useHasRole('employer');
  
  if (!isAuthenticated) {
    return <button onClick={login}>Sign In</button>;
  }
  
  return (
    <div>
      <p>Welcome, {user.name}</p>
      {isEmployer && <p>Employer Access</p>}
      <button onClick={logout}>Sign Out</button>
    </div>
  );
}
```

### Protected Routes

```jsx
import { ZitadelAuthProvider } from '../context/ZitadelAuthContext';
import { withZitadelAuth } from '../context/ZitadelAuthContext';

// Wrap your app with the provider
<ZitadelAuthProvider>
  <App />
</ZitadelAuthProvider>

// Protect a component
const ProtectedComponent = withZitadelAuth(
  ({ user }) => <div>Protected: {user.name}</div>,
  { requiredAuth: true }
);

// Protect with role requirement
const EmployerOnly = withZitadelAuth(
  ({ user }) => <div>Employer Dashboard</div>,
  { requiredRoles: ['employer', 'admin'] }
);
```

## Backend Integration

### Using Zitadel Middleware

```javascript
import { zitadelAuth, requireZitadelRole, requireAdmin } from './middleware/zitadelAuth.js';

// Protect any route
app.get('/api/protected', zitadelAuth, (req, res) => {
  res.json({ user: req.user });
});

// Role-based access
app.get('/api/employer', zitadelAuth, requireZitadelRole(['employer', 'admin']), (req, res) => {
  res.json({ data: 'Employer data' });
});

// Admin-only route
app.get('/api/admin', zitadelAuth, requireAdmin, (req, res) => {
  res.json({ data: 'Admin data' });
});
```

## Docker Compose Services

The `docker-compose.zitadel.yml` includes:

| Service | Port | Description |
|---------|------|-------------|
| zitadel | 8080 | Zitadel identity provider |
| db | 5432 | PostgreSQL database |
| minio | 9000/9001 | S3-compatible storage |
| rabbitmq | 5672 | Message queue |

### Stopping Services

```bash
docker-compose -f docker-compose.zitadel.yml down

# To also remove volumes (data will be lost)
docker-compose -f docker-compose.zitadel.yml down -v
```

## Production Deployment

### Cloud Setup (Zitadel Cloud)

1. Create account at https://zitadel.com
2. Create new organization
3. Create project for ChexPro
4. Configure applications

### Environment Variables

**Frontend (.env.production)**
```
VITE_ZITADEL_ISSUER=https://your-org.zitadel.cloud
VITE_ZITADEL_CLIENT_ID=your-client-id
VITE_ZITADEL_REDIRECT_URI=https://yourdomain.com/callback
VITE_ZITADEL_LOGOUT_URI=https://yourdomain.com/logout
```

**Backend (.env)**
```
ZITADEL_ISSUER=https://your-org.zitadel.cloud
ZITADEL_CLIENT_ID=your-client-id
ZITADEL_ENABLED=true
```

### OCI Deployment Notes

When deploying to Oracle Cloud Infrastructure:

1. **Use Zitadel Cloud** for easier management, or deploy Zitadel to OCI using:
   - Oracle Container Engine for Kubernetes (OKE)
   - Oracle Cloud Infrastructure Container Instances
   - Virtual Machine with Docker

2. **Configure TLS/SSL**:
   - Use Oracle Cloud Load Balancer
   - Or configure Zitadel with certificates

3. **Database**:
   - Use Oracle Autonomous Transaction Processing
   - Or PostgreSQL on Oracle Base Database Service

4. **Update CORS**:
   - Add your OCI load balancer URL to Zitadel allowed origins

## Security Considerations

1. **Change default admin password**
2. **Enable MFA for admin accounts**
3. **Use HTTPS in production**
4. **Configure CORS properly**
5. **Set up rate limiting**
6. **Monitor authentication logs**

## Troubleshooting

### Common Issues

#### 1. Token validation fails

```bash
# Check JWKS endpoint
curl http://localhost:8080/oauth/jwks

# Verify issuer in .env matches Zitadel settings
```

#### 2. CORS errors

```bash
# Add frontend origin to Zitadel Console
# Project → Applications → Frontend → Settings → Allowed origins
```

#### 3. User roles not appearing

```bash
# Check token payload
# Ensure roles are included in token response
# Project → Applications → Settings → Add role claim
```

### Debug Mode

Enable debug logging:

```bash
# Frontend
VITE_DEBUG_MODE=true

# Backend
LOG_LEVEL=debug
```

### Container Logs

```bash
# View Zitadel logs
docker logs chexpro-zitadel

# Follow logs
docker logs -f chexpro-zitadel
```

## Migration from Legacy Auth

To migrate existing users to Zitadel:

1. Export users from current system
2. Create matching users in Zitadel
3. Assign appropriate roles
4. Update frontend to use Zitadel Auth
5. Update backend middleware
6. Test all authentication flows

## Support

- Zitadel Documentation: https://docs.zitadel.com
- GitHub Issues: https://github.com/zitadel/zitadel
- ChexPro Team: [internal contacts]
