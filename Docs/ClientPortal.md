Chexpro.com Client Portal - Technical Specification Document
Version 1.0 | February 2026
1. EXECUTIVE SUMMARY
1.1 Project Overview
Build a web-based client portal for Chexpro.com that enables clients to authenticate, create background check orders, enter applicant data, track order status, and retrieve completed reports.

1.2 Core Objectives
Self-service order initiation and management

Real-time status tracking and notifications

Secure data collection and storage

Automated workflow processing

Client-branded user experience

2. SYSTEM ARCHITECTURE
2.1 Architecture Pattern
Recommended: Three-tier architecture with API-first design

Presentation Layer: React SPA (Single Page Application)

Application Layer: Node.js/Express REST API

Data Layer: PostgreSQL with Redis caching

2.2 Technology Stack
Frontend
Framework: React 18+ with TypeScript

State Management: Zustand or Redux Toolkit

UI Library: shadcn/ui + Tailwind CSS

Form Handling: React Hook Form + Zod validation

HTTP Client: Axios with interceptors

Authentication: JWT with refresh token rotation

Backend
Runtime: Node.js 20 LTS

Framework: Express.js or Fastify

ORM: Prisma or TypeORM

Authentication: Passport.js + JWT

File Upload: Multer with S3 integration

Queue System: Bull (Redis-based) for async tasks

Email: Nodemailer or SendGrid

Database
Primary: PostgreSQL 15+

Cache: Redis 7+

File Storage: AWS S3 or compatible (MinIO for self-hosted)

Infrastructure
Containerization: Docker + Docker Compose

Reverse Proxy: Nginx

SSL: Let's Encrypt (automatic renewal)

Monitoring: PM2 or built-in health checks

3. CORE MODULES & FEATURES
3.1 Authentication & Authorization Module
Features:
Email/password login with "Remember Me" option

Multi-factor authentication (2FA via TOTP) - optional enhancement

Password reset via email with time-limited tokens

Session management with automatic timeout (30 minutes idle)

Role-based access control (RBAC): Admin, Manager, User

Technical Requirements:
text
POST /api/auth/login
POST /api/auth/logout
POST /api/auth/refresh-token
POST /api/auth/forgot-password
POST /api/auth/reset-password
GET  /api/auth/me
Security:

Bcrypt password hashing (cost factor: 12)

JWT with 15-minute access token, 7-day refresh token

Rate limiting: 5 login attempts per 15 minutes per IP

HTTPS only, secure cookie flags (HttpOnly, Secure, SameSite)

3.2 Client Dashboard (Home Tab)
Features:
​
Customizable color scheme per client account

Three-column layout: Left sidebar, Main content, Right sidebar

Quick Links section showing 5 most recent orders

Statistics widgets: Total orders, Pending checks, Completed this month, Average turnaround time

Recent activity feed (last 10 actions)

Configurable help desk link (footer)

Up to 5 custom external links (Privacy Policy, Terms, etc.)

Technical Requirements:
text
GET /api/dashboard/stats
GET /api/dashboard/recent-orders?limit=5
GET /api/dashboard/activity-feed?limit=10
GET /api/client/theme-config
PUT /api/client/theme-config
UI Components:

StatCard: Reusable component for metric display

QuickLinkCard: Clickable card showing order ID, applicant name, status, date

ActivityFeedItem: Timeline-style activity log

ThemeSwitcher: Admin component for color scheme selection

3.3 Custom Order Form Module
Features:
​
Dynamic form builder with client-specific instructions

Package selection (pre-configured service bundles)

À la carte service selection

Bulk order capability (upload CSV for multiple applicants)

Draft save functionality (auto-save every 30 seconds)

Order preview before submission

Copy from previous order feature

Form Fields:
Client Information:

Reference Number (optional, client's internal ID)

Department/Division

Position/Role being screened for

Reason for screening (dropdown: Employment, Volunteer, Tenant, Other)

Package Selection:

Radio buttons for pre-configured packages

Checkbox list for individual services if custom order

Dynamic pricing display based on selection

Package descriptions with tooltips

Technical Requirements:
text
GET  /api/packages?clientId={id}
GET  /api/services?clientId={id}
POST /api/orders/draft
PUT  /api/orders/draft/{id}
POST /api/orders/submit
POST /api/orders/bulk-upload
GET  /api/orders/{id}/duplicate
Service Types to Support:

Criminal Record Check (Federal, Provincial, Local)

Employment Verification

Education Verification

Credit Check

Reference Checks

Driving Record

Professional License Verification

International Criminal Check

Social Media Screening

3.4 Applicant Data Entry Module
Features:
Step-by-step wizard with progress indicator

Field validation with real-time feedback

Auto-populate from past address history

Document upload capability (ID, consents, supporting docs)

Digital consent capture with e-signature

Mobile-responsive design for applicant self-service

Save & resume capability with unique link

Multi-address history collection

Data Fields:
Step 1: Personal Information

Full Legal Name (First, Middle, Last, Suffix)

Date of Birth

Social Insurance Number (encrypted, optional based on check type)

Email Address

Phone Number (Mobile preferred)

Gender (optional, for certain checks)

Step 2: Current Address

Street Address

City/Town

Province/State

Postal/ZIP Code

Country

Residence Type (Own, Rent, Other)

Years at address

Step 3: Address History (Past 7 years minimum)

Dynamic form to add multiple previous addresses

Same fields as current address

Date ranges (From - To)

Auto-populate functionality for criminal search jurisdictions

Step 4: Employment History

Current/Most Recent Employer

Job Title

Employment Dates

Supervisor Name & Contact

Reason for Leaving

Permission to Contact (Y/N)

Add up to 3 previous employers

Step 5: Education History

Institution Name

Degree/Diploma/Certification

Field of Study

Graduation Date

Student ID (if available)

Step 6: Additional Information

Professional Licenses/Certifications

Other Names Used (maiden, aliases)

Criminal Record Disclosure (self-declaration)

Consent acknowledgments

Step 7: Document Upload

Government-issued photo ID (front & back)

Proof of address (utility bill, bank statement)

Consent forms (if not using e-signature)

Other supporting documents

Technical Requirements:
text
POST /api/applicants
PUT  /api/applicants/{id}
GET  /api/applicants/{id}
POST /api/applicants/{id}/documents
GET  /api/applicants/{id}/documents
POST /api/applicants/{id}/consent
GET  /api/applicants/auto-populate/{id}
POST /api/applicants/{id}/e-signature
File Upload Specs:

Max file size: 10MB per file

Accepted formats: PDF, JPG, PNG, HEIC

Virus scanning on upload (ClamAV)

Encrypted storage (AES-256)

Automatic file compression for images

3.5 Order Management & Tracking Module
Features:
Order list view with filters and search

Status-based segmentation (tabs: All, Pending, In Progress, Requires Action, Completed, Cancelled)

Real-time status updates without page refresh (WebSocket or polling)

Progress bar per order showing completion percentage

Color-coded status indicators

Bulk actions (export, cancel, duplicate)

Advanced filtering: Date range, applicant name, package type, status

Sortable columns

Order Statuses:
Draft (saved but not submitted)

Submitted (order received, pending processing)

Awaiting Applicant Info (invitation sent, awaiting data)

Data Verification (reviewing submitted information)

In Progress (checks being conducted)

Pending Review (results received, needs adjudication)

Requires Action (discrepancy found, client input needed)

Completed (report ready)

Cancelled

Order Detail View:
Order summary card (ID, date, applicant, package, total cost)

Status timeline with timestamps and notes
​

Individual service status breakdown

Applicant information (view-only with edit request option)

Document viewer for uploaded files

Report download button (when completed)

Notes/comments section with internal messaging

Action buttons: Cancel, Request Update, Download Report, Re-screen

Technical Requirements:
text
GET  /api/orders?status={status}&page={n}&limit={n}
GET  /api/orders/{id}
GET  /api/orders/{id}/timeline
PUT  /api/orders/{id}/cancel
POST /api/orders/{id}/notes
GET  /api/orders/{id}/report
POST /api/orders/{id}/rescreen
GET  /api/orders/export?format=csv|pdf
Real-time Updates:

WebSocket connection for live status changes

Fallback to polling every 30 seconds if WebSocket unavailable

Browser notifications for status changes (with permission)

Email notifications on key status transitions

3.6 Reporting & Analytics Module
Features:
Order volume metrics (daily, weekly, monthly)

Turnaround time analytics (average, by service type)

Completion rate dashboard

Pass/fail rate statistics (anonymized)

Export reports to CSV/PDF

Custom date range selection

Graphical charts: Line charts for trends, bar charts for comparisons, donut charts for distributions

Reports Available:
Monthly Order Summary

Service Type Breakdown

Turnaround Time Report

Incomplete Orders Report

Billing Summary (orders by cost)

Technical Requirements:
text
GET /api/reports/order-volume?startDate={date}&endDate={date}
GET /api/reports/turnaround-time?groupBy=service
GET /api/reports/completion-rates
GET /api/reports/export?type={reportType}&format=csv
3.7 Client Account Management
Features:
Company profile management

User management (add/remove users, assign roles)

Billing information & payment methods

Invoice history & download

API key generation for integrations

Theme customization (brand colors, logo upload)

Custom external links configuration

Notification preferences

User Roles:
Account Owner: Full access, billing, user management

Administrator: Order management, user management (except owner)

Manager: Order management, view reports

Standard User: Create orders, view own orders

Technical Requirements:
text
GET  /api/client/profile
PUT  /api/client/profile
GET  /api/client/users
POST /api/client/users
PUT  /api/client/users/{id}
DELETE /api/client/users/{id}
GET  /api/client/billing/invoices
GET  /api/client/api-keys
POST /api/client/api-keys
DELETE /api/client/api-keys/{id}
PUT  /api/client/branding
3.8 Applicant Self-Service Portal
Features:
​
Unique invitation link sent via email/SMS

Guided data entry wizard

Mobile-optimized interface

Progress saved automatically

Document upload via phone camera

Real-time validation

Status check without login (using token)

Multi-language support (English, French initially)

Applicant Flow:
Receive email with unique link (expires in 14 days)

Click link → Land on welcome page with instructions

Complete data entry wizard (Steps 1-7 as defined in 3.4)

Review & submit

Receive confirmation email

Can check status anytime using the same link

Technical Requirements:
text
POST /api/applicant-portal/invite
GET  /api/applicant-portal/{token}
PUT  /api/applicant-portal/{token}/data
POST /api/applicant-portal/{token}/submit
GET  /api/applicant-portal/{token}/status
4. DATABASE SCHEMA
4.1 Core Tables
clients
sql
id: UUID PRIMARY KEY
company_name: VARCHAR(255) NOT NULL
primary_contact: VARCHAR(255)
email: VARCHAR(255) UNIQUE NOT NULL
phone: VARCHAR(20)
address: TEXT
theme_config: JSONB (colors, logo_url)
custom_links: JSONB (array of {title, url})
status: ENUM('active', 'suspended', 'inactive')
created_at: TIMESTAMP
updated_at: TIMESTAMP
users
sql
id: UUID PRIMARY KEY
client_id: UUID FOREIGN KEY → clients(id)
email: VARCHAR(255) UNIQUE NOT NULL
password_hash: VARCHAR(255) NOT NULL
first_name: VARCHAR(100)
last_name: VARCHAR(100)
role: ENUM('owner', 'admin', 'manager', 'user')
status: ENUM('active', 'inactive', 'pending')
last_login: TIMESTAMP
mfa_secret: VARCHAR(255) NULLABLE
created_at: TIMESTAMP
updated_at: TIMESTAMP
packages
sql
id: UUID PRIMARY KEY
client_id: UUID FOREIGN KEY → clients(id) NULLABLE (null = global)
name: VARCHAR(255) NOT NULL
description: TEXT
services: JSONB (array of service IDs)
price: DECIMAL(10,2)
turnaround_time_days: INTEGER
is_active: BOOLEAN DEFAULT true
created_at: TIMESTAMP
updated_at: TIMESTAMP
services
sql
id: UUID PRIMARY KEY
name: VARCHAR(255) NOT NULL
category: VARCHAR(100)
description: TEXT
base_price: DECIMAL(10,2)
estimated_turnaround_days: INTEGER
requires_sin: BOOLEAN
is_active: BOOLEAN DEFAULT true
created_at: TIMESTAMP
orders
sql
id: UUID PRIMARY KEY
order_number: VARCHAR(50) UNIQUE (auto-generated: CHX-YYYYMMDD-XXXX)
client_id: UUID FOREIGN KEY → clients(id)
created_by_user_id: UUID FOREIGN KEY → users(id)
package_id: UUID FOREIGN KEY → packages(id) NULLABLE
custom_services: JSONB (if à la carte)
status: ENUM (statuses from 3.5)
total_price: DECIMAL(10,2)
reference_number: VARCHAR(100) NULLABLE
position_title: VARCHAR(255)
department: VARCHAR(255)
screening_reason: VARCHAR(100)
applicant_id: UUID FOREIGN KEY → applicants(id)
completion_percentage: INTEGER DEFAULT 0
submitted_at: TIMESTAMP NULLABLE
completed_at: TIMESTAMP NULLABLE
created_at: TIMESTAMP
updated_at: TIMESTAMP
applicants
sql
id: UUID PRIMARY KEY
first_name: VARCHAR(100) NOT NULL
middle_name: VARCHAR(100)
last_name: VARCHAR(100) NOT NULL
date_of_birth: DATE
sin: VARCHAR(255) ENCRYPTED NULLABLE
email: VARCHAR(255)
phone: VARCHAR(20)
gender: VARCHAR(20)
current_address: JSONB
address_history: JSONB (array of addresses)
employment_history: JSONB (array)
education_history: JSONB (array)
additional_info: JSONB
consent_given: BOOLEAN
consent_signature: TEXT (base64 image)
consent_date: TIMESTAMP
invitation_token: VARCHAR(255) UNIQUE
token_expires_at: TIMESTAMP
portal_completed: BOOLEAN DEFAULT false
created_at: TIMESTAMP
updated_at: TIMESTAMP
order_timeline
sql
id: UUID PRIMARY KEY
order_id: UUID FOREIGN KEY → orders(id)
status: VARCHAR(100)
description: TEXT
notes: TEXT NULLABLE
created_by: VARCHAR(255) (system or user email)
created_at: TIMESTAMP
documents
sql
id: UUID PRIMARY KEY
order_id: UUID FOREIGN KEY → orders(id)
applicant_id: UUID FOREIGN KEY → applicants(id)
document_type: VARCHAR(100)
file_name: VARCHAR(255)
file_path: VARCHAR(500) (S3 key)
file_size: INTEGER
mime_type: VARCHAR(100)
uploaded_by: VARCHAR(255)
created_at: TIMESTAMP
reports
sql
id: UUID PRIMARY KEY
order_id: UUID FOREIGN KEY → orders(id)
report_type: VARCHAR(100)
file_path: VARCHAR(500)
generated_at: TIMESTAMP
created_at: TIMESTAMP
notifications
sql
id: UUID PRIMARY KEY
user_id: UUID FOREIGN KEY → users(id)
order_id: UUID FOREIGN KEY → orders(id) NULLABLE
type: VARCHAR(100)
title: VARCHAR(255)
message: TEXT
is_read: BOOLEAN DEFAULT false
created_at: TIMESTAMP
5. API SPECIFICATIONS
5.1 API Standards
RESTful design principles

JSON request/response bodies

Standard HTTP status codes

JWT bearer token authentication

API versioning: /api/v1/...

Rate limiting: 100 requests/minute per client

CORS enabled for allowed origins only

5.2 Response Format
json
// Success
{
  "success": true,
  "data": { /* response data */ },
  "meta": {
    "timestamp": "2026-02-17T16:00:00Z",
    "page": 1,
    "limit": 20,
    "total": 150
  }
}

// Error
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": [
      {"field": "email", "message": "Invalid email format"}
    ]
  },
  "meta": {
    "timestamp": "2026-02-17T16:00:00Z"
  }
}
5.3 Authentication Headers
text
Authorization: Bearer <JWT_TOKEN>
X-Client-ID: <CLIENT_UUID>
6. SECURITY REQUIREMENTS
6.1 Data Protection
All PII encrypted at rest (AES-256)
​

SIN/SSN stored in separate encrypted column with dedicated key

TLS 1.3 for all data in transit

Database backups encrypted

Secure file storage with signed URLs (expire in 1 hour)

6.2 Access Control
Row-level security: Users can only access their client's data

API endpoints require authentication (except login, signup, password reset)

Role-based permissions enforced at controller level

Audit logging for all sensitive operations

6.3 Compliance
PIPEDA compliance (Canada) for personal information handling

GDPR-ready (for EU clients): Right to access, right to erasure

FCRA compliance if operating in USA

SOC 2 Type II alignment (for future certification)

6.4 Security Headers
text
Strict-Transport-Security: max-age=31536000; includeSubDomains
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Content-Security-Policy: default-src 'self'
7. USER WORKFLOWS
7.1 Client Order Creation Workflow
text
1. Login → Dashboard
2. Click "New Order" button
3. Select Package or Build Custom
4. Fill order details (reference #, position, etc.)
5. Choose: Enter applicant info now OR Send invitation
   
   Path A (Enter Now):
   6a. Complete applicant data entry (Steps 1-7)
   7a. Upload documents
   8a. Review & Submit
   9a. Order created → Status: "In Progress"
   
   Path B (Send Invitation):
   6b. Enter applicant email/phone
   7b. Click "Send Invitation"
   8b. Order created → Status: "Awaiting Applicant Info"
7.2 Applicant Self-Service Workflow
text
1. Receive email with unique link
2. Click link → Welcome page
3. Step-by-step wizard (auto-save each step)
   - Personal Info
   - Current Address
   - Address History
   - Employment
   - Education
   - Additional Info
   - Document Upload
4. E-signature for consent
5. Review all information
6. Submit
7. Confirmation page with status check link
8. Email confirmation sent
9. Order status changes → "Data Verification"
7.3 Order Status Check Workflow
text
1. Login → Dashboard
2. View orders table (default: sorted by most recent)
3. Apply filters if needed (status, date range)
4. Click order row → Order detail page
5. View:
   - Status timeline
   - Progress breakdown per service
   - Applicant info
   - Uploaded documents
6. Actions available based on status:
   - Download report (if completed)
   - Request update
   - Cancel order
   - Add note
8. INTEGRATIONS
8.1 Third-Party Services
Email Service
Provider: SendGrid or AWS SES

Templates for: Invitations, Status updates, Password reset, Invoices

Tracking: Open rates, click rates

SMS Service (Optional)
Provider: Twilio

Use cases: Invitation reminders, Status updates for urgent cases

Payment Gateway
Provider: Stripe or Square

Features: Credit card processing, ACH, Invoicing

Webhook handling for payment confirmations

File Storage
Provider: AWS S3 or MinIO (self-hosted)

Signed URLs with short expiry

Lifecycle policies: Archive to Glacier after 2 years

Background Check Vendors
Integration type: REST API or SFTP

Vendor examples: Sterling, Checkr, First Advantage (adapt as needed)

Webhook support for status updates

8.2 API for External Integrations
Client API (for ATS/HRMS integrations)
text
POST /api/v1/external/orders (Create order)
GET  /api/v1/external/orders/{id} (Get order status)
GET  /api/v1/external/reports/{orderId} (Download report)
POST /api/v1/external/webhook (Register webhook URL)
Authentication: API Key + Secret (HMAC signature)
Documentation: OpenAPI 3.0 specification with Swagger UI

9. PERFORMANCE REQUIREMENTS
9.1 Response Times
API endpoints: < 200ms (95th percentile)

Page load: < 2 seconds (initial load)

Search/filter: < 500ms

File upload: Background with progress indicator

9.2 Scalability
Support 1,000+ concurrent users

Handle 10,000 orders per day

Database connection pooling (min: 10, max: 100)

Redis caching for frequently accessed data (TTL: 5 minutes)

CDN for static assets

9.3 Availability
Uptime target: 99.5%

Graceful degradation if third-party services fail

Health check endpoint: GET /health

Database failover ready (read replicas)

10. DEPLOYMENT STRATEGY
10.1 Environment Setup
text
Development → Staging → Production

Development:
- Local Docker Compose setup
- Hot reload enabled
- Debug logging
- Test data seeding

Staging:
- Mirror of production architecture
- CI/CD automated deployments
- Integration testing
- Load testing

Production:
- High availability setup
- Auto-scaling enabled
- Monitoring & alerting
- Automated backups (daily)
10.2 Docker Compose Configuration
text
services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: chexpro
      POSTGRES_USER: admin
      POSTGRES_PASSWORD: <secure_password>
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
  
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
  
  backend:
    build: ./backend
    environment:
      DATABASE_URL: postgresql://admin:<password>@postgres:5432/chexpro
      REDIS_URL: redis://redis:6379
      JWT_SECRET: <secure_secret>
      AWS_ACCESS_KEY: <key>
      AWS_SECRET_KEY: <secret>
      AWS_S3_BUCKET: chexpro-documents
    depends_on:
      - postgres
      - redis
    ports:
      - "3000:3000"
  
  frontend:
    build: ./frontend
    environment:
      REACT_APP_API_URL: http://localhost:3000/api
    ports:
      - "80:80"
    depends_on:
      - backend
  
  nginx:
    image: nginx:alpine
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
    ports:
      - "443:443"
    depends_on:
      - frontend
      - backend
10.3 CI/CD Pipeline
text
1. Code push to Git repository
2. Run linter & code quality checks
3. Run unit tests (backend & frontend)
4. Build Docker images
5. Push images to registry
6. Deploy to staging
7. Run integration tests
8. Manual approval gate
9. Deploy to production
10. Run smoke tests
11. Notify team (Slack/Email)
11. TESTING STRATEGY
11.1 Test Coverage Requirements
Backend: 80%+ code coverage

Frontend: 70%+ code coverage

Critical paths: 100% coverage

11.2 Test Types
Unit Tests
All service functions

Utility functions

React components (Jest + React Testing Library)

Integration Tests
API endpoint testing (Supertest)

Database operations

Third-party service mocks

E2E Tests
Playwright or Cypress

Critical user journeys:

Login → Create order → Submit

Applicant portal completion

Status check → Download report

Performance Tests
Load testing with k6 or Artillery

Simulate 500 concurrent users

Measure response times under load

Security Tests
OWASP Top 10 vulnerability scanning

Dependency vulnerability checks (npm audit, Snyk)

Penetration testing (pre-launch)

12. MONITORING & OBSERVABILITY
12.1 Application Monitoring
Tool: Prometheus + Grafana OR New Relic

Metrics:

Request rate, error rate, duration (RED method)

CPU, memory, disk usage

Database query performance

Queue length (Bull)

Cache hit rate (Redis)

12.2 Logging
Tool: Winston (backend) + LogRocket (frontend)

Log Levels: ERROR, WARN, INFO, DEBUG

Structured logging: JSON format

Retention: 90 days (compress and archive after 30 days)

12.3 Alerting
Tool: PagerDuty or OpsGenie

Alert Conditions:

Error rate > 5% for 5 minutes

API response time > 1s (95th percentile)

Database connection failures

Disk usage > 85%

Failed background jobs

13. DEVELOPMENT PHASES
Phase 1: MVP (6-8 weeks)
Authentication system

Client dashboard (basic)

Order creation (single order, manual entry)

Applicant data entry (client-entered only)

Order list with basic filtering

Order detail view

File upload capability

Email notifications (basic templates)

Phase 2: Core Features (4-6 weeks)
Applicant self-service portal

Invitation system (email)

Real-time status updates (WebSocket)

Advanced filtering & search

Order timeline with detailed tracking

Report generation & download

User management

Role-based access control

Phase 3: Advanced Features (4-6 weeks)
Bulk order upload (CSV)

Custom package builder

Client branding & theme customization

Reporting & analytics dashboard

API for external integrations

SMS notifications

Multi-language support

Auto-save drafts

Phase 4: Optimization & Scale (3-4 weeks)
Performance optimization

Caching implementation

Load testing & tuning

Security hardening

Documentation (API docs, user guides)

Training materials

Production deployment

14. DOCUMENTATION REQUIREMENTS
14.1 Technical Documentation
API documentation (Swagger/OpenAPI)

Database schema diagrams

Architecture diagrams (C4 model)

Deployment runbooks

Disaster recovery procedures

14.2 User Documentation
User manual (client portal)

Applicant portal guide

Video tutorials (screen recordings)

FAQ section

Troubleshooting guide

14.3 Developer Documentation
Setup instructions (local development)

Code style guide

Git workflow

PR review checklist

Onboarding guide for new developers

15. SUCCESS METRICS
15.1 Technical KPIs
System uptime: > 99.5%

API response time: < 200ms (p95)

Bug density: < 1 critical bug per month

Test coverage: > 80%

Deployment frequency: Weekly

15.2 Business KPIs
Order completion rate: > 90%

Average order turnaround time: Track and optimize

User satisfaction (NPS): > 8.0

Support ticket volume: Decreasing trend

Client retention rate: > 95%

16. APPENDICES
16.1 Glossary
Applicant: Individual being screened

Client: Company/organization using Chexpro services

Order: Single background check request

Package: Pre-configured bundle of services

Service: Individual check type (e.g., criminal record check)

Turnaround Time: Days from order submission to report completion

16.2 Sample Data Structures
Order Object (JSON)
json
{
  "id": "uuid",
  "orderNumber": "CHX-20260217-0001",
  "clientId": "uuid",
  "createdBy": {
    "userId": "uuid",
    "name": "John Doe",
    "email": "john@company.com"
  },
  "package": {
    "id": "uuid",
    "name": "Standard Employment Package",
    "services": [
      {"id": "uuid", "name": "Criminal Record Check", "status": "completed"},
      {"id": "uuid", "name": "Employment Verification", "status": "in_progress"}
    ]
  },
  "applicant": {
    "id": "uuid",
    "firstName": "Jane",
    "lastName": "Smith",
    "email": "jane.smith@email.com",
    "phone": "+1-555-0100"
  },
  "status": "in_progress",
  "completionPercentage": 50,
  "totalPrice": 89.99,
  "referenceNumber": "EMP-2024-123",
  "positionTitle": "Software Developer",
  "department": "Engineering",
  "submittedAt": "2026-02-15T10:30:00Z",
  "estimatedCompletionDate": "2026-02-22T10:30:00Z",
  "createdAt": "2026-02-15T09:00:00Z",
  "updatedAt": "2026-02-17T16:00:00Z"
}
17. NEXT STEPS FOR AI CODING AGENT
17.1 Initial Setup Tasks
Create project structure (mono-repo or separate repos)

Initialize frontend (Create React App + TypeScript)

Initialize backend (Express + TypeScript)

Setup Docker Compose with PostgreSQL and Redis

Configure ESLint, Prettier, Husky for code quality

Setup Git repository with branch protection

Create initial database schema with Prisma/TypeORM

Implement authentication module (JWT)

Create base UI components (shadcn/ui setup)

Setup CI/CD pipeline (GitHub Actions or GitLab CI)

17.2 Development Priority Order
Week 1-2: Authentication, database setup, basic API structure

Week 3-4: Client dashboard, order creation (manual entry)

Week 5-6: Applicant data entry, document upload

Week 7-8: Order management, status tracking, basic notifications

Week 9-10: Applicant self-service portal

Week 11-12: Real-time updates, timeline tracking

Week 13-14: Reporting, analytics, user management

Week 15-16: Bulk operations, advanced features

Week 17-18: Testing, optimization, documentation

Week 19-20: Staging deployment, UAT, production launch

17.3 Questions for Clarification
Before starting development, please confirm:

Preferred hosting environment (AWS, Azure, Google Cloud, or self-hosted)?

Expected initial user volume?

Integration requirements with existing systems?

Specific background check vendor APIs to integrate?

Payment processing requirements (immediate or invoicing)?

Regulatory compliance requirements specific to your target markets?

Document Version: 1.0
Last Updated: February 17, 2026
Prepared By: CTO, Chexpro.com
Review Status: Ready for Development


Chexpro.com Client Portal - Technical Specification Document v2.0
Enhanced Feature Set + OCI Deployment Architecture
Version: 2.0 (Enhanced)
Date: February 17, 2026
Previous Version: 1.0
Environment: Oracle Cloud Infrastructure (Toronto)

WHAT'S NEW IN v2.0
This enhanced specification adds 15 critical feature categories identified through industry research and OCI-specific deployment architecture tailored to your existing infrastructure.

Major Additions:
FCRA-Compliant Adverse Action Workflow

Automated Adjudication & Decision Matrix

Continuous Monitoring & Rescreening

Enhanced Candidate Experience Features

Workflow Automation Engine

Advanced Compliance Tools

White-Label & Multi-Tenant Support

Document Verification (OCR/AI)

Geolocation & Ban-the-Box Compliance

Enhanced Security Features

Dispute Resolution Management

Client Billing & Invoicing Portal

Advanced Analytics & Benchmarking

Mobile Applications (iOS/Android)

SSO & Enterprise Integrations

SECTION 1: OCI DEPLOYMENT ARCHITECTURE
1.1 Infrastructure Configuration (Based on Your Current Setup)
**Existing OCI Environment **
​
Tenancy: Chexpro (Canada Southeast - Toronto)

Compute: chexpro-main-server (VM.Standard.A1.Flex: 4 OCPUs, 24 GB RAM)

OS: Ubuntu 24.04

Database: OCI MySQL Database Service (Always Free: 1 ECPU)

Network: chexpro-vcn (10.0.0.0/16 CIDR)

Public IP: 132.145.96.174

Current Services Running:
Nginx 1.24.0 (Web server/Reverse proxy)

Node.js v22.18.0 / Express (Backend API)

PM2 6.0.8 (Process manager)

Docker Engine 27.5.1 + Docker Compose

PostgreSQL 16.9 (for Odoo)

Odoo 18.0, n8n, Mautic, SuiteCRM

UFW Firewall

Fail2Ban v1.0.2

1.2 Deployment Strategy for Client Portal
Option A: Separate Subdomain Deployment (Recommended)
Deploy the new client portal as portal.chexpro.com on the existing server.

Architecture:

text
Internet → Nginx (443) → Reverse Proxy Routes:
  ├─ portal.chexpro.com → React Client Portal (Port 3001)
  ├─ api.chexpro.com → Node.js API (Port 3002)
  ├─ chexpro.com → Existing marketing site
  ├─ n8n.chexpro.com → Existing n8n (Port 5678)
  └─ internal.chexpro.com → Existing Homer dashboard
Database Strategy:

Create new database: chexpro_portal_db in existing OCI MySQL instance

Separate from marketing site database

Use dedicated MySQL user: portal_user (least privilege)

File Structure:

text
/var/www/
├── chexpro-frontend/          (existing marketing site)
├── chexpro-backend/           (existing API)
├── portal-frontend/           (NEW - client portal React app)
├── portal-backend/            (NEW - portal API)
└── portal-frontend-build/     (NEW - staging/build directory)
Option B: Dedicated OCI Instance (Future Scaling)
When load increases, provision a second VM specifically for the client portal.

Benefits:

Isolated resources

Independent scaling

Separate security boundaries

Zero impact on marketing site

1.3 Docker Compose Configuration for Portal
File: /opt/chexpro-portal/docker-compose.yml

text
version: '3.8'

services:
  portal-redis:
    image: redis:7-alpine
    container_name: chexpro-portal-redis
    restart: always
    ports:
      - "6380:6379"  # Avoid conflict with potential existing Redis
    volumes:
      - portal-redis-data:/data
    command: redis-server --appendonly yes
    networks:
      - portal-network

  portal-backend:
    build: ./backend
    container_name: chexpro-portal-api
    restart: always
    environment:
      NODE_ENV: production
      DATABASE_URL: ${DATABASE_URL}
      REDIS_URL: redis://portal-redis:6379
      JWT_SECRET: ${JWT_SECRET}
      JWT_REFRESH_SECRET: ${JWT_REFRESH_SECRET}
      SMTP_HOST: ${SMTP_HOST}
      SMTP_PORT: ${SMTP_PORT}
      SMTP_USER: ${SMTP_USER}
      SMTP_PASS: ${SMTP_PASS}
      AWS_S3_BUCKET: ${AWS_S3_BUCKET}
      AWS_ACCESS_KEY: ${AWS_ACCESS_KEY}
      AWS_SECRET_KEY: ${AWS_SECRET_KEY}
      FRONTEND_URL: https://portal.chexpro.com
    ports:
      - "127.0.0.1:3002:3000"  # Only expose to localhost
    depends_on:
      - portal-redis
    networks:
      - portal-network
    volumes:
      - ./backend/logs:/app/logs
      - /var/log/chexpro-portal:/var/log/app

  portal-worker:
    build: ./backend
    container_name: chexpro-portal-worker
    restart: always
    command: npm run worker
    environment:
      NODE_ENV: production
      DATABASE_URL: ${DATABASE_URL}
      REDIS_URL: redis://portal-redis:6379
    depends_on:
      - portal-redis
    networks:
      - portal-network

volumes:
  portal-redis-data:

networks:
  portal-network:
    driver: bridge
1.4 Nginx Configuration for Portal
File: /etc/nginx/sites-available/portal.chexpro.com

text
# Portal Frontend
server {
    listen 443 ssl http2;
    server_name portal.chexpro.com;

    ssl_certificate /etc/letsencrypt/live/chexpro.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/chexpro.com/privkey.pem;
    include /etc/nginx/snippets/ssl-params.conf;

    root /var/www/portal-frontend/build;
    index index.html;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # Main SPA route
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Static assets caching
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Rate limiting for API requests
    limit_req_zone $binary_remote_addr zone=portal_api:10m rate=100r/m;
}

# Portal API
server {
    listen 443 ssl http2;
    server_name api.chexpro.com;

    ssl_certificate /etc/letsencrypt/live/chexpro.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/chexpro.com/privkey.pem;
    include /etc/nginx/snippets/ssl-params.conf;

    location / {
        limit_req zone=portal_api burst=20 nodelay;
        
        proxy_pass http://127.0.0.1:3002;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeout settings for long-running operations
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # WebSocket support for real-time updates
    location /ws {
        proxy_pass http://127.0.0.1:3002;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_read_timeout 86400;
    }
}
1.5 PM2 Process Management
File: /home/chexproadmin/pm2-ecosystem.config.js

javascript
module.exports = {
  apps: [
    {
      name: 'chexpro-backend',
      script: '/var/www/chexpro-backend/index.js',
      instances: 1,
      exec_mode: 'cluster',
      watch: false,
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      error_file: '/var/log/chexpro-portal/backend-error.log',
      out_file: '/var/log/chexpro-portal/backend-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
    },
    {
      name: 'portal-api',
      script: '/opt/chexpro-portal/backend/index.js',
      instances: 2,
      exec_mode: 'cluster',
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 3002
      },
      error_file: '/var/log/chexpro-portal/portal-api-error.log',
      out_file: '/var/log/chexpro-portal/portal-api-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
    },
    {
      name: 'portal-worker',
      script: '/opt/chexpro-portal/backend/worker.js',
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      max_memory_restart: '750M',
      env: {
        NODE_ENV: 'production'
      },
      error_file: '/var/log/chexpro-portal/worker-error.log',
      out_file: '/var/log/chexpro-portal/worker-out.log'
    },
    {
      name: 'n8n-service',
      script: 'n8n',
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      max_memory_restart: '500M'
    }
  ]
};
1.6 Backup Strategy Enhancement
Update existing backup scripts to include portal data.

Update: /home/chexproadmin/db_backup.sh

bash
#!/bin/bash
# Add portal database backup
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Existing databases...
# Add portal database
mysqldump --single-transaction -h <oci-mysql-endpoint> \
  -u portal_user -p"${PORTAL_DB_PASSWORD}" \
  chexpro_portal_db | gzip > portal_db_${TIMESTAMP}.sql.gz

# Upload to OCI bucket
oci os object put --bucket-name chexpro-backups \
  --file portal_db_${TIMESTAMP}.sql.gz \
  --name backups/portal/db/portal_db_${TIMESTAMP}.sql.gz
SECTION 2: CRITICAL MISSING FEATURES
2.1 FCRA-Compliant Adverse Action Workflow
**Overview **
The Fair Credit Reporting Act (FCRA) requires a specific multi-step process before taking adverse employment action based on background check information.
​

Feature Requirements:
Two-Step Process:

Step 1: Pre-Adverse Action Notice

Must include: Copy of background check report, FCRA Summary of Rights, 5-7 business day waiting period

System automatically generates compliant letters

Tracks delivery method (email/mail) and timestamp

Candidate can dispute findings during waiting period

Step 2: Final Adverse Action Notice

Sent only after waiting period expires

Includes: Final decision, CRA contact information, Right to dispute with CRA, Not required to dispute with employer first

Tracks all communications for audit trail

Technical Implementation:
New Database Tables:

sql
CREATE TABLE adverse_actions (
  id UUID PRIMARY KEY,
  order_id UUID REFERENCES orders(id),
  status ENUM('initiated', 'pre_notice_sent', 'waiting_period', 'candidate_responded', 'final_notice_sent', 'completed', 'cancelled'),
  pre_notice_sent_at TIMESTAMP,
  pre_notice_method VARCHAR(50),
  waiting_period_end TIMESTAMP,
  candidate_response TEXT,
  candidate_response_at TIMESTAMP,
  final_notice_sent_at TIMESTAMP,
  final_decision VARCHAR(100),
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

CREATE TABLE adverse_action_documents (
  id UUID PRIMARY KEY,
  adverse_action_id UUID REFERENCES adverse_actions(id),
  document_type VARCHAR(100), -- 'pre_notice', 'final_notice', 'candidate_response'
  file_path VARCHAR(500),
  sent_to VARCHAR(255),
  sent_at TIMESTAMP,
  delivery_status VARCHAR(50)
);
API Endpoints:

text
POST /api/orders/{id}/adverse-action/initiate
GET  /api/orders/{id}/adverse-action/status
POST /api/orders/{id}/adverse-action/send-pre-notice
POST /api/adverse-action/{id}/candidate-response
POST /api/orders/{id}/adverse-action/send-final-notice
GET  /api/adverse-action/{id}/audit-trail
Automated Workflow:

Client marks order for adverse action

System validates all required documents are present

Automatically generates pre-adverse action letter (PDF)

Sends via email + certified mail option

Starts 5-business-day countdown timer (excluding weekends)

Sends reminder notifications to client at day 4

After waiting period: Enables "Send Final Notice" button

Logs all actions for compliance audit

UI Components:

Adverse Action wizard with progress steps

Document preview and editing

Countdown timer display

Candidate response portal (public, token-based access)

Audit trail timeline view

2.2 Automated Adjudication & Decision Matrix
**Overview **
An adjudication matrix allows consistent, fair, and automated evaluation of background check results.

Matrix Factors:
Time: How long ago did the offense occur?

Nature: What type of offense? (violent, financial, drug-related, traffic)

Severity: Felony vs. misdemeanor vs. infraction

Role Relevance: Does the offense relate to job duties?

Conviction vs. Charge: Was there a conviction or just charges?

Rehabilitation: Evidence of rehabilitation (time passed, certificates, references)

Technical Implementation:
Database Schema:

sql
CREATE TABLE adjudication_matrices (
  id UUID PRIMARY KEY,
  client_id UUID REFERENCES clients(id),
  name VARCHAR(255),
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

CREATE TABLE adjudication_rules (
  id UUID PRIMARY KEY,
  matrix_id UUID REFERENCES adjudication_matrices(id),
  rule_order INTEGER,
  position_category VARCHAR(100), -- 'all', 'financial', 'healthcare', 'driver', etc.
  offense_type VARCHAR(100),
  severity VARCHAR(50), -- 'felony', 'misdemeanor', 'infraction'
  lookback_years INTEGER, -- How far back to consider
  decision ENUM('auto_approve', 'auto_reject', 'manual_review', 'conditional'),
  conditions JSONB, -- Additional conditions (e.g., "if_no_other_offenses": true)
  notes TEXT,
  created_at TIMESTAMP
);

CREATE TABLE order_adjudications (
  id UUID PRIMARY KEY,
  order_id UUID REFERENCES orders(id),
  matrix_id UUID REFERENCES adjudication_matrices(id),
  automated_decision VARCHAR(50), -- 'approved', 'rejected', 'requires_review'
  decision_reasoning JSONB, -- Which rules were triggered
  manual_override BOOLEAN DEFAULT false,
  manual_decision VARCHAR(50),
  manual_decision_by UUID REFERENCES users(id),
  manual_decision_notes TEXT,
  final_decision VARCHAR(50),
  decided_at TIMESTAMP,
  created_at TIMESTAMP
);
Features:

Matrix Builder UI:

Drag-and-drop rule builder

Visual decision tree representation

Template library (Healthcare, Financial Services, Retail, etc.)

Rule simulation/testing with sample cases

Version history and rollback

Automated Adjudication Engine:

javascript
// Pseudo-code for adjudication logic
function adjudicateOrder(order, backgroundReport, matrix) {
  const findings = backgroundReport.findings;
  let decision = 'approved';
  let reasoning = [];

  for (const rule of matrix.rules) {
    for (const finding of findings) {
      if (matchesRule(finding, rule)) {
        if (isWithinLookback(finding.date, rule.lookback_years)) {
          if (rule.decision === 'auto_reject') {
            decision = 'rejected';
            reasoning.push({
              rule_id: rule.id,
              finding: finding,
              reason: rule.notes
            });
            break; // Stop processing
          } else if (rule.decision === 'manual_review') {
            decision = 'requires_review';
            reasoning.push({
              rule_id: rule.id,
              finding: finding,
              reason: rule.notes
            });
          }
        }
      }
    }
    if (decision === 'rejected') break;
  }

  return { decision, reasoning };
}
Dashboard Metrics:

Auto-approval rate

Manual review queue size

Average adjudication time

Decision breakdown by offense type

Adverse action rate

API Endpoints:

text
GET  /api/adjudication/matrices
POST /api/adjudication/matrices
PUT  /api/adjudication/matrices/{id}
POST /api/adjudication/matrices/{id}/simulate
GET  /api/orders/{id}/adjudication
POST /api/orders/{id}/adjudication/manual-override
GET  /api/adjudication/queue (pending manual reviews)
2.3 Continuous Monitoring & Rescreening
**Overview **
Continuous monitoring provides ongoing visibility into employee records after hire, alerting to new criminal records, license suspensions, or other changes.
​

Features:
1. Continuous Monitoring Service

Real-time monitoring of employee records

Monitors: Criminal records, Driving records, Professional licenses, Sex offender registries, Global watchlists

Configurable alert thresholds per client

Automatic notifications when changes detected

2. Periodic Rescreening

Scheduled rescreening (annual, biannual, on promotion)

Automated reminders to initiate rescreening

Comparison reports: Original vs. Current screening

Batch rescreening for entire departments

3. Role-Based Monitoring

High-risk roles: Continuous monitoring

Standard roles: Annual rescreening

Low-risk roles: Every 3 years or on promotion

Technical Implementation:
Database Schema:

sql
CREATE TABLE monitoring_enrollments (
  id UUID PRIMARY KEY,
  client_id UUID REFERENCES clients(id),
  employee_id VARCHAR(255), -- Client's internal employee ID
  applicant_id UUID REFERENCES applicants(id),
  original_order_id UUID REFERENCES orders(id),
  monitoring_type ENUM('continuous', 'periodic'),
  monitoring_scope JSONB, -- Which checks to monitor
  frequency VARCHAR(50), -- 'realtime', 'daily', 'annual'
  status ENUM('active', 'paused', 'cancelled'),
  enrolled_at TIMESTAMP,
  last_check_at TIMESTAMP,
  next_check_at TIMESTAMP,
  created_at TIMESTAMP
);

CREATE TABLE monitoring_alerts (
  id UUID PRIMARY KEY,
  enrollment_id UUID REFERENCES monitoring_enrollments(id),
  alert_type VARCHAR(100),
  severity VARCHAR(50), -- 'critical', 'high', 'medium', 'low'
  description TEXT,
  details JSONB,
  status ENUM('new', 'reviewed', 'dismissed', 'actioned'),
  reviewed_by UUID REFERENCES users(id),
  reviewed_at TIMESTAMP,
  action_taken TEXT,
  created_at TIMESTAMP
);

CREATE TABLE rescreening_schedules (
  id UUID PRIMARY KEY,
  client_id UUID REFERENCES clients(id),
  position_category VARCHAR(100),
  frequency_months INTEGER,
  auto_initiate BOOLEAN DEFAULT false,
  package_id UUID REFERENCES packages(id),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP
);
Workflow:

Client enrolls employee in monitoring program

System polls vendor APIs daily for updates

When change detected: Create alert, Notify client, Optionally trigger full rescreen

Client reviews alert and takes action

Document all decisions for compliance

API Endpoints:

text
POST /api/monitoring/enroll
PUT  /api/monitoring/{id}/pause
PUT  /api/monitoring/{id}/cancel
GET  /api/monitoring/alerts?status=new
POST /api/monitoring/alerts/{id}/review
POST /api/rescreening/schedule
POST /api/rescreening/batch-initiate
GET  /api/monitoring/dashboard-stats
UI Components:

Monitoring dashboard with alert feed

Employee list with monitoring status

Alert detail view with recommended actions

Batch enrollment tool (CSV upload)

Rescreening calendar view

2.4 Enhanced Candidate Experience
Features:
1. Mobile-Optimized Portal

Fully responsive design (mobile-first)

Native-like PWA experience

Offline form saving with sync

Camera integration for document upload

Biometric authentication (fingerprint/face ID)

2. Real-Time Progress Tracking

Visual progress bar with milestones

Estimated completion time

Push notifications for status updates

SMS updates for major milestones

3. Smart Form Experience

Auto-save every 30 seconds

Address autocomplete (Google Places API)

Copy previous address feature

Smart date pickers

Conditional field display (show/hide based on answers)

4. Pre-Filling & Data Portability

Resume parsing (PDF/DOCX) to auto-fill employment history

LinkedIn profile import

Previous screening data reuse (with consent)

Export personal data (GDPR right to portability)

5. Multilingual Support

English, French (Canadian), Spanish

Language selector on welcome page

Localized date/currency formats

RTL support for future languages (Arabic, Hebrew)

6. Accessibility (WCAG 2.1 AA Compliance)

Screen reader compatible

Keyboard navigation

High contrast mode

Adjustable font sizes

Alt text for all images

7. Transparent Timeline

"What happens next" section

Visual timeline with explanations

FAQ section specific to current step

Live chat support widget

8. Branded Experience

Client logo display

Custom welcome message from hiring manager

Company culture video/images

Direct link to employer's career page

Technical Implementation:
Resume Parser Integration:

javascript
// Using Affinda or similar API
POST /api/applicants/parse-resume
Body: { file: <multipart/form-data> }
Response: {
  personal_info: { name, email, phone },
  work_experience: [ { employer, title, dates, description } ],
  education: [ { institution, degree, dates } ],
  skills: [],
  confidence_scores: {}
}
Push Notifications:

Web Push API for browser notifications

Firebase Cloud Messaging (FCM) for future mobile apps

Service worker for offline notification queuing

Progress Tracking WebSocket:

javascript
// Real-time status updates
const ws = new WebSocket('wss://api.chexpro.com/ws/order/status/{orderId}');
ws.onmessage = (event) => {
  const update = JSON.parse(event.data);
  // Update UI: { status: 'in_progress', completion: 45, message: '...' }
};
2.5 Workflow Automation Engine (n8n Integration)
Overview
Leverage your existing n8n installation to create powerful workflow automations.
​

Use Cases:
1. Lead-to-Order Automation

When lead submitted via marketing site → Create client account → Send welcome email + setup link

2. Order Status Notifications

Order status changes → Trigger n8n workflow → Send email/SMS → Update CRM (SuiteCRM)

3. Compliance Reminders

Daily cron: Check for expiring consents → Send renewal requests

Weekly: Check for stale orders (no activity 14+ days) → Notify account manager

4. Adverse Action Automation

Adverse action initiated → Generate documents → Send via email → Schedule calendar reminder for day 5

5. Billing & Invoicing

End of month → Query completed orders → Generate invoices → Send to clients → Log in Odoo

6. Integration with Background Check Vendors

Order submitted → Format request for vendor API → Submit to Sterling/Checkr → Poll for results → Update order status

7. Quality Assurance

Order completed → Random selection (10%) → Assign to QA team → Review checklist → Approve or flag for correction

8. Client Onboarding

New client signup → Send to approval queue → Approved → Create accounts in all systems → Schedule kickoff call

n8n Workflow Examples:
Workflow 1: Order Status Update

text
Trigger: Webhook (POST /webhook/order-status-update)
↓
Node: HTTP Request (Get order details from Portal API)
↓
Node: Switch (Route based on status)
  ├─ If "Completed" → Send email with report link
  ├─ If "Requires Action" → Send urgent SMS + email
  └─ If "In Progress" → Update SuiteCRM deal stage
↓
Node: MySQL (Log notification in portal database)
Workflow 2: Adverse Action Day 5 Reminder

text
Trigger: Cron (Daily at 9 AM)
↓
Node: MySQL (Query adverse_actions where waiting_period_end = TODAY)
↓
Node: Loop (For each record)
  ├─ HTTP Request (Get client + applicant details)
  ├─ Email (Send reminder to client)
  └─ MySQL (Update adverse_action status)
Technical Implementation:
Portal → n8n Webhooks:

javascript
// In portal backend, trigger n8n workflow
const triggerN8nWorkflow = async (workflowName, payload) => {
  await axios.post(`https://n8n.chexpro.com/webhook/${workflowName}`, payload, {
    headers: { 'Authorization': `Bearer ${process.env.N8N_API_KEY}` }
  });
};

// Example usage
await triggerN8nWorkflow('order-status-update', {
  orderId: order.id,
  status: order.status,
  clientId: order.clientId
});
2.6 Document Verification & OCR
Features:
​
1. AI-Powered Document Classification

Auto-detect document type (driver's license, passport, utility bill, etc.)

Extract relevant fields using OCR

Validate document authenticity

2. ID Verification

Real-time ID verification API (Onfido, Jumio, Veriff)

Liveness detection (selfie verification)

Document tampering detection

Age verification

3. OCR for Form Auto-Fill

Upload driver's license → Auto-fill name, DOB, address

Upload utility bill → Extract and validate address

Upload diploma → Extract institution, degree, graduation date

4. Fraud Detection

Check for common forgery patterns

Cross-reference extracted data with databases

Flag suspicious documents for manual review

Technical Implementation:
OCR Service (AWS Textract or Google Cloud Vision):

javascript
// Extract text from uploaded ID
POST /api/documents/extract-data
Body: { documentId: 'uuid', documentType: 'drivers_license' }

Response: {
  extracted_data: {
    full_name: 'John Doe',
    date_of_birth: '1990-05-15',
    address: '123 Main St, Toronto, ON',
    license_number: 'D1234-56789-01234',
    expiration_date: '2027-05-15'
  },
  confidence_scores: {
    full_name: 0.98,
    date_of_birth: 0.95,
    ...
  },
  fraud_indicators: []
}
ID Verification Integration:

javascript
// Real-time ID check
POST /api/verification/id-check
Body: {
  applicantId: 'uuid',
  frontImageId: 'uuid',
  backImageId: 'uuid',
  selfieImageId: 'uuid'
}

Response: {
  verification_status: 'approved', // 'approved', 'rejected', 'review'
  overall_score: 0.92,
  checks: {
    document_authenticity: 'pass',
    liveness_detection: 'pass',
    face_match: 'pass',
    data_consistency: 'warning'
  },
  extracted_data: { ... }
}
2.7 Geolocation & Ban-the-Box Compliance
Features:
​
1. Automated Record Filtering

Based on job location, automatically filter records per state/local laws

Ban-the-box compliance: Hide criminal records until conditional offer

"7-year rule" for reporting criminal records (FCRA)

State-specific salary history bans

2. Geolocation-Aware Consent Forms

Detect applicant's location

Display state-specific consent language

Capture required disclosures per jurisdiction

Maintain audit trail of which version was shown

3. Multi-Jurisdiction Hiring

Client specifies job location

System automatically applies correct filtering rules

Alert if order violates local restrictions

4. Compliance Dashboard

Show which orders are subject to which laws

Flag potential compliance issues

Generate compliance reports for audits

Technical Implementation:
Compliance Rules Engine:

sql
CREATE TABLE compliance_rules (
  id UUID PRIMARY KEY,
  jurisdiction VARCHAR(100), -- 'CA-ON', 'US-CA', 'US-NY', 'US-FEDERAL'
  rule_type VARCHAR(100), -- 'ban_the_box', 'lookback_period', 'salary_history'
  effective_date DATE,
  rule_details JSONB,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP
);

-- Example rule for California Ban-the-Box
{
  "jurisdiction": "US-CA",
  "rule_type": "ban_the_box",
  "rule_details": {
    "applies_to": ["criminal_records"],
    "restriction": "Cannot ask about criminal history until conditional offer made",
    "exceptions": ["healthcare", "law_enforcement"],
    "effective_date": "2018-01-01"
  }
}
Filtering Logic:

javascript
function filterBackgroundReport(report, order, client) {
  const jobLocation = order.jobLocation; // 'US-CA', 'CA-ON'
  const applicableRules = getComplianceRules(jobLocation);
  
  let filteredReport = { ...report };
  
  for (const rule of applicableRules) {
    if (rule.rule_type === 'ban_the_box' && !order.conditionalOfferMade) {
      // Hide criminal records section
      delete filteredReport.criminal_records;
      filteredReport.compliance_note = "Criminal records hidden per CA Ban-the-Box law";
    }
    
    if (rule.rule_type === 'lookback_period') {
      // Filter records older than lookback period
      filteredReport = filterByLookback(filteredReport, rule.rule_details.years);
    }
  }
  
  return filteredReport;
}
2.8 Dispute Resolution Management
Features:
1. Candidate Dispute Portal

Secure, token-based access (no login required)

View background check report

Flag inaccurate information

Upload supporting documents

Track dispute status

2. Internal Dispute Workflow

Dispute received → Notify client → Pause adverse action (if applicable)

Assign to dispute resolution specialist

Research and verify information

Update report if changes needed

Notify candidate and client of resolution

3. Re-Investigation Process

Contact original data source

Request verification/correction

Document all communications

Update report with corrected information

Log resolution time for compliance

4. Audit Trail

Complete history of dispute

All documents submitted by candidate

All communications

Resolution decision and reasoning

Time to resolution

Technical Implementation:
Database Schema:

sql
CREATE TABLE disputes (
  id UUID PRIMARY KEY,
  order_id UUID REFERENCES orders(id),
  applicant_id UUID REFERENCES applicants(id),
  disputed_section VARCHAR(100), -- 'criminal_records', 'employment', 'education'
  dispute_reason TEXT,
  status ENUM('submitted', 'under_review', 'resolved', 'closed'),
  assigned_to UUID REFERENCES users(id),
  submitted_at TIMESTAMP,
  resolved_at TIMESTAMP,
  resolution_notes TEXT,
  created_at TIMESTAMP
);

CREATE TABLE dispute_communications (
  id UUID PRIMARY KEY,
  dispute_id UUID REFERENCES disputes(id),
  from_party VARCHAR(50), -- 'candidate', 'client', 'system'
  message TEXT,
  attachments JSONB,
  sent_at TIMESTAMP
);
API Endpoints:

text
POST /api/public/disputes (Candidate submits dispute)
GET  /api/disputes/{id}/status?token={token} (Candidate checks status)
GET  /api/disputes (Client views all disputes)
PUT  /api/disputes/{id}/assign
POST /api/disputes/{id}/messages
PUT  /api/disputes/{id}/resolve
2.9 Client Billing & Invoicing Portal
Features:
1. Transparent Pricing

Real-time cost calculator on order form

Volume discounts automatically applied

Monthly usage dashboard

Cost per hire metrics

2. Flexible Billing Models

Pay-per-check (credit card)

Prepaid credits (bulk purchase discounts)

Monthly invoicing (NET 30 for enterprise)

Subscription plans (unlimited checks up to X per month)

3. Automated Invoicing

Auto-generate invoices monthly

Send via email with PDF attachment

Payment reminders for overdue invoices

Late fee calculations (if applicable)

4. Payment Processing

Credit card (Stripe)

ACH/EFT

Wire transfer

Payment history and receipts

5. Budget Management

Set monthly budget caps

Alerts when approaching limit

Automatic order holds if budget exceeded (configurable)

Technical Implementation:
Database Schema:

sql
CREATE TABLE billing_accounts (
  id UUID PRIMARY KEY,
  client_id UUID REFERENCES clients(id),
  billing_model VARCHAR(50), -- 'pay_per_check', 'prepaid_credits', 'monthly_invoice', 'subscription'
  credit_balance DECIMAL(10,2) DEFAULT 0,
  monthly_budget DECIMAL(10,2),
  auto_recharge_enabled BOOLEAN DEFAULT false,
  auto_recharge_threshold DECIMAL(10,2),
  auto_recharge_amount DECIMAL(10,2),
  created_at TIMESTAMP
);

CREATE TABLE invoices (
  id UUID PRIMARY KEY,
  invoice_number VARCHAR(50) UNIQUE,
  client_id UUID REFERENCES clients(id),
  billing_period_start DATE,
  billing_period_end DATE,
  subtotal DECIMAL(10,2),
  tax DECIMAL(10,2),
  total DECIMAL(10,2),
  status ENUM('draft', 'sent', 'paid', 'overdue', 'cancelled'),
  due_date DATE,
  sent_at TIMESTAMP,
  paid_at TIMESTAMP,
  payment_method VARCHAR(50),
  created_at TIMESTAMP
);

CREATE TABLE invoice_line_items (
  id UUID PRIMARY KEY,
  invoice_id UUID REFERENCES invoices(id),
  order_id UUID REFERENCES orders(id),
  description VARCHAR(255),
  quantity INTEGER,
  unit_price DECIMAL(10,2),
  total DECIMAL(10,2)
);

CREATE TABLE payments (
  id UUID PRIMARY KEY,
  client_id UUID REFERENCES clients(id),
  invoice_id UUID REFERENCES invoices(id),
  amount DECIMAL(10,2),
  payment_method VARCHAR(50),
  transaction_id VARCHAR(255),
  status VARCHAR(50),
  processed_at TIMESTAMP,
  created_at TIMESTAMP
);
Stripe Integration:

javascript
// Create payment intent
POST /api/billing/payment-intent
Body: { amount: 150.00, currency: 'CAD' }
Response: { clientSecret: '...' }

// Webhook handler for payment confirmation
POST /api/webhooks/stripe
Body: { type: 'payment_intent.succeeded', data: {...} }
→ Update invoice status, send receipt email
Monthly Invoice Generation (n8n workflow):

text
Trigger: Cron (1st of every month at midnight)
↓
Node: MySQL (Get all clients with 'monthly_invoice' billing model)
↓
Node: Loop (For each client)
  ├─ MySQL: Query completed orders in previous month
  ├─ Calculate: Sum total costs
  ├─ HTTP: Generate PDF invoice (using puppeteer service)
  ├─ MySQL: Create invoice record
  ├─ Email: Send invoice with PDF attachment
  └─ MySQL: Log invoice sent
2.10 Advanced Analytics & Benchmarking
Features:
1. Client Analytics Dashboard

Time-to-fill metrics

Offer acceptance rate

Background check pass/fail rates

Cost per hire

Turnaround time trends

Most common disqualifications

2. Industry Benchmarking

Compare your metrics to industry averages (anonymized)

Percentile rankings (e.g., "Your turnaround time is faster than 78% of similar companies")

Best practices recommendations

3. Predictive Analytics

Predict order completion time based on package and location

Forecast monthly costs based on hiring patterns

Identify bottlenecks in your screening process

4. Custom Reports

Report builder with drag-and-drop

Schedule automated report delivery

Export to Excel/PDF

Share reports with stakeholders

5. Data Visualization

Interactive charts and graphs

Drill-down capabilities

Date range comparisons

Cohort analysis

Technical Implementation:
Analytics Database (Separate Read Replica or Data Warehouse):

Use OCI MySQL read replica for reporting queries

Or setup dedicated PostgreSQL for analytics (better for complex queries)

Pre-Aggregated Metrics Tables:

sql
CREATE TABLE analytics_daily_metrics (
  id UUID PRIMARY KEY,
  client_id UUID REFERENCES clients(id),
  date DATE,
  orders_submitted INTEGER,
  orders_completed INTEGER,
  avg_turnaround_hours DECIMAL(10,2),
  total_cost DECIMAL(10,2),
  pass_rate DECIMAL(5,2),
  created_at TIMESTAMP
);

CREATE TABLE analytics_order_funnels (
  id UUID PRIMARY KEY,
  client_id UUID,
  funnel_stage VARCHAR(100),
  count INTEGER,
  avg_time_in_stage_hours DECIMAL(10,2),
  date DATE
);
Analytics API:

text
GET /api/analytics/dashboard?startDate=2026-01-01&endDate=2026-02-17
GET /api/analytics/turnaround-time?groupBy=package&period=monthly
GET /api/analytics/cost-trends?period=weekly
GET /api/analytics/benchmarking?industry=technology&companySize=50-200
POST /api/analytics/custom-report (Save custom report definition)
GET /api/analytics/reports/{id}/data (Run saved report)
Charting Library:

Frontend: Recharts or Chart.js

Backend PDF generation: Puppeteer to screenshot charts

2.11 White-Label & Multi-Tenant Support
Features:
1. White-Label Portal

Custom domain (checks.clientdomain.com)

Client branding (logo, colors, fonts)

Custom email templates with client branding

Remove Chexpro branding (for premium clients)

2. Multi-Tenant Architecture

Complete data isolation between clients

Separate databases per tenant (optional) or row-level security

Tenant-specific configurations

Per-tenant feature flags

3. Reseller/Partner Program

Partners can resell Chexpro services under their brand

Commission tracking

Partner portal for managing sub-clients

White-label API access

Technical Implementation:
Tenant Identification:

javascript
// Middleware to identify tenant from subdomain or custom domain
app.use((req, res, next) => {
  const hostname = req.hostname;
  
  if (hostname.includes('chexpro.com')) {
    // Extract subdomain: portal.chexpro.com → 'portal'
    const subdomain = hostname.split('.')[0];
    req.tenant = await getTenantBySubdomain(subdomain);
  } else {
    // Custom domain: checks.acmecorp.com
    req.tenant = await getTenantByCustomDomain(hostname);
  }
  
  if (!req.tenant) {
    return res.status(404).send('Tenant not found');
  }
  
  next();
});
Database Row-Level Security:

sql
-- All queries automatically filtered by client_id
-- Using PostgreSQL RLS (if switching from MySQL)
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON orders
  USING (client_id = current_setting('app.current_tenant')::uuid);

-- Set tenant context at connection level
SET app.current_tenant = 'client-uuid-here';
Custom Branding Storage:

sql
CREATE TABLE client_branding (
  id UUID PRIMARY KEY,
  client_id UUID REFERENCES clients(id),
  custom_domain VARCHAR(255),
  logo_url VARCHAR(500),
  primary_color VARCHAR(7),
  secondary_color VARCHAR(7),
  font_family VARCHAR(100),
  remove_chexpro_branding BOOLEAN DEFAULT false,
  email_header_html TEXT,
  email_footer_html TEXT,
  custom_css TEXT,
  created_at TIMESTAMP
);
2.12 SSO & Enterprise Integrations
Features:
1. Single Sign-On (SSO)

SAML 2.0 support

OAuth 2.0 / OpenID Connect

Support for major IdPs: Okta, Azure AD, Google Workspace, OneLogin

2. ATS Integration

Direct integration with: Greenhouse, Lever, Workday, BambooHR, iCIMS

Bidirectional sync: Orders created in ATS auto-sync to Chexpro, Status updates flow back to ATS

Candidate data auto-populated

3. HRIS Integration

Integration with: Workday, SAP SuccessFactors, Oracle HCM, ADP

Employee lifecycle events trigger rescreening

Sync employee data for continuous monitoring

4. API for Custom Integrations

RESTful API with comprehensive documentation

Webhook support for real-time updates

SDK libraries (Node.js, Python, PHP)

5. Zapier/Make Integration

Pre-built Zaps/Scenarios for common workflows

Trigger: Order status change → Action: Update Google Sheets

Trigger: New hire in BambooHR → Action: Create background check order

Technical Implementation:
SAML 2.0 Configuration:

javascript
// Using passport-saml
const saml = require('passport-saml');

passport.use(new saml.Strategy({
  entryPoint: 'https://client-idp.com/saml/sso',
  issuer: 'portal.chexpro.com',
  cert: fs.readFileSync('idp-cert.pem', 'utf-8'),
  callbackUrl: 'https://portal.chexpro.com/auth/saml/callback'
}, (profile, done) => {
  // Map SAML profile to user
  const user = {
    email: profile.email,
    firstName: profile.firstName,
    lastName: profile.lastName,
    clientId: profile['custom:clientId']
  };
  return done(null, user);
}));
ATS Webhook Integration:

javascript
// Greenhouse webhook receiver
POST /api/webhooks/greenhouse
Body: {
  action: 'candidate_stage_change',
  payload: {
    candidate: { id, name, email },
    stage: 'background_check',
    job: { id, title }
  }
}

// Handler
async function handleGreenhouseWebhook(payload) {
  if (payload.stage === 'background_check') {
    // Auto-create order
    const order = await createOrder({
      clientId: getClientByGreenhouseId(payload.account_id),
      applicantData: payload.candidate,
      positionTitle: payload.job.title,
      externalId: payload.candidate.id,
      externalSystem: 'greenhouse'
    });
    
    // Send status update back to Greenhouse
    await greenhouseApi.updateCandidate(payload.candidate.id, {
      custom_field: { background_check_order_id: order.id }
    });
  }
}
2.13 Mobile Applications (Future Phase)
Features:
1. Native iOS/Android Apps

React Native for cross-platform development

Full feature parity with web portal

Biometric authentication

Push notifications

Offline mode with sync

2. Client Mobile App

View and manage orders on-the-go

Approve/reject candidates

Receive push notifications for urgent items

View reports

3. Applicant Mobile App

Complete background check from phone

Take photos of documents with camera

E-signature with finger/stylus

Check status anytime

4. Field Manager App (for staffing agencies)

Batch-initiate checks for multiple candidates

On-site document collection

Quick status lookup via barcode/QR code

2.14 Enhanced Security Features
Additional Security Layers:
1. Two-Factor Authentication (2FA)

TOTP (Google Authenticator, Authy)

SMS backup codes

Enforced for admin accounts

Optional for standard users

2. IP Whitelisting

Restrict access to specific IP ranges

Useful for enterprise clients with static IPs

3. Session Management

Concurrent session limits

Device tracking and management

"Logout from all devices" feature

Session timeout after inactivity (configurable)

4. Audit Logging

Log all user actions

Immutable audit trail

SIEM integration ready (export to Splunk, LogRhythm)

Tamper-proof logging (blockchain-based optional)

5. Data Loss Prevention (DLP)

Prevent copy/paste of sensitive data

Watermark on printed reports

Disable screenshot capability in mobile apps

Email encryption (PGP) for sensitive communications

6. Penetration Testing & Vulnerability Scanning

Quarterly automated scans (OWASP ZAP, Nessus)

Annual third-party pen test

Bug bounty program

Vulnerability disclosure policy

7. Encryption Enhancements

Field-level encryption for SIN/SSN

Encrypted backups

Key rotation policy (quarterly)

Hardware Security Module (HSM) for key storage (for enterprise tier)

Implementation:
2FA Setup:

javascript
// Using speakeasy library
const secret = speakeasy.generateSecret({ name: 'Chexpro Portal' });

// Save secret.base32 to user record
// Generate QR code for user to scan
const qrCode = await QRCode.toDataURL(secret.otpauth_url);

// Verify token
const verified = speakeasy.totp.verify({
  secret: user.twoFactorSecret,
  encoding: 'base32',
  token: userEnteredToken,
  window: 2
});
Audit Logging:

sql
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  client_id UUID,
  action VARCHAR(100), -- 'order_created', 'report_downloaded', 'user_deleted'
  resource_type VARCHAR(50),
  resource_id UUID,
  ip_address VARCHAR(45),
  user_agent TEXT,
  request_details JSONB,
  created_at TIMESTAMP,
  INDEX idx_user_created (user_id, created_at),
  INDEX idx_client_created (client_id, created_at)
);
2.15 Compliance & Certification
Compliance Standards:
1. SOC 2 Type II

Already aligned per your runbook
​

Complete audit preparation

Evidence collection automation

Continuous compliance monitoring

2. ISO 27001

Information Security Management System (ISMS)

Risk assessment framework

Security policies and procedures

Annual recertification

3. GDPR Compliance

Right to access (data export)

Right to erasure (data deletion)

Right to rectification (data correction)

Data portability

Consent management

Data breach notification (72-hour requirement)

4. PIPEDA (Canada)

Privacy policy

Consent for data collection

Data retention policies

Cross-border data transfer agreements

5. FCRA (USA)

Adverse action process

Proper consent forms

Required disclosures

Dispute resolution

6. State-Specific Laws

California Consumer Privacy Act (CCPA)

New York SHIELD Act

Illinois Biometric Information Privacy Act (BIPA)

Ban-the-box laws (various states/cities)

Compliance Dashboard:
Real-time compliance score

Outstanding compliance tasks

Upcoming audit dates

Policy acknowledgment tracking

Training completion status

Incident response readiness

SECTION 3: DEPLOYMENT ROADMAP
Phase 1: Foundation (Weeks 1-4)
Local Development Setup

bash
# 1. Create project structure
mkdir -p /home/{your-user}/chexpro-portal/{frontend,backend}
cd /home/{your-user}/chexpro-portal

# 2. Initialize backend
cd backend
npm init -y
npm install express prisma @prisma/client bcrypt jsonwebtoken dotenv cors helmet express-rate-limit

# 3. Initialize frontend
cd ../frontend
npx create-react-app . --template typescript
npm install @tanstack/react-query axios react-router-dom zustand react-hook-form zod

# 4. Setup database
# Create chexpro_portal_db in your local MySQL/PostgreSQL
npx prisma init
# Edit schema.prisma with tables from Section 4
npx prisma migrate dev --name init
Deliverables:

Authentication system

Basic dashboard

Order creation (single order, manual entry)

Applicant data entry

File upload

Order list view

Phase 2: Core Features (Weeks 5-8)
Applicant self-service portal

Invitation system

Order status tracking

Real-time updates (WebSocket)

Email notifications

Document management

User management (RBAC)

Phase 3: Advanced Features (Weeks 9-12)
Adjudication matrix builder

Automated adjudication

Adverse action workflow

Continuous monitoring enrollment

Dispute resolution portal

Advanced reporting

Billing & invoicing

Phase 4: Integrations (Weeks 13-16)
n8n workflow integration

Background check vendor APIs

ATS webhooks (Greenhouse, Lever)

Payment processing (Stripe)

Email service (SendGrid)

SMS service (Twilio)

OCR/ID verification (Onfido)

Phase 5: OCI Production Deployment (Week 17-18)
Pre-Deployment Checklist:

bash
# On your existing chexpro-main-server

# 1. Create directory structure
sudo mkdir -p /opt/chexpro-portal/{frontend,backend}
sudo chown chexproadmin:chexproadmin /opt/chexpro-portal

# 2. Create database
mysql -h <oci-mysql-endpoint> -u mysqladmin -p
CREATE DATABASE chexpro_portal_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'portal_user'@'%' IDENTIFIED BY 'SecurePassword123!';
GRANT SELECT, INSERT, UPDATE, DELETE ON chexpro_portal_db.* TO 'portal_user'@'%';
FLUSH PRIVILEGES;

# 3. Setup environment file
cat > /opt/chexpro-portal/.env << EOF
NODE_ENV=production
DATABASE_URL=mysql://portal_user:SecurePassword123!@<oci-mysql-endpoint>:3306/chexpro_portal_db
REDIS_URL=redis://localhost:6380
JWT_SECRET=$(openssl rand -hex 32)
JWT_REFRESH_SECRET=$(openssl rand -hex 32)
FRONTEND_URL=https://portal.chexpro.com
API_URL=https://api.chexpro.com
EOF

# 4. Install dependencies
cd /opt/chexpro-portal/backend
npm install --production

cd /opt/chexpro-portal/frontend
npm install
npm run build

# 5. Run database migrations
cd /opt/chexpro-portal/backend
npx prisma migrate deploy

# 6. Setup PM2
pm2 start /opt/chexpro-portal/backend/index.js --name portal-api -i 2
pm2 save

# 7. Configure Nginx
sudo nano /etc/nginx/sites-available/portal.chexpro.com
# (Use config from Section 1.4)
sudo ln -s /etc/nginx/sites-available/portal.chexpro.com /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# 8. Update DNS
# Add A records:
# portal.chexpro.com → 132.145.96.174
# api.chexpro.com → 132.145.96.174

# 9. Test
curl https://api.chexpro.com/health
curl https://portal.chexpro.com
Phase 6: Testing & QA (Week 19-20)
UAT with pilot clients

Performance testing

Security testing

Bug fixes

Documentation

Phase 7: Launch (Week 21+)
Soft launch to existing clients

Monitor performance

Gather feedback

Iterate

SECTION 4: CRITICAL ADDITIONS TO DATABASE SCHEMA
New Tables for v2.0 Features
sql
-- Adverse Actions (from Section 2.1)
CREATE TABLE adverse_actions (
  id CHAR(36) PRIMARY KEY,
  order_id CHAR(36) NOT NULL,
  status ENUM('initiated', 'pre_notice_sent', 'waiting_period', 'candidate_responded', 'final_notice_sent', 'completed', 'cancelled') NOT NULL,
  pre_notice_sent_at DATETIME,
  pre_notice_method VARCHAR(50),
  waiting_period_end DATETIME,
  candidate_response TEXT,
  candidate_response_at DATETIME,
  final_notice_sent_at DATETIME,
  final_decision VARCHAR(100),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  INDEX idx_status (status),
  INDEX idx_waiting_period (waiting_period_end)
);

-- Adjudication (from Section 2.2)
CREATE TABLE adjudication_matrices (
  id CHAR(36) PRIMARY KEY,
  client_id CHAR(36) NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_by CHAR(36),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE adjudication_rules (
  id CHAR(36) PRIMARY KEY,
  matrix_id CHAR(36) NOT NULL,
  rule_order INT NOT NULL,
  position_category VARCHAR(100),
  offense_type VARCHAR(100),
  severity VARCHAR(50),
  lookback_years INT,
  decision ENUM('auto_approve', 'auto_reject', 'manual_review', 'conditional') NOT NULL,
  conditions JSON,
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (matrix_id) REFERENCES adjudication_matrices(id) ON DELETE CASCADE,
  INDEX idx_matrix_order (matrix_id, rule_order)
);

CREATE TABLE order_adjudications (
  id CHAR(36) PRIMARY KEY,
  order_id CHAR(36) NOT NULL,
  matrix_id CHAR(36),
  automated_decision VARCHAR(50),
  decision_reasoning JSON,
  manual_override BOOLEAN DEFAULT FALSE,
  manual_decision VARCHAR(50),
  manual_decision_by CHAR(36),
  manual_decision_notes TEXT,
  final_decision VARCHAR(50),
  decided_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (matrix_id) REFERENCES adjudication_matrices(id) ON DELETE SET NULL,
  FOREIGN KEY (manual_decision_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_order (order_id)
);

-- Continuous Monitoring (from Section 2.3)
CREATE TABLE monitoring_enrollments (
  id CHAR(36) PRIMARY KEY,
  client_id CHAR(36) NOT NULL,
  employee_id VARCHAR(255),
  applicant_id CHAR(36) NOT NULL,
  original_order_id CHAR(36),
  monitoring_type ENUM('continuous', 'periodic') NOT NULL,
  monitoring_scope JSON,
  frequency VARCHAR(50),
  status ENUM('active', 'paused', 'cancelled') DEFAULT 'active',
  enrolled_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_check_at DATETIME,
  next_check_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
  FOREIGN KEY (applicant_id) REFERENCES applicants(id) ON DELETE CASCADE,
  FOREIGN KEY (original_order_id) REFERENCES orders(id) ON DELETE SET NULL,
  INDEX idx_status (status),
  INDEX idx_next_check (next_check_at)
);

CREATE TABLE monitoring_alerts (
  id CHAR(36) PRIMARY KEY,
  enrollment_id CHAR(36) NOT NULL,
  alert_type VARCHAR(100) NOT NULL,
  severity VARCHAR(50) NOT NULL,
  description TEXT,
  details JSON,
  status ENUM('new', 'reviewed', 'dismissed', 'actioned') DEFAULT 'new',
  reviewed_by CHAR(36),
  reviewed_at DATETIME,
  action_taken TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (enrollment_id) REFERENCES monitoring_enrollments(id) ON DELETE CASCADE,
  FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_status (status),
  INDEX idx_created (created_at)
);

-- Disputes (from Section 2.8)
CREATE TABLE disputes (
  id CHAR(36) PRIMARY KEY,
  order_id CHAR(36) NOT NULL,
  applicant_id CHAR(36) NOT NULL,
  disputed_section VARCHAR(100),
  dispute_reason TEXT,
  status ENUM('submitted', 'under_review', 'resolved', 'closed') DEFAULT 'submitted',
  assigned_to CHAR(36),
  submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  resolved_at DATETIME,
  resolution_notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (applicant_id) REFERENCES applicants(id) ON DELETE CASCADE,
  FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_status (status)
);

-- Billing (from Section 2.9)
CREATE TABLE billing_accounts (
  id CHAR(36) PRIMARY KEY,
  client_id CHAR(36) NOT NULL UNIQUE,
  billing_model VARCHAR(50) DEFAULT 'pay_per_check',
  credit_balance DECIMAL(10,2) DEFAULT 0.00,
  monthly_budget DECIMAL(10,2),
  auto_recharge_enabled BOOLEAN DEFAULT FALSE,
  auto_recharge_threshold DECIMAL(10,2),
  auto_recharge_amount DECIMAL(10,2),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
);

CREATE TABLE invoices (
  id CHAR(36) PRIMARY KEY,
  invoice_number VARCHAR(50) UNIQUE NOT NULL,
  client_id CHAR(36) NOT NULL,
  billing_period_start DATE,
  billing_period_end DATE,
  subtotal DECIMAL(10,2) NOT NULL,
  tax DECIMAL(10,2) DEFAULT 0.00,
  total DECIMAL(10,2) NOT NULL,
  status ENUM('draft', 'sent', 'paid', 'overdue', 'cancelled') DEFAULT 'draft',
  due_date DATE,
  sent_at DATETIME,
  paid_at DATETIME,
  payment_method VARCHAR(50),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
  INDEX idx_status (status),
  INDEX idx_due_date (due_date)
);

CREATE TABLE invoice_line_items (
  id CHAR(36) PRIMARY KEY,
  invoice_id CHAR(36) NOT NULL,
  order_id CHAR(36),
  description VARCHAR(255) NOT NULL,
  quantity INT DEFAULT 1,
  unit_price DECIMAL(10,2) NOT NULL,
  total DECIMAL(10,2) NOT NULL,
  FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE SET NULL
);

-- Compliance Rules (from Section 2.7)
CREATE TABLE compliance_rules (
  id CHAR(36) PRIMARY KEY,
  jurisdiction VARCHAR(100) NOT NULL,
  rule_type VARCHAR(100) NOT NULL,
  effective_date DATE,
  rule_details JSON,
  is_active BOOLEAN DEFAULT TRUE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_jurisdiction (jurisdiction),
  INDEX idx_active (is_active)
);

-- Audit Logs (from Section 2.14)
CREATE TABLE audit_logs (
  id CHAR(36) PRIMARY KEY,
  user_id CHAR(36),
  client_id CHAR(36),
  action VARCHAR(100) NOT NULL,
  resource_type VARCHAR(50),
  resource_id CHAR(36),
  ip_address VARCHAR(45),
  user_agent TEXT,
  request_details JSON,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_user_created (user_id, created_at),
  INDEX idx_client_created (client_id, created_at),
  INDEX idx_action (action)
);

-- Analytics (from Section 2.10)
CREATE TABLE analytics_daily_metrics (
  id CHAR(36) PRIMARY KEY,
  client_id CHAR(36) NOT NULL,
  date DATE NOT NULL,
  orders_submitted INT DEFAULT 0,
  orders_completed INT DEFAULT 0,
  avg_turnaround_hours DECIMAL(10,2),
  total_cost DECIMAL(10,2) DEFAULT 0.00,
  pass_rate DECIMAL(5,2),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
  UNIQUE KEY unique_client_date (client_id, date),
  INDEX idx_date (date)
);
SECTION 5: API ENDPOINTS SUMMARY (Complete List)
Authentication
POST /api/auth/register

POST /api/auth/login

POST /api/auth/logout

POST /api/auth/refresh-token

POST /api/auth/forgot-password

POST /api/auth/reset-password

GET /api/auth/me

POST /api/auth/2fa/setup

POST /api/auth/2fa/verify

Dashboard
GET /api/dashboard/stats

GET /api/dashboard/recent-orders

GET /api/dashboard/activity-feed

GET /api/dashboard/alerts

Orders
GET /api/orders

POST /api/orders

GET /api/orders/{id}

PUT /api/orders/{id}

DELETE /api/orders/{id}

POST /api/orders/draft

POST /api/orders/{id}/submit

POST /api/orders/bulk-upload

GET /api/orders/{id}/duplicate

POST /api/orders/{id}/cancel

GET /api/orders/{id}/timeline

POST /api/orders/{id}/notes

GET /api/orders/{id}/report

POST /api/orders/{id}/rescreen

GET /api/orders/export

Applicants
POST /api/applicants

GET /api/applicants/{id}

PUT /api/applicants/{id}

POST /api/applicants/{id}/documents

GET /api/applicants/{id}/documents

POST /api/applicants/{id}/consent

POST /api/applicants/{id}/e-signature

POST /api/applicants/parse-resume

Applicant Portal (Public)
POST /api/applicant-portal/invite

GET /api/applicant-portal/{token}

PUT /api/applicant-portal/{token}/data

POST /api/applicant-portal/{token}/submit

GET /api/applicant-portal/{token}/status

Adverse Actions
POST /api/orders/{id}/adverse-action/initiate

GET /api/orders/{id}/adverse-action/status

POST /api/orders/{id}/adverse-action/send-pre-notice

POST /api/adverse-action/{id}/candidate-response

POST /api/orders/{id}/adverse-action/send-final-notice

GET /api/adverse-action/{id}/audit-trail

Adjudication
GET /api/adjudication/matrices

POST /api/adjudication/matrices

PUT /api/adjudication/matrices/{id}

DELETE /api/adjudication/matrices/{id}

POST /api/adjudication/matrices/{id}/simulate

GET /api/orders/{id}/adjudication

POST /api/orders/{id}/adjudication/manual-override

GET /api/adjudication/queue

Continuous Monitoring
POST /api/monitoring/enroll

PUT /api/monitoring/{id}/pause

PUT /api/monitoring/{id}/cancel

GET /api/monitoring/alerts

POST /api/monitoring/alerts/{id}/review

POST /api/rescreening/schedule

POST /api/rescreening/batch-initiate

GET /api/monitoring/dashboard-stats

Disputes
POST /api/public/disputes

GET /api/disputes/{id}/status

GET /api/disputes

PUT /api/disputes/{id}/assign

POST /api/disputes/{id}/messages

PUT /api/disputes/{id}/resolve

Billing
GET /api/billing/account

PUT /api/billing/account

POST /api/billing/payment-intent

GET /api/billing/invoices

GET /api/billing/invoices/{id}

POST /api/billing/credits/purchase

GET /api/billing/history

Analytics
GET /api/analytics/dashboard

GET /api/analytics/turnaround-time

GET /api/analytics/cost-trends

GET /api/analytics/benchmarking

POST /api/analytics/custom-report

GET /api/analytics/reports/{id}/data

Client Management
GET /api/client/profile

PUT /api/client/profile

GET /api/client/users

POST /api/client/users

PUT /api/client/users/{id}

DELETE /api/client/users/{id}

GET /api/client/branding

PUT /api/client/branding

GET /api/client/api-keys

POST /api/client/api-keys

DELETE /api/client/api-keys/{id}

Packages & Services
GET /api/packages

POST /api/packages

PUT /api/packages/{id}

GET /api/services

Documents
POST /api/documents/upload

GET /api/documents/{id}

DELETE /api/documents/{id}

POST /api/documents/extract-data (OCR)

POST /api/verification/id-check

Webhooks
POST /api/webhooks/stripe

POST /api/webhooks/greenhouse

POST /api/webhooks/lever

POST /api/webhooks/vendor-status-update

Reports
GET /api/reports/order-volume

GET /api/reports/turnaround-time

GET /api/reports/completion-rates

GET /api/reports/export

Health & System
GET /api/health

GET /api/system/status

SECTION 6: TECHNOLOGY STACK UPDATES
Backend Additions:
json
{
  "dependencies": {
    "express": "^4.18.2",
    "prisma": "^5.8.0",
    "@prisma/client": "^5.8.0",
    "bcrypt": "^5.1.1",
    "jsonwebtoken": "^9.0.2",
    "dotenv": "^16.3.1",
    "cors": "^2.8.5",
    "helmet": "^7.1.0",
    "express-rate-limit": "^7.1.5",
    "express-validator": "^7.0.1",
    "multer": "^1.4.5-lts.1",
    "aws-sdk": "^2.1524.0",
    "nodemailer": "^6.9.7",
    "bull": "^4.12.0",
    "ioredis": "^5.3.2",
    "socket.io": "^4.6.0",
    "stripe": "^14.10.0",
    "twilio": "^4.19.3",
    "speakeasy": "^2.0.0",
    "qrcode": "^1.5.3",
    "pdf-lib": "^1.17.1",
    "puppeteer": "^21.7.0",
    "axios": "^1.6.5",
    "passport": "^0.7.0",
    "passport-saml": "^4.0.0",
    "winston": "^3.11.0"
  }
}
Frontend Additions:
json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "typescript": "^5.3.3",
    "@tanstack/react-query": "^5.17.0",
    "axios": "^1.6.5",
    "react-router-dom": "^6.21.1",
    "zustand": "^4.4.7",
    "react-hook-form": "^7.49.2",
    "zod": "^3.22.4",
    "@headlessui/react": "^1.7.17",
    "@heroicons/react": "^2.1.1",
    "tailwindcss": "^3.4.1",
    "recharts": "^2.10.3",
    "socket.io-client": "^4.6.0",
    "react-dropzone": "^14.2.3",
    "react-pdf": "^7.5.1",
    "react-signature-canvas": "^1.0.6",
    "date-fns": "^3.0.6"
  }
}
CONCLUSION
This enhanced v2.0 specification provides a production-ready, enterprise-grade background check portal with:

Key Additions:
✅ 15 major feature categories not in v1.0
✅ FCRA-compliant adverse action workflow
✅ Automated adjudication engine
✅ Continuous monitoring & rescreening
✅ Enhanced candidate experience
✅ Complete OCI deployment architecture
✅ Integration with your existing n8n, Odoo, SuiteCRM stack
✅ 70+ new API endpoints
✅ 20+ new database tables
✅ Enterprise security & compliance features
✅ White-label & multi-tenant support