# Chexpro.com Platform — Master Technical Specification
# Version 1.0 | February 19, 2026
# Author: Chexpro.com (CEO)
# Status: Active Development

---

## DOCUMENT PURPOSE

This is the single source of truth for the entire Chexpro.com platform.
It covers all three portals, shared infrastructure, inter-portal 
communication, deployment architecture, and the eventual monorepo structure.
Reference this document before making any architectural decisions.

---

## PART 1: PLATFORM OVERVIEW

### 1.1 What Chexpro Is

Chexpro.com is a Canadian background check company offering enterprise-grade
screening services to employers, staffing agencies, property managers, and 
volunteer organizations. The platform consists of three separate web portals
and a marketing website, all running on Oracle Cloud Infrastructure (OCI) 
in the Toronto region.

### 1.2 The Three Portals

| Portal | Who Uses It | URL (Production) | Status |
|--------|-------------|-----------------|--------|
| **Client Portal** | Companies ordering background checks | `portal.chexpro.com` | ✅ Built — GitHub: Chexpro-Client-Portal |
| **Admin Portal** | Chexpro internal staff (processors, QA, compliance) | `admin.chexpro.com` | 🔄 In Development |
| **Candidate Portal** | Individuals being screened | `mycheck.chexpro.com` | 🔄 In Development |
| **Marketing Website** | Public-facing site | `chexpro.com` | ✅ Existing |

### 1.3 The Journey of a Background Check

CLIENT logs into portal.chexpro.com
→ Creates a new order for a candidate
→ Selects package (e.g., Standard Employment — $79.99)
→ Chooses "Send Invitation" — enters candidate's email

CANDIDATE receives email invitation
→ Clicks link → mycheck.chexpro.com/register?token=xxx
→ Creates account + password
→ Completes 7-step data entry wizard
→ Uploads photo ID + signs consent electronically
→ Submits

ADMIN STAFF log into admin.chexpro.com
→ Order appears in queue (auto-assigned by rules engine)
→ Processor routes order to vendor (Sterling, Certn, etc.)
→ QA specialist reviews returned report
→ Adjudicator reviews any adverse findings
→ Report approved and delivered to client

CLIENT receives notification
→ Views completed report in portal.chexpro.com
→ Downloads PDF
→ Takes action (hire / adverse action process)

CANDIDATE sees status updates
→ Logs into mycheck.chexpro.com
→ Tracks check progress in real-time
→ Receives notification when complete

text

---

## PART 2: ARCHITECTURE DECISIONS (LOCKED)

### 2.1 Database Strategy
**Decision: Single shared database with prefix-namespaced tables**

- Database name: `chexpro_portal_db`
- All three portals connect to this same MySQL 8.0 instance
- Admin-specific tables use `admin_` prefix
- Candidate-specific tables: `candidate_profiles`, `candidate_invitations`
- All portals use the same Prisma schema
- Rationale: Avoids cross-database JOIN complexity; Prisma does not support 
  multi-database schemas cleanly; appropriate for bootstrapped startup scale

### 2.2 Authentication Strategy
**Decision: Shared JWT_SECRET across all portals with role-based routing**

- All three portals share the same `JWT_SECRET` value in their `.env` files
- Token payload: `{ id, email, role, clientId? }`
- Role → Portal routing:
  - `role: 'owner' | 'admin' | 'manager' | 'user'` → Client Portal
  - `role: 'superadmin' | 'ops_manager' | 'processor' | 'qa_specialist' | 
     'client_success' | 'compliance_officer' | 'finance'` → Admin Portal
  - `role: 'candidate'` → Candidate Portal
- Each portal's auth middleware rejects tokens whose role doesn't match

### 2.3 Inter-Portal Communication
**Decision: Redis pub/sub for real-time events**

Shared Redis instance. Defined event channels:

| Channel | Publisher | Subscriber(s) | Payload |
|---------|-----------|---------------|---------|
| `candidate:registered` | Candidate Portal | Admin Portal | `{ orderId, userId, email }` |
| `candidate:wizard_completed` | Candidate Portal | Admin Portal, Client Portal | `{ orderId, applicantId, submittedAt }` |
| `order:statusChanged` | Admin Portal | Client Portal, Candidate Portal | `{ orderId, newStatus, clientId, candidateId }` |
| `order:requiresAction` | Admin Portal | Client Portal, Candidate Portal | `{ orderId, actionType, message }` |
| `report:ready` | Admin Portal | Client Portal, Candidate Portal | `{ orderId, reportId, clientId }` |
| `adverse_action:initiated` | Admin Portal | Client Portal, Candidate Portal | `{ orderId, candidateEmail }` |
| `order:created` | Client Portal | Admin Portal | `{ orderId, clientId, packageId }` |

### 2.4 Shared Code Strategy
**Decision: Copy shared types into each portal for now; npm package at monorepo stage**

During active development (now), copy these into each portal's `src/types/`:
- `Order`, `Applicant`, `Client`, `User`, `Package`, `Service` interfaces
- Status enums and label maps
- Response shape interfaces

At monorepo assembly, extract into `@chexpro/shared` private npm package.

### 2.5 API Gateway / Nginx Port Map

| Service | Local Port | Production URL |
|---------|-----------|----------------|
| Client Portal Frontend | `5173` | `portal.chexpro.com` |
| Client Portal Backend | `3001` | `api.chexpro.com` |
| Admin Portal Frontend | `4001` | `admin.chexpro.com` |
| Admin Portal Backend | `4000` | `admin-api.chexpro.com` |
| Candidate Portal Frontend | `5174` | `mycheck.chexpro.com` |
| Candidate Portal Backend | `3004` | `candidate-api.chexpro.com` |
| MySQL | `3307` (local) | OCI MySQL Service |
| Redis | `6379` | localhost (OCI server) |
| Bull Dashboard | `4002` (dev only) | Not exposed in prod |

---

## PART 3: CLIENT PORTAL

**Repo:** `github.com/swsamitsmc/Chexpro-Client-Portal` (Private)  
**Status:** ✅ Built — TypeScript: 0 errors (backend + frontend)  
**Spec:** `Docs/ClientPortal.md` in repo

### 3.1 Who Uses It

Companies (clients) that purchase background check services from Chexpro.
- HR managers ordering checks on candidates
- Hiring managers tracking check status
- Company owners managing billing and team access

### 3.2 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + TypeScript + Tailwind CSS + shadcn/ui |
| State | Zustand |
| Forms | React Hook Form + Zod |
| HTTP | Axios + TanStack Query |
| Real-time | Socket.io-client |
| Charts | Recharts |
| Backend | Node.js + Express + TypeScript |
| ORM | Prisma (MySQL) |
| Auth | JWT (15min access / 7day refresh) + optional TOTP 2FA |
| Queue | Bull (Redis) |
| Email | Nodemailer |
| Payments | Stripe |

### 3.3 User Roles

| Role | Access Level |
|------|-------------|
| `owner` | Full access including billing, user management, API keys |
| `admin` | Order management + user management (not billing) |
| `manager` | Order management + view reports |
| `user` | Create orders + view own orders |

### 3.4 Core Features (Built)

- **Authentication**: Email/password + JWT + optional 2FA (TOTP)
- **Dashboard**: Stats widgets, recent orders, activity feed, WebSocket live updates
- **Order Creation**: 3-step form → package selection → applicant entry OR send invitation
- **Applicant Portal (embedded)**: 7-step wizard at `/applicant-portal/:token`
  - ⚠️ NOTE: This embedded wizard is the PRECURSOR to the standalone Candidate Portal.
    Once Candidate Portal is live, invitation links will redirect to 
    `mycheck.chexpro.com/register?token=xxx` instead.
- **Order Management**: List with filters, detail view with timeline, status tracking
- **Reports & Analytics**: 4 charts — volume, package distribution, TAT, pass rates
- **Adverse Action**: FCRA-compliant pre-notice → 5-day waiting → final notice
- **Adjudication**: Decision matrix builder + automated engine + manual override
- **Continuous Monitoring**: Enrollment + alerts + re-screening scheduler
- **Disputes**: Candidate dispute submission + admin-side resolution
- **Client Settings**: Profile, users, branding, API keys, billing
- **Stripe Integration**: Payment processing + webhook handling
- **WebSocket**: Real-time order status push to connected clients

### 3.5 API Endpoints

Base URL: `https://api.chexpro.com/api/v1`

- `POST /auth/login` — Email/password login
- `POST /auth/refresh-token` — Token refresh
- `POST /auth/logout` — Invalidate session
- `POST /auth/forgot-password` — Password reset email
- `POST /auth/reset-password` — Set new password
- `GET /auth/me` — Current user
- `POST /auth/2fa/setup` — Generate TOTP secret + QR
- `POST /auth/2fa/verify` — Validate TOTP token
- `GET /dashboard/stats` — Metrics for dashboard widgets
- `GET /orders` — List with filters (status, date, search)
- `POST /orders` — Create order (draft or submit)
- `GET /orders/:id` — Order detail
- `PUT /orders/:id` — Update order
- `POST /orders/:id/submit` — Submit draft order
- `GET /orders/:id/timeline` — Status history
- `POST /orders/:id/notes` — Add internal note
- `GET /orders/:id/report` — Get report download URL
- `POST /orders/:id/adverse-action/initiate` — Start FCRA adverse action
- `POST /orders/:id/adverse-action/send-pre-notice` — Send pre-notice
- `POST /orders/:id/adverse-action/send-final-notice` — Send final notice
- `POST /orders/:id/adjudication/manual-override` — Override decision
- `GET /packages` — List packages for client
- `GET /services` — List individual services
- `GET /applicants/:id` — Applicant data
- `PUT /applicants/:id` — Update applicant
- `GET /applicant-portal/:token` — Validate invitation token (public)
- `PUT /applicant-portal/:token/data` — Save wizard step (public)
- `POST /applicant-portal/:token/submit` — Final submission (public)
- `POST /monitoring/enroll` — Enroll in continuous monitoring
- `GET /monitoring/alerts` — Active monitoring alerts
- `GET /disputes` — List disputes
- `PUT /disputes/:id/resolve` — Resolve dispute
- `GET /reports/*` — Analytics data endpoints
- `GET /client/profile` — Company profile
- `PUT /client/profile` — Update profile
- `GET /client/users` — Team members
- `POST /client/users` — Invite user
- `GET /client/api-keys` — List API keys
- `POST /client/api-keys` — Generate new key
- `GET /billing/invoices` — Invoice history
- `POST /billing/payment-intent` — Stripe payment
- `PUT /client/branding` — Update branding

### 3.6 Database Tables (Primary)

`users`, `clients`, `orders`, `applicants`, `packages`, `services`, 
`order_services`, `order_timeline`, `documents`, `reports`, `notifications`,
`adverse_actions`, `adverse_action_documents`, `adjudication_matrices`,
`adjudication_rules`, `order_adjudications`, `monitoring_enrollments`,
`monitoring_alerts`, `disputes`, `dispute_communications`, `invoices`,
`payments`, `api_keys`, `audit_logs` (30+ total)

### 3.7 Redis Events Published

- `order:created` → on new order submission
- `order:statusChanged` → on any status transition

### 3.8 Local Dev Credentials

| Role | Email | Password |
|------|-------|----------|
| Owner | `owner@acmecorp.com` | `Demo@123456` |
| Admin | `admin@acmecorp.com` | `Demo@123456` |
| Manager | `manager@acmecorp.com` | `Demo@123456` |
| User | `user@acmecorp.com` | `Demo@123456` |

---

## PART 4: ADMIN PORTAL

**Repo:** `github.com/swsamitsmc/Chexpro-Admin-Portal` (Private)  
**Status:** 🔄 In Development — Audit pending  
**Spec:** `adminportal.md` (full spec document)

### 4.1 Who Uses It

Chexpro internal operations staff only. Never accessible to clients or candidates.

### 4.2 Tech Stack

Same as Client Portal (React + TypeScript + Tailwind + Node.js + Express + Prisma).
Additional: Bull queue with worker process, Puppeteer for PDF generation.

### 4.3 User Roles

| Role | Primary Function |
|------|----------------|
| `superadmin` | Full system access, user management, financial settings |
| `ops_manager` | All orders, team management, SLA override |
| `processor` | Process assigned orders, manual verifications |
| `qa_specialist` | QA review queue, report approval |
| `client_success` | Client health, onboarding, account management |
| `compliance_officer` | Adverse actions, disputes, audit log (read-only orders) |
| `finance` | Revenue dashboard, vendor reconciliation, invoices |

### 4.4 Core Modules (20 Total)

1. **Operations Dashboard** — Real-time widgets: new/in-progress/QA/overdue counts, 
   SLA tracker, vendor health, alert feed, role-based widget layout
2. **Order Queue** — Full list with advanced filters, bulk actions, Kanban view,
   order detail with all tabs (info, notes, documents, vendor, timeline)
3. **Order Assignment Engine** — Auto-assignment rules, round-robin fallback,
   capacity-aware routing (respects daily limits per processor)
4. **Exception Management** — Blocking/non-blocking exceptions, resolution workflows,
   suggested resolution paths per exception type
5. **Manual Verification Entry** — Log phone/email/fax verifications with
   contact details, confirmation fields, and outcome
6. **Client Management** — Full client list, onboarding pipeline (Kanban),
   health score (6-factor weighted 0-100), compliance expiry calendar
7. **Vendor Management** — Vendor list, API health monitor (60s heartbeat),
   auto-failover on outage, routing decision log per order
8. **AI Vendor Routing** — Score each eligible vendor on TAT, reliability,
   quality, cost, capacity, client preference; auto-select highest scorer
9. **Vendor Cost Reconciliation** — Compare expected vs. billed amounts,
   variance detection, dispute workflow with vendor
10. **QA Module** — QA review queue, configurable checklist, first-pass rate,
    10% random sampling audit program, calibration sessions
11. **Adjudication System** — Decision queue, second-level review triggers,
    searchable decision library, rationale templates
12. **Report Generation** — Template builder (drag-to-reorder sections),
    Puppeteer PDF generation, compliance filtering (ban-the-box, 7-year),
    delivery center with webhook + email options
13. **FCRA Reinvestigation** — 30-day countdown per dispute, investigation workflow,
    contact log, resolution with automatic report correction
14. **SLA Management** — Per-client/per-package SLA config, breach detection worker,
    auto-escalation rules, penalty/credit tracking
15. **Financial Dashboard** — Revenue by client/period, vendor invoice management,
    reconciliation, AR aging
16. **Team Management** — Team CRUD, staff capacity per day, workload visualization,
    demand forecasting (rolling 8-week average)
17. **Fraud Detection** — Duplicate identity flags, document tampering signals,
    configurable rules engine
18. **Escalation Engine** — Rule-based automated escalation with delay options,
    configurable triggers and action chains
19. **Knowledge Base** — Internal SOPs, article CRUD, search, categories
20. **Communications Center** — Internal messaging, order-linked threads

### 4.5 API Endpoints

Base URL: `https://admin-api.chexpro.com/api/v1`

All endpoints require `authenticateAdminJWT` middleware.
Role-specific endpoints additionally require `requireRole([...])` middleware.

**Auth:** `POST /auth/login`, `POST /auth/logout`, `POST /auth/refresh-token`,
`POST /auth/2fa/setup`, `POST /auth/2fa/verify` (2FA mandatory for all admin users)

**Dashboard:** `GET /dashboard/metrics`, `GET /dashboard/alerts`,
`GET /dashboard/sla-summary`, `GET /dashboard/vendor-health`

**Orders:** `GET /orders`, `GET /orders/:id`, `PUT /orders/:id/status`,
`POST /orders/:id/assign`, `POST /orders/:id/notes`,
`POST /orders/:id/exceptions`, `PUT /orders/:id/exceptions/:exId`,
`POST /orders/:id/manual-verification`, `POST /orders/:id/send-to-vendor`

**Clients:** `GET /clients`, `GET /clients/:id`, `GET /clients/:id/health-score`,
`GET /clients/:id/compliance-calendar`, `POST /clients/:id/onboarding-tasks`,
`PUT /clients/:id/onboarding-tasks/:taskId`

**Vendors:** `GET /vendors`, `GET /vendors/:id`, `GET /vendors/health`,
`GET /vendors/:id/routing-decisions`, `POST /vendors/:id/reconciliation`,
`GET /vendors/incidents`

**QA:** `GET /qa/queue`, `POST /qa/:orderId/review`, `GET /qa/metrics`,
`POST /qa/sampling/run`, `POST /qa/calibration/session`

**Adjudication:** `GET /adjudication/queue`, `POST /adjudication/:orderId/decision`,
`POST /adjudication/:orderId/second-review`, `GET /adjudication/library`

**Reports:** `GET /report-templates`, `POST /report-templates`,
`PUT /report-templates/:id`, `POST /orders/:id/generate-report`,
`POST /orders/:id/deliver-report`

**SLA:** `GET /sla/configs`, `POST /sla/configs`, `PUT /sla/configs/:id`,
`GET /sla/dashboard`, `GET /sla/breaches`

**Finance:** `GET /finance/revenue`, `GET /finance/vendor-invoices`,
`POST /finance/vendor-invoices`, `PUT /finance/vendor-invoices/:id`

**Team:** `GET /team/members`, `GET /team/capacity`, `GET /team/forecast`,
`PUT /team/members/:id/capacity`

**Escalations:** `GET /escalations/rules`, `POST /escalations/rules`,
`GET /escalations/active`

**System:** `GET /system/settings`, `PUT /system/settings`,
`GET /system/feature-flags`, `PUT /system/feature-flags/:flag`

**Webhooks:** `POST /webhooks/sterling`, `POST /webhooks/certn`,
`POST /webhooks/first-advantage`, `POST /webhooks/equifax`

### 4.6 Additional Database Tables

(Added to `chexpro_portal_db` alongside Client Portal tables)

`admin_users`, `admin_teams`, `admin_team_members`, `staff_assignments`,
`staff_capacity`, `assignment_rules`, `order_exceptions`, `manual_verifications`,
`internal_notes`, `vendors`, `vendor_health_checks`, `vendor_incidents`,
`vendor_invoices`, `vendor_invoice_line_items`, `routing_decisions`,
`client_compliance_items`, `onboarding_checklists`, `qa_reviews`, `qa_samples`,
`qa_calibration_sessions`, `adjudication_decisions`, `second_level_reviews`,
`report_templates`, `sla_configurations`, `sla_tracking`, `escalation_rules`,
`escalation_events`, `fraud_signals`, `fraud_rules`, `kb_articles`,
`kb_categories`, `internal_messages`, `reinvestigation_cases`

### 4.7 Bull Queue Workers

| Job | Trigger | Action |
|-----|---------|--------|
| `vendor-health-check` | Every 60s | Ping all vendor APIs, detect outages, auto-failover |
| `sla-breach-detection` | Every 5min | Flag orders approaching/breaching SLA |
| `auto-escalation` | Every 5min | Trigger escalation rules if conditions met |
| `notification-dispatch` | On demand | Send email/in-app notifications |
| `demand-forecast` | Nightly | Recalculate 7-day capacity forecast |

### 4.8 Redis Events

**Subscribes to:** `order:created`, `candidate:registered`, 
`candidate:wizard_completed`

**Publishes:** `order:statusChanged`, `report:ready`, 
`adverse_action:initiated`, `order:requiresAction`

### 4.9 Local Dev Credentials (Post-Seed)

| Role | Email | Password |
|------|-------|----------|
| Super Admin | `superadmin@chexpro.com` | `Admin@123456` |
| Ops Manager | `ops@chexpro.com` | `Admin@123456` |
| Processor | `processor@chexpro.com` | `Admin@123456` |
| QA Specialist | `qa@chexpro.com` | `Admin@123456` |

---

## PART 5: CANDIDATE PORTAL

**Repo:** `github.com/swsamitsmc/Chexpro-Candidate-Portal` (Private)  
**Status:** 🔄 In Development (Kilo Code building now)  
**Spec:** `CandidatePortal.md`

### 5.1 Who Uses It

Individuals (candidates) who have been invited to complete a background check
by a company that uses Chexpro. They do NOT have a client account — they have
their own separate candidate account on this portal.

### 5.2 Tech Stack

Same as Client Portal. Backend port: `3004`. Frontend port: `5174`.

### 5.3 User Role

Single role: `candidate` — enforced at auth middleware level.
Client/admin accounts cannot log into this portal.

### 5.4 The Candidate Journey in Detail

Client creates order → selects "Send Invitation"

Client Portal creates CandidateInvitation record with unique token

Candidate receives email: "You've been invited by {Company} to complete
a background check"

Candidate clicks: mycheck.chexpro.com/register?token={token}

RegisterPage validates token (GET /api/v1/auth/invitation/:token)
→ Shows: company name, position, token expiry
→ Email field pre-filled and locked

Candidate creates password → account created (role: 'candidate')

Auto-login → redirect to /wizard/:orderId

7-step wizard (auto-saves each step):
Step 1: Personal Info (name, DOB, phone, SIN encrypted)
Step 2: Current Address
Step 3: Address History — 7 years, gap detection
Step 4: Employment History — 5 years, dynamic list
Step 5: Education History — dynamic list
Step 6: Other names, licenses, criminal self-disclosure, e-consent
Step 7: Photo ID upload + additional docs + signature canvas

Submit → order status → 'data_verification'

Redis publishes: 'candidate:wizard_completed'

Admin Portal receives event → order moves to processing queue

Candidate tracks progress at /checks/:orderId
→ WebSocket pushes status updates in real-time
→ Notifications center shows all updates

When check complete → candidate sees notification
→ Status shows "Complete" in dashboard

text

### 5.5 Core Pages

| Page | Path | Description |
|------|------|-------------|
| Login | `/login` | Email/password, link to register |
| Register | `/register?token=xxx` | Invitation-based only |
| Forgot Password | `/forgot-password` | Reset email flow |
| Reset Password | `/reset-password?token=xxx` | Set new password |
| Dashboard | `/dashboard` | Check summary, pending action banners |
| Wizard | `/wizard/:orderId` | 7-step data entry (core feature) |
| Wizard Complete | `/wizard/:orderId/complete` | Celebration/confirmation |
| Checks List | `/checks` | All background checks with status |
| Check Detail | `/checks/:orderId` | Full detail + timeline + docs |
| Documents | `/documents` | Upload management |
| Profile | `/profile` | Account settings, password, delete account |
| Notifications | `/notifications` | All notifications with read/unread |
| Public Status | `/status/:orderNumber` | No-login status check (minimal) |

### 5.6 API Endpoints

Base URL: `https://candidate-api.chexpro.com/api/v1`

**Auth (public):**
- `GET /auth/invitation/:token` — Validate invitation before registration
- `POST /auth/register` — Invitation-based registration
- `POST /auth/login` — Login (candidate role only)
- `POST /auth/refresh-token` — Token refresh
- `POST /auth/logout` — Invalidate session
- `POST /auth/forgot-password` — Reset email
- `POST /auth/reset-password` — Set new password
- `GET /auth/me` — Current user (authenticated)

**Wizard (authenticated):**
- `GET /wizard/status` — All wizard states across orders
- `GET /wizard/:orderId` — Pre-fill data for wizard
- `PUT /wizard/:orderId/step/:stepNumber` — Auto-save step (1-7)
- `POST /wizard/:orderId/submit` — Final submission

**Checks (authenticated):**
- `GET /checks` — All background checks for candidate
- `GET /checks/:orderId` — Full check detail
- `GET /checks/:orderId/timeline` — Status history
- `GET /checks/:orderId/report` — Report metadata

**Documents (authenticated):**
- `GET /documents` — All uploaded documents
- `POST /documents/upload` — Upload document (multipart)
- `DELETE /documents/:id` — Delete document

**Profile (authenticated):**
- `GET /profile` — Profile + stats
- `PUT /profile` — Update profile
- `PUT /profile/password` — Change password
- `DELETE /profile/account` — Delete account (soft)

**Notifications (authenticated):**
- `GET /notifications` — List with unread count
- `PUT /notifications/:id/read` — Mark read
- `PUT /notifications/read-all` — Mark all read
- `DELETE /notifications/:id` — Delete

**Status (public):**
- `GET /status/check/:orderNumber` — Minimal public status (no PII)

### 5.7 New Database Tables Added

`candidate_profiles`, `candidate_invitations`

(All other tables reused from shared `chexpro_portal_db` schema)

### 5.8 Bull Queue Workers

| Job | Trigger | Action |
|-----|---------|--------|
| `send-reminder-email` | Daily 9am | Remind candidates with incomplete wizards (3 reminders max) |
| `expire-invitations` | Every hour | Mark expired uninvited invitations |
| `send-notification-email` | On demand | Email for notification records |

### 5.9 Redis Events

**Subscribes to:** `order:statusChanged`, `report:ready`,
`adverse_action:initiated`, `order:requiresAction`

**Publishes:** `candidate:registered`, `candidate:wizard_completed`

### 5.10 Local Dev Credentials (Post-Seed)

| Role | Email | Password |
|------|-------|----------|
| Candidate | `candidate@test.com` | `Demo@123456` |

---

## PART 6: SHARED INFRASTRUCTURE

### 6.1 Database

**Engine:** MySQL 8.0  
**Instance:** OCI MySQL Database Service (Always Free tier, 1 ECPU)  
**Database:** `chexpro_portal_db`  
**Local port:** `3307`  
**OCI endpoint:** Internal OCI hostname (not public-facing)  

All three portals connect to this single database.
Database user `portal_user` has full read/write access to `chexpro_portal_db`.

### 6.2 Redis

**Version:** Redis 7  
**Purpose:** Bull job queues + pub/sub inter-portal events + JWT blacklist
**Local port:** `6379`  
**Production:** Runs on same OCI VM as application services

### 6.3 File Storage

**Local dev:** `/uploads/` directory in each portal's backend folder  
**Production:** OCI Object Storage bucket (or local filesystem — TBD based on volume)  
**Format:** Signed URLs with 1-hour expiry for secure file access

### 6.4 Email

**Local dev:** Ethereal (fake SMTP, logs preview URLs to console)  
**Production:** SMTP (configure with actual provider — SendGrid recommended)

### 6.5 OCI Server

**Instance:** `chexpro-main-server` — VM.Standard.A1.Flex  
**Specs:** 4 OCPUs, 24 GB RAM  
**OS:** Ubuntu 24.04  
**Public IP:** (on OCI account — not stored in source code)  
**Domain:** `chexpro.com` + all subdomains via wildcard SSL

---

## PART 7: PRODUCTION DEPLOYMENT (NGINX + PM2)

### 7.1 Nginx Virtual Hosts

chexpro.com → marketing site (existing)
portal.chexpro.com → Client Portal frontend (static files)
api.chexpro.com → Client Portal backend (port 3001)
admin.chexpro.com → Admin Portal frontend (static files)
admin-api.chexpro.com → Admin Portal backend (port 4000)
mycheck.chexpro.com → Candidate Portal frontend (static files)
candidate-api.chexpro.com → Candidate Portal backend (port 3004)

text

All HTTP → HTTPS redirect (301).  
All subdomains covered by wildcard cert: `*.chexpro.com`.  
WebSocket upgrade configured on all API subdomains (`/socket.io/`).

### 7.2 PM2 Process Map

| Process Name | Script | Instances | RAM Limit |
|---|---|---|---|
| `portal-api` | `portal-backend/dist/index.js` | 2 (cluster) | 1GB |
| `portal-worker` | `portal-backend/dist/worker.js` | 1 (fork) | 750MB |
| `admin-api` | `admin-backend/dist/index.js` | 2 (cluster) | 800MB |
| `admin-worker` | `admin-backend/dist/worker.js` | 1 (fork) | 600MB |
| `candidate-api` | `candidate-backend/dist/index.js` | 2 (cluster) | 512MB |
| `candidate-worker` | `candidate-backend/dist/worker.js` | 1 (fork) | 256MB |

Total: 6 PM2 processes across 3 portals.

### 7.3 Deployment Sequence (When Ready)

```bash
# 1. SSH into OCI server
ssh chexproadmin@[OCI_PUBLIC_IP]

# 2. Create directory structure
sudo mkdir -p /opt/chexpro/{portal,admin,candidate}/{backend,frontend}

# 3. Pull each portal (or rsync from local)
# Client Portal
cd /opt/chexpro/portal && git pull

# Admin Portal
cd /opt/chexpro/admin && git pull

# Candidate Portal
cd /opt/chexpro/candidate && git pull

# 4. Install deps + build each portal
cd /opt/chexpro/portal/backend && npm ci && npx prisma migrate deploy && npm run build
cd /opt/chexpro/portal/frontend && npm ci && npm run build

cd /opt/chexpro/admin/backend && npm ci && npm run build
cd /opt/chexpro/admin/frontend && npm ci && npm run build

cd /opt/chexpro/candidate/backend && npm ci && npm run build
cd /opt/chexpro/candidate/frontend && npm ci && npm run build

# 5. Copy frontend builds to Nginx web root
sudo cp -r /opt/chexpro/portal/frontend/dist/* /var/www/portal-frontend/
sudo cp -r /opt/chexpro/admin/frontend/dist/* /var/www/admin-frontend/
sudo cp -r /opt/chexpro/candidate/frontend/dist/* /var/www/candidate-frontend/

# 6. Reload Nginx
sudo nginx -t && sudo systemctl reload nginx

# 7. Restart PM2 processes
pm2 reload all
pm2 save
PART 8: ENVIRONMENT VARIABLES MASTER LIST
All three portals share these variable NAMES — only the VALUES differ.
Secrets marked 🔐 must match across all portals.

Shared Secrets (same value in all three .env files)
Variable	Description
🔐 DATABASE_URL	MySQL connection string to chexpro_portal_db
🔐 JWT_SECRET	Must be identical across all 3 portals
🔐 JWT_REFRESH_SECRET	Must be identical across all 3 portals
🔐 ENCRYPTION_KEY	AES-256 key for SIN/PII encryption
REDIS_URL	Redis connection string
Portal-Specific Variables
Variable	Client Portal	Admin Portal	Candidate Portal
PORT	3001	4000	3004
FRONTEND_URL	http://localhost:5173	http://localhost:4001	http://localhost:5174
NODE_ENV	development	development	development
Optional / Service-Specific
Variable	Used By	Purpose
STRIPE_SECRET_KEY	Client Portal	Payment processing
STRIPE_WEBHOOK_SECRET	Client Portal	Webhook verification
STERLING_API_KEY	Admin Portal	Vendor integration
CERTN_API_KEY	Admin Portal	Vendor integration
N8N_WEBHOOK_BASE_URL	Admin Portal	Workflow automation
SMTP_HOST/PORT/USER/PASS	All 3	Email sending
PART 9: SECURITY & COMPLIANCE
9.1 Data Protection
All PII encrypted at rest (AES-256-CBC using ENCRYPTION_KEY)

SIN/SSN stored in separately encrypted column

TLS 1.3 for all data in transit (enforced by Nginx)

JWT tokens expire in 15 minutes (access) / 7 days (refresh)

Refresh token invalidation via Redis blacklist on logout

bcrypt cost factor 12 for all passwords

Rate limiting on all auth endpoints (5 attempts/15min per IP)

9.2 Compliance
Standard	Coverage
PIPEDA (Canada)	Primary compliance standard — consent, collection limitation, retention
FCRA (USA)	Adverse action workflow, dispute resolution, consumer rights
GDPR-ready	Right to access, erasure, portability (future EU clients)
SOC 2 Type II	Aligned (not certified yet — see System Runbook)
9.3 Access Control Model
Row-level security: All API queries filter by clientId from JWT payload

Role checks: Each endpoint has explicit role requirements

Portal isolation: Auth middleware rejects roles that don't belong to that portal

Audit logging: All admin actions written to audit_logs table

PART 10: TESTING STRATEGY
Per Portal
Type	Tool	Target Coverage
Unit (Backend)	Vitest	80%
Unit (Frontend)	Vitest + Testing Library	70%
API Integration	Supertest	All critical paths
E2E	Playwright (future)	Critical user journeys
Critical Test Paths (All Portals)
Client Portal:

Login → Create Order → Send Invitation → Order in "Awaiting" status

Adverse action → Pre-notice → 5-day wait → Final notice

Admin Portal:

Login → Order in queue → Assign → Send to vendor → Update status

QA review → Approve → Report delivery to client

Candidate Portal:

Registration from invitation token → Wizard complete → Submit

Status update received via WebSocket after admin updates order

Cross-Portal Integration Test
Client Portal creates order + sends invitation

Candidate Portal registers + completes wizard

Admin Portal receives wizard_completed event → order moves to queue

Admin Portal marks order complete

Client Portal receives report:ready event → report available

Candidate Portal receives status update via WebSocket

PART 11: GITHUB REPOSITORIES
Repo	URL	Status
Client Portal	github.com/swsamitsmc/Chexpro-Client-Portal	✅ Pushed
Admin Portal	github.com/swsamitsmc/Chexpro-Admin-Portal	🔄 Pending push
Candidate Portal	github.com/swsamitsmc/Chexpro-Candidate-Portal	🔄 In Development
All repos are private. The Runbook and Security Guide may be included
in repos since they are private.

Git Workflow
main → production-ready code only

develop → active development branch

feature/[name] → individual feature branches

Force pushes only allowed on first push to main (repo initialization)

PART 12: THE FINAL MONOREPO PLAN
Once all three portals are complete, tested, and working together:

12.1 Target Structure
text
chexpro-platform/                     ← New combined private repo
├── packages/
│   └── shared/                       ← @chexpro/shared (private npm)
│       ├── prisma/
│       │   └── schema.prisma         ← Single source of truth for DB schema
│       └── src/
│           ├── types/                ← Shared TypeScript interfaces
│           ├── utils/                ← Shared utilities (encryption, helpers)
│           └── constants/            ← Status enums, label maps, role lists
├── portals/
│   ├── client-portal/
│   │   ├── frontend/
│   │   └── backend/
│   ├── admin-portal/
│   │   ├── frontend/
│   │   └── backend/
│   └── candidate-portal/
│       ├── frontend/
│       └── backend/
├── website/                          ← chexpro.com (if brought into monorepo)
├── infrastructure/
│   ├── nginx/
│   │   ├── portal.chexpro.com.conf
│   │   ├── admin.chexpro.com.conf
│   │   └── mycheck.chexpro.com.conf
│   ├── pm2-ecosystem.config.js       ← All 6 processes
│   ├── docker-compose.yml            ← All services together
│   └── deploy/
│       └── deploy.sh                 ← Full platform deployment script
└── docs/
    ├── Chexpro-Platform-Master-Spec.md   ← THIS DOCUMENT
    ├── ClientPortal.md
    ├── adminportal.md
    ├── CandidatePortal.md
    └── Chexpro-System-Runbook-v3.1.md   ← (private — do not make public)
12.2 Monorepo Assembly Sequence
Create chexpro-platform repo (private)

Set up packages/shared with Prisma schema + shared types

Update each portal backend to use @chexpro/shared instead of local copies

Merge individual portal repos into portals/ subdirectories

Create unified infrastructure/ folder from all 3 Nginx + PM2 configs

Single docker-compose.yml that starts all services

Single deploy.sh that deploys all portals in correct order

Tag individual portal repos as v1.0-archived and archive them

PART 13: KNOWN ISSUES & DECISIONS PENDING
Item	Status	Owner
Client Portal local testing checklist	⏳ Not started	CEO
Admin Portal codebase audit	⏳ Awaiting Kilo Code results	Kilo Code
Candidate Portal build	🔄 Building now	Kilo Code
Candidate Portal — transition from embedded wizard to standalone	🔲 Not started	After Candidate Portal built
OCI deployment	🔲 Not started	After all 3 portals pass testing
SSL wildcard cert renewal automation	🔲 Review existing Let's Encrypt setup	Before OCI deployment
Stripe live keys	🔲 Not configured	Before OCI deployment
Vendor API sandbox keys (Sterling, Certn)	🔲 Not configured	Before OCI deployment
PART 14: BUILD PROGRESS TRACKER
Current Sprint Status
Task	Status	Completion
Client Portal — TypeScript: 0 errors	✅ Done	100%
Client Portal — pushed to GitHub	✅ Done	100%
Admin Portal — spec reviewed	✅ Done	100%
Admin Portal — codebase audit	🔄 In progress	—
Candidate Portal spec written	✅ Done	100%
Candidate Portal build	🔄 In progress	—
Client Portal local testing	⏳ Pending	0%
Inter-portal integration testing	⏳ Pending	0%
OCI deployment	⏳ Pending	0%
Next Actions (In Order)
✅ Admin Portal audit results come back from Kilo Code

✅ Fix Admin Portal gaps (same sprint-based approach as Client Portal)

✅ Candidate Portal build completes

Run Client Portal local testing checklist (from earlier in conversation)

Test all three portals together (cross-portal integration test)

UI/UX review and polish pass on all three portals

Stripe live keys + vendor sandbox keys configured

OCI deployment — all three portals together

Document Version: 1.0
Last Updated: February 19, 2026
Maintained By: CEO, Chexpro.com
Classification: Internal — Confidential