# Keycloak Enterprise Authentication Setup Guide

## Overview

This document describes how to set up Keycloak as the enterprise authentication provider for ChexPro. Keycloak will handle:
- Employer portal authentication
- Candidate background check tracking authentication
- Role-based access control (RBAC)
- Multi-factor authentication (MFA)
- SSO capabilities

## Prerequisites

1. Docker Desktop running
2. Access to ports 8081 (Keycloak admin console)
3. Node.js and npm installed
4. Access to frontend and server directories

## Quick Start (When Docker is Working)

### Step 1: Start Keycloak

```bash
docker-compose -f docker-compose.keycloak.yml up -d
```

Wait for Keycloak to start (about 30 seconds), then access:
- **Admin Console**: http://localhost:8081
- **Admin Username**: admin
- **Admin Password**: Admin123!

### Step 2: Create ChexPro Realm

1. Log in to Keycloak Admin Console
2. Click "Master" dropdown (top-left) → "Create realm"
3. Fill in:
   - **Realm name**: `chexpro`
   - **Display name**: `ChexPro`
   - **Enabled**: `ON`
4. Click "Create"

### Step 3: Create Roles

In the ChexPro realm:

1. Go to **Realm Roles** → **Create role**
2. Create these roles:
   - `employer` - For employer portal access
   - `candidate` - For candidate tracking portal
   - `admin` - For ChexPro staff administrators

### Step 4: Create Client Applications

#### Frontend Application (Public Client)

1. Go to **Clients** → **Create client**
2. Fill in:
   - **Client ID**: `chexpro-frontend`
   - **Client type**: `OpenID Connect`
3. Click **Next** → **Save**
4. Configure:
   - **Valid redirect URIs**:
     - `http://localhost:5173/*`
     - `http://localhost:3000/*`
     - `https://chexpro.com/*`
   - **Web origins**: `*`
   - **Login theme**: `chexpro` (custom theme)
5. Save and note the **Client ID** for frontend/.env

#### Backend Application (Confidential Client)

1. Go to **Clients** → **Create client**
2. Fill in:
   - **Client ID**: `chexpro-backend`
   - **Client type**: `OpenID Connect`
3. Click **Next** → **Save**
4. Configure:
   - **Valid redirect URIs**: (leave empty for service)
   - **Web origins**: (leave empty)
   - **Client authentication**: `ON`
   - **Service accounts enabled**: `ON`
5. Save and note the **Client Secret** from the **Credentials** tab

### Step 5: Create Test Users

#### Employer User
1. Go to **Users** → **Add user**
2. Fill in:
   - **Username**: `employer@test.com`
   - **Email**: `employer@test.com`
   - **First Name**: `Test`
   - **Last Name**: `Employer`
   - **Email verified**: `ON`
3. Click **Create**
4. Go to **Credentials** tab → **Set password**: `Employer123!`
5. Go to **Role Mappings** → **Assign role**: `employer`

#### Candidate User
1. Go to **Users** → **Add user**
2. Fill in:
   - **Username**: `candidate@test.com`
   - **Email**: `candidate@test.com`
   - **First Name**: `Test`
   - **Last Name**: `Candidate`
   - **Email verified**: `ON`
3. Click **Create**
4. Go to **Credentials** tab → **Set password**: `Candidate123!`
5. Go to **Role Mappings** → **Assign role**: `candidate`

### Step 6: Configure Environment Variables

#### Frontend (.env)
```env
VITE_KEYCLOAK_URL=http://localhost:8081
VITE_KEYCLOAK_REALM=chexpro
VITE_KEYCLOAK_CLIENT_ID=chexpro-frontend
```

#### Server (.env)
```env
KEYCLOAK_URL=http://localhost:8081
KEYCLOAK_REALM=chexpro
KEYCLOAK_CLIENT_ID=chexpro-backend
KEYCLOAK_CLIENT_SECRET=your-client-secret-here
KEYCLOAK_AUDIENCE=chexpro-backend
```

### Step 7: Test Authentication

1. Start the frontend: `npm run dev` (in frontend directory)
2. Start the backend: `npm run dev` (in server directory)
3. Visit http://localhost:5173
4. Click "Client Login" or navigate to login page
5. Test with employer@test.com / Employer123!
6. Test with candidate@test.com / Candidate123!

## Production Deployment (OCI)

When deploying to Oracle Cloud Infrastructure:

1. **Keycloak on OCI**:
   - Deploy Keycloak on an Oracle Linux VM or Kubernetes
   - Use Oracle Database (Autonomous) or PostgreSQL
   - Configure SSL/TLS with Let's Encrypt
   - Update environment variables for production URLs

2. **Update DNS**:
   - Create subdomain: `auth.chexpro.com`
   - Point to Keycloak server IP

3. **Update Redirect URIs**:
   - Add production URLs to Keycloak client settings

4. **Configure Email**:
   - Set up SMTP in Keycloak for password reset emails
   - Use your corporate email service

## Keycloak API Endpoints

| Endpoint | Description |
|----------|-------------|
| `/auth/realms/{realm}` | OIDC discovery endpoint |
| `/auth/realms/{realm}/protocol/openid-connect/auth` | Authorization endpoint |
| `/auth/realms/{realm}/protocol/openid-connect/token` | Token endpoint |
| `/auth/realms/{realm}/protocol/openid-connect/userinfo` | User info endpoint |
| `/auth/realms/{realm}/protocol/openid-connect/certs` | JWKS endpoint |

## Security Best Practices

1. **Use HTTPS everywhere** in production
2. **Enable MFA** for admin accounts
3. **Regular password policies**: Minimum 12 chars, complexity requirements
4. **Session timeout**: 30 minutes for sensitive operations
5. **CORS configuration**: Restrict origins in production
6. **Client secrets**: Store securely, rotate regularly

## Troubleshooting

### Keycloak Won't Start
```bash
# Check logs
docker logs chexpro-keycloak

# Restart Docker Desktop
# Clear Docker disk image (Docker Desktop Settings → Docker Engine → Clear disk image)
```

### Can't Connect to Keycloak
- Verify Keycloak is running: `docker ps`
- Check port 8081 is not in use
- Verify firewall rules

### Token Validation Fails
- Ensure client secret is correct
- Check clock synchronization between servers
- Verify audience claim in token matches client ID

## Next Steps

1. Complete Keycloak setup (this document)
2. Implement frontend login flow with keycloak-js
3. Implement backend token validation
4. Create employer portal pages
5. Create candidate tracking pages
6. Configure MFA for enhanced security
7. Set up SSO for enterprise clients
