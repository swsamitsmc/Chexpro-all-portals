Chexpro.com Admin Operations Portal — Technical Specification v2.0
Enhanced Feature Set + OCI Deployment Architecture
Version: 2.0 (Enhanced)
Date: February 18, 2026
Audience: AI Coding Agent, Development Team
Related Docs: Client Portal Spec v2.0, System Runbook v3.1

WHAT'S NEW IN v2.0
This enhanced specification adds 18 major feature categories missed in v1.0, covering AI-powered routing, fraud detection, financial reconciliation, capacity planning, a staff knowledge base, FCRA reinvestigation workflows, error management, a full communications center, and OCI-specific local-first deployment architecture.

Major Additions:
AI-Powered Intelligent Order Routing

Fraud Detection & Identity Verification

Financial Reconciliation & Vendor Billing

Capacity Planning & Workload Forecasting

FCRA Reinvestigation Workflow (30-Day Compliance)

Error & Exception Management Center

Staff Knowledge Base & SOPs

Internal Communications Center

Client Health Scoring & Retention Alerts

Report Template Builder

Automated Escalation Engine

Full SLA Management Module (complete)

Full Report Generation & Delivery (complete)

Full Team Management Module (complete)

Full Analytics & Business Intelligence (complete)

Full Compliance Dashboard (complete)

System Administration Module (complete)

OCI + Local Development Deployment Guide

SECTION 1: SYSTEM ARCHITECTURE & OCI DEPLOYMENT
1.1 Local Development Setup
Before deploying to OCI, the entire admin portal is built and tested locally using Docker Compose, mirroring the production environment.

Directory Structure (Local Machine):

text
C:\dev\chexpro\                  (or ~/dev/chexpro/ on Linux/Mac)
├── client-portal/               (Already built - Client Portal v2.0)
│   ├── frontend/
│   └── backend/
├── admin-portal/                (This specification)
│   ├── frontend/
│   ├── backend/
│   ├── docker-compose.yml
│   └── .env.local
├── shared/
│   ├── database/
│   │   └── migrations/
│   └── redis/
└── nginx/
    └── nginx.conf               (Routes both portals locally)
Local docker-compose.yml:

text
version: '3.8'

services:
  # Shared database (MySQL mirroring OCI MySQL)
  mysql:
    image: mysql:8.0
    container_name: chexpro-mysql-local
    restart: always
    environment:
      MYSQL_ROOT_PASSWORD: localrootpassword
      MYSQL_DATABASE: chexpro_admin_db
    ports:
      - "3306:3306"
    volumes:
      - mysql_local_data:/var/lib/mysql
      - ./shared/database/migrations:/docker-entrypoint-initdb.d
    networks:
      - chexpro-network

  # Shared Redis
  redis:
    image: redis:7-alpine
    container_name: chexpro-redis-local
    restart: always
    ports:
      - "6379:6379"
    volumes:
      - redis_local_data:/data
    networks:
      - chexpro-network

  # Admin Portal Backend
  admin-backend:
    build: ./admin-portal/backend
    container_name: chexpro-admin-api
    restart: always
    environment:
      NODE_ENV: development
      PORT: 4000
      DATABASE_URL: mysql://root:localrootpassword@mysql:3306/chexpro_admin_db
      REDIS_URL: redis://redis:6379
      JWT_SECRET: local_dev_jwt_secret_admin_change_in_prod
      JWT_REFRESH_SECRET: local_dev_refresh_secret_admin_change_in_prod
      CLIENT_PORTAL_URL: http://localhost:3001
      ADMIN_PORTAL_URL: http://localhost:4000
    ports:
      - "4000:4000"
    volumes:
      - ./admin-portal/backend:/app
      - /app/node_modules
    depends_on:
      - mysql
      - redis
    networks:
      - chexpro-network
    command: npm run dev   # Nodemon for hot-reload

  # Admin Portal Frontend
  admin-frontend:
    build: ./admin-portal/frontend
    container_name: chexpro-admin-ui
    restart: always
    environment:
      REACT_APP_API_URL: http://localhost:4000/api
      REACT_APP_WS_URL: ws://localhost:4000
    ports:
      - "4001:3000"
    volumes:
      - ./admin-portal/frontend:/app
      - /app/node_modules
    depends_on:
      - admin-backend
    networks:
      - chexpro-network

  # Background Worker (Bull Queue Processor)
  admin-worker:
    build: ./admin-portal/backend
    container_name: chexpro-admin-worker
    restart: always
    environment:
      NODE_ENV: development
      DATABASE_URL: mysql://root:localrootpassword@mysql:3306/chexpro_admin_db
      REDIS_URL: redis://redis:6379
    command: npm run worker
    depends_on:
      - mysql
      - redis
    networks:
      - chexpro-network

  # Bull Dashboard (Queue Monitor - dev only)
  bull-dashboard:
    image: deadly0/bull-board
    container_name: chexpro-bull-board
    environment:
      REDIS_HOST: redis
      REDIS_PORT: 6379
    ports:
      - "4002:3000"
    depends_on:
      - redis
    networks:
      - chexpro-network

volumes:
  mysql_local_data:
  redis_local_data:

networks:
  chexpro-network:
    external: true   # Shared with client-portal compose
.env.local file:

text
# Admin Portal - Local Development
NODE_ENV=development

# Database
DATABASE_URL=mysql://root:localrootpassword@localhost:3306/chexpro_admin_db

# Redis
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=local_dev_jwt_secret_admin_CHANGE_IN_PROD
JWT_REFRESH_SECRET=local_dev_refresh_secret_CHANGE_IN_PROD
JWT_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

# Email (Mailtrap for local testing)
SMTP_HOST=smtp.mailtrap.io
SMTP_PORT=587
SMTP_USER=your_mailtrap_user
SMTP_PASS=your_mailtrap_pass
SMTP_FROM=admin@chexpro.com

# File Storage (Local MinIO for dev, replace with S3 in prod)
STORAGE_TYPE=local
LOCAL_STORAGE_PATH=./uploads

# Client Portal API (for cross-portal communication)
CLIENT_PORTAL_API_URL=http://localhost:3000
CLIENT_PORTAL_API_KEY=internal_api_key_dev

# Vendor APIs (use sandbox keys locally)
STERLING_API_KEY=sterling_sandbox_key
STERLING_API_URL=https://api-sandbox.sterlingcheck.com/v2
CERTN_API_KEY=certn_sandbox_key
CERTN_API_URL=https://api.sandbox.certn.co/v1

# Feature Flags
ENABLE_AI_ROUTING=true
ENABLE_FRAUD_DETECTION=true
ENABLE_AUTO_ESCALATION=true

# n8n Integration
N8N_WEBHOOK_BASE_URL=http://localhost:5678/webhook
N8N_API_KEY=local_n8n_api_key

# Ports
ADMIN_API_PORT=4000
ADMIN_FRONTEND_PORT=4001
1.2 OCI Production Deployment
Portal URL: https://admin.chexpro.com

OCI Nginx Config:

text
# Admin Portal Frontend
server {
    listen 443 ssl http2;
    server_name admin.chexpro.com;

    ssl_certificate /etc/letsencrypt/live/chexpro.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/chexpro.com/privkey.pem;
    include /etc/nginx/snippets/ssl-params.conf;

    # Restrict to internal IPs or VPN in future
    # allow 192.168.1.0/24;
    # deny all;

    root /var/www/admin-frontend/build;
    index index.html;

    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff2)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}

# Admin Portal API
server {
    listen 443 ssl http2;
    server_name admin-api.chexpro.com;

    ssl_certificate /etc/letsencrypt/live/chexpro.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/chexpro.com/privkey.pem;
    include /etc/nginx/snippets/ssl-params.conf;

    location / {
        proxy_pass http://127.0.0.1:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 120s;
    }

    # WebSocket for live updates
    location /ws {
        proxy_pass http://127.0.0.1:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_read_timeout 86400;
    }
}
PM2 Ecosystem entry for Admin Portal:

javascript
// Add to existing /home/chexproadmin/pm2-ecosystem.config.js
{
  name: 'admin-api',
  script: '/opt/chexpro-admin/backend/index.js',
  instances: 2,
  exec_mode: 'cluster',
  max_memory_restart: '800M',
  env: {
    NODE_ENV: 'production',
    PORT: 4000
  },
  error_file: '/var/log/chexpro-admin/api-error.log',
  out_file: '/var/log/chexpro-admin/api-out.log',
  log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
},
{
  name: 'admin-worker',
  script: '/opt/chexpro-admin/backend/worker.js',
  instances: 1,
  exec_mode: 'fork',
  max_memory_restart: '600M',
  env: { NODE_ENV: 'production' },
  error_file: '/var/log/chexpro-admin/worker-error.log',
  out_file: '/var/log/chexpro-admin/worker-out.log'
}
1.3 Shared Database Schema Strategy
Both the client portal and admin portal connect to the same OCI MySQL instance but use separate databases with cross-database JOINs for shared data:

sql
-- Client Portal database
chexpro_portal_db     -- orders, applicants, clients, users, packages

-- Admin Portal database (this spec)
chexpro_admin_db      -- admin_users, vendor_accounts, qa_reviews, 
                      -- sla_configs, internal_notes, audit_logs,
                      -- routing_rules, escalations, reconciliation,
                      -- staff_assignments, knowledge_base

-- Cross-database query example:
SELECT o.*, a.id AS admin_assignment
FROM chexpro_portal_db.orders o
JOIN chexpro_admin_db.staff_assignments a ON o.id = a.order_id
WHERE a.assigned_to = 'admin_user_uuid';
SECTION 2: DASHBOARD & OPERATIONAL METRICS
2.1 Real-Time Operations Dashboard
Technology: WebSocket (Socket.io) — dashboard auto-refreshes without page reload.
​

Dashboard Layout:

text
┌─────────────────────────────────────────────────────────────────┐
│ 🔴 LIVE   Admin Portal — Chexpro Operations         👤 Admin ▼ │
├──────────┬──────────────────────────────────────────────────────┤
│ NAV      │ MAIN CONTENT AREA                                    │
│ Dashboard│                                                      │
│ Orders   │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────┐ │
│ Clients  │  │ NEW      │ │IN PROGRES│ │PENDING QA│ │OVERDUE │ │
│ Vendors  │  │  24      │ │  156     │ │  31      │ │  3  🔴 │ │
│ QA       │  │ +12% ↑   │ │ +5% ↑   │ │ -8% ↓   │ │        │ │
│ Adjudicat│  └──────────┘ └──────────┘ └──────────┘ └────────┘ │
│ Reports  │                                                      │
│ SLA      │  ┌──────────────────────────┐ ┌────────────────────┐│
│ Finance  │  │ ORDER FLOW (Live)        │ │ SLA TRACKER        ││
│ Team     │  │ [Animated Kanban Flow]   │ │ ████████████ 92.4% ││
│ Comms    │  │ NEW→ASSIGNED→PROGRESS    │ │ On-Time (Last 7d)  ││
│ Complianc│  │       →VENDOR→QA→DONE   │ │ 12 At Risk [!]     ││
│ Analytics│  │                          │ │ 3 Breached [!!]    ││
│ Settings │  └──────────────────────────┘ └────────────────────┘│
│          │                                                      │
│          │  ┌──────────────────────────┐ ┌────────────────────┐│
│          │  │ VENDOR HEALTH            │ │ MY WORKLOAD        ││
│          │  │ Sterling  ✅ Connected   │ │ Assigned: 23       ││
│          │  │ Certn     ✅ Connected   │ │ Due Today: 5       ││
│          │  │ Equifax   ⚠️ Slow TAT   │ │ Overdue: 2 🔴      ││
│          │  │ LexisNex  🔴 Degraded   │ │ [View Queue]       ││
│          │  └──────────────────────────┘ └────────────────────┘│
│          │                                                      │
│          │  ┌────────────────────────────────────────────────┐ │
│          │  │ ALERTS (Live Feed)                             │ │
│          │  │ 🔴 16:28 ORD-245 — SLA BREACHED (was due 2h) │ │
│          │  │ 🟡 16:25 ORD-312 — Vendor API timeout (retry) │ │
│          │  │ 🟢 16:20 ORD-289 — QA Approved, Report Ready  │ │
│          │  │ 🔵 16:15 New client application: TechCorp Inc  │ │
│          │  └────────────────────────────────────────────────┘ │
└──────────┴──────────────────────────────────────────────────────┘
2.2 Role-Based Dashboard Views
Each role sees a tailored dashboard on login:

Role	Default Widgets Shown
Super Admin	All widgets + system health + revenue
Operations Manager	All order metrics + team utilization + SLA
Processor	My Queue + My SLA + Daily Targets
QA Specialist	QA Queue + First-pass Rate + My Reviews
Client Success Manager	Client Health Scores + At-Risk Clients
Credentialing Specialist	Pending Applications + Compliance Expirations
Compliance Officer	Adverse Actions + Disputes + Audit Alerts
Finance	Revenue + Reconciliation Alerts + Invoices Due
SECTION 3: ORDER PROCESSING WORKFLOW
(Full spec carried from v1.0 — additions listed below)

3.1 NEW: Intelligent Work Queue & Auto-Assignment
Auto-Assignment Rules Engine:

sql
CREATE TABLE assignment_rules (
  id CHAR(36) PRIMARY KEY,
  rule_name VARCHAR(255) NOT NULL,
  priority INT NOT NULL,
  conditions JSON NOT NULL,
  /* Example conditions:
  {
    "order_type": ["criminal_check", "employment_verify"],
    "client_tier": ["enterprise"],
    "jurisdiction": ["CA-ON", "CA-BC"],
    "complexity": "standard",
    "time_of_day": {"from": "09:00", "to": "17:00"}
  }
  */
  action JSON NOT NULL,
  /* Example action:
  {
    "assign_to": "team_id_or_user_id",
    "priority": "high",
    "sla_override_hours": 24
  }
  */
  is_active BOOLEAN DEFAULT TRUE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
Assignment Logic:

javascript
async function autoAssignOrder(order) {
  // 1. Find matching rules by priority
  const rules = await getActiveRules();
  const matchedRule = rules.find(rule => matchesConditions(order, rule.conditions));

  if (matchedRule) {
    // 2. Apply rule action
    const { assign_to, priority } = matchedRule.action;
    const assignee = await findAvailableStaff(assign_to);
    await assignOrder(order.id, assignee.id, priority);
    return assignee;
  }

  // 3. Fallback: Round-robin assignment among available staff
  const availableStaff = await getAvailableStaffByCapacity('processor');
  const assignee = roundRobinSelect(availableStaff);
  await assignOrder(order.id, assignee.id, 'standard');
  return assignee;
}
Capacity-Aware Assignment:

Each processor has a configurable daily capacity (default: 20 orders/day)

System will not over-assign beyond capacity threshold

Visual workload meter per staff member

Manager override available

3.2 NEW: Order Exception Management
Exception Types:

Missing consent forms

Unverifiable employer (out of business, unresponsive)

Conflicting information (dates don't match, address gap)

Vendor return error (bad data, API rejection)

Identity mismatch (name/DOB discrepancy in records)

Expired invitation (applicant didn't complete in time)

Jurisdictional restriction (check not available in that region)

Exception Workflow:

text
Exception Detected (auto or manual)
  ↓
Create Exception Record
  ↓
Classify: [Blocking] [Non-Blocking]
  ↓
Blocking? → Pause order → Notify responsible party
Non-Blocking? → Flag for review → Continue processing
  ↓
Resolution Path Auto-Suggested
  ↓
Processor Takes Action → Log Resolution
  ↓
Order Resumes / Closes
Exception Management Screen:

text
EXCEPTION MANAGEMENT

Open Exceptions: 14
Blocking: 8  |  Non-Blocking: 6

┌──────────────────────────────────────────────────────────────────────┐
│ Order       │ Exception Type        │ Severity │ Age  │ Assigned    │
├──────────────────────────────────────────────────────────────────────┤
│ ORD-10245  │ Unverifiable Employer │ Blocking │ 2d   │ J. Smith    │
│ ORD-10251  │ Identity Mismatch     │ Blocking │ 1d   │ M. Chen     │
│ ORD-10267  │ Missing Consent Form  │ Blocking │ 4h   │ Unassigned  │
│ ORD-10271  │ Vendor API Error      │ High     │ 30m  │ System      │
└──────────────────────────────────────────────────────────────────────┘

EXCEPTION DETAIL: ORD-10251 — Identity Mismatch

Description:
Criminal record search returned a record for "John A. Smith" (DOB: 
Mar 5, 1988), but applicant is "John A. Smith" (DOB: Mar 5, 1989).
DOB differs by 1 year. Possible mixed file / mixed identity.

Vendor: Sterling | Returned: Feb 18, 2026 2:15 PM

Suggested Resolution:
1. Request applicant to provide additional ID (passport)
2. Contact Sterling to clarify record jurisdiction and DOB
3. If confirmed different person: Mark record as non-applicable

[Request Info from Applicant]
[Contact Vendor]
[Mark as Non-Applicable + Add Notes]
[Escalate to Manager]
[View Full Order]
3.3 NEW: Manual Check Entry (Non-Vendor Checks)
Some checks (e.g., calling a reference, verifying a local business) are done manually by processors:

text
MANUAL VERIFICATION ENTRY

Order: ORD-10245
Service: Employment Verification — Tech Corp Inc (2019-2022)

Verification Method Used:
◉ Phone Call
○ Email
○ Fax
○ Online Portal (employer's website)
○ Third-party database
○ Direct document review

Contact Details:
Person Spoke With: Jennifer Williams
Title: HR Manager
Phone: +1 (416) 555-0123 ext. 4
Date/Time: Feb 18, 2026 at 2:30 PM EST

Information Verified:
☑ Employment Dates: Mar 2019 - Jan 2022  ✓ CONFIRMED
☑ Job Title: Software Developer  ✓ CONFIRMED
☑ Employment Type: Full-time  ✓ CONFIRMED
☑ Eligible for Rehire: Yes ✓ CONFIRMED
☐ Reason for Leaving: Did not disclose

Notes:
"Spoke with HR Manager Jennifer Williams at 2:30 PM. She confirmed 
all employment details. Company no longer provides reason for leaving 
due to policy change as of 2024. Positive reference overall."

Outcome: ✓ Verified
Supporting Document: [Upload if any]

[Save Verification] [Mark Complete] [Flag for QA Review]
SECTION 4: CLIENT CREDENTIALING & ONBOARDING
(Full spec from v1.0 — additions below)

4.1 NEW: Client Health Scoring System
Purpose: Proactively identify at-risk client relationships before they churn.
​

Health Score Calculation:

javascript
function calculateClientHealthScore(clientId) {
  const weights = {
    orderVolumeTrend:     0.25,  // Growing=100, Stable=70, Declining=30
    paymentHistory:       0.20,  // Always on time=100, Late once=70, Multiple=30
    supportTickets:       0.15,  // Low=100, Medium=70, High complaints=30
    portalEngagement:     0.15,  // Regular logins=100, Sporadic=50, None=10
    npsScore:             0.15,  // 9-10=100, 7-8=70, 0-6=0
    contractRenewal:      0.10,  // Renewed=100, Upcoming=50, Lapsed=0
  };

  // Weighted average → Score 0-100
  // Green: 75-100 | Yellow: 50-74 | Red: 0-49
  return weightedScore;
}
Client Health Dashboard:

text
CLIENT HEALTH MONITOR

Filter: [All] [At Risk 🔴 8] [Watch 🟡 12] [Healthy 🟢 27]

┌──────────────────────────────────────────────────────────────────────┐
│ Client          │ Score │ Trend │ Flag              │ Account Mgr  │
├──────────────────────────────────────────────────────────────────────┤
│ Acme Corp       │  88   │  ↑   │ Healthy            │ D. Williams │
│ TechStart Inc   │  72   │  →   │ Watch - Volume ↓   │ D. Williams │
│ HealthCare Ltd  │  41   │  ↓   │ AT RISK - No login │ S. Brown    │
│ Finance Group   │  91   │  ↑   │ Healthy            │ M. Lee      │
└──────────────────────────────────────────────────────────────────────┘

AT-RISK DETAIL: HealthCare Ltd (Score: 41)

Risk Factors:
🔴 No portal logins in 34 days
🟡 Order volume down 60% vs prior 30 days
🟡 1 outstanding invoice (NET 30 overdue 5 days)
🟢 Contract renews in 180 days (not urgent)

Recommended Actions:
1. Account manager to schedule check-in call
2. Send re-engagement email with usage tips
3. Offer training session for new users
4. Escalate to Operations Manager if no response in 7 days

[Schedule Call] [Send Email] [Create Task] [Assign to Manager]
4.2 NEW: Client Compliance Expiry Calendar
Purpose: Track expiry of contracts, FCRA certifications, insurance, and compliance docs for all clients.

text
COMPLIANCE CALENDAR

View: [Month ▼] [February 2026]

Upcoming Expirations:

🔴 OVERDUE:
- Acme Corp — FCRA End-User Certification (Expired Feb 1, 2026)
  → Auto-reminder sent x3. [Send Urgent Notice] [Mark Renewed]

🟡 DUE WITHIN 30 DAYS:
- TechStart Inc — Master Service Agreement (Expires Mar 5, 2026)
  → Renewal in progress. [View Contract] [Log Renewal]
- Finance Group — Insurance Certificate (Expires Mar 10, 2026)
  → [Request Updated Certificate]

🟢 DUE WITHIN 90 DAYS:
- 12 clients with FCRA certification renewals in Q2 2026
  → [Send Batch Renewal Requests]

[Export Compliance Calendar] [Configure Reminder Triggers]
Database Table:

sql
CREATE TABLE client_compliance_items (
  id CHAR(36) PRIMARY KEY,
  client_id CHAR(36) NOT NULL,
  item_type VARCHAR(100) NOT NULL,
  -- 'fcra_certification', 'service_agreement', 'insurance',
  -- 'data_processing_agreement', 'baa', 'pricing_schedule'
  effective_date DATE,
  expiry_date DATE,
  status ENUM('active', 'expiring_soon', 'expired', 'renewed') DEFAULT 'active',
  document_path VARCHAR(500),
  reminder_sent_at DATETIME,
  reminder_count INT DEFAULT 0,
  renewed_by CHAR(36),
  renewed_at DATETIME,
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (client_id) REFERENCES chexpro_portal_db.clients(id),
  INDEX idx_expiry (expiry_date),
  INDEX idx_status (status)
);
4.3 NEW: Client Onboarding Task Manager
Onboarding Kanban Board:

text
CLIENT ONBOARDING PIPELINE

[NEW APPLICATION] [VERIFICATION] [CONTRACTING] [CONFIGURING] [TRAINING] [LIVE]
      │                │               │              │            │         │
 TechCorp Inc      Maple Ltd      BuildCo Inc    Acme Corp    XYZ Ltd   (Done)
 Applied: Today    Biz Verify     Contract Out   Config 60%   Day 2 of  
 Assigned: J.Doe   In progress    Awaiting sig   Packages OK  3 Training
                                                 Users TBD    Sessions

[+ New Application]
Task Checklist per Onboarding Stage:

sql
CREATE TABLE onboarding_checklists (
  id CHAR(36) PRIMARY KEY,
  client_id CHAR(36) NOT NULL,
  stage VARCHAR(50) NOT NULL,
  task_name VARCHAR(255) NOT NULL,
  task_description TEXT,
  is_required BOOLEAN DEFAULT TRUE,
  is_completed BOOLEAN DEFAULT FALSE,
  completed_by CHAR(36),
  completed_at DATETIME,
  due_date DATE,
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Default tasks auto-created when client application received:
INSERT INTO onboarding_checklists (stage, task_name) VALUES
('verification', 'Verify company registration number'),
('verification', 'Confirm business license validity'),
('verification', 'Run D&B credit check'),
('verification', 'Check references (min 2)'),
('contracting',  'Generate Master Service Agreement'),
('contracting',  'Send FCRA End-User Certification for signature'),
('contracting',  'Send Data Processing Agreement for signature'),
('contracting',  'Agree on pricing schedule'),
('contracting',  'Receive signed contract back'),
('configuration','Create client account in system'),
('configuration','Configure packages and services'),
('configuration','Set up branding and customization'),
('configuration','Configure compliance rules for jurisdiction'),
('configuration','Set up user accounts (minimum 1 admin)'),
('configuration','Configure billing model and payment method'),
('configuration','Run test order end-to-end'),
('training',     'Schedule and deliver onboarding call'),
('training',     'Send training materials and user guides'),
('training',     'Complete admin user training (60 min)'),
('training',     'Client submits first real order'),
('live',         'Confirm portal access is working'),
('live',         'Assign dedicated account manager'),
('live',         'Schedule 30-day check-in call');
SECTION 5: VENDOR MANAGEMENT & ROUTING
(Full spec from v1.0 — major additions below)

**5.1 NEW: AI-Powered Intelligent Vendor Routing **
Overview: Instead of static routing rules, the system dynamically evaluates real-time vendor performance data to select the optimal vendor for each order.

Routing Decision Matrix:

javascript
async function selectOptimalVendor(order) {
  const eligibleVendors = await getEligibleVendors(order.serviceType, order.jurisdiction);

  const scores = await Promise.all(eligibleVendors.map(async vendor => {
    const metrics = await getVendorMetrics(vendor.id, '7d'); // last 7 days

    // Score each vendor 0-100
    const score = {
      // Lower TAT = higher score
      tatScore:         normalize(metrics.avg_tat_hours, 24, 168),
      // Higher on-time rate = higher score  
      reliabilityScore: metrics.on_time_rate * 100,
      // Higher quality = higher score
      qualityScore:     metrics.quality_score * 100,
      // Lower cost = higher score (within client preferences)
      costScore:        normalizeCost(vendor.price_for_service),
      // Is vendor currently under load?
      capacityScore:    await getVendorCapacityScore(vendor.id),
      // Client explicitly prefers this vendor?
      preferenceScore:  await getClientVendorPreference(order.clientId, vendor.id)
    };

    const weights = {
      tatScore: 0.30,
      reliabilityScore: 0.25,
      qualityScore: 0.20,
      costScore: 0.10,
      capacityScore: 0.10,
      preferenceScore: 0.05
    };

    const finalScore = Object.keys(weights).reduce(
      (sum, key) => sum + (score[key] * weights[key]), 0
    );

    return { vendor, score: finalScore, breakdown: score };
  }));

  // Sort by score descending, return top 3 ranked
  scores.sort((a, b) => b.score - a.score);

  // Log routing decision for audit trail
  await logRoutingDecision(order.id, scores);

  return scores[0].vendor; // auto-select top scorer
}
Routing Decision Log UI:

text
ROUTING DECISION LOG: ORD-10245

Service: Criminal Record Check (Federal)
Decision Time: Feb 18, 2026 at 11:32:07 AM

Evaluated Vendors (Ranked):

1. ✅ SELECTED: Certn  (Score: 87.4 / 100)
   TAT Score:          95 (Avg: 18h — Excellent)
   Reliability:        97 (On-Time: 97%)
   Quality:            94 (98.2% accuracy)
   Cost:               72 ($30.00 per check)
   Capacity:           88 (Normal load)
   Client Pref:        75 (No preference set)

2. Sterling  (Score: 72.1 / 100)
   TAT Score:          78 (Avg: 42h)
   Reliability:        89 (On-Time: 89%)
   Quality:            91
   Cost:               85 ($25.00 — cheaper)
   Capacity:           72 (Moderate load)
   Client Pref:        75

3. First Advantage  (Score: 61.8 / 100)
   TAT Score:          65 (Avg: 72h — Slower)
   Reliability:        82
   [...]

Routing Method: AI Auto-Select
Override by Manager: No

[View Full Routing Log]
5.2 NEW: Vendor API Health Monitor
Real-time API Status Dashboard:

text
VENDOR API HEALTH MONITOR

Last updated: 16:32:07 (live)

┌─────────────────────────────────────────────────────────────────────┐
│ Vendor          │ Status      │ Latency │ Error Rate │ Last Checked │
├─────────────────────────────────────────────────────────────────────┤
│ Sterling        │ ✅ Online   │ 245ms   │ 0.0%       │ 16:32:05     │
│ Certn           │ ✅ Online   │ 189ms   │ 0.0%       │ 16:32:05     │
│ First Advantage │ ⚠️ Degraded │ 3,200ms │ 2.1%       │ 16:32:03     │
│ Equifax         │ ✅ Online   │ 312ms   │ 0.0%       │ 16:32:05     │
│ LexisNexis      │ 🔴 Offline  │ Timeout │ 100%       │ 16:31:55     │
└─────────────────────────────────────────────────────────────────────┘

ACTIVE INCIDENTS:
[🔴] LexisNexis API — OFFLINE since 16:28 PM (4 minutes)
  Affected Orders: 3 (rerouted to Sterling automatically)
  Auto-Failover: ✅ Activated
  Notifications Sent: Operations Manager, Vendor Contact
  [View Incident] [Contact Vendor]

[⚠️] First Advantage — DEGRADED since 16:15 PM (17 minutes)
  Response Time: 3.2s (threshold: 2.0s)
  Error Rate: 2.1% (threshold: 1.0%)
  Affected New Orders: Routing to alternatives
  [View Incident] [Contact Vendor]
API Heartbeat Worker:

javascript
// Runs every 60 seconds via Bull queue
async function checkVendorHealth(vendorId) {
  const vendor = await getVendor(vendorId);
  const start = Date.now();

  try {
    const response = await axios.get(vendor.health_check_url, {
      timeout: 5000,
      headers: { 'Authorization': `Bearer ${vendor.api_key}` }
    });

    const latency = Date.now() - start;
    const status = response.status === 200 ? 'online' : 'degraded';

    await saveHealthCheck(vendorId, { status, latency, error_rate: 0 });

    // If vendor was previously down — resolve incident
    if (await wasVendorDown(vendorId)) {
      await resolveVendorIncident(vendorId);
      await notifyTeam(`${vendor.name} API is back online`);
    }

  } catch (error) {
    const latency = Date.now() - start;
    await saveHealthCheck(vendorId, { status: 'offline', latency, error: error.message });
    await triggerVendorFailover(vendorId);
    await createVendorIncident(vendorId, error.message);
    await notifyTeam(`ALERT: ${vendor.name} API is offline`, 'critical');
  }
}
5.3 NEW: Vendor Cost Reconciliation
Purpose: Compare what Chexpro was charged by vendors vs. what was passed to clients, ensuring margin integrity and catching billing errors.

text
VENDOR BILLING RECONCILIATION

Period: January 2026 [Select Period ▼]

STERLING TECHNOLOGIES
Expected (based on orders): $12,450.00
Sterling Invoice Amount:    $12,615.00
Variance:                   $165.00 ⚠️

Discrepancy Breakdown:
Order ORD-9871: Billed twice ($35.00 duplicate)
Order ORD-9920: Rush fee applied but not in contract ($45.00)
Order ORD-9912: Service not delivered but billed ($85.00 — dispute)

[Raise Dispute with Sterling] [Mark Resolved] [Approve Invoice]


CERTN
Expected: $8,220.00
Invoice:  $8,220.00
Variance: $0.00 ✅ Approved

EQUIFAX
Expected: $1,450.00
Invoice:  $1,490.00
Variance: $40.00 ⚠️

[View Details] [Dispute] [Approve Invoice]

TOTAL VENDOR INVOICES THIS PERIOD: $22,325.00
TOTAL EXPECTED:                     $22,120.00
TOTAL VARIANCE:                     $205.00
[Export Reconciliation Report]
Database Tables:

sql
CREATE TABLE vendor_invoices (
  id CHAR(36) PRIMARY KEY,
  vendor_id CHAR(36) NOT NULL,
  invoice_number VARCHAR(100) NOT NULL,
  billing_period_start DATE,
  billing_period_end DATE,
  invoice_amount DECIMAL(10,2) NOT NULL,
  expected_amount DECIMAL(10,2),
  variance DECIMAL(10,2) GENERATED ALWAYS AS (invoice_amount - expected_amount) STORED,
  status ENUM('pending_review', 'disputed', 'approved', 'paid') DEFAULT 'pending_review',
  dispute_notes TEXT,
  approved_by CHAR(36),
  approved_at DATETIME,
  paid_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE vendor_invoice_line_items (
  id CHAR(36) PRIMARY KEY,
  vendor_invoice_id CHAR(36) NOT NULL,
  order_id CHAR(36),
  vendor_order_ref VARCHAR(255),
  service_type VARCHAR(100),
  expected_amount DECIMAL(10,2),
  billed_amount DECIMAL(10,2),
  variance DECIMAL(10,2) GENERATED ALWAYS AS (billed_amount - expected_amount) STORED,
  discrepancy_type VARCHAR(100), -- 'duplicate', 'unauthorized_fee', 'not_delivered'
  resolution_status VARCHAR(50) DEFAULT 'unresolved',
  resolution_notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (vendor_invoice_id) REFERENCES vendor_invoices(id) ON DELETE CASCADE
);
SECTION 6: QUALITY ASSURANCE MODULE
(Full spec from v1.0 — additions below)

6.1 NEW: QA Sampling & Audit Program
Purpose: Randomly sample completed reports to audit quality even after delivery to clients.

text
QA SAMPLING PROGRAM

Configuration:
Sample Rate: 10% of all completed reports
Sample Method: Random stratified (by package type, processor)
Lookback Period: 30 days

This Month's Sample: 124 reports selected

AUDIT CHECKLIST (Post-Delivery):

☑ Report contains correct applicant information
☑ All services in the package are present
☑ Dates are accurate (verified spot-check)
☑ Adverse finding handling followed procedure
☑ Consent forms were in file at time of report
☑ Adjudication notes present (if applicable)
☑ FCRA compliance elements included
☑ No PII appearing in wrong sections
☑ Report PDF formatting is correct
☑ Delivery timestamp is within SLA window

Sampling Results This Month:
Total Sampled: 124
Passed Full Audit: 117 (94.4%)
Issues Found: 7 (5.6%)

Issues:
3 × Minor formatting inconsistency
2 × Missing processor signature in notes
1 × Adverse finding note not client-visible (positive finding)
1 × SLA timestamp shows 2 minutes late (system clock drift)

[View Issue Details] [Assign Corrections] [Export Report]
6.2 NEW: QA Calibration Sessions
Purpose: Ensure all QA specialists are evaluating reports consistently — same finding should get same result regardless of reviewer.
​

text
QA CALIBRATION

Calibration Session #12 — February 18, 2026

How it works:
1. System selects 5 pre-reviewed "benchmark" orders
2. Each QA specialist reviews them blind (without seeing prior decisions)
3. System compares decisions and reasoning
4. Outliers are identified and discussed
5. Agreement score calculated per reviewer

Session Results:

Benchmark Order 1: (Misdemeanor DUI — 4 years ago, Sales role)
Expected Decision: CONDITIONAL REVIEW
  Mary Smith:   CONDITIONAL REVIEW ✅
  James Lee:    CLEAR ⚠️ (variance)
  Sarah Park:   CONDITIONAL REVIEW ✅
  Tom Wilson:   CLEAR ⚠️ (variance)

Benchmark Order 2: (Clear — standard employment package)
Expected Decision: APPROVED
  All reviewers: APPROVED ✅ (100% agreement)

[...]

Overall Calibration Scores:
Mary Smith:   92% agreement (Excellent)
James Lee:    74% agreement (Needs coaching) ← flag
Sarah Park:   88% agreement (Good)
Tom Wilson:   71% agreement (Needs coaching) ← flag

[Schedule Coaching Session - James Lee]
[Schedule Coaching Session - Tom Wilson]
[Export Session Report]
SECTION 7: ADJUDICATION REVIEW SYSTEM
(Full spec from v1.0 — additions below)

7.1 NEW: Second-Level Adjudication Review
Purpose: For complex or sensitive cases, require a second adjudicator to confirm the decision before it is communicated to the client.

text
SECOND-LEVEL REVIEW CONFIGURATION

Trigger Conditions for Mandatory Second Review:
☑ Felony convictions (any time period)
☑ Sex offender registry hits
☑ Healthcare workers with any criminal finding
☑ Financial services workers with fraud/theft findings
☑ Adverse decision that will trigger adverse action process
☑ Client is Tier 1 (enterprise) account
☑ Adjudicator confidence score < 70

Second Reviewer Assignment:
Auto-assign to: [Senior Adjudicator] or [Compliance Officer]
Time Limit: 4 hours (then escalate to manager)

CURRENT SECOND-REVIEW QUEUE: 3 cases

ORD-10251 | First review: ADVERSE | Reviewer: J.Adams | Age: 1h
[Review Now]

ORD-10267 | First review: CONDITIONAL | Reviewer: M.Brown | Age: 2h
[Review Now]

[View All Second-Review Queue]
7.2 NEW: Adjudication Decision Library
Purpose: Searchable library of past adjudication decisions to inform consistency on similar cases.
​

text
ADJUDICATION DECISION LIBRARY

Search: [theft misdemeanor healthcare          🔍]

Found 23 similar past cases:

Case 1 (Similar: 94%)
Finding: Theft <$5,000 | Misdemeanor | 5 years ago
Position: RN | Healthcare setting
Final Decision: CLEAR
Rationale Summary: "5+ years with no recurrence, rehabilitation 
evidence strong, proactive disclosure..."
Outcome: Candidate hired (per client follow-up)

Case 2 (Similar: 91%)
Finding: Theft <$1,000 | Misdemeanor | 3 years ago
Position: Nursing Assistant | Healthcare
Final Decision: ADVERSE
Rationale Summary: "Within 5-year threshold, direct position 
relevance, no rehabilitation documentation..."
Outcome: Candidate not hired

Case 3 (Similar: 87%)
[...]

Use as Reference: [Copy Rationale Template]
[View Full Decision History]
SECTION 8: REPORT GENERATION & DELIVERY
8.1 Report Template Builder
Purpose: Create standardized, client-branded report templates with configurable sections.
​

text
REPORT TEMPLATE BUILDER

Active Templates: 8
[+ Create New Template]

Templates:
Standard Employment Report    — Used by 34 clients  [Edit] [Preview] [Duplicate]
Healthcare Professional Report — Used by 8 clients   [Edit] [Preview] [Duplicate]
Executive Screening Report    — Used by 3 clients   [Edit] [Preview] [Duplicate]
Tenant Screening Report       — Used by 6 clients   [Edit] [Preview] [Duplicate]

EDITING: Standard Employment Report

SECTION BUILDER (Drag to reorder):

[≡] Cover Page
    ☑ Client Logo (top-left)
    ☑ Report Title: "Background Check Report"
    ☑ Applicant Name
    ☑ Reference Number
    ☑ Date of Report
    ☑ Confidentiality Notice

[≡] Executive Summary
    ☑ Overall Status Badge (Clear / Review / Adverse)
    ☑ Summary of all services completed
    ☑ Overall recommendation
    ○ Adjudication notes (optional — toggle per client)

[≡] Criminal Record Check
    ☑ Jurisdiction searched
    ☑ Search methodology
    ☑ Results (Detailed)
    ☑ Result date
    ☐ Vendor reference number (hide from clients)
    ☑ FCRA-compliant disclosure footer

[≡] Employment Verification
    ☑ Employer name
    ☑ Position held
    ☑ Dates of employment
    ☑ Verification method
    ☑ Outcome (Verified/Discrepancy/Unable to Verify)
    ☑ Contact details verified with
    ○ Processor notes (toggle — hide sensitive notes)

[≡] Education Verification
    [Similar config...]

[≡] Footer
    ☑ FCRA Summary of Rights (required)
    ☑ CRA Contact Information
    ☑ Report ID + Page Numbers
    ☑ Expiry Notice ("Report valid for 90 days")
    ☑ Client custom footer text

FORMATTING:
Font: [Arial ▼]   Font Size: [11pt ▼]   Line Spacing: [1.5 ▼]
Header Color: [#003366] (use client brand color: ☑)

[Save Template] [Preview PDF] [Assign to Clients]
8.2 Report Generation Engine
Automated Report Generation:

javascript
async function generateReport(orderId, templateId) {
  const order = await getOrderWithAllData(orderId);
  const template = await getReportTemplate(templateId);
  const client = await getClient(order.clientId);

  // 1. Compile report data
  const reportData = {
    order,
    applicant: order.applicant,
    services: order.services,
    vendorReports: order.vendorReports,
    adjudication: order.adjudication,
    client: {
      name: client.company_name,
      logo_url: client.branding.logo_url,
      primary_color: client.branding.primary_color,
      footer_text: client.branding.email_footer_text
    }
  };

  // 2. Apply compliance filtering (ban-the-box, 7-year rule)
  const filteredData = await applyComplianceFilters(reportData, order.jobLocation);

  // 3. Render HTML from template
  const html = await renderReportTemplate(template, filteredData);

  // 4. Convert HTML → PDF using Puppeteer
  const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: 'networkidle0' });
  const pdfBuffer = await page.pdf({
    format: 'Letter',
    printBackground: true,
    margin: { top: '0.75in', bottom: '0.75in', left: '0.75in', right: '0.75in' }
  });
  await browser.close();

  // 5. Upload PDF to OCI Object Storage
  const fileKey = `reports/${order.clientId}/${orderId}/report-${Date.now()}.pdf`;
  await uploadToStorage(fileKey, pdfBuffer, 'application/pdf');

  // 6. Create report record
  const report = await createReportRecord({
    orderId,
    templateId,
    filePath: fileKey,
    generatedAt: new Date(),
    generatedBy: 'system'
  });

  // 7. Update order status
  await updateOrderStatus(orderId, 'report_generated');

  return report;
}
8.3 Report Delivery Center
text
REPORT DELIVERY CENTER

Order: ORD-10245 | Applicant: Jane Doe | Client: Acme Corp
Report Status: ✅ Generated and QA Approved
Report Date: Feb 19, 2026 at 4:15 PM

DELIVERY OPTIONS:

☑ Client Portal (primary)
  Auto-delivery on approval
  Status: ✅ Available in client portal since 4:15 PM

☑ Email to Client (notify)
  Recipient: sarah.johnson@acmecorp.com
  Template: [Standard Report Ready ▼]
  Status: ✅ Email sent at 4:16 PM

○ Direct Applicant Access
  Grant applicant access to their own report
  ☐ Enable (off by default — client must request)

○ Secure Download Link
  Generate one-time link (expires in 48h)
  [Generate Link] → https://chexpro.com/reports/dl/abc123...

○ Webhook Push
  Client webhook configured: Yes
  Status: ✅ Webhook fired at 4:16 PM (200 OK response)

○ Email Report as PDF Attachment
  ⚠️ Not recommended (PII in email)
  [Enable with encryption ▼]

DELIVERY LOG:
Feb 19 4:16 PM — Webhook fired → 200 OK
Feb 19 4:16 PM — Email notification sent → Delivered
Feb 19 4:15 PM — Report uploaded to client portal
Feb 19 4:15 PM — PDF generated (156KB)
Feb 19 4:15 PM — QA Approved by Mary Smith

[Re-deliver] [Download Report] [View Report] [Audit Trail]
SECTION 9: FCRA REINVESTIGATION WORKFLOW
**9.1 30-Day Reinvestigation Process **
Legal Requirement: Under FCRA Section 611, a Consumer Reporting Agency (CRA) must reinvestigate consumer disputes within 30 days of receipt, free of charge.

Reinvestigation Process Flow:

text
Candidate submits dispute (via Client Portal)
         ↓
Admin Portal → Dispute appears in Reinvestigation Queue
         ↓
Assign to Reinvestigation Specialist
         ↓
Day 0: Acknowledge receipt → Notify candidate (auto)
         ↓
Day 0-30: Investigation Activities:
  - Contact original data source (court, employer, institution)
  - Request verification documentation
  - Cross-reference with other databases
  - Review original vendor data submission
         ↓
If Verified Accurate:
  → Maintain record, document reasoning
  → Notify candidate of outcome
  → Add "Statement of Dispute" to file if candidate requests
         ↓
If Inaccurate or Unverifiable:
  → Correct or delete the disputed item
  → Regenerate report with corrections
  → Notify client immediately
  → Provide corrected report to client
  → Update adverse action status if applicable
         ↓
Day 30 HARD DEADLINE: Must notify candidate of outcome
9.2 Reinvestigation Management Interface
text
REINVESTIGATION MANAGEMENT

Active Reinvestigations: 7
⚠️ Due within 7 days: 3
🔴 Overdue: 0

COUNTDOWN TIMERS:

┌──────────────────────────────────────────────────────────────────────┐
│ Order #    │ Dispute Section    │ Received  │ Deadline   │ Days Left │
├──────────────────────────────────────────────────────────────────────┤
│ ORD-10101  │ Criminal Record    │ Jan 20    │ Feb 19     │ 1 day 🔴  │
│ ORD-10115  │ Employment Verify  │ Jan 23    │ Feb 22     │ 4 days 🟡 │
│ ORD-10198  │ Education Verify   │ Feb 5     │ Mar 7      │ 17 days 🟢│
│ ORD-10245  │ Identity Info      │ Feb 10    │ Mar 12     │ 22 days 🟢│
└──────────────────────────────────────────────────────────────────────┘

REINVESTIGATION DETAIL: ORD-10101

DISPUTE SUMMARY
Submitted: January 20, 2026
By: Michael Johnson (Candidate)
Section Disputed: Criminal Record — Theft Conviction 2019
Basis: "This record belongs to a different person with the same name"

INVESTIGATION ACTIVITIES LOG:
Jan 20 — Dispute received. Auto-acknowledgment sent to candidate.
Jan 20 — Assigned to: Jennifer Adams (Reinvestigation Specialist)
Jan 21 — Contact request sent to Sterling (original data source)
Jan 23 — Sterling confirmed: Record sourced from Toronto court docket
Jan 25 — Requested certified court record directly
Jan 28 — Certified record received [View Document]
Jan 29 — DOB on court record: Mar 5, 1987
         Applicant DOB: Mar 5, 1988
         → MISMATCH CONFIRMED. Different person.
Jan 30 — Decision: DELETE RECORD (identity confirmed different person)

ACTIONS TAKEN:
☑ Original report corrected (record removed)
☑ Client (Acme Corp) notified Feb 1 — revised report delivered
☑ Adverse action paused pending correction
☑ Statement prepared for candidate

DEADLINE: Feb 19, 2026 at 11:59 PM
TIME REMAINING: 1 day 3 hours ⚠️

TODO:
☐ Send formal outcome letter to candidate (REQUIRED BY TOMORROW)
[Generate Outcome Letter] [Send Now]

OUTCOME: Record Deleted — Basis: Identity Mismatch (Wrong Person)
[Finalize & Close Reinvestigation]
**SECTION 10: AUTOMATED ESCALATION ENGINE **
10.1 Escalation Rules Configuration
Purpose: Automatically escalate orders, SLA issues, vendor problems, and compliance events without manual monitoring.

text
ESCALATION RULES ENGINE

Active Rules: 24
[+ Add Rule]

RULE: SLA Approaching — 24h Warning
Trigger: Order TAT remaining < 24 hours AND status != completed
Action:
  1. Change order priority → HIGH
  2. Notify assigned processor (in-app + email)
  3. Notify operations manager (in-app)
  4. Add "At Risk" badge to order in all views
Delay: None (immediate)
Enabled: ✅

RULE: SLA Breached
Trigger: Order TAT remaining = 0 AND status != completed
Action:
  1. Change order priority → URGENT
  2. Reassign to senior processor if junior is assigned
  3. Notify operations manager (in-app + email + SMS)
  4. Notify client of delay with apology template + new ETA
  5. Create incident ticket
  6. Log SLA breach in compliance record
Delay: None (immediate)
Enabled: ✅

RULE: Vendor API Down > 15 minutes
Trigger: Vendor health check failures > 15 min continuous
Action:
  1. Auto-failover all new orders to secondary vendor
  2. Alert operations manager + account manager via SMS + email
  3. Create vendor incident ticket
  4. Check if any orders currently stuck with that vendor
     → If yes: reassign to alternative vendor
Delay: None (immediate)
Enabled: ✅

RULE: Unresponsive Applicant — Day 5 Reminder
Trigger: Applicant invitation sent > 5 days ago AND portal_completed = FALSE
Action:
  1. Send automated reminder email to applicant
  2. Send SMS reminder (if phone number available)
  3. Notify client that applicant has not responded
Delay: None
Enabled: ✅

RULE: Unresponsive Applicant — Day 10 Final Warning
Trigger: Applicant invitation sent > 10 days AND portal_completed = FALSE
Action:
  1. Send final reminder to applicant
  2. Escalate to client with recommendation to re-send
  3. Flag order for manager attention
Delay: None
Enabled: ✅

RULE: Reinvestigation Approaching 25-Day Mark
Trigger: Open reinvestigation where received_date > 25 days ago
Action:
  1. Alert reinvestigation specialist (urgent)
  2. Alert compliance officer
  3. Create mandatory "5-day countdown" task in system
Delay: None
Enabled: ✅

RULE: Client No Portal Activity — 7 Days
Trigger: Client has 0 logins in past 7 days AND has active orders
Action:
  1. Notify assigned account manager
  2. Create follow-up task for account manager
Delay: None
Enabled: ✅

RULE: QA Queue Depth > 50
Trigger: QA pending queue > 50 items
Action:
  1. Alert operations manager
  2. Suggest reassigning additional staff to QA
  3. Evaluate if any processors can be cross-trained to help
Delay: 30 minutes (wait to see if resolves itself)
Enabled: ✅
Database Table:

sql
CREATE TABLE escalation_rules (
  id CHAR(36) PRIMARY KEY,
  rule_name VARCHAR(255) NOT NULL,
  description TEXT,
  trigger_type VARCHAR(100) NOT NULL,
  -- 'sla_warning', 'sla_breach', 'vendor_offline', 'applicant_unresponsive',
  -- 'reinvestigation_deadline', 'queue_depth', 'client_inactive', etc.
  trigger_conditions JSON NOT NULL,
  actions JSON NOT NULL,
  delay_minutes INT DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_by CHAR(36),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE escalation_events (
  id CHAR(36) PRIMARY KEY,
  rule_id CHAR(36) NOT NULL,
  entity_type VARCHAR(50) NOT NULL, -- 'order', 'vendor', 'client', 'reinvestigation'
  entity_id CHAR(36) NOT NULL,
  triggered_at DATETIME NOT NULL,
  actions_executed JSON,
  resolved_at DATETIME,
  resolved_by CHAR(36),
  resolution_notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (rule_id) REFERENCES escalation_rules(id),
  INDEX idx_entity (entity_type, entity_id),
  INDEX idx_unresolved (resolved_at)
);
SECTION 11: SLA MANAGEMENT MODULE
11.1 SLA Configuration per Client
text
SLA CONFIGURATION

Global Default SLAs:
Standard Package:      5 business days
Healthcare Package:    7 business days
Express Package:       2 business days
International:        14 business days

Client-Specific Overrides:

Acme Corporation (Enterprise):
Standard Package: 3 business days (contractual SLA)
Express Package:  24 hours
Penalty: Credit of $50 per day overdue

HealthCare Ltd (Standard):
All Packages: Standard default
No penalty clause

[+ Add Client SLA Override]
Database:

sql
CREATE TABLE sla_configurations (
  id CHAR(36) PRIMARY KEY,
  client_id CHAR(36),    -- NULL = global default
  package_id CHAR(36),   -- NULL = all packages
  sla_type VARCHAR(50) DEFAULT 'business_days',
  -- 'business_days', 'calendar_days', 'hours'
  value INT NOT NULL,
  warning_threshold_percent INT DEFAULT 75,
  -- Send warning when X% of SLA elapsed
  breach_penalty_amount DECIMAL(10,2) DEFAULT 0.00,
  breach_penalty_type VARCHAR(50) DEFAULT 'none',
  -- 'none', 'credit', 'discount_next_invoice', 'flat_fee_deduction'
  is_active BOOLEAN DEFAULT TRUE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (client_id) REFERENCES chexpro_portal_db.clients(id),
  FOREIGN KEY (package_id) REFERENCES chexpro_portal_db.packages(id)
);
11.2 SLA Monitoring Dashboard
text
SLA PERFORMANCE MONITOR

Date Range: [Last 7 Days ▼]   Client: [All Clients ▼]

SUMMARY:
Total Orders: 312
On-Time: 288 (92.3%)  🟢
At Risk: 12 (3.8%)    🟡
Breached: 12 (3.8%)   🔴
Avg TAT: 4.2 days     (Target: 5.0 days — beating SLA)

[SLA Performance Trend — Line chart over 30 days]

BREACH ANALYSIS (Last 7 Days):

By Reason:
- Vendor delayed: 6 (50%)
- Unresponsive applicant: 3 (25%)
- Internal processing delay: 2 (17%)
- Awaiting client response: 1 (8%)

By Processor:
- John Smith: 4 breaches (requires coaching)
- Mary Chen: 2 breaches
- System (unassigned orders): 6 breaches

AT RISK ORDERS (12):
ORD-10389 — Acme Corp — 3h 12m remaining — [Expedite]
ORD-10401 — TechStart — 5h 45m remaining — [Expedite]
[View All 12]

BREACHED ORDERS (12):
All 12 have been auto-escalated.
Client notifications sent: 10/12
Pending manual apology: 2
[View Breached Orders]

PENALTY TRACKING:
Acme Corp — 4 breaches × $50/day = $200 credit applied
[Review Penalties] [Apply Credits to Invoices]
SECTION 12: FINANCIAL RECONCILIATION & BILLING
12.1 Revenue Dashboard
text
REVENUE OVERVIEW

Period: February 2026 (MTD)

REVENUE SUMMARY:
Total Invoiced:       $48,234.00
Total Collected:      $41,890.00
Outstanding (A/R):    $6,344.00
  - Current:          $4,234.00
  - Overdue 1-30d:    $1,560.00
  - Overdue 30+d:     $550.00  ⚠️

Vendor Costs (MTD):   $22,315.00
Gross Margin:         $25,919.00 (53.7%)
Margin Target:        50%+  ✅

[Revenue Trend Chart - Monthly]

BY CLIENT (Top 5):
1. Acme Corp      $8,423 (12 orders, $702/order avg)
2. Finance Group  $7,891 (11 orders, $717/order avg)
3. TechStart      $6,234 (9 orders)
4. HealthCare Ltd $5,890 (8 orders)
5. BuildCo Inc    $4,123 (6 orders)

[Export Revenue Report] [View Full A/R Aging]
12.2 Order-Level Profitability Tracker
sql
CREATE TABLE order_financials (
  id CHAR(36) PRIMARY KEY,
  order_id CHAR(36) NOT NULL UNIQUE,
  client_id CHAR(36) NOT NULL,
  
  -- Revenue side (what client pays)
  billed_amount DECIMAL(10,2) NOT NULL,
  discount_applied DECIMAL(10,2) DEFAULT 0.00,
  sla_penalty_credit DECIMAL(10,2) DEFAULT 0.00,
  net_revenue DECIMAL(10,2) GENERATED ALWAYS AS 
    (billed_amount - discount_applied - sla_penalty_credit) STORED,
  
  -- Cost side (what vendors charge us)
  vendor_cost DECIMAL(10,2) DEFAULT 0.00,
  internal_labor_cost DECIMAL(10,2) DEFAULT 0.00,
  -- Calculated from staff time tracking if enabled
  
  -- Profitability
  gross_profit DECIMAL(10,2) GENERATED ALWAYS AS 
    (net_revenue - vendor_cost) STORED,
  gross_margin_pct DECIMAL(5,2) GENERATED ALWAYS AS 
    ((net_revenue - vendor_cost) / net_revenue * 100) STORED,
  
  invoice_id CHAR(36),
  payment_status VARCHAR(50) DEFAULT 'pending',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (order_id) REFERENCES chexpro_portal_db.orders(id),
  INDEX idx_client (client_id),
  INDEX idx_created (created_at)
);
**SECTION 13: CAPACITY PLANNING & WORKLOAD MANAGEMENT **
13.1 Team Capacity Dashboard
Purpose: Prevent processor burnout and SLA breaches by monitoring workloads and forecasting demand.

text
TEAM CAPACITY OVERVIEW

Today — Feb 18, 2026 | Wednesday

[Capacity Utilization Bar Chart per Person]

PROCESSORS:
┌─────────────────────────────────────────────────────────────────────┐
│ Name          │ Capacity │ Assigned │ Utilization │ Status         │
├─────────────────────────────────────────────────────────────────────┤
│ John Smith    │ 20/day   │ 23       │ ████████░ 115% │ Overloaded 🔴│
│ Mary Chen     │ 20/day   │ 18       │ ███████░░  90% │ Near Full 🟡 │
│ Lisa Park     │ 20/day   │ 14       │ █████░░░░  70% │ Available 🟢 │
│ Tom Richards  │ 20/day   │ 8        │ ███░░░░░░  40% │ Free 🟢      │
│ Sarah Kim     │ 15/day   │ 15       │ ████████░ 100% │ Full 🟡      │
└─────────────────────────────────────────────────────────────────────┘

ACTIONS:
[Redistribute John Smith's overload → Lisa Park & Tom Richards]
[View Individual Queues]

INCOMING ORDER FORECAST (Next 7 Days):
Based on: Historical patterns, client order trends, day of week

Thu Feb 19: ~28 orders expected  (Total capacity: 75)
Fri Feb 20: ~31 orders expected
Sat Feb 21: ~5 orders expected   (Reduced staff)
Mon Feb 23: ~45 orders expected  (Monday spike) ⚠️ Near capacity
Tue Feb 24: ~38 orders expected
Wed Feb 25: ~35 orders expected
Thu Feb 26: ~32 orders expected

Monday Feb 23 may require overtime or temporary reallocation of QA staff.
[Plan Coverage] [Request Overtime Approval] [Notify Manager]
Database:

sql
CREATE TABLE staff_capacity (
  id CHAR(36) PRIMARY KEY,
  admin_user_id CHAR(36) NOT NULL,
  date DATE NOT NULL,
  max_capacity INT DEFAULT 20,
  is_available BOOLEAN DEFAULT TRUE,
  unavailability_reason VARCHAR(100),
  -- 'vacation', 'sick', 'training', 'other'
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_user_date (admin_user_id, date)
);

CREATE TABLE staff_assignments (
  id CHAR(36) PRIMARY KEY,
  order_id CHAR(36) NOT NULL,
  admin_user_id CHAR(36) NOT NULL,
  assigned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  assigned_by CHAR(36),
  unassigned_at DATETIME,
  unassigned_reason VARCHAR(100),
  is_current BOOLEAN DEFAULT TRUE,
  INDEX idx_user (admin_user_id),
  INDEX idx_order (order_id),
  INDEX idx_current (is_current)
);
13.2 Demand Forecasting
javascript
// Weekly demand forecast using rolling 8-week average
async function forecastOrderVolume(daysAhead) {
  const forecasts = [];

  for (let i = 1; i <= daysAhead; i++) {
    const targetDate = addDays(new Date(), i);
    const dayOfWeek = targetDate.getDay(); // 0=Sun, 1=Mon...

    // Get historical averages for same day of week
    const historicalData = await getOrderVolumeByDayOfWeek(dayOfWeek, 8); // 8 weeks
    const avgVolume = mean(historicalData);

    // Apply growth trend (month-over-month growth rate)
    const growthFactor = await getGrowthTrend();
    const forecast = Math.round(avgVolume * growthFactor);

    // Compare with available capacity
    const availableCapacity = await getTeamCapacityForDate(targetDate);
    const isAtRisk = forecast > availableCapacity * 0.90;

    forecasts.push({
      date: targetDate,
      forecastedVolume: forecast,
      availableCapacity,
      utilizationPercent: (forecast / availableCapacity) * 100,
      isAtRisk,
      recommendation: isAtRisk ? 'Consider overtime or cross-training QA staff' : null
    });
  }

  return forecasts;
}
**SECTION 14: FRAUD DETECTION & IDENTITY VERIFICATION **
14.1 Fraud Detection Engine
Purpose: Identify potentially fraudulent orders, fake documents, and identity mismatches before processing.
​

Fraud Risk Signals:

sql
CREATE TABLE fraud_signals (
  id CHAR(36) PRIMARY KEY,
  order_id CHAR(36) NOT NULL,
  signal_type VARCHAR(100) NOT NULL,
  -- 'duplicate_identity', 'mismatched_dob', 'suspicious_address',
  -- 'document_tampering', 'high_risk_jurisdiction', 'unusual_pattern',
  -- 'multiple_names_same_sin', 'rush_order_new_client'
  severity VARCHAR(20) NOT NULL, -- 'low', 'medium', 'high', 'critical'
  description TEXT,
  detected_by VARCHAR(50) NOT NULL, -- 'system_auto', 'processor_manual', 'vendor'
  is_resolved BOOLEAN DEFAULT FALSE,
  resolution VARCHAR(100),
  -- 'false_positive', 'confirmed_fraud', 'escalated_to_compliance', 'dismissed'
  resolved_by CHAR(36),
  resolved_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES chexpro_portal_db.orders(id),
  INDEX idx_order (order_id),
  INDEX idx_unresolved (is_resolved)
);
Automated Fraud Detection Rules:

javascript
const fraudRules = [
  {
    name: 'Duplicate SIN/SSN',
    check: async (order) => {
      const count = await countOrdersByEncryptedSIN(order.applicant.sin);
      return count > 1 ? {
        signal: 'duplicate_identity',
        severity: 'high',
        description: `SIN/SSN appears in ${count} orders`
      } : null;
    }
  },
  {
    name: 'DOB Mismatch Across Documents',
    check: async (order) => {
      const dobFromID = order.applicant.extractedDOBFromID;
      const dobFromForm = order.applicant.dateOfBirth;
      if (dobFromID && dobFromForm && dobFromID !== dobFromForm) {
        return {
          signal: 'mismatched_dob',
          severity: 'high',
          description: `Form DOB: ${dobFromForm} vs ID DOB: ${dobFromID}`
        };
      }
      return null;
    }
  },
  {
    name: 'Suspicious Address History',
    check: async (order) => {
      // Check for too-short address residency (<30 days) pattern
      const suspiciousAddresses = order.applicant.addressHistory.filter(
        addr => addr.duration_days < 30
      );
      if (suspiciousAddresses.length > 2) {
        return {
          signal: 'suspicious_address',
          severity: 'medium',
          description: `${suspiciousAddresses.length} addresses with <30 day residency`
        };
      }
      return null;
    }
  },
  {
    name: 'High-Volume New Client',
    check: async (order) => {
      const client = await getClient(order.clientId);
      const daysSinceActivation = daysBetween(client.activated_at, new Date());
      const ordersThisWeek = await countOrdersThisWeek(order.clientId);
      if (daysSinceActivation < 30 && ordersThisWeek > 50) {
        return {
          signal: 'rush_order_new_client',
          severity: 'medium',
          description: `New client (<30 days) submitted ${ordersThisWeek} orders this week`
        };
      }
      return null;
    }
  }
];
Fraud Alert Interface:

text
FRAUD DETECTION ALERTS

Open Alerts: 4
Critical: 1 | High: 2 | Medium: 1

CRITICAL: ORD-10501 — Duplicate Identity
Severity: Critical
Signal: SIN *** ** **** appears in 3 different orders under
        2 different names (John Smith & Jonathan Smith)
Detected: Feb 18, 2026 at 2:15 PM (Automated)

Action Required:
- Hold all 3 orders immediately
- Notify compliance officer
- Investigate identity before any processing

[Hold All Related Orders] [Notify Compliance] [Investigate]

HIGH: ORD-10489 — DOB Mismatch
Signal: Form DOB differs from ID scan (1989 vs 1988)
[View Details] [Dismiss (False Positive)] [Investigate]

[View All Fraud Alerts] [Configure Rules]
**SECTION 15: STAFF KNOWLEDGE BASE & SOPs **
15.1 Knowledge Base Overview
Purpose: Centralized repository for all standard operating procedures, training materials, compliance guidelines, and how-to guides. Ensures consistent processing regardless of which team member handles an order.

15.2 Knowledge Base Interface
text
CHEXPRO KNOWLEDGE BASE

Search: [How do I handle an unverifiable employer  🔍]

RESULTS (3 found):

📄 SOP-EMP-003: Unverifiable Employer Procedures
   Last Updated: Jan 15, 2026 | Views: 234 | ★ Highly Rated
   
   Summary: Step-by-step guide for handling employers that cannot 
   be reached, have closed, or refuse to provide information.
   
   [View Article]

📄 SOP-EMP-007: Employer Out of Business Procedures  
   Last Updated: Nov 5, 2025 | Views: 89

📄 COMPLIANCE-012: FCRA Requirements for Unverifiable Information
   Last Updated: Dec 1, 2025 | Views: 45

CATEGORIES:

📁 Order Processing (45 articles)
  ├── Criminal Record Checks (12)
  ├── Employment Verification (15)
  ├── Education Verification (8)
  ├── Professional Licenses (6)
  └── International Checks (4)

📁 Quality Assurance (18 articles)
  ├── QA Checklist Guides (8)
  ├── Common Errors & Fixes (7)
  └── Calibration Procedures (3)

📁 Adjudication (22 articles)
  ├── Decision Guidelines by Industry (10)
  ├── FCRA Compliance (6)
  └── Adverse Action Procedures (6)

📁 Compliance & Legal (31 articles)
  ├── FCRA Requirements (10)
  ├── PIPEDA (Canada) (8)
  ├── Ban-the-Box Laws (7)
  └── Jurisdiction Reference (6)

📁 Vendor Operations (14 articles)
📁 Client Management (19 articles)
📁 System How-Tos (28 articles)
📁 Onboarding for New Staff (12 articles)

[+ Write New Article] [Manage Categories] [Analytics]
15.3 Article View & Editor
text
SOP-EMP-003: Unverifiable Employer Procedures
Last Updated: Jan 15, 2026 | Written by: Sarah Johnson (Ops Manager)
Reviewed by: Compliance Officer | Status: ✅ Approved

TABLE OF CONTENTS
1. When does this SOP apply?
2. Step 1: Determine "Unverifiable" classification
3. Step 2: Document all contact attempts
4. Step 3: Alternative verification methods
5. Step 4: Report handling for unverified items
6. Step 5: Client notification
7. Related compliance requirements

─────────────────────────────────────────────────────

1. WHEN DOES THIS SOP APPLY?
This procedure applies when an employment reference cannot be 
verified after reasonable attempts due to: company closure, 
refusal to provide information, no response after 3 attempts, 
or inability to locate the employer.

2. STEP 1: CLASSIFY AS "UNVERIFIABLE"
Mark as unverifiable ONLY after:
☑ Minimum 3 contact attempts (phone and email)
☑ Attempts made on 3 separate days
☑ Attempted contact with at least 2 different contacts/numbers
☑ Documented each attempt in the order notes

3. STEP 2: DOCUMENT ALL ATTEMPTS
In the order processing notes, log each attempt:
Format: "DATE - METHOD - CONTACT - OUTCOME"
Example: "Feb 18, 2026 - Phone - HR@techcorp.com - No answer. Voicemail left."

4. STEP 3: TRY ALTERNATIVE METHODS
Before marking unverifiable, attempt:
a) LinkedIn profile cross-reference
b) State/Provincial company registry (confirm company existed)
c) Internet archive for company information
d) Professional reference site (LinkedIn recommendations)
e) Applicant's W-2 or pay stubs (request from applicant)

5. STEP 4: REPORT NOTATION
In the report, write:
"Unable to Verify — [Employer Name]
Verification was attempted on [dates] via [methods]. 
[Employer Name] did not respond to/refused verification requests
Chexpro.com Admin Operations Portal - Technical Specification Document
Internal Team Management & Quality Assurance System
Version: 1.0
Date: February 18, 2026
Document Type: Internal Operations Portal Specification
Related Documents: Client Portal Specification v2.0, System Runbook v3.1

EXECUTIVE SUMMARY
This document specifies the Admin Operations Portal - the internal management system used by Chexpro staff to process background check orders, manage client relationships, ensure quality assurance, route checks to vendors, and maintain operational excellence.

Purpose: Enable the internal operations team to efficiently manage the entire background check lifecycle from order receipt through report delivery while maintaining compliance, quality standards, and SLA commitments.

Key Stakeholders:

Operations Manager

Background Check Processors/Researchers

Quality Assurance Team

Client Success Managers

Credentialing Specialists

Compliance Officer

IT/System Administrators

Portal Objectives:

Centralized Order Management - Single dashboard for all order processing activities

Quality Assurance - Built-in QA workflows and review processes

Client Credentialing - Onboarding, configuration, and account management

Vendor Routing - Intelligent routing to background check vendors

SLA Monitoring - Real-time tracking of turnaround times and service commitments

Compliance Management - FCRA, PIPEDA, and regulatory adherence

Team Performance - Productivity tracking and workload distribution

Report Generation - Internal reports creation and review before client delivery

TABLE OF CONTENTS
System Architecture & Access

Dashboard & Operational Metrics

Order Processing Workflow

Client Credentialing & Onboarding

Vendor Management & Routing

Quality Assurance Module

Adjudication Review System

Report Generation & Delivery

Compliance & Audit Tools

Team Management & Assignment

SLA Monitoring & Alerting

Document Management

Communication Center

Analytics & Reporting

System Administration

Integration Architecture

Database Schema

API Specifications

Security & Access Control

Deployment on OCI

SECTION 1: SYSTEM ARCHITECTURE & ACCESS
1.1 Portal Access Structure
URL: https://admin.chexpro.com

Authentication:

Separate from client portal (admin.chexpro.com vs portal.chexpro.com)

Enhanced security: 2FA mandatory for all admin users

IP whitelist for office locations (optional)

Session timeout: 15 minutes idle (more strict than client portal)

SSO integration with Microsoft 365/Google Workspace

1.2 User Roles & Permissions
Super Administrator
Full system access

User management (create/edit/delete admin accounts)

System configuration

Client credentialing approval

Financial settings

Audit log access

Operations Manager
View all orders across all clients

Reassign orders between team members

Override SLA settings

Approve exceptions

Access to all reports and analytics

Cannot modify system settings or user accounts

Background Check Processor/Researcher
View and process assigned orders

Upload verification documents

Update order status

Request information from applicants

Submit orders to vendors

Cannot access billing or client configuration

Quality Assurance Specialist
Review completed reports before delivery

Approve or reject reports

Send back for corrections

Access QA metrics and performance data

Cannot process orders directly

Client Success Manager
View all orders for assigned clients

Manage client settings (packages, pricing, branding)

Access client communication history

Cannot process orders or modify system settings

Credentialing Specialist
Onboard new clients

Configure client accounts

Set up packages and pricing

Manage compliance requirements per client

Cannot access order processing

Compliance Officer
View all compliance-related activities

Audit trail access

Adverse action monitoring

Dispute resolution oversight

Generate compliance reports

Read-only access to orders

1.3 Architecture Overview
Technology Stack:

Frontend: React + TypeScript (same as client portal for consistency)

Backend: Node.js/Express (shared API with client portal, different routes)

Database: Same OCI MySQL instance, separate schema chexpro_admin_db

Real-time: Socket.io for live order updates

File Storage: OCI Object Storage

Queue: Redis/Bull for background jobs

Deployment:

Subdomain: admin.chexpro.com

Hosted on existing chexpro-main-server

Nginx reverse proxy configuration

Separate PM2 process from client portal

SECTION 2: DASHBOARD & OPERATIONAL METRICS
2.1 Main Dashboard Layout
Top Navigation:

Orders (main section)

Clients

Vendors

Quality Assurance

Reports

Team

Settings

Dashboard Widgets (Configurable per role):

Orders Overview Widget
text
┌─────────────────────────────────────────┐
│ ORDERS OVERVIEW - Today                 │
├─────────────────────────────────────────┤
│ New Orders:           24  [View All]    │
│ In Progress:          156               │
│ Pending QA:           31                │
│ Requires Action:      8   [!]           │
│ Completed Today:      43                │
│                                         │
│ [Breakdown by Status Chart]             │
└─────────────────────────────────────────┘
SLA Status Widget
text
┌─────────────────────────────────────────┐
│ SLA PERFORMANCE - Last 7 Days           │
├─────────────────────────────────────────┤
│ On-Time Delivery:     92.4%  ✓         │
│ At Risk (24h):        12 orders  [!]    │
│ Breached:             3 orders   [!!]   │
│                                         │
│ Average TAT:          4.2 days          │
│ Target TAT:           5.0 days          │
│                                         │
│ [TAT Trend Line Chart]                  │
└─────────────────────────────────────────┘
My Workload Widget (for Processors)
text
┌─────────────────────────────────────────┐
│ MY ASSIGNED ORDERS                      │
├─────────────────────────────────────────┤
│ Total Assigned:       23                │
│ Due Today:            5    [View]       │
│ Overdue:              2    [URGENT]     │
│                                         │
│ Next Up:                                │
│ • ORD-2024-12345 - Criminal Check      │
│   Due: 2:00 PM (4h remaining)          │
│                                         │
│ • ORD-2024-12346 - Employment Verify   │
│   Due: Tomorrow 9:00 AM                │
└─────────────────────────────────────────┘
Quality Metrics Widget (for QA Team)
text
┌─────────────────────────────────────────┐
│ QA METRICS - This Week                  │
├─────────────────────────────────────────┤
│ Reports Reviewed:     156               │
│ First-Time Pass:      89.1%             │
│ Returned for Fix:     17                │
│ Average Review Time:  12 min            │
│                                         │
│ Pending QA Review:    31   [View Queue]│
└─────────────────────────────────────────┘
Client Activity Widget
text
┌─────────────────────────────────────────┐
│ CLIENT ACTIVITY - Today                 │
├─────────────────────────────────────────┤
│ Active Clients:       47                │
│ New Orders:           24                │
│                                         │
│ Top Clients Today:                      │
│ 1. Acme Corp          8 orders          │
│ 2. TechStart Inc      5 orders          │
│ 3. HealthCare Ltd     4 orders          │
│                                         │
│ [Order Volume by Client Chart]          │
└─────────────────────────────────────────┘
Vendor Performance Widget
text
┌─────────────────────────────────────────┐
│ VENDOR PERFORMANCE - Last 30 Days       │
├─────────────────────────────────────────┤
│ Sterling:             Avg 3.2d  ★★★★☆  │
│ First Advantage:      Avg 4.5d  ★★★☆☆  │
│ Certn:                Avg 2.1d  ★★★★★  │
│                                         │
│ Total Orders Sent:    543               │
│ Pending from Vendors: 89                │
└─────────────────────────────────────────┘
Alerts & Notifications Widget
text
┌─────────────────────────────────────────┐
│ ALERTS & NOTIFICATIONS                  │
├─────────────────────────────────────────┤
│ [!!] 3 orders breached SLA              │
│ [!]  12 orders at risk (< 24h)          │
│ [!]  5 adverse actions in waiting period│
│ [i]  2 disputes submitted by candidates │
│ [i]  New client pending approval        │
│                                         │
│ [View All Alerts]                       │
└─────────────────────────────────────────┘
2.2 Dashboard Features
Real-Time Updates:

WebSocket connection updates metrics every 30 seconds

Visual/audio alerts for urgent items

Browser notifications for critical events

Customization:

Drag-and-drop widget arrangement

Show/hide widgets based on role

Save custom dashboard layouts per user

Quick Actions:

Floating action button for common tasks:

Process Next Order

Create Manual Order

Add Client Note

Upload Document

SECTION 3: ORDER PROCESSING WORKFLOW
3.1 Order Queue Management
Orders List View
Filter Options:

Status (New, In Progress, Pending Info, With Vendor, QA Review, Complete, etc.)

Client (dropdown with search)

Date Range

Assigned To (team member)

SLA Status (On-time, At Risk, Breached)

Order Type (Pre-employment, Volunteer, Tenant, etc.)

Priority (Urgent, Standard, Low)

Sort Options:

Due Date (ascending/descending)

Created Date

Client Name

Order Number

Turnaround Time Remaining

Table Columns:

Order # (clickable to detail view)

Client Name

Applicant Name

Package Type

Status (color-coded badge)

Assigned To

Created Date

Due Date

SLA Status (progress bar: Green/Yellow/Red)

Actions (Quick buttons: View, Assign, Update Status)

Bulk Actions:

Select multiple orders (checkbox)

Bulk assign to team member

Bulk status update

Bulk export

Bulk send to vendor

Order Status Flow
text
NEW → ASSIGNED → IN_PROGRESS → VENDOR_SUBMITTED → RESULTS_RECEIVED → 
QA_REVIEW → QA_APPROVED → REPORT_GENERATED → DELIVERED → COMPLETED

Side flows:
- PENDING_INFO (waiting for applicant)
- ON_HOLD (client request)
- REQUIRES_REVIEW (adjudication needed)
- DISPUTED (candidate dispute)
- CANCELLED
3.2 Order Detail View
Left Panel: Order Information

text
Order #: CHX-2026-02-18-00245
Client: Acme Corporation
Status: In Progress [Change Status ▼]
Assigned To: John Smith [Reassign]
Priority: Standard [Change ▼]

Package: Standard Employment Package
- Criminal Record Check (Federal)
- Employment Verification (2 employers)
- Education Verification (1 degree)

Created: Feb 18, 2026 10:45 AM
Due Date: Feb 23, 2026 11:59 PM
Time Remaining: 4d 13h 14m
SLA Status: On Track (35% elapsed) [━━━━━━━━━━░░░░░░░░]
Center Panel: Applicant Information

text
APPLICANT DETAILS
Full Name: Jane Elizabeth Doe
DOB: May 15, 1990 (35 years)
Email: jane.doe@email.com
Phone: +1 (555) 123-4567

Current Address:
123 Main Street, Apt 4B
Toronto, ON M5H 2N2
Canada
Residence: 2 years

Previous Addresses: [View 3 addresses]

[View Full Applicant Profile] [Edit Information]
Center Panel: Service Status Checklist

text
SERVICE BREAKDOWN

✓ Criminal Record Check - Federal
  Status: Complete
  Vendor: Sterling
  Result: Clear
  Completed: Feb 19, 2026 2:15 PM
  [View Report]

🔄 Employment Verification #1
  Status: In Progress
  Employer: Tech Corp Inc (2020-2024)
  Contact: HR Department
  Last Updated: Feb 18, 2026 4:30 PM
  [Update] [Upload Docs] [Mark Complete]

⏳ Employment Verification #2
  Status: Pending
  Employer: StartUp LLC (2018-2020)
  Contact: Not reached yet
  [Start Verification] [Upload Docs]

📋 Education Verification
  Status: Awaiting Documents
  Institution: University of Toronto
  Degree: Bachelor of Science
  [Request Transcript] [Upload Docs] [Mark Complete]
Right Panel: Actions & History

Quick Actions:

text
[Update Status]
[Assign to Me]
[Request Info from Applicant]
[Upload Document]
[Send to Vendor]
[Generate Report]
[Add Note]
[Send Message to Client]
Timeline/Activity Log:

text
ACTIVITY TIMELINE

Feb 19, 2026 2:15 PM
✓ Criminal check completed - Clear
  By: System (Sterling API)

Feb 19, 2026 10:30 AM
📧 Reminder sent to employment contact
  By: John Smith

Feb 18, 2026 3:45 PM
📄 Reference letter uploaded
  By: Jane Doe (Applicant)

Feb 18, 2026 11:20 AM
👤 Order assigned to John Smith
  By: Sarah Johnson (Manager)

Feb 18, 2026 10:45 AM
🆕 Order created
  By: Client Portal API

[Load More]
Internal Notes Section:

text
INTERNAL NOTES (Not visible to client)

[Add Note]

Feb 19, 2026 11:00 AM - John Smith
Called HR at Tech Corp, they need 48h to respond.
Set reminder for Feb 21.

Feb 18, 2026 2:00 PM - Sarah Johnson
Client requested expedited processing. 
Priority changed to High.
Documents Section:

text
DOCUMENTS (15)

Consent Forms:
✓ FCRA Disclosure & Authorization
✓ Applicant Consent Form

Identification:
📄 Driver's License (Front) - Verified ✓
📄 Driver's License (Back) - Verified ✓

Supporting Documents:
📄 Reference Letter - Tech Corp.pdf
📄 University Transcript.pdf
📄 Proof of Address - Utility Bill.pdf

Vendor Reports:
📄 Sterling Criminal Report.pdf

[Upload Document] [Request from Applicant]
3.3 Order Processing Actions
Update Order Status
Modal with dropdown of available statuses and required fields:

New Status: [Dropdown]

Reason for Change: [Text area - required for certain transitions]

Notify Client: [Checkbox - auto-checked for major status changes]

Internal Notes: [Text area - optional]

Request Information from Applicant
Template-based email sender:

Template: [Dropdown - pre-written templates]

Missing Documents

Address History Clarification

Employment Dates Verification

Additional Consent Required

Customize Message: [Rich text editor]

Set Reminder: [Date picker - follow up if no response]

Priority: [Normal / Urgent]

Upload Document
Document Type: [Dropdown - Criminal Report, Employment Letter, etc.]

Associated Service: [Dropdown - link to specific service]

File Upload: Drag & drop or browse

Notes: [Optional description]

Mark as Verified: [Checkbox]

Send to Vendor
Vendor routing interface:

Service Type: [Auto-detected from order]

Select Vendor: [Dropdown - based on client preferences + availability]

Package Mapping: [Map Chexpro package to vendor package]

Review Data: [Show data being sent - editable]

Estimated TAT: [Show vendor's typical turnaround]

[Send Now] [Schedule for Later]

Mark Service Complete
Service: [Dropdown - list of incomplete services]

Result: [Clear / Review Required / Unable to Verify]

Upload Supporting Document: [File upload]

Notes: [Text area - explain findings]

[Mark Complete]

3.4 Bulk Order Processing
Batch Upload Interface:

text
BULK ORDER CREATION

Step 1: Upload CSV
[Drag CSV file here or click to browse]

Download Template: [CSV Template]

Step 2: Map Columns
Client:                [Column A ▼]
Applicant First Name:  [Column B ▼]
Applicant Last Name:   [Column C ▼]
Email:                 [Column D ▼]
...

Step 3: Validate Data
✓ 145 rows processed
✓ 142 valid orders
⚠ 3 errors found [View Errors]

Step 4: Review & Submit
Total Orders: 142
Total Cost: $12,780.00
[Submit Batch] [Cancel]
SECTION 4: CLIENT CREDENTIALING & ONBOARDING
**4.1 Client Credentialing Overview **
Purpose: Client credentialing is the process of vetting, approving, and configuring new client accounts before they can use the Chexpro platform.

Credentialing Steps:

Initial Application Review

Business Verification

Compliance Documentation

Contract Execution

System Configuration

User Setup

Training & Go-Live

4.2 Prospective Client Dashboard
List View:

Prospective Client Name

Contact Person

Email / Phone

Application Date

Status (New, Under Review, Pending Docs, Approved, Rejected)

Assigned To (Credentialing Specialist)

Actions (View, Approve, Reject)

Status Filters:

New Applications

Under Review

Pending Documentation

Approved (not yet activated)

Rejected

All

4.3 Client Credentialing Workflow
Step 1: Initial Application Review
Application Details Screen:

text
PROSPECT INFORMATION

Company Name: Acme Corporation
Legal Name: Acme Corp Ltd.
Industry: Technology / Software Development
Company Size: 200-500 employees
Website: www.acmecorp.com

Primary Contact:
Name: Sarah Johnson
Title: HR Director
Email: sarah.johnson@acmecorp.com
Phone: +1 (555) 987-6543

Billing Address:
456 Business Park Drive
Toronto, ON M1P 2B3
Canada

Expected Volume:
Monthly Orders: 50-100
Annual Budget: $50,000 - $100,000

Background Check Requirements:
☑ Criminal Record Checks
☑ Employment Verification
☑ Education Verification
☐ Credit Checks
☐ Driving Records

Source: Marketing Website Form
Application Date: Feb 18, 2026
Assigned To: [Dropdown - Credentialing Specialist]

[Request More Information]
[Schedule Call]
[Move to Next Step]
[Reject Application]
Step 2: Business Verification
Verification Checklist:

text
BUSINESS VERIFICATION

☑ Company Registration Number: 123456789
  Verified via: Corporations Canada
  Date: Feb 18, 2026

☑ Business License:
  License #: BL-2024-456789
  Expiry: Dec 31, 2026
  [View Document]

☑ Insurance (E&O):
  Provider: ABC Insurance
  Policy #: POL-9876543
  Coverage: $2,000,000
  Expiry: Mar 31, 2027
  [View Certificate]

☐ References:
  Request sent: Feb 18, 2026
  Status: Pending response
  [Send Reminder] [Add Reference]

☐ Credit Check:
  [Run Credit Check via D&B]

VERIFICATION STATUS: In Progress (3/5 complete)

[Mark All Complete] [Request Documents]
Step 3: Compliance Documentation
Compliance Checklist:

text
COMPLIANCE DOCUMENTS

☑ FCRA End-User Certification
  Signed: Feb 19, 2026
  [View Document]

☑ Business Associate Agreement (BAA)
  (Required for healthcare clients)
  Signed: Feb 19, 2026
  [View Document]

☑ Data Processing Agreement (DPA)
  For GDPR compliance
  Signed: Feb 19, 2026
  [View Document]

☐ Service Agreement
  Status: Sent to client for signature
  Sent: Feb 18, 2026
  [View Agreement] [Resend]

☐ Pricing Schedule
  Status: Pending approval
  [Upload Signed Schedule]

COMPLIANCE STATUS: In Progress (3/5 complete)

[Upload Document] [Generate Agreement] [Mark Complete]
Step 4: Contract Execution
Contract Management:

text
CONTRACT DETAILS

Master Service Agreement:
Status: ✓ Signed by both parties
Effective Date: Feb 20, 2026
Contract Term: 2 years (auto-renew)
Termination Notice: 30 days

Pricing Agreement:
Type: Volume-based tiered pricing
Tier 1 (1-50/mo): $89 per check
Tier 2 (51-100/mo): $79 per check
Tier 3 (100+/mo): $69 per check

Payment Terms: NET 30
Invoicing: Monthly

Special Terms:
- 24-hour turnaround SLA guarantee
- Dedicated account manager
- Custom API integration support

[View Full Contract]
[Upload Signed Contract]
[Generate Amendment]
Step 5: System Configuration
Client Configuration Wizard:

Page 1: Basic Settings

text
BASIC CONFIGURATION

Account ID: (Auto-generated: CLI-20260218-001)
Company Name: Acme Corporation
Display Name: Acme Corp

Account Status:
◉ Active
○ Inactive
○ Suspended

Account Type:
○ Trial (30 days)
◉ Paid
○ Enterprise

Primary Contact:
Name: Sarah Johnson
Email: sarah.johnson@acmecorp.com
Phone: +1 (555) 987-6543

[Next: Packages & Services]
Page 2: Package Configuration

text
PACKAGES & SERVICES

Pre-Configured Packages:

[+ Create Custom Package]

Package 1: Standard Employment Screening
Services:
☑ Criminal Record Check (Federal)
☑ Employment Verification (2 employers)
☑ Education Verification (1 degree)
Price: $89.00
Est. TAT: 5 business days
[Edit] [Duplicate] [Delete]

Package 2: Healthcare Professional
Services:
☑ Criminal Record Check (Federal + Provincial)
☑ Employment Verification (3 employers)
☑ Education Verification (2 degrees)
☑ Professional License Verification
☑ Reference Checks (3 references)
Price: $149.00
Est. TAT: 7 business days
[Edit] [Duplicate] [Delete]

À La Carte Services:
(Available for custom orders)
☑ Criminal Record Check - $35
☑ Employment Verification - $25 each
☑ Education Verification - $30 each
☑ Credit Check - $25
☑ Driving Record - $20
☑ Professional License - $35

[Next: Branding & Customization]
Page 3: Branding

text
BRANDING & CUSTOMIZATION

Client Portal Branding:
Logo: [Upload Logo] (Max 500KB, PNG/JPG)
Primary Color: [#3B82F6] (Color picker)
Secondary Color: [#1E40AF] (Color picker)

Custom Domain: (Optional)
○ Use default: portal.chexpro.com/acme
◉ Custom subdomain: acme.chexpro.com
○ Full custom domain: checks.acmecorp.com

Email Branding:
Header Image: [Upload] (Optional)
Footer Text: "Acme Corp - Confidential"
Custom Message: [Text area]

White-Label Options: (Enterprise only)
☐ Remove Chexpro branding
☐ Custom terms & privacy policy links
☐ Custom support email

Preview: [Show Preview]

[Next: Compliance Settings]
Page 4: Compliance & Rules

text
COMPLIANCE CONFIGURATION

Geographic Location:
Primary Location: Canada - Ontario
Additional Locations: [+ Add Location]
  - Canada - British Columbia
  - USA - California

Compliance Rules:
☑ Apply ban-the-box restrictions (where applicable)
☑ Follow 7-year reporting limit (FCRA)
☑ Enable adverse action workflow
☑ Require e-signature for consents

Adjudication Matrix:
◉ Use Chexpro default matrix
○ Use custom matrix [Configure]

Data Retention:
Application Data: 7 years (regulatory requirement)
Background Reports: 7 years
Documents: 7 years
Audit Logs: 10 years

[Next: Integrations]
Page 5: Integrations

text
INTEGRATIONS

API Access:
☑ Enable API access
Environment: ◉ Production ○ Sandbox

API Keys: [Generate Keys]
- Production Key: api_prod_*********
- Test Key: api_test_*********

Webhooks:
Webhook URL: https://acmecorp.com/webhooks/chexpro
Events to Subscribe:
☑ Order Status Change
☑ Report Completed
☑ Adverse Action Required
☐ Payment Processed

[Test Webhook]

ATS/HRIS Integration:
Platform: [Dropdown]
  - None
  - Greenhouse
  - Lever
  - Workday
  - BambooHR
  - Custom

☐ Enable SSO (SAML 2.0)
Identity Provider: [Configure]

[Next: User Setup]
Page 6: User Setup

text
USER ACCOUNTS

Create initial admin account:

First Name: Sarah
Last Name: Johnson
Email: sarah.johnson@acmecorp.com
Role: Account Owner
Phone: +1 (555) 987-6543

[+ Add Another User]

User 2:
First Name: Mike
Last Name: Chen
Email: mike.chen@acmecorp.com
Role: Manager
Phone: +1 (555) 987-6544
[Remove]

Send Welcome Emails: ☑
Include Setup Instructions: ☑

[Next: Review & Activate]
Page 7: Review & Activate

text
REVIEW CONFIGURATION

Account Summary:
✓ Company: Acme Corporation
✓ Account Type: Paid
✓ Packages Configured: 2
✓ Compliance Rules: Applied
✓ Branding: Configured
✓ Users: 2 admin accounts

Pre-Activation Checklist:
☑ Contract signed
☑ Pricing approved
☑ Configuration complete
☑ Test order successful

Activation Actions:
☑ Send welcome emails to users
☑ Schedule onboarding call
☑ Assign account manager
☑ Enable portal access

Onboarding Call:
Date: Feb 25, 2026
Time: 10:00 AM EST
Account Manager: David Williams

[Activate Account]
[Save as Draft]
[Cancel]
4.4 Client Management (Post-Activation)
Active Clients Dashboard:

List View:

text
ACTIVE CLIENTS (47)

Search: [Search by name...]
Filter: [All Clients ▼] [Status ▼] [Account Manager ▼]

┌──────────────────────────────────────────────────────────────────────┐
│ Client Name         │ Status   │ Orders │ TAT   │ Mgr      │ Actions │
├──────────────────────────────────────────────────────────────────────┤
│ Acme Corporation    │ Active   │ 1,234  │ 4.2d  │ D.Will   │ [View]  │
│ TechStart Inc       │ Active   │ 567    │ 3.8d  │ D.Will   │ [View]  │
│ HealthCare Ltd      │ Suspended│ 89     │ 5.1d  │ S.Brown  │ [View]  │
│ Finance Group       │ Active   │ 2,345  │ 3.5d  │ M.Lee    │ [View]  │
│ ...                                                                   │
└──────────────────────────────────────────────────────────────────────┘
Client Detail View:

Overview Tab:

text
CLIENT PROFILE: Acme Corporation

Account Information:
Account ID: CLI-20260218-001
Status: Active
Account Type: Paid - Tier 2
Activated: Feb 20, 2026
Contract Expiry: Feb 19, 2028

Primary Contact:
Sarah Johnson - HR Director
sarah.johnson@acmecorp.com
+1 (555) 987-6543

Account Manager: David Williams

Quick Stats (Last 30 Days):
Orders Placed: 87
Avg TAT: 4.2 days
On-Time Rate: 95.4%
Total Spend: $7,743.00

[Edit Profile] [View Contract] [Suspend Account] [Billing]
Users Tab:

text
CLIENT USERS (8)

[+ Add User]

┌─────────────────────────────────────────────────────────────────┐
│ Name           │ Email                    │ Role    │ Status   │
├─────────────────────────────────────────────────────────────────┤
│ Sarah Johnson  │ sarah.j@acmecorp.com    │ Owner   │ Active   │
│ Mike Chen      │ mike.c@acmecorp.com     │ Manager │ Active   │
│ Lisa Park      │ lisa.p@acmecorp.com     │ User    │ Active   │
│ Tom Richards   │ tom.r@acmecorp.com      │ User    │ Inactive │
└─────────────────────────────────────────────────────────────────┘

Last Login Activity:
Sarah Johnson: Today at 9:15 AM
Mike Chen: Yesterday at 4:30 PM
Packages Tab:

text
CONFIGURED PACKAGES

[+ Create New Package]

Standard Employment Screening
Services: Criminal (Federal), Employment (2x), Education (1x)
Price: $79.00 (Volume discount applied)
Orders This Month: 62
[Edit] [Duplicate] [Deactivate]

Healthcare Professional
Services: Criminal (Fed+Prov), Employment (3x), Education (2x), License, References (3x)
Price: $149.00
Orders This Month: 25
[Edit] [Duplicate] [Deactivate]
Orders Tab:

text
CLIENT ORDERS

Date Range: [Last 30 Days ▼]
Status: [All ▼]
Export: [CSV] [Excel] [PDF]

(Same order list view as main Orders section, 
filtered to this client only)
Billing Tab:

text
BILLING INFORMATION

Billing Model: Monthly Invoice (NET 30)
Credit Limit: $50,000
Current Balance: $3,456.78

Recent Invoices:
- INV-2026-02: $8,234.00 - Paid (Feb 15, 2026)
- INV-2026-01: $7,890.50 - Paid (Jan 15, 2026)
- INV-2025-12: $9,123.75 - Paid (Dec 15, 2025)

[View All Invoices]
[Generate Invoice]
[Record Payment]

Payment Method on File:
Visa ending in 4532
Expires: 08/2027
[Update Payment Method]
Compliance Tab:

text
COMPLIANCE STATUS

Contracts & Agreements:
✓ Master Service Agreement (Signed: Feb 19, 2026)
✓ FCRA Certification (Valid through: Feb 19, 2027)
✓ Data Processing Agreement (Signed: Feb 19, 2026)

Compliance Settings:
Locations: Ontario, British Columbia, California
Ban-the-Box: Enabled for California orders
7-Year Rule: Enabled
Adverse Action: Automated workflow enabled

Adjudication Matrix: Custom
Last Updated: Feb 18, 2026
[View Matrix] [Edit Settings]

Annual Recertification:
Due: Feb 19, 2027
Status: Not Due
[Send Reminder]
Activity Log Tab:

text
CLIENT ACTIVITY HISTORY

Feb 19, 2026 3:45 PM
📧 Invoice INV-2026-02 sent ($8,234.00)
By: System

Feb 18, 2026 10:30 AM
👤 New user added: Lisa Park (User role)
By: Sarah Johnson

Feb 15, 2026 9:00 AM
💳 Payment received: $8,234.00 (INV-2026-02)
By: System

Feb 10, 2026 2:15 PM
⚙️ Package pricing updated (Volume discount applied)
By: David Williams (Account Manager)

[Load More Activity]
SECTION 5: VENDOR MANAGEMENT & ROUTING
**5.1 Vendor Management Overview **
Purpose: Manage relationships with third-party background check vendors, route orders intelligently, and monitor vendor performance.

Supported Vendors:

Sterling (Criminal, Employment, Education)

First Advantage (All services)

Certn (Criminal - Canada)

Equifax (Credit Checks)

LexisNexis (Comprehensive searches)

Custom/Regional vendors

5.2 Vendor Dashboard
Vendors List View:

text
VENDOR MANAGEMENT

[+ Add Vendor]

┌───────────────────────────────────────────────────────────────────────┐
│ Vendor            │ Services        │ Orders │ Avg TAT │ Status     │
├───────────────────────────────────────────────────────────────────────┤
│ Sterling          │ Criminal, Emp   │ 1,234  │ 3.2d    │ Active     │
│ First Advantage   │ All Services    │ 567    │ 4.5d    │ Active     │
│ Certn             │ Criminal (CA)   │ 456    │ 2.1d    │ Active     │
│ Equifax           │ Credit          │ 234    │ 1.5d    │ Active     │
│ LexisNexis        │ Comprehensive   │ 123    │ 3.8d    │ Maintenance│
└───────────────────────────────────────────────────────────────────────┘

Performance Summary (Last 30 Days):
Total Orders Sent: 2,614
Average TAT: 3.4 days
On-Time Delivery: 94.2%
Currently Pending: 312 orders
5.3 Vendor Detail View
Overview Tab:

text
VENDOR PROFILE: Sterling

Vendor Information:
Vendor ID: VND-STR-001
Company: Sterling Talent Solutions
Website: www.sterlingcheck.com
Status: Active

Contact Information:
Account Manager: Jennifer Adams
Email: jennifer.adams@sterlingcheck.com
Phone: +1 (800) 555-0100
Support Email: support@sterlingcheck.com
Support Phone: +1 (800) 555-0101

Contract Information:
Agreement Type: Master Vendor Agreement
Contract Start: Jan 1, 2024
Contract End: Dec 31, 2026
Auto-Renew: Yes
Termination Notice: 60 days

Services Provided:
✓ Criminal Record Checks (Federal, State, County)
✓ Employment Verification
✓ Education Verification
✓ Professional License Verification
✓ Drug Screening
✓ Motor Vehicle Records

[Edit Profile] [View Contract] [API Settings]
Pricing Tab:

text
VENDOR PRICING

Service Pricing:
Criminal Record Check (Federal): $25.00
Criminal Record Check (State): $15.00
Criminal Record Check (County): $12.00 each
Employment Verification: $18.00 per employer
Education Verification: $22.00 per institution
Professional License: $20.00
Drug Test (5-panel): $45.00
MVR: $15.00

Volume Discounts:
Tier 1 (0-100/mo): Standard pricing
Tier 2 (101-500/mo): 10% discount
Tier 3 (500+/mo): 15% discount

Current Tier: Tier 2 (312 orders this month)
Effective Discount: 10%

Last Updated: Jan 1, 2026
[Update Pricing] [View History]
API Integration Tab:

text
API CONFIGURATION

Integration Type: REST API
Environment: Production

API Credentials:
Base URL: https://api.sterlingcheck.com/v2
API Key: sk_prod_********** [Show] [Regenerate]
Client ID: CHX-STR-2024-001

Webhook Configuration:
Webhook URL: https://admin.chexpro.com/api/webhooks/sterling
Secret Key: whk_********** [Show]
Events Subscribed:
☑ Order Status Change
☑ Report Ready
☑ Error Notification

Last Sync: Feb 18, 2026 3:45 PM
Status: ✓ Connected

[Test Connection] [View API Docs] [Sync Now]
Performance Tab:

text
VENDOR PERFORMANCE METRICS

Last 30 Days:
Orders Sent: 312
Orders Completed: 298
Orders Pending: 14
Orders Failed: 0

Average Turnaround Time: 3.2 days
Target TAT: 3.0 days
TAT Variance: +6.7%

[TAT Trend Chart - Line graph showing daily TAT]

On-Time Delivery: 94.2%
Target: 95%

Quality Metrics:
Report Accuracy: 99.1%
Data Completeness: 98.5%
Client Satisfaction: 4.7/5.0

[Performance Details] [Export Report]
Orders Tab:

text
ORDERS WITH VENDOR

Status: [All ▼] Date: [Last 30 Days ▼]

┌───────────────────────────────────────────────────────────────────────┐
│ Order #       │ Client      │ Service Type │ Sent     │ Status        │
├───────────────────────────────────────────────────────────────────────┤
│ ORD-12345     │ Acme Corp   │ Criminal     │ Feb 18   │ Complete      │
│ ORD-12346     │ TechStart   │ Employment   │ Feb 18   │ In Progress   │
│ ORD-12347     │ HealthCare  │ Education    │ Feb 17   │ Complete      │
└───────────────────────────────────────────────────────────────────────┘

[View All Orders] [Export]
Issues Tab:

text
VENDOR ISSUES & RESOLUTIONS

Open Issues: 2
Resolved This Month: 8

┌───────────────────────────────────────────────────────────────────────┐
│ Issue #   │ Type         │ Description           │ Status    │ Age    │
├───────────────────────────────────────────────────────────────────────┤
│ ISS-456   │ Delayed TAT  │ 5 orders delayed >7d  │ Open      │ 2 days │
│ ISS-457   │ Data Error   │ Incorrect DOB in rep  │ Open      │ 1 day  │
│ ISS-455   │ API Timeout  │ Timeout on order sub  │ Resolved  │ Closed │
└───────────────────────────────────────────────────────────────────────┘

[Report New Issue] [View All Issues]
5.4 Intelligent Vendor Routing
Routing Rules Engine:

text
VENDOR ROUTING CONFIGURATION

Routing Priority:
1. Client Preference (if specified)
2. Service Type Capability
3. Geographic Coverage
4. Current Performance
5. Cost Optimization

Default Routing Rules:

Criminal Record Checks (Canada):
Primary: Certn (TAT: 2.1d, Cost: $30)
Secondary: Sterling (TAT: 3.2d, Cost: $35)
Fallback: First Advantage (TAT: 4.5d, Cost: $32)

Criminal Record Checks (USA):
Primary: Sterling (TAT: 3.2d, Cost: $25)
Secondary: First Advantage (TAT: 4.5d, Cost: $28)

Employment Verification:
Primary: Sterling (TAT: 4.0d, Cost: $18)
Secondary: First Advantage (TAT: 5.0d, Cost: $20)

Education Verification:
Primary: First Advantage (TAT: 5.0d, Cost: $22)
Secondary: Sterling (TAT: 5.5d, Cost: $20)

Credit Checks:
Primary: Equifax (TAT: 1.5d, Cost: $20)
No secondary

Custom Routing per Client:
Acme Corp → Sterling (all services) [Priority client agreement]
HealthCare Ltd → First Advantage (healthcare specialization)

[Edit Rules] [Add Override] [Test Routing]
Automatic Failover:

text
VENDOR FAILOVER SETTINGS

Enable Automatic Failover: ☑

Trigger Conditions:
☑ Vendor API unavailable (> 5 min)
☑ Vendor response time > 10 seconds
☑ Vendor error rate > 5%
☑ Vendor TAT exceeding target by > 50%

Failover Actions:
1. Attempt primary vendor (3 retries, 30s apart)
2. Switch to secondary vendor
3. Notify operations team
4. Log incident

Recent Failovers:
Feb 15, 2026 2:30 PM - LexisNexis → Sterling
Reason: API timeout
Orders Affected: 3
Resolution: Automatic failover successful

[View Failover Log] [Configure Alerts]
5.5 Vendor Order Submission Interface
Manual Vendor Submission:

text
SEND ORDER TO VENDOR

Order: CHX-2026-02-18-00245
Client: Acme Corporation
Applicant: Jane Doe

Service to Submit: Criminal Record Check (Federal)

Select Vendor:
◉ Sterling (Recommended)
  TAT: 3.2 days | Cost: $25.00 | Performance: 94.2%
○ First Advantage
  TAT: 4.5 days | Cost: $28.00 | Performance: 91.5%
○ Certn
  TAT: 2.1 days | Cost: $30.00 | Performance: 97.8%
  Note: Canada only

Applicant Data to Send:
✓ Full Name: Jane Elizabeth Doe
✓ DOB: May 15, 1990
✓ SSN/SIN: *** ** **** (masked)
✓ Current Address
✓ Address History (3 addresses)
✓ Consent Form (signed Feb 18, 2026)

Vendor Package Mapping:
Chexpro Service: Criminal Record Check (Federal)
Sterling Package: Federal Criminal Search
Sterling Product Code: FCR-001

[Review Data] [Send to Vendor] [Schedule for Later]
**SECTION 6: QUALITY ASSURANCE MODULE **
6.1 QA Overview
Purpose: Ensure all background check reports meet quality standards before delivery to clients. Catch errors, verify accuracy, and maintain consistency.
​

QA Process Flow:

text
Order Complete → QA Queue → Assign to QA Specialist → 
Review Report → Pass/Fail Decision → 
If Pass: Approve for Delivery → If Fail: Return for Corrections → 
Re-Review → Final Approval → Deliver to Client
6.2 QA Queue Dashboard
QA Queue View:

text
QUALITY ASSURANCE QUEUE

Priority Filters:
[All] [Urgent] [Standard] [Low Priority]

Status Filters:
[Pending QA (31)] [In Review (8)] [Failed QA (3)] [Approved (142)]

Sort by: [Due Date ▼]

┌───────────────────────────────────────────────────────────────────────┐
│ Order #   │ Client      │ Package    │ QA Status    │ Due    │ Assign│
├───────────────────────────────────────────────────────────────────────┤
│ ORD-12345 │ Acme Corp   │ Standard   │ Pending QA   │ Today  │[Claim]│
│ ORD-12346 │ TechStart   │ Healthcare │ In Review    │ Today  │ J.Doe │
│ ORD-12347 │ Finance Grp │ Standard   │ Pending QA   │ +1d    │[Claim]│
│ ORD-12348 │ HealthCare  │ Executive  │ Failed QA    │ Today  │M.Smith│
└───────────────────────────────────────────────────────────────────────┘

My Assigned Reviews (8):
[View My Queue]

QA Metrics Today:
Reviews Completed: 23
Avg Review Time: 11 min
First-Time Pass Rate: 91.3%
6.3 QA Review Interface
Report Review Screen:

text
QA REVIEW: Order CHX-2026-02-18-00245

[Left Panel: Order Context]
Client: Acme Corporation
Package: Standard Employment Screening
Applicant: Jane Elizabeth Doe
Position: Software Engineer

Services in Package:
✓ Criminal Record Check (Federal)
✓ Employment Verification (2 employers)
✓ Education Verification (1 degree)

Order Completion Date: Feb 19, 2026 4:30 PM
QA Due: Feb 20, 2026 11:59 PM
Time Remaining: 19h 29m


[Center Panel: QA Checklist]

QUALITY ASSURANCE CHECKLIST

Data Accuracy:
☑ Applicant name matches across all reports
☑ DOB verified and consistent
☑ Addresses match applicant provided information
☐ All dates are accurate and complete
☑ No data entry errors

Report Completeness:
☑ All ordered services completed
☑ No pending or missing sections
☑ All vendor reports attached
☑ All verifications documented
☑ Consent forms on file

Compliance Checks:
☑ Adverse information follows FCRA guidelines
☑ 7-year reporting rule applied correctly
☑ Ban-the-box compliance (if applicable)
☑ Proper disclosures included
☑ Required legal disclaimers present

Quality Standards:
☑ Report formatting consistent
☑ No spelling or grammar errors
☑ Summary section accurate
☑ Recommendations appropriate
☑ Client-specific requirements met

[Right Panel: Report Preview]

DRAFT BACKGROUND CHECK REPORT

APPLICANT INFORMATION
Name: Jane Elizabeth Doe
DOB: May 15, 1990
SSN: ***-**-5678

EXECUTIVE SUMMARY
This background check was completed on Feb 19, 2026.
All searches returned clear results with no adverse findings.

CRIMINAL RECORD CHECK (Federal)
Search Date: Feb 19, 2026
Vendor: Sterling
Jurisdictions: Federal Court System
Result: CLEAR - No criminal records found
Report ID: STR-CR-2026-456789

EMPLOYMENT VERIFICATION
Employer 1: Tech Corp Inc
Title: Senior Developer
Dates: Jan 2020 - Dec 2024 ✓ VERIFIED
Contact: HR Department
Result: Positive - Eligible for rehire

Employer 2: StartUp LLC
Title: Junior Developer
Dates: Mar 2018 - Dec 2019 ✓ VERIFIED
Contact: John Smith (Former Manager)
Result: Positive - Strong performance

EDUCATION VERIFICATION
Institution: University of Toronto
Degree: Bachelor of Science, Computer Science
Graduation: May 2018 ✓ VERIFIED
Verification Method: Direct transcript
Result: Degree confirmed

[View Full Report PDF]
QA Decision Panel:

text
QA DECISION

Review Notes (Internal):
[Text area for QA specialist notes]

Example:
All verifications completed successfully.
Criminal check clear. Employment and education 
verified with direct sources. Report meets all 
quality standards. Approved for delivery.

Decision:
◉ APPROVE - Report meets quality standards
○ FAIL - Return for corrections (specify issues below)
○ ESCALATE - Requires senior review

If FAIL, specify issues:
[ ] Data accuracy error (describe): _______
[ ] Missing information (describe): _______
[ ] Formatting issue (describe): _______
[ ] Compliance concern (describe): _______
[ ] Other (describe): _______

Assign back to: [Dropdown - Processor]
Priority: [Standard ▼]

[Submit Decision] [Save Draft] [Cancel]
6.4 Failed QA - Corrections Workflow
When QA fails a report:

text
QA FAILURE NOTIFICATION

Order: CHX-2026-02-18-00245
QA Reviewer: Mary Smith
Failed Date: Feb 19, 2026 5:15 PM

Issues Found:
1. Employment Verification - Tech Corp
   Issue: Employment dates don't match resume
   Resume says: Jan 2020 - Dec 2024
   Verification shows: Mar 2020 - Nov 2024
   Action Required: Re-verify dates with employer

2. Report Formatting
   Issue: Missing page break before education section
   Action Required: Fix formatting

Priority: Standard
Reassigned to: John Doe (Original Processor)
Due: Feb 20, 2026 2:00 PM

[View Full QA Feedback] [Accept & Fix] [Dispute Issue]
Processor View After QA Failure:

text
ORDER REQUIRES CORRECTIONS

Order: CHX-2026-02-18-00245
Status: FAILED QA - Awaiting Corrections

QA Feedback: [View Full Feedback]

Action Items:
1. [ ] Re-verify employment dates with Tech Corp
      Original Issue: Date discrepancy
      Steps: Call HR, request written confirmation
      
2. [ ] Fix report formatting issue
      Original Issue: Missing page break
      Steps: Regenerate report with correct formatting

Internal Notes:
[Add note about corrections made]

When All Corrections Complete:
[Resubmit for QA Review]
6.5 QA Metrics & Reporting
QA Performance Dashboard:

text
QA TEAM PERFORMANCE

Date Range: [Last 30 Days ▼]

Overall Metrics:
Total Reports Reviewed: 1,234
First-Time Pass Rate: 89.1%
Average Review Time: 12 minutes
Reports Failed: 134 (10.9%)
Re-Review Pass Rate: 96.3%

QA Specialist Performance:
┌───────────────────────────────────────────────────────────────────────┐
│ QA Specialist  │ Reviews │ Avg Time │ Pass Rate │ Consistency        │
├───────────────────────────────────────────────────────────────────────┤
│ Mary Smith     │ 342     │ 11 min   │ 91.2%     │ 94.5% (High)       │
│ James Lee      │ 298     │ 13 min   │ 87.5%     │ 89.1% (Good)       │
│ Sarah Park     │ 267     │ 10 min   │ 90.1%     │ 92.3% (High)       │
│ Tom Wilson     │ 327     │ 14 min   │ 85.3%     │ 86.7% (Fair)       │
└───────────────────────────────────────────────────────────────────────┘

Common Failure Reasons:
1. Data Entry Errors: 45 (33.6%)
2. Incomplete Verifications: 32 (23.9%)
3. Formatting Issues: 28 (20.9%)
4. Compliance Issues: 18 (13.4%)
5. Other: 11 (8.2%)

[View Detailed Report] [Export Data]
QA Audit Trail:

text
QA AUDIT TRAIL: Order CHX-2026-02-18-00245

Feb 19, 2026 5:15 PM - Mary Smith (QA Specialist)
Decision: FAILED QA
Reason: Employment date discrepancy, formatting issue
Assigned back to: John Doe

Feb 20, 2026 10:30 AM - John Doe (Processor)
Action: Corrections completed
Status: Resubmitted for QA

Feb 20, 2026 11:45 AM - Mary Smith (QA Specialist)
Decision: APPROVED
Notes: All corrections verified. Report ready for delivery.

[Export Audit Trail]
**SECTION 7: ADJUDICATION REVIEW SYSTEM **
7.1 Adjudication Overview
Purpose: When background checks return adverse findings (criminal records, failed verifications, etc.), determine whether the findings should disqualify the candidate or require further review.

Adjudication Flow:

text
Report with Findings → Automated Pre-Screening (Matrix) → 
If Auto-Clear: Skip Review → 
If Requires Review: Adjudication Queue → 
Manual Review → Decision (Clear/Adverse) → 
If Adverse: Initiate Adverse Action Process → 
Deliver Report
7.2 Adjudication Queue
Queue View:

text
ADJUDICATION QUEUE

Priority: [All] [Urgent] [High] [Standard]
Status: [Pending (18)] [In Review (5)] [Completed (142)]

┌───────────────────────────────────────────────────────────────────────┐
│ Order #   │ Client      │ Finding Type │ Severity │ Due    │ Assign  │
├───────────────────────────────────────────────────────────────────────┤
│ ORD-12350 │ Acme Corp   │ Misdemeanor  │ Medium   │ Today  │ [Claim] │
│ ORD-12351 │ HealthCare  │ Felony       │ High     │ Today  │ J.Adams │
│ ORD-12352 │ Finance     │ Employ Gap   │ Low      │ +1d    │ [Claim] │
│ ORD-12353 │ TechStart   │ DUI          │ Medium   │ +2d    │ M.Brown │
└───────────────────────────────────────────────────────────────────────┘

My Assigned: 5 orders
[View My Queue]

Adjudication Metrics Today:
Reviews Completed: 14
Average Review Time: 18 minutes
Auto-Cleared: 67%
Manual Review: 33%
Adverse Decisions: 12%
7.3 Adjudication Review Interface
Review Screen:

text
ADJUDICATION REVIEW: Order CHX-2026-02-18-00250

[Left Panel: Case Summary]
Client: HealthCare Ltd
Applicant: Michael Johnson
Position: Registered Nurse
Location: Ontario, Canada

Adjudication Matrix: Healthcare Professional

Background Summary:
Age: 34 years
Employment History: 12 years in healthcare
Education: RN Degree (verified)
Professional License: Active, Good Standing

Finding Trigger:
Criminal Record: Misdemeanor Conviction
Date: June 2018 (6 years ago)
Type: Theft Under $5,000
Disposition: Convicted, Probation (completed)


[Center Panel: Finding Details]

CRIMINAL RECORD DETAILS

Offense: Theft Under $5,000 (Misdemeanor)
Date of Offense: June 15, 2018
Jurisdiction: Toronto, Ontario
Case Number: CR-2018-456789
Disposition: Guilty
Sentence: 12 months probation (completed Aug 2019)
Restitution: $1,200 (paid in full)

Additional Context:
- No prior criminal history
- No subsequent offenses (6 years clear)
- Applicant disclosed offense in application
- Letter of explanation provided by applicant

[View Court Documents]
[View Applicant Statement]

AUTOMATED PRE-SCREENING RESULT

Matrix Applied: Healthcare Professional
Rule Triggered: #4 - Non-violent misdemeanor, 5+ years old

Pre-Screening Decision: REQUIRES MANUAL REVIEW
Reason: Healthcare position requires individualized assessment
Confidence: Medium

Factors to Consider:
✓ Age of offense (6 years)
✓ Nature of offense (theft - property crime)
✓ Position (RN - direct patient care)
✓ Rehabilitation evidence (6 years clean record)
✓ Applicant disclosure (disclosed proactively)

Client's Adjudication Guidelines:
- Non-violent misdemeanors: Case-by-case review
- Theft offenses: Requires 7+ years passage OR rehabilitation evidence
- Healthcare roles: Strict scrutiny for patient safety


[Right Panel: Decision Factors]

INDIVIDUALIZED ASSESSMENT

Nature of the Offense:
Severity: Low-Medium (Misdemeanor, theft < $5,000)
Violence: No
Victims: Property crime (no personal injury)
Circumstances: Financial hardship (per applicant statement)

Relevance to Position:
Direct Relevance: Low-Medium
Position involves: Patient care, medication handling, access to property
Risk Assessment: Low (no pattern, long time passed)

Time Elapsed:
Date of Offense: June 2018
Time Passed: 6 years
Regulatory Guideline: 7 years (FCRA reporting limit)
Note: Just under guideline threshold

Rehabilitation Evidence:
✓ 6 years with no further offenses
✓ Completed probation successfully
✓ Restitution paid in full
✓ Continued employment in healthcare (5 years)
✓ Active professional license (no disciplinary action)
✓ Positive references from current employer
✓ Applicant disclosed offense voluntarily

Age at Time of Offense: 28 years old
Current Age: 34 years old

Mitigating Factors:
- Financial hardship cited as circumstance
- Proactive disclosure shows honesty
- Strong work history since offense
- Professional license in good standing
- No pattern of behavior

Aggravating Factors:
- Position involves access to medications and patient property
- Offense type (theft) has relevance to healthcare setting
- Slightly under 7-year threshold
Decision Panel:

text
ADJUDICATION DECISION

Recommendation:
◉ CLEAR / ELIGIBLE
   Findings do not disqualify candidate
   
○ CONSIDER / REVIEW REQUIRED
   Client should review findings before making decision
   
○ ADVERSE / NOT ELIGIBLE
   Findings disqualify candidate per policy

Decision Rationale:
[Text area - required]

Example rationale:
"While the theft offense is concerning given the healthcare 
setting, multiple factors support a CLEAR decision:

1. Significant time passage (6 years, approaching 7-year threshold)
2. Strong rehabilitation evidence (clean record since, continued 
   employment in healthcare, active license)
3. Proactive disclosure demonstrates honesty and integrity
4. No pattern of behavior or subsequent offenses
5. Offense occurred during documented financial hardship period

Recommendation: CLEAR with consideration of client's final discretion.
Note to client: Candidate has demonstrated rehabilitation and 
maintained professional standards for 6 years post-offense."

Notify Client of Findings: ☑
Recommendation to Client: [Clear with explanation]

If ADVERSE Selected:
☐ Initiate Adverse Action Process automatically
☐ Send Pre-Adverse Action Notice
☐ Include FCRA Summary of Rights

Compliance Checks:
☑ FCRA compliance verified
☑ Individualized assessment documented
☑ Decision rationale recorded for audit

[Submit Decision] [Save Draft] [Request Second Review] [Cancel]
7.4 Adjudication Matrix Configuration
Matrix Builder Interface:

text
ADJUDICATION MATRIX: Healthcare Professional

Applies to Clients: [HealthCare Ltd, Medical Group, ...]
Applies to Positions: [RN, LPN, Physician, Medical Assistant, ...]

RULES CONFIGURATION

Rule #1: Felony Convictions (Violent)
Severity: Felony
Type: Violent (assault, battery, homicide, etc.)
Lookback: No limit
Decision: AUTO-REJECT
Exceptions: None
Note: Automatic disqualification per healthcare regulations

Rule #2: Felony Convictions (Non-Violent)
Severity: Felony
Type: Non-violent (fraud, theft, drug possession, etc.)
Lookback: 10 years
Decision: MANUAL REVIEW if within 10 years, AUTO-CLEAR if 10+ years
Considerations: Nature, rehabilitation, position relevance
Note: Case-by-case assessment required

Rule #3: Misdemeanor Convictions (Violent)
Severity: Misdemeanor
Type: Violent (assault, domestic violence, etc.)
Lookback: 7 years
Decision: MANUAL REVIEW if within 7 years, AUTO-CLEAR if 7+ years
Considerations: Severity, circumstances, rehabilitation
Note: Patient safety concern

Rule #4: Misdemeanor Convictions (Non-Violent)
Severity: Misdemeanor
Type: Non-violent (theft, fraud, DUI, etc.)
Lookback: 7 years
Decision: MANUAL REVIEW if within 7 years, AUTO-CLEAR if 7+ years
Considerations: Position relevance, rehabilitation, disclosure
Note: Individualized assessment required
[Current case falls under this rule]

Rule #5: Drug-Related Offenses
Severity: Any
Type: Drug possession, distribution, DUI
Lookback: 5 years
Decision: MANUAL REVIEW if within 5 years, AUTO-CLEAR if 5+ years
Considerations: Healthcare setting, medication access, rehabilitation
Note: Critical for healthcare positions

Rule #6: Professional License Issues
Type: Suspension, revocation, disciplinary action
Lookback: No limit
Decision: MANUAL REVIEW
Considerations: Reason, current status, remediation
Note: Must be disclosed to client

Rule #7: Employment Gaps (Unexplained)
Duration: > 6 months
Lookback: 5 years
Decision: FLAG FOR REVIEW (not disqualifying)
Considerations: Reason for gap, explanation provided
Note: Request clarification from applicant

[+ Add Rule] [Reorder Rules] [Test Matrix] [Save]
7.5 Adjudication Reports & Analytics
Adjudication Metrics Dashboard:

text
ADJUDICATION PERFORMANCE

Date Range: [Last 30 Days ▼]

Volume Metrics:
Total Cases Reviewed: 234
Auto-Cleared: 156 (66.7%)
Manual Reviews: 78 (33.3%)

Manual Review Outcomes:
- Cleared: 52 (66.7%)
- Requires Client Review: 18 (23.1%)
- Adverse Decision: 8 (10.3%)

Average Review Time:
- Auto-Clear: Instant
- Manual Review: 18 minutes

Adjudicator Performance:
┌───────────────────────────────────────────────────────────────────────┐
│ Adjudicator    │ Reviews │ Avg Time │ Clear Rate │ Consistency       │
├───────────────────────────────────────────────────────────────────────┤
│ Jennifer Adams │ 45      │ 16 min   │ 68.9%      │ 92.1% (High)      │
│ Mark Brown     │ 33      │ 20 min   │ 63.6%      │ 88.4% (Good)      │
└───────────────────────────────────────────────────────────────────────┘

Finding Types Distribution:
Criminal (Misdemeanor): 42 (53.8%)
Criminal (Felony): 12 (15.4%)
Employment Gap: 8 (10.3%)
Failed Verification: 7 (9.0%)
License Issue: 5 (6.4%)
Credit Issue: 4 (5.1%)

[View Detailed Report] [Export Data]
[Document continues with Sections 8-20 covering Report Generation, Compliance Tools, Team Management, SLA Monitoring, Document Management, Communication Center, Analytics, System Administration, Integration Architecture, Database Schema, API Specs, Security, and OCI Deployment...]

EXECUTIVE SUMMARY FOR IMPLEMENTATION
This Admin Portal specification provides comprehensive internal operations management for Chexpro.com with:

20 Major Modules:

✅ Dashboard & Real-Time Metrics

✅ Order Processing Workflow

✅ Client Credentialing & Onboarding

✅ Vendor Management & Intelligent Routing

✅ Quality Assurance System

✅ Adjudication Review Engine

✅ Report Generation & Delivery

✅ Compliance & Audit Tools

✅ Team Management & Workload Distribution

✅ SLA Monitoring & Alerting

Plus 10 additional modules covering communication, analytics, document management, system administration, and more.