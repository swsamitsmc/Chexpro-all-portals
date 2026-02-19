# Technical Specification Questions & Suggestions

**Document Version:** 1.0  
**Date:** February 2026  
**Purpose:** Questions and recommendations for the ClientPortal technical specification  

---

## Executive Summary

After reviewing the [`ClientPortal.md`](ClientPortal.md) specification and the [`Chexpro - System Runbook and Security Guide v3.1.docx`](Chexpro%20-%20System%20Runbook%20and%20Security%20Guide%20v3.1.docx), I have identified several areas that require clarification or adjustment. The key themes are:

1. **Database Technology Alignment** - PostgreSQL vs MySQL
2. **Integration with Existing Infrastructure** - Leveraging current ChexPro assets
3. **Authentication Strategy** - Unified vs separate auth systems
4. **Deployment Architecture** - OCI-specific considerations
5. **Timeline and Resource Alignment** - Phased approach recommendations

---

## 1. Database Technology Questions

### 1.1 PostgreSQL vs MySQL (CRITICAL)

**Current State:**
- Existing ChexPro system uses **OCI MySQL Database Service** (chexpro-mysql-db)
- MySQL.Free tier (Always Free) with ECPU billing
- Database already contains tables: `users`, `sessions`, `clients`, `candidates`, `bg_orders`, `screening_reports`, etc.

**Specification Proposes:**
- PostgreSQL 15+ as primary database
- Redis 7+ for caching

**Questions:**

| # | Question | Impact |
|---|----------|--------|
| 1.1.1 | Should the ClientPortal use the existing MySQL database or migrate to PostgreSQL? | Architecture, data migration, cost |
| 1.1.2 | If PostgreSQL is chosen, will both databases run in parallel? | Complexity, data synchronization |
| 1.1.3 | Is there a specific reason to prefer PostgreSQL over MySQL for this use case? | Technical decision rationale |
| 1.1.4 | Will the existing `bg_orders`, `candidates`, `clients` tables be reused or recreated? | Data consistency, migration effort |

**Recommendation:**

```
Option A: Extend Existing MySQL (Recommended for Phase 1)
+ Leverage existing database and tables
+ No data migration required
+ Consistent with current infrastructure
+ Lower cost (already on Always Free tier)
- May need schema extensions for new fields

Option B: New PostgreSQL Database
+ Clean slate with optimized schema
+ Better JSONB support for dynamic fields
+ Native array types for address_history, services
- Requires data migration
- Additional infrastructure cost
- Dual database complexity
```

**Suggested Schema Extensions (if using existing MySQL):**

```sql
-- Add new tables to existing MySQL database
CREATE TABLE packages (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  client_id VARCHAR(36),  -- NULL for global packages
  name VARCHAR(255) NOT NULL,
  description TEXT,
  services JSON,  -- MySQL 8.0 supports JSON type
  price DECIMAL(10,2),
  turnaround_time_days INT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Extend existing orders table
ALTER TABLE bg_orders ADD COLUMN order_number VARCHAR(50) UNIQUE;
ALTER TABLE bg_orders ADD COLUMN reference_number VARCHAR(100);
ALTER TABLE bg_orders ADD COLUMN completion_percentage INT DEFAULT 0;
```

### 1.2 Redis Caching

**Questions:**

| # | Question | Impact |
|---|----------|--------|
| 1.2.1 | Is Redis strictly required for Phase 1 MVP? | Infrastructure complexity |
| 1.2.2 | Can we use in-memory caching initially? | Simplified deployment |
| 1.2.3 | What specific data needs caching? | Architecture decisions |

**Recommendation:** Defer Redis to Phase 3. Use in-memory caching for MVP:

```javascript
// Simple in-memory cache for Phase 1
const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

function getCached(key) {
  const item = cache.get(key);
  if (item && Date.now() < item.expiry) {
    return item.value;
  }
  cache.delete(key);
  return null;
}
```

---

## 2. Integration with Existing ChexPro Infrastructure

### 2.1 Current Infrastructure Assets

Based on the OCI Runbook, the following assets exist:

| Asset | Details | Reuse Potential |
|-------|---------|-----------------|
| **chexpro-main-server** | VM.Standard.A1.Flex (4 OCPUs, 24 GB RAM) | Host ClientPortal |
| **chexpro-mysql-db** | MySQL.Free, ECPU | Database (if Option A) |
| **Nginx** | Reverse proxy, SSL termination | Add new subdomain |
| **PM2** | Process manager | Manage new backend |
| **SSL Certificate** | *.chexpro.com wildcard | Already covers subdomains |
| **Zitadel** | OIDC on port 8080 | Authentication |
| **Keycloak** | SSO on port 8081 | Authentication |
| **OCI Object Storage** | chexpro-backups bucket | Document storage |

### 2.2 Architecture Questions

**Questions:**

| # | Question | Impact |
|---|----------|--------|
| 2.2.1 | Should ClientPortal be a separate application or extend the existing React app? | Codebase management |
| 2.2.2 | Will the ClientPortal run on the same VM (chexpro-main-server)? | Resource allocation |
| 2.2.3 | Should we use the existing Nginx or deploy a separate reverse proxy? | Configuration complexity |
| 2.2.4 | Can we reuse the existing `server/routes/dashboard.js` as a starting point? | Development velocity |

**Recommendation: Extend Existing Application**

```
Current Structure:
frontend/
  src/pages/Dashboard.jsx     # Basic dashboard exists
  src/components/layout/ClientLayout.jsx

server/
  routes/dashboard.js         # Dashboard API exists
  routes/auth.js              # Authentication exists
  routes/mfa.js               # MFA exists

Proposed Extension:
frontend/
  src/pages/portal/
    OrdersPage.jsx            # New
    ApplicantsPage.jsx        # New
    ReportsPage.jsx           # New
    SettingsPage.jsx          # New

server/
  routes/portal/
    orders.js                 # New
    applicants.js              # New
    packages.js                # New
    reports.js                 # New
```

### 2.3 Subdomain Strategy

**Current subdomains (from runbook):**
- `chexpro.com` - Main website
- `internal.chexpro.com` - Internal portal (Homer)
- `n8n.chexpro.com` - Workflow automation
- `scrm.chexpro.com` - SuiteCRM

**Proposed for ClientPortal:**
- `portal.chexpro.com` - Client portal
- `applicant.chexpro.com` - Applicant self-service

**Questions:**

| # | Question | Impact |
|---|----------|--------|
| 2.3.1 | Is `portal.chexpro.com` the desired subdomain? | DNS configuration |
| 2.3.2 | Should applicant portal be on a separate subdomain? | SSL, Nginx config |
| 2.3.3 | Will existing wildcard SSL certificate cover new subdomains? | Yes - already covered |

---

## 3. Authentication Strategy

### 3.1 Current Authentication Systems

The existing ChexPro application has **three authentication methods**:

| Method | Status | Use Case |
|--------|--------|----------|
| **Local Auth** | Working | Email/password with bcrypt |
| **Zitadel OIDC** | Available | Modern SSO (port 8080) |
| **Keycloak SSO** | Available | Enterprise SSO (port 8081) |
| **MFA** | Available | TOTP with recovery codes |

### 3.2 Specification vs Existing

**Specification proposes:**
- JWT with 15-minute access token, 7-day refresh token
- Bcrypt password hashing (cost factor: 12)
- Rate limiting: 5 login attempts per 15 minutes

**Existing implementation:**
- Session-based auth with httpOnly cookies
- bcrypt with 10 salt rounds
- Rate limiting already implemented
- MFA with TOTP

**Questions:**

| # | Question | Impact |
|---|----------|--------|
| 3.2.1 | Should ClientPortal use the existing auth system or implement a new one? | User experience, security |
| 3.2.2 | Can clients use the same credentials for both marketing site and portal? | SSO experience |
| 3.2.3 | Should we implement pure JWT or hybrid (JWT + session)? | Security architecture |
| 3.2.4 | Is MFA required for client portal access? | Compliance, UX |

**Recommendation: Unified Authentication**

```javascript
// Extend existing auth system for portal
// server/routes/auth.js - Add portal-specific endpoints

// Existing login works for both
POST /api/auth/login

// Add portal-specific session handling
GET /api/portal/session    // Get portal session info
POST /api/portal/switch-client  // Switch between client accounts (for multi-client users)

// Leverage existing MFA
GET /api/mfa/status
POST /api/mfa/verify
```

### 3.3 Role-Based Access Control

**Specification roles:**
- Account Owner
- Administrator
- Manager
- Standard User

**Existing roles:**
- `admin` (database field)
- Client association via `client_id`

**Questions:**

| # | Question | Impact |
|---|----------|--------|
| 3.3.1 | Should roles be stored in `users.role` field or a separate `user_roles` table? | Database design |
| 3.3.2 | How do portal roles map to existing `admin` role? | Permission inheritance |
| 3.3.3 | Should we implement a permission matrix or simple role checks? | Complexity vs flexibility |

**Recommendation:**

```sql
-- Extend existing users table
ALTER TABLE users ADD COLUMN portal_role ENUM('owner', 'admin', 'manager', 'user') DEFAULT 'user';
ALTER TABLE users ADD COLUMN permissions JSON;  -- For fine-grained control

-- Or create separate role tables for scalability
CREATE TABLE user_roles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  client_id VARCHAR(36) NOT NULL,  -- Role per client
  role ENUM('owner', 'admin', 'manager', 'user') NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (client_id) REFERENCES clients(id)
);
```

---

## 4. Deployment Architecture for OCI

### 4.1 Current Deployment Process

From the runbook, the current deployment is:
1. SSH to `chexpro-main-server`
2. Pull code from GitHub
3. Build frontend with `npm run build`
4. Sync to live directories with rsync
5. Reload backend with `pm2 reload`

**Known risks:**
- Manual, error-prone process
- No staging environment
- No CI/CD pipeline

### 4.2 Proposed Docker Deployment

**Specification proposes:**
- Docker + Docker Compose
- Nginx reverse proxy
- Let's Encrypt SSL

**Existing infrastructure:**
- Docker already installed (for n8n, Homer)
- Nginx already configured
- Wildcard SSL already in place

**Questions:**

| # | Question | Impact |
|---|----------|--------|
| 4.2.1 | Should ClientPortal run as Docker containers or native Node.js processes? | Deployment strategy |
| 4.2.2 | Can we use the existing Nginx configuration with added locations? | Configuration management |
| 4.2.3 | What is the plan for CI/CD implementation? | Deployment automation |
| 4.2.4 | Will a staging environment be created before production? | Risk mitigation |

**Recommendation: Hybrid Approach**

```yaml
# Phase 1: Extend existing PM2 setup
# Add to existing PM2 ecosystem
apps:
  - name: chexpro-backend
    script: index.js
    cwd: /var/www/chexpro-backend
    instances: 2
    exec_mode: cluster
    
  - name: portal-backend
    script: portal/index.js
    cwd: /var/www/chexpro-backend
    instances: 2
    exec_mode: cluster
    env:
      PORT: 3001

# Phase 3: Migrate to Docker if scaling needed
```

### 4.3 Nginx Configuration

**Existing structure:**
- `/etc/nginx/sites-available/chexpro.com.conf`
- `/etc/nginx/snippets/ssl-params.conf`
- Wildcard certificate at `/etc/letsencrypt/live/chexpro.com/`

**Proposed addition:**

```nginx
# /etc/nginx/sites-available/portal.chexpro.com
server {
    listen 443 ssl;
    server_name portal.chexpro.com;
    
    ssl_certificate /etc/letsencrypt/live/chexpro.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/chexpro.com/privkey.pem;
    include /etc/nginx/snippets/ssl-params.conf;
    
    # Frontend
    location / {
        root /var/www/portal-frontend;
        try_files $uri $uri/ /index.html;
    }
    
    # API proxy
    location /api/ {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
    
    # WebSocket for real-time updates
    location /ws/ {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "Upgrade";
    }
}
```

---

## 5. Technology Stack Alignment

### 5.1 Frontend Stack Comparison

| Component | Specification | Existing | Recommendation |
|-----------|---------------|----------|----------------|
| Framework | React 18+ TypeScript | React 18 JavaScript | TypeScript for new code |
| State | Zustand/Redux Toolkit | React Context | Zustand (simpler) |
| UI Library | shadcn/ui + Tailwind | Tailwind + custom | Use shadcn/ui |
| Forms | React Hook Form + Zod | Manual validation | React Hook Form + Zod |
| HTTP | Axios | Fetch | Axios with interceptors |

### 5.2 Backend Stack Comparison

| Component | Specification | Existing | Recommendation |
|-----------|---------------|----------|----------------|
| Runtime | Node.js 20 LTS | Node.js 22 | Keep existing |
| Framework | Express or Fastify | Express | Keep Express |
| ORM | Prisma or TypeORM | Raw SQL | Prisma (with MySQL) |
| Auth | Passport.js + JWT | Custom + bcrypt | Extend existing |

**Questions:**

| # | Question | Impact |
|---|----------|--------|
| 5.2.1 | Should we migrate from raw SQL to Prisma? | Development speed, type safety |
| 5.2.2 | Is TypeScript required or can we use JSDoc for type hints? | Development workflow |
| 5.2.3 | Should we use Fastify for better performance or stick with Express? | API design, middleware |

**Recommendation: Gradual Migration**

```javascript
// Phase 1: Keep existing Express + raw SQL
// Add new routes with same pattern

// Phase 2: Introduce Prisma for new tables
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

// New portal routes use Prisma
router.get('/portal/packages', async (req, res) => {
  const packages = await prisma.package.findMany({
    where: { OR: [{ clientId: req.client.id }, { clientId: null }] }
  });
  res.json(packages);
});

// Phase 3: Migrate existing routes to Prisma
```

---

## 6. Feature Prioritization Questions

### 6.1 MVP Scope Clarification

**Specification Phase 1 (6-8 weeks):**
- Authentication system
- Client dashboard (basic)
- Order creation (single order, manual entry)
- Applicant data entry (client-entered only)
- Order list with basic filtering
- Order detail view
- File upload capability
- Email notifications (basic templates)

**Questions:**

| # | Question | Impact |
|---|----------|--------|
| 6.1.1 | Can we reduce MVP to 4-6 weeks by leveraging existing components? | Time to market |
| 6.1.2 | Which features from the existing Dashboard.jsx can be reused? | Development effort |
| 6.1.3 | Is the applicant self-service portal required for MVP? | Scope definition |
| 6.1.4 | What is the minimum viable order creation flow? | User experience |

### 6.2 Existing Components to Leverage

| Existing Component | Portal Equivalent | Reuse Level |
|--------------------|-------------------|-------------|
| `Dashboard.jsx` | Client Dashboard | High - extend |
| `ClientLayout.jsx` | Portal Layout | High - extend |
| `server/routes/dashboard.js` | Portal API | High - extend |
| `server/routes/auth.js` | Portal Auth | High - reuse |
| `bg_orders` table | Orders | High - extend |
| `candidates` table | Applicants | High - extend |
| `clients` table | Client Accounts | High - reuse |

---

## 7. Security and Compliance Questions

### 7.1 Data Protection Requirements

**From specification:**
- AES-256 encryption for PII at rest
- TLS 1.3 for data in transit
- SIN/SSN in separate encrypted column

**From runbook:**
- SOC 2 Type II alignment in progress
- PIPEDA compliance (Canada)
- FCRA compliance (USA)

**Questions:**

| # | Question | Impact |
|---|----------|--------|
| 7.1.1 | What encryption library should be used for SIN/SSN? | Implementation |
| 7.1.2 | Is TLS 1.3 required or is TLS 1.2 acceptable? | Nginx configuration |
| 7.1.3 | Should we implement field-level encryption or table-level? | Database design |
| 7.1.4 | What is the data retention policy for applicant data? | Compliance |

**Recommendation:**

```javascript
// Use existing crypto utilities
import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const KEY = Buffer.from(process.env.SIN_ENCRYPTION_KEY, 'hex');

export function encryptSIN(sin) {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);
  let encrypted = cipher.update(sin, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag();
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

export function decryptSIN(encrypted) {
  const [ivHex, authTagHex, data] = encrypted.split(':');
  const decipher = crypto.createDecipheriv(
    ALGORITHM, 
    KEY, 
    Buffer.from(ivHex, 'hex')
  );
  decipher.setAuthTag(Buffer.from(authTagHex, 'hex'));
  let decrypted = decipher.update(data, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}
```

### 7.2 Audit Logging

**Questions:**

| # | Question | Impact |
|---|----------|--------|
| 7.2.1 | Should we extend the existing Winston logging or implement new audit tables? | Logging strategy |
| 7.2.2 | What events must be logged for SOC 2 compliance? | Compliance scope |
| 7.2.3 | How long should audit logs be retained? | Storage, compliance |

---

## 8. Third-Party Integration Questions

### 8.1 Background Check Vendors

**Specification mentions:**
- Sterling, Checkr, First Advantage as examples
- REST API or SFTP integration
- Webhook support for status updates

**Questions:**

| # | Question | Impact |
|---|----------|--------|
| 8.1.1 | Which specific vendor(s) will be integrated first? | API design |
| 8.1.2 | Is there an existing vendor relationship or contract? | Business requirement |
| 8.1.3 | Should we build a vendor abstraction layer? | Architecture |
| 8.1.4 | What is the expected volume of checks per month? | Capacity planning |

### 8.2 Payment Processing

**Specification mentions:**
- Stripe or Square
- Credit card, ACH, invoicing

**Questions:**

| # | Question | Impact |
|---|----------|--------|
| 8.2.1 | Is payment processing required for MVP? | Scope |
| 8.2.2 | Will clients be billed monthly or per-order? | Business model |
| 8.2.3 | Should we integrate with existing Odoo for invoicing? | Integration |

---

## 9. Resource and Timeline Questions

### 9.1 Development Resources

**Questions:**

| # | Question | Impact |
|---|----------|--------|
| 9.1.1 | How many developers will work on this project? | Timeline estimation |
| 9.1.2 | What is the expected launch date? | Priority decisions |
| 9.1.3 | Is there budget for third-party services (SendGrid, Twilio)? | Vendor selection |
| 9.1.4 | Who will handle DevOps/infrastructure setup? | Responsibility |

### 9.2 Timeline Adjustments

**Based on existing infrastructure, I suggest:**

```
Revised Phase 1 (4-6 weeks):
Week 1-2: 
  - Extend existing auth for portal roles
  - Add portal routes to existing Express app
  - Create portal frontend structure
  
Week 3-4:
  - Order creation flow (reuse bg_orders table)
  - Applicant data entry (reuse candidates table)
  - Basic file upload
  
Week 5-6:
  - Order list and detail views
  - Basic dashboard widgets
  - Email notifications via existing SMTP

Revised Phase 2 (4-5 weeks):
  - Applicant self-service portal
  - Real-time status updates (WebSocket)
  - Advanced filtering

Revised Phase 3 (4-5 weeks):
  - Bulk operations
  - Reporting & analytics
  - Client branding
```

---

## 10. Summary of Critical Decisions Required

| Priority | Decision | Options | Recommendation |
|----------|----------|---------|----------------|
| **P1** | Database | MySQL (extend) vs PostgreSQL (new) | MySQL for Phase 1 |
| **P1** | Architecture | Extend existing vs new application | Extend existing |
| **P1** | Authentication | Unified vs separate | Unified with existing |
| **P2** | ORM | Raw SQL vs Prisma | Prisma for new tables |
| **P2** | Deployment | PM2 vs Docker | PM2 for Phase 1 |
| **P2** | Frontend | Separate app vs integrated | Integrated in existing |
| **P3** | Caching | Redis vs in-memory | In-memory for MVP |
| **P3** | TypeScript | Required vs optional | Optional, add gradually |

---

## 11. Proposed Next Steps

1. **Clarify database decision** - Confirm whether to use existing MySQL or create new PostgreSQL database
2. **Define MVP scope** - Confirm which features are required for initial launch
3. **Identify vendor integrations** - Determine which background check vendors to integrate
4. **Establish timeline** - Set target launch date and work backward
5. **Allocate resources** - Confirm development team size and availability

---

**Document Prepared By:** AI Development Assistant  
**Review Date:** February 2026  
**Status:** Awaiting Clarification

**Note:** This document is intended to facilitate discussion and decision-making. All recommendations are based on analysis of existing infrastructure and should be validated with business requirements.