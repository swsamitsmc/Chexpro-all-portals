Here's the complete Candidate Portal specification document. Save this as CandidatePortal.md and give it to Kilo Code in a fresh workspace:

text
# mycheck.chexpro.com — Candidate Portal
# Technical Specification v1.0
# Audience: AI Coding Agent (Kilo Code)
# Build Target: Complete, production-ready codebase in one session

---

## CRITICAL CONTEXT — READ FIRST

This is the third portal in the Chexpro.com platform.
The other two portals are already built and running:
- Client Portal: portal.chexpro.com (port 3001, backend port 3002)
- Admin Portal: admin.chexpro.com (port 4001, backend port 4000)

This Candidate Portal:
- URL: mycheck.chexpro.com
- Frontend port: 5174 (local dev)
- Backend port: 3004
- Shares the SAME MySQL database as Client Portal (chexpro_portal_db)
- Shares the SAME JWT_SECRET as Client Portal
- Communicates with Client Portal via Redis pub/sub
- Is a SEPARATE codebase in its own GitHub repository

The candidate is a person who has been invited to complete a 
background check by a company (the client). They receive an email 
invitation, create an account on this portal, fill in their 
background check information, and track their check status here.

---

## SECTION 1: TECH STACK

### Backend
- Runtime: Node.js 20+
- Framework: Express.js
- Language: TypeScript (strict mode)
- ORM: Prisma (connects to existing chexpro_portal_db)
- Auth: JWT (access token 15min, refresh token 7 days)
- Password Hashing: bcrypt (cost factor 12)
- Validation: Zod
- Email: Nodemailer
- File Upload: Multer (local /uploads/ folder)
- Encryption: Node.js crypto (AES-256-CBC for SIN)
- Queue: Bull (Redis-backed)
- Real-time: Socket.io
- Logging: Winston
- Rate Limiting: express-rate-limit
- Security: Helmet, CORS

### Frontend
- Framework: React 18
- Language: TypeScript
- Build Tool: Vite
- Styling: Tailwind CSS + shadcn/ui (Radix UI primitives)
- State: Zustand
- Forms: React Hook Form + Zod
- HTTP: Axios
- Data Fetching: TanStack Query v5
- Real-time: Socket.io-client
- Charts: Recharts
- Router: React Router v7
- Icons: Lucide React

### Infrastructure
- Database: MySQL 8.0 (shared chexpro_portal_db)
- Cache/Queue: Redis 7
- Local Dev: Docker Compose
- Production: PM2 + Nginx on OCI

---

## SECTION 2: PROJECT STRUCTURE

Create this exact structure:

Chexpro-Candidate-Portal/
├── .env.example
├── .gitignore
├── docker-compose.dev.yml
├── package.json (root workspace)
├── README.md
├── pm2.ecosystem.config.js
├── backend/
│ ├── package.json
│ ├── tsconfig.json
│ ├── vitest.config.ts
│ ├── prisma/
│ │ ├── schema.prisma (shared schema — copy from client portal)
│ │ └── seed.ts (candidate-specific seed data)
│ └── src/
│ ├── index.ts (main Express server)
│ ├── worker.ts (Bull queue worker)
│ ├── config/
│ │ ├── env.ts
│ │ ├── logger.ts
│ │ ├── prisma.ts
│ │ └── redis.ts
│ ├── middleware/
│ │ ├── auth.ts (JWT validation)
│ │ ├── errorHandler.ts
│ │ └── rateLimiter.ts
│ ├── routes/
│ │ ├── auth.ts
│ │ ├── profile.ts
│ │ ├── checks.ts
│ │ ├── wizard.ts
│ │ ├── documents.ts
│ │ ├── notifications.ts
│ │ └── status.ts
│ ├── services/
│ │ ├── emailService.ts
│ │ ├── encryptionService.ts
│ │ ├── redisPublisher.ts
│ │ └── redisSubscriber.ts
│ ├── types/
│ │ ├── express.d.ts
│ │ └── index.ts
│ └── utils/
│ ├── response.ts
│ └── helpers.ts
└── frontend/
├── package.json
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.js
├── index.html
└── src/
├── main.tsx
├── App.tsx
├── index.css
├── components/
│ ├── Layout.tsx (authenticated layout with sidebar)
│ ├── PublicLayout.tsx (centered card layout for auth pages)
│ ├── StepProgress.tsx (wizard step indicator)
│ ├── StatusBadge.tsx (order status colored badges)
│ └── DocumentUploadZone.tsx
├── hooks/
│ ├── useWebSocket.ts
│ └── useAuth.ts
├── lib/
│ ├── api.ts (axios instance with interceptors)
│ └── utils.ts
├── store/
│ └── authStore.ts (Zustand auth state)
├── types/
│ └── index.ts
└── pages/
├── auth/
│ ├── LoginPage.tsx
│ ├── RegisterPage.tsx (invitation-based registration)
│ ├── ForgotPasswordPage.tsx
│ └── ResetPasswordPage.tsx
├── DashboardPage.tsx (check status overview)
├── wizard/
│ ├── WizardPage.tsx (7-step data entry, authenticated)
│ └── WizardCompletePage.tsx
├── checks/
│ ├── ChecksListPage.tsx (all background checks)
│ └── CheckDetailPage.tsx (single check status + timeline)
├── documents/
│ └── DocumentsPage.tsx (uploaded docs management)
├── profile/
│ └── ProfilePage.tsx (account settings)
├── notifications/
│ └── NotificationsPage.tsx
└── NotFoundPage.tsx

text

---

## SECTION 3: DATABASE STRATEGY

IMPORTANT: This portal shares the SAME MySQL database as the Client Portal
(chexpro_portal_db). Copy the FULL Prisma schema from the Client Portal 
exactly. Do NOT create a separate database.

The following tables in the shared schema are the primary ones this portal 
reads and writes:
- applicants — candidate personal data (this portal fills this in)
- users — candidates are stored here with role = 'candidate'
- orders — candidates read their own orders (read-only)
- documents — candidates upload documents here
- notifications — candidates receive notifications here
- order_timeline — candidates read status updates here

ADD these new models to the Prisma schema for candidate-specific features:

```prisma
model CandidateProfile {
  id                    String    @id @default(uuid())
  userId                String    @unique @map("user_id")
  applicantId           String?   @map("applicant_id")
  preferredName         String?   @map("preferred_name")
  communicationPrefs    Json?     @map("communication_prefs")
  timezone              String?   @default("America/Toronto")
  language              String?   @default("en")
  lastActiveAt          DateTime? @map("last_active_at")
  createdAt             DateTime  @default(now()) @map("created_at")
  updatedAt             DateTime  @updatedAt @map("updated_at")
  user                  User      @relation(fields: [userId], references: [id])

  @@map("candidate_profiles")
}

model CandidateInvitation {
  id                    String    @id @default(uuid())
  orderId               String    @map("order_id")
  applicantEmail        String    @map("applicant_email")
  invitationToken       String    @unique @map("invitation_token")
  tokenExpiresAt        DateTime  @map("token_expires_at")
  registrationCompletedAt DateTime? @map("registration_completed_at")
  userId                String?   @map("user_id")
  createdAt             DateTime  @default(now()) @map("created_at")

  @@map("candidate_invitations")
}
SECTION 4: ENVIRONMENT VARIABLES
Create backend/.env.example with exactly these variables:

text
NODE_ENV=development
PORT=3004

# MUST match Client Portal exactly — shared JWT validation
DATABASE_URL=mysql://portal_user:your_db_password@localhost:3307/chexpro_portal_db
JWT_SECRET=your_jwt_secret_min_64_chars_replace_this
JWT_REFRESH_SECRET=your_refresh_secret_min_64_chars_replace_this
ENCRYPTION_KEY=your_32_byte_hex_key_generate_with_openssl_rand_-hex_32

REDIS_URL=redis://localhost:6379

FRONTEND_URL=http://localhost:5174
CLIENT_PORTAL_URL=http://localhost:5173

# Email
SMTP_HOST=smtp.ethereal.email
SMTP_PORT=587
SMTP_USER=replace_with_smtp_user
SMTP_PASS=replace_with_smtp_password
SMTP_FROM=noreply@mycheck.chexpro.com

# App
APP_NAME=mycheck by Chexpro
Create frontend/.env.local:

text
VITE_API_URL=http://localhost:3004/api/v1
VITE_WS_URL=http://localhost:3004
VITE_APP_NAME=mycheck by Chexpro
SECTION 5: AUTHENTICATION SYSTEM
5.1 Registration Flow (Invitation-Based)
When a client creates an order in the Client Portal and selects
"Send Invitation", the Client Portal:

Creates a CandidateInvitation record with a unique token

Sends an email to the candidate with link:
https://mycheck.chexpro.com/register?token={invitationToken}

The Candidate Portal registration flow:

Candidate opens the registration link

Frontend calls GET /api/v1/auth/invitation/:token to validate token

If valid: pre-fill email field from invitation data

Candidate creates password + confirms password

Optionally sets preferred name

Frontend calls POST /api/v1/auth/register

Backend creates a User record (role = 'candidate') + CandidateProfile

Backend links the CandidateInvitation to the new user

Backend sends welcome email

Backend publishes Redis event: 'candidate:registered'

Auto-login: return access + refresh tokens

Redirect to wizard if background check is pending, else dashboard

5.2 Login Flow
Standard email/password login.
Candidates can ONLY log in if their account has role = 'candidate'.
Do not allow client/admin accounts to log in here.

5.3 Token Strategy
Access token: 15 minutes, signed with JWT_SECRET

Refresh token: 7 days, stored in httpOnly cookie AND returned in response body

Token payload: { id, email, role: 'candidate', applicantId? }

SECTION 6: BACKEND API ROUTES
backend/src/index.ts — Main Server Setup
typescript
// Express server setup
// Apply in this exact order:
// 1. helmet()
// 2. cors({ origin: env.frontendUrl, credentials: true })
// 3. express.json({ limit: '10mb' })
// 4. express.urlencoded({ extended: true })
// 5. Morgan logging (dev format)
// 6. Route registration (all under /api/v1)
// 7. Socket.io setup
// 8. Error handler middleware

// Route prefixes:
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/profile', authenticateJWT, profileRouter);
app.use('/api/v1/checks', authenticateJWT, checksRouter);
app.use('/api/v1/wizard', authenticateJWT, wizardRouter);
app.use('/api/v1/documents', authenticateJWT, documentsRouter);
app.use('/api/v1/notifications', authenticateJWT, notificationsRouter);
app.use('/api/v1/status', statusRouter); // public status endpoint

// Health check
app.get('/health', (req, res) => res.json({ status: 'ok', service: 'candidate-api' }));

// Socket.io rooms:
io.on('connection', (socket) => {
  socket.on('join-candidate-room', ({ candidateId }) => {
    socket.join(`candidate:${candidateId}`);
  });
  socket.on('join-check-room', ({ orderId }) => {
    socket.join(`order:${orderId}`);
  });
});

// Export app for testing
export { app };
if (process.env.NODE_ENV !== 'test') {
  server.listen(PORT);
}
backend/src/routes/auth.ts
All routes in this file are PUBLIC (no authenticateJWT).
Apply loginLimiter (5 attempts per 15min) to POST /login.

GET /api/v1/auth/invitation/:token
Validate an invitation token before registration.

Find CandidateInvitation where invitationToken = token

If not found: return 404 { error: { code: 'INVALID_TOKEN' } }

If tokenExpiresAt < now: return 410 { error: { code: 'TOKEN_EXPIRED',
message: 'This invitation has expired. Please contact the employer.' } }

If registrationCompletedAt is not null: return 409
{ error: { code: 'ALREADY_REGISTERED',
message: 'An account already exists for this invitation. Please log in.' } }

Find the linked Order and Client for context

Return: {
valid: true,
applicantEmail: invitation.applicantEmail,
companyName: order.client.companyName,
positionTitle: order.positionTitle,
expiresAt: invitation.tokenExpiresAt
}

POST /api/v1/auth/register
Register a new candidate account.
Body schema (Zod):

invitationToken: string (required)

password: string (min 8 chars, must contain uppercase + number)

confirmPassword: string (must match password)

preferredName: string (optional)

agreeToTerms: boolean (must be true)

Implementation:

Validate token (same checks as GET above)

Find invitation record

Check if user already exists with that email → return 409 if so

Hash password: bcrypt.hash(password, 12)

Create User: {
email: invitation.applicantEmail,
passwordHash,
role: 'candidate',
firstName: '', // filled in wizard step 1
lastName: '', // filled in wizard step 1
clientId: order.clientId, // link candidate to client
isActive: true
}

Create CandidateProfile: { userId, preferredName }

Update CandidateInvitation: {
registrationCompletedAt: now(),
userId: newUser.id
}

Link invitation to applicant record if one exists for this order:
Update Applicant: { userId: newUser.id } where orderId = invitation.orderId

Generate access + refresh tokens (same pattern as Client Portal auth.ts)

Send welcome email with:
Subject: "Welcome to mycheck — Your background check is ready"
Body: "Your account has been created. Click here to start your
background check. You have 14 days to complete it."

Publish Redis event:
publisher.publish('candidate:registered', JSON.stringify({
orderId: invitation.orderId,
userId: newUser.id,
email: invitation.applicantEmail
}))

Return: {
success: true,
data: {
accessToken,
refreshToken,
user: { id, email, role },
pendingCheckOrderId: invitation.orderId
}
}

POST /api/v1/auth/login
Body: { email, password }

Find User where email = email AND role = 'candidate' AND isActive = true

If not found: return 401 { error: { code: 'INVALID_CREDENTIALS' } }

Compare password with bcrypt

If wrong: return 401 { error: { code: 'INVALID_CREDENTIALS' } }

Generate access + refresh tokens

Update user lastLoginAt

Return: { success: true, data: { accessToken, refreshToken, user } }

POST /api/v1/auth/refresh-token
Body: { refreshToken }

Verify refresh token using JWT_REFRESH_SECRET

Find user from token payload

Generate new access token

Return: { success: true, data: { accessToken } }

POST /api/v1/auth/logout
Body: { refreshToken }

Invalidate refresh token (add to Redis blacklist with TTL 7 days)

Return: { success: true }

POST /api/v1/auth/forgot-password
Body: { email }

Always return 200 (don't reveal if email exists)

If user with email + role='candidate' exists:

Generate reset token: crypto.randomBytes(32).toString('hex')

Store in Redis: key=pwd_reset:${token}, value=userId, TTL=3600 (1 hour)

Send email with reset link:
${FRONTEND_URL}/reset-password?token=${resetToken}

POST /api/v1/auth/reset-password
Body: { token, password, confirmPassword }

Get userId from Redis key pwd_reset:${token}

If not found: return 400 { error: { code: 'INVALID_OR_EXPIRED_TOKEN' } }

Validate passwords match + meet requirements

Update user: { passwordHash: bcrypt.hash(password, 12) }

Delete Redis key

Return: { success: true, message: 'Password updated successfully' }

GET /api/v1/auth/me
Requires: authenticateJWT

Return current user with CandidateProfile

Include count of pending background checks

backend/src/routes/wizard.ts
The 7-step data entry wizard for authenticated candidates.
All routes require authenticateJWT.
Candidate can only access wizard data for their own orders.

GET /api/v1/wizard/status
Return all orders linked to this candidate's applicant records

For each order: return { orderId, orderNumber, positionTitle,
clientName, wizardStatus: { completedSteps: [], portalCompleted } }

GET /api/v1/wizard/:orderId
Get full applicant data for this order (for pre-filling wizard)

Verify: applicant.userId = req.user.id OR
order linked via CandidateInvitation to req.user.id

If not authorized: return 403

Return applicant data with decrypted SIN (show masked: --**34)
NEVER return the full SIN — only last 2 digits visible

Return: { applicant, order: { orderNumber, positionTitle, packageName,
clientName, clientLogo }, completedSteps: [] }

PUT /api/v1/wizard/:orderId/step/:stepNumber
Auto-save a single wizard step. stepNumber is 1-7.

Verify candidate authorization for this order

stepNumber 1 — personal info:
Body: { firstName, middleName?, lastName, dateOfBirth,
phone, gender?, sin? }
If sin provided: encrypt with encryptField() from encryption service
Also update User record: { firstName, lastName }
Mark step 1 complete

stepNumber 2 — current address:
Body: { currentAddress: { street, city, province, postalCode,
country, residenceType?, yearsAtAddress } }
Store in applicant.currentAddress (Json field)
Mark step 2 complete

stepNumber 3 — address history:
Body: { addressHistory: [{ street, city, province, postalCode,
country, from, to }] }
Store in applicant.addressHistory (Json field)
Mark step 3 complete

stepNumber 4 — employment history:
Body: { employmentHistory: [{ employer, jobTitle, startDate, endDate?,
isCurrent, supervisorName?, supervisorContact?,
reasonForLeaving?, permissionToContact }] }
Store in applicant.employmentHistory (Json field)
Mark step 4 complete

stepNumber 5 — education history:
Body: { educationHistory: [{ institution, degree, fieldOfStudy?,
graduationDate?, studentId?, didNotGraduate }] }
Store in applicant.educationHistory (Json field)
Mark step 5 complete

stepNumber 6 — additional info:
Body: { otherNames?: string[], licenses?: string,
criminalDisclosure: boolean, criminalDetails?: string,
additionalInfo?: string }
Store in applicant (individual fields or additionalInfo Json field)
Mark step 6 complete

stepNumber 7 — documents + signature:
Body: { signatureBase64: string, consentGiven: boolean }
Validate: consentGiven must be true
Store signature as base64 in applicant.eSignature
Set applicant.consentGiven = true, consentDate = now()
Mark step 7 complete

For ALL steps:

After saving, recalculate completedSteps array

If all 7 steps completed + consentGiven = true:
Set applicant.portalCompleted = true

Return: { success: true, data: { completedSteps, portalCompleted,
nextStep: stepNumber + 1 } }

POST /api/v1/wizard/:orderId/submit
Final submission of completed wizard.

Verify all required steps are complete (steps 1, 2, 6, 7 mandatory)

Verify consentGiven = true

Set applicant.portalCompleted = true (if not already)

Update order status to 'data_verification'

Create order_timeline entry:
'Candidate submitted background check information'

Send confirmation email to candidate

Publish Redis event:
publisher.publish('candidate:wizard_completed', JSON.stringify({
orderId,
applicantId: applicant.id,
submittedAt: new Date().toISOString()
}))

Emit Socket.io event to client portal rooms:
io.to(client:${order.clientId}).emit('candidateWizardCompleted',
{ orderId, applicantName })

Return: { success: true, data: {
message: 'Your background check information has been submitted.',
orderNumber: order.orderNumber,
estimatedCompletionDate: (add 5 business days to now)
}}

backend/src/routes/checks.ts
View background check orders. All require authenticateJWT.
Candidates can ONLY see orders linked to their applicant records.

GET /api/v1/checks
Find all applicant records where userId = req.user.id

For each applicant: get linked order with timeline

Return: [{
orderId,
orderNumber,
status,
positionTitle,
companyName,
packageName,
submittedAt,
estimatedCompletionDate,
completedAt,
wizardCompleted: applicant.portalCompleted,
latestTimelineEntry: { status, description, createdAt }
}]

GET /api/v1/checks/:orderId
Full detail for one background check.

Find applicant where orderId = orderId AND userId = req.user.id

If not found: return 403

Return: {
order: { orderNumber, status, positionTitle, companyName,
packageName, services, submittedAt, completedAt },
applicant: {
firstName, lastName, email,
portalCompleted, completedSteps,
(do NOT return sin, passwordHash, or any encrypted field)
},
timeline: [ all order_timeline entries, sorted newest first ],
documents: [ list of uploaded documents with names and types ],
report: { available: boolean, downloadUrl?: string }
}

GET /api/v1/checks/:orderId/timeline
Return all order_timeline entries for this order

Verify candidate has access to this order

Format timestamps as human-readable

Return: { success: true, data: { timeline: [] } }

GET /api/v1/checks/:orderId/report
Verify candidate has access to this order

Find report record linked to this order

If no report or order not completed:
return 404 { error: { code: 'REPORT_NOT_AVAILABLE',
message: 'Your report is not yet ready.' } }

Return report metadata (not the file itself — signed URL deferred)

Return: { success: true, data: { reportId, generatedAt, status } }

backend/src/routes/documents.ts
Document upload and management. All require authenticateJWT.

GET /api/v1/documents
Find all documents linked to applicant records where userId = req.user.id

Return: [{ id, fileName, fileType, documentType, uploadedAt,
fileSize, orderId }]

POST /api/v1/documents/upload
Multipart form upload using multer middleware.

Accept: PDF, JPG, JPEG, PNG, HEIC

Max size: 10MB per file

Body fields: orderId (required), documentType (required)
documentType options: 'photo_id_front' | 'photo_id_back' |
'proof_of_address' | 'other'

Verify candidate has access to orderId

Save file to /uploads/documents/{candidateId}/{filename}

Create document record in documents table:
{ applicantId, orderId, fileName, filePath, fileType,
documentType, uploadedBy: req.user.id }

Return: { success: true, data: { documentId, fileName, uploadedAt } }

DELETE /api/v1/documents/:id
Verify document belongs to req.user via applicant linkage

Only allow deletion if order status is NOT completed or in_progress

Delete file from filesystem

Delete document record

Return: { success: true }

backend/src/routes/profile.ts
Candidate profile management. All require authenticateJWT.

GET /api/v1/profile
Return user + candidateProfile + linked applicant summary

Return: {
user: { id, email, firstName, lastName, createdAt, lastLoginAt },
profile: { preferredName, communicationPrefs, timezone },
stats: { totalChecks, completedChecks, pendingChecks }
}

PUT /api/v1/profile
Body: { firstName?, lastName?, preferredName?, timezone?,
communicationPrefs?: { emailNotifications, smsNotifications } }

Update User: { firstName, lastName }

Update CandidateProfile: { preferredName, timezone, communicationPrefs }

Return: { success: true, data: updatedProfile }

PUT /api/v1/profile/password
Body: { currentPassword, newPassword, confirmPassword }

Verify currentPassword with bcrypt

Validate newPassword requirements

Verify confirmPassword matches

Update: { passwordHash: bcrypt.hash(newPassword, 12) }

Invalidate all refresh tokens in Redis for this user

Return: { success: true, message: 'Password updated' }

DELETE /api/v1/profile/account
Body: { password, confirmDeletion: "DELETE MY ACCOUNT" }

Verify password

Verify confirmDeletion = "DELETE MY ACCOUNT" exactly

Soft delete: set user.isActive = false, user.deletedAt = now()

Anonymize PII: set applicant fields to "[DELETED]" except encrypted ones

Return: { success: true }

backend/src/routes/notifications.ts
All require authenticateJWT.

GET /api/v1/notifications
Query params: unreadOnly? (boolean), page, limit

Return notifications where userId = req.user.id

Return: { notifications: [], unreadCount, total }

PUT /api/v1/notifications/:id/read
Set is_read = true for notification owned by req.user.id

PUT /api/v1/notifications/read-all
Set is_read = true for ALL notifications where userId = req.user.id

DELETE /api/v1/notifications/:id
Delete notification owned by req.user.id

backend/src/routes/status.ts
PUBLIC endpoint — no auth required. For sharing check status externally.

GET /api/v1/status/check/:orderNumber
Find order by orderNumber

Return ONLY public-safe fields (no PII):
{ orderNumber, status, statusLabel, lastUpdated,
estimatedCompletionDate }

This is intentionally minimal — candidates use the portal for full details

backend/src/services/redisSubscriber.ts
Subscribe to events from Client Portal and Admin Portal.
Set up in worker.ts on startup.

typescript
// Listen for these events from Client Portal:
subscriber.subscribe('order:statusChanged');
// When received: 
// - Find candidate linked to this order
// - Create notification for the candidate
// - Emit Socket.io event to candidate's room

subscriber.subscribe('report:ready');
// When received:
// - Create "Your report is ready" notification
// - Emit Socket.io to candidate

subscriber.subscribe('adverse_action:initiated');
// When received:
// - Create urgent notification for candidate
// - Send email: "Important notice regarding your background check"

subscriber.subscribe('order:requiresAction');
// When received:
// - Create notification: "Action required for your background check"
// - Send email notification
backend/src/worker.ts
Background job processor using Bull.

typescript
// Queue: candidate-notifications
// Jobs:
// 1. send-reminder-email
//    - Trigger: Run every 24h
//    - Find candidates with incomplete wizard older than 3 days
//    - Send reminder email with link to complete check
//    - Stop after 3 reminders

// 2. expire-invitations
//    - Trigger: Run every hour
//    - Find CandidateInvitations where tokenExpiresAt < now 
//      AND registrationCompletedAt IS NULL
//    - Update linked order status if needed

// 3. send-notification-email
//    - Trigger: On demand (published by redisSubscriber)
//    - Send email for notification records
//    - Mark notification.emailSent = true

// Queue: setup
const candidateQueue = new Bull('candidate-notifications', {
  redis: env.redisUrl
});

// Process jobs
candidateQueue.process('send-reminder-email', sendReminderEmail);
candidateQueue.process('expire-invitations', expireInvitations);
candidateQueue.process('send-notification-email', sendNotificationEmail);

// Schedule recurring jobs
candidateQueue.add('send-reminder-email', {}, { 
  repeat: { cron: '0 9 * * *' }  // 9am daily
});
candidateQueue.add('expire-invitations', {}, {
  repeat: { cron: '0 * * * *' }  // every hour
});
SECTION 7: FRONTEND PAGES
7.1 frontend/src/App.tsx — Route Structure
typescript
// PUBLIC routes (no auth required):
/login                              → LoginPage
/register                           → RegisterPage (reads ?token= from URL)
/forgot-password                    → ForgotPasswordPage
/reset-password                     → ResetPasswordPage
/status/:orderNumber                → PublicStatusPage (minimal, no login)

// AUTHENTICATED routes (redirect to /login if no token):
/                                   → redirect to /dashboard
/dashboard                          → DashboardPage
/checks                             → ChecksListPage
/checks/:orderId                    → CheckDetailPage
/wizard/:orderId                    → WizardPage
/wizard/:orderId/complete           → WizardCompletePage
/documents                          → DocumentsPage
/profile                            → ProfilePage
/notifications                      → NotificationsPage
*                                   → NotFoundPage
Auth guard: Check Zustand authStore. If no token, redirect to /login.
On every protected route mount, call GET /api/v1/auth/me to validate token.
If 401 returned: clear auth store, redirect to /login.

7.2 AUTH PAGES
LoginPage (/login)
Clean centered card layout. Logo at top.
Tagline: "Manage your background check with mycheck"

Form:

Email (type: email, autocomplete: email)

Password (type: password, show/hide toggle)

"Remember me" checkbox (extends refresh token display)

"Forgot password?" link → /forgot-password

Submit button "Sign In"

On submit: POST /api/v1/auth/login
On success: save tokens to authStore, redirect to /dashboard
On 401: show "Invalid email or password"
On 429: show "Too many attempts. Please wait 15 minutes."

Bottom of card:
"Received an invitation? Register here →" link to /register

RegisterPage (/register)
URL contains: ?token=invitation_token_here

On mount:

Extract token from URL query params

Call GET /api/v1/auth/invitation/:token

If 404: show error card "This invitation link is invalid."

If 410: show error card "This invitation link has expired. Please
contact {companyName} who requested your check."

If 409 (already registered): show "You already have an account.
Sign in here →" with link to /login

If valid: pre-fill email field, show company name and position

Page header (shown above form):
"You've been invited by {companyName} to complete a background check
for the position: {positionTitle}"
Progress indicator: "Link expires: {expiresAt formatted as readable date}"

Form:

Email: pre-filled from invitation, read-only (greyed out)

Preferred Name (optional): "What should we call you?"

Password: with strength meter (show requirements: 8+ chars, uppercase, number)

Confirm Password

Checkbox: "I agree to the Terms of Service and Privacy Policy" (required)

Submit button: "Create My Account & Start"

On submit: POST /api/v1/auth/register
On success: save tokens, redirect to /wizard/:pendingCheckOrderId
On error: show specific error message

ForgotPasswordPage (/forgot-password)
Simple form: Email field + Submit
On submit: POST /api/v1/auth/forgot-password
Always show: "If an account exists, we've sent a reset link."
(never reveal whether email exists)

ResetPasswordPage (/reset-password)
URL contains: ?token=reset_token
Form: New Password + Confirm Password (both with show/hide)
On submit: POST /api/v1/auth/reset-password with token from URL
On success: show "Password updated. Sign in →" link to /login
On error: "This reset link has expired. Request a new one."

7.3 AUTHENTICATED LAYOUT (frontend/src/components/Layout.tsx)
Left sidebar (collapsible on mobile):

Logo: "mycheck" with small "by Chexpro" below it

User avatar + name + email at top of sidebar

Navigation:

Dashboard (icon: Home)

My Checks (icon: ClipboardList) — shows badge with pending count

Documents (icon: FileText)

Profile (icon: User)

Notifications (icon: Bell) — shows badge with unread count

Bottom of sidebar: Sign Out button

Top header:

Page title (dynamic)

Notification bell icon with unread badge

User menu dropdown: Profile, Sign Out

On every page load: call useWebSocket() hook.

7.4 DashboardPage (/dashboard)
Header: "Welcome back, {preferredName || firstName}"

If candidate has ANY incomplete wizards:
Show a prominent yellow banner at the top:
"⚠️ Action Required: You have a pending background check for {positionTitle}
at {companyName}. {daysRemaining} days remaining to complete it."
[Complete Now →] button → navigate to /wizard/:orderId

Section 1 — My Checks Summary (stat cards in a row):

Total Checks: count

In Progress: count (blue)

Completed: count (green)

Requires Action: count (red)

Section 2 — Active Checks (list or cards):
Fetch GET /api/v1/checks
For each check show a card:

Company logo (if available) or company initial

Company name + Position title

Status badge (color-coded)

Package name

Submitted date

Estimated completion date (if available)

Latest timeline entry (brief)

[View Details] button → /checks/:orderId

If wizard not completed for this check: show [Complete Your Info →] button

Show empty state if no checks:
"No background checks yet. You'll see them here once invited."

Section 3 — Recent Activity (timeline feed):
Show last 5 status updates across all checks.
Each entry: order number + status change + date

Section 4 — Quick Links:

Upload Documents → /documents

View Profile → /profile

Need Help? (links to mailto:support@chexpro.com)

7.5 WizardPage (/wizard/:orderId)
This is the core feature of the Candidate Portal.
Fetch GET /api/v1/wizard/:orderId on mount.

If order not found or not authorized: redirect to /dashboard with error toast.
If wizard already completed (portalCompleted = true):
redirect to /wizard/:orderId/complete

Layout:

No left sidebar — full-width wizard layout

Logo top-left

Company name top-right: "Completing check for {companyName}"

Large step progress bar below header:
Step 1 → Step 2 → Step 3 → Step 4 → Step 5 → Step 6 → Step 7
Completed steps show ✓, current step highlighted, future steps gray

Session persistence:
Save completed step data to localStorage as backup.
On wizard mount, restore any unsaved step data from localStorage.

Auto-save behavior:
When user clicks "Save & Continue", call
PUT /api/v1/wizard/:orderId/step/:stepNumber
Show loading spinner on button while saving.
On success: advance to next step.
On error: show error toast, DO NOT advance.

--- STEP 1: Personal Information ---
Title: "Tell us about yourself"

Fields (use react-hook-form + zod):

First Name* (text, min 1 char)

Middle Name (text, optional)

Last Name* (text, min 1 char)

Date of Birth* (date input, validate: must be 18+ years old)

Phone Number* (text, format: +1 (XXX) XXX-XXXX, validate Canadian/US format)

Gender (select: Prefer not to say | Male | Female | Non-binary | Other, optional)

Social Insurance Number (text, optional)
Show info icon with tooltip: "Required for credit and criminal record
checks in Canada. Stored encrypted. Never shared without your consent."
Mask input: show *** as user types, unmask only on hover of show button
Validate format: ###-###-### (9 digits, optional hyphens)

Pre-fill from existing applicant data if available.
Email field shown as read-only (from registration, cannot change in wizard).

"Save & Continue" button.

--- STEP 2: Current Address ---
Title: "Where do you currently live?"

Fields:

Street Address* (text)

Unit/Apt # (text, optional)

City* (text)

Province/State* (text)

Postal / ZIP Code* (text, validate: Canadian A1A 1A1 or US 12345)

Country* (text, default: Canada)

Residence Type* (select: Own | Rent | Live with family | Other)

How long have you lived here?*
(two selects: Years [0-30+] and Months [0-11])

"← Back" and "Save & Continue" buttons.

--- STEP 3: Address History ---
Title: "Where else have you lived in the past 7 years?"

Instruction text: "We need all addresses from the past 7 years,
starting with your most recent (after your current address)."

Show a timeline visualization of years covered so far:
[Current Address: 2024-Present] ---- [GAP: 2019-2024 needs filling]

Dynamic list of address entries (each collapsible after saving):
Each entry has:

Street Address*, City*, Province/State*, Postal Code*, Country*

Moved In*: Month (select) + Year (select)

Moved Out*: Month (select) + Year (select)
OR checkbox "I moved directly to my current address"

Add another past address → [+ Add Address] button

Gap detection: Calculate if all years back to 7 years ago are covered.
If gaps exist: show yellow warning "You have a gap from {date} to {date}.
Please add the address for this period."
Gaps don't BLOCK submission but are flagged.

"← Back" and "Save & Continue" buttons.

--- STEP 4: Employment History ---
Title: "Tell us about your work history (past 5 years)"

Instruction: "Please provide your employment history for the past 5 years.
Include all positions, including self-employment and gaps."

Dynamic list (up to 5 employers). Start with 1 blank entry.
Each entry (show as collapsible card after completing):

Employer/Company Name*

Job Title / Position*

Start Date*: Month + Year selects

End Date: Month + Year selects OR checkbox "I currently work here"

Work Type (select: Full-time | Part-time | Contract | Self-employed)

Supervisor Name (text, optional)

Supervisor Email or Phone (text, optional)

Reason for Leaving (text, max 200 chars, optional,
hidden if "currently work here" checked)

May we contact this employer? (toggle: Yes / No, default Yes)

[+ Add Another Employer] button (max 5).

No minimum entries required. Can skip if no work history in past 5 years
(show checkbox "I have no employment history in the past 5 years").

"← Back" and "Save & Continue" buttons.

--- STEP 5: Education History ---
Title: "Your education background"

Dynamic list (up to 3). Start with 1 blank entry.
Each entry:

Institution/School Name*

Degree / Diploma / Certificate / Program*
(select: High School Diploma | College Diploma | Bachelor's Degree |
Master's Degree | Doctorate | Professional Certification | Other)

Field of Study (text, optional)

Graduation Date: Month + Year (or checkbox "In progress" or
"Did not complete")

Student ID (text, optional, tooltip: "Only required for some
credential verification checks")

[+ Add Another Education] button (max 3).
Checkbox: "I did not complete any post-secondary education" (skip all)

"← Back" and "Save & Continue" buttons.

--- STEP 6: Additional Information ---
Title: "A few more questions"

Section A — Other Names:
"Have you ever been known by a different name? (e.g., maiden name,
previous legal name, alias)"
Radio: No | Yes
If Yes: Dynamic list of name fields (first + last + type: Maiden/Legal/Alias)
[+ Add Another Name] (max 3)

Section B — Professional Licenses:
"Do you hold any professional licenses, certifications, or memberships?"
Radio: No | Yes
If Yes: Textarea (max 500 chars) with placeholder:
"e.g., Registered Nurse (RN), CPA, Real Estate License #12345..."

Section C — Criminal Record Disclosure (required section):
This section is legally required. Display with a distinct border/card style.

Heading: "Criminal Record Self-Disclosure"
Subtext: "Please answer honestly. Having a criminal record does not
automatically disqualify you. Chexpro is required by law to conduct
an individualized assessment."

Radio (required):
◉ "I do not have a criminal record or outstanding charges"
○ "I have a criminal record, outstanding charge, or have received
a conditional discharge"

If second option selected: show textarea
"Please provide details (type of offense, approximate date, jurisdiction).
You may also include context about rehabilitation, elapsed time, or other
relevant information."
(max 1000 chars. Not required but recommended)

Section D — Consent & Agreement (required):
Large bordered consent box:
"CONSENT TO BACKGROUND CHECK

I, {firstName} {lastName}, authorize Chexpro.com and its authorized
partners to conduct a background check on my behalf as requested by
{companyName}.

I confirm that:
☑ All information I have provided is accurate and complete to the
best of my knowledge
☑ I understand that providing false information may result in
disqualification
☑ I have read and agree to the Privacy Policy and Terms of Service
☑ I understand my rights under applicable privacy legislation
(PIPEDA in Canada)
☑ I consent to the collection, use, and disclosure of my personal
information for the purpose of this background check"

Single checkbox: "I agree to all of the above" (REQUIRED to proceed)

"← Back" and "Save & Continue" buttons.

--- STEP 7: Documents & Signature ---
Title: "Almost done — upload your ID and sign"

Section A: Document Upload
Instruction: "Please upload clear photos or scans of the following documents."

Upload Zone 1 (Required): "Government-issued Photo ID — Front"
Accepted: JPG, PNG, PDF, HEIC | Max: 10MB
Examples: Driver's License (front), Passport photo page
Show existing upload ✓ if already uploaded

Upload Zone 2 (Conditionally Required): "Government-issued Photo ID — Back"
Checkbox: "I'm uploading a passport (no back needed)"
If passport checkbox unchecked: required
Show existing upload ✓ if already uploaded

Upload Zone 3 (Optional): "Proof of Current Address"
Examples: Utility bill, bank statement, lease agreement (dated within 3 months)
Show existing upload ✓ if already uploaded

Upload Zone 4 (Optional): "Additional Documents"
Multiple files allowed
Show list of already uploaded additional documents

Each upload zone behavior:

Drag-and-drop OR click to browse

On file select: immediately call POST /api/v1/documents/upload

Show inline upload progress bar (0-100%)

On success: show ✓ checkmark + filename + file size

On failure: show ✗ with error message + retry button

Show thumbnail preview for image files (JPG, PNG)

Section B: Electronic Signature
Heading: "Sign to authorize this background check"
Subtext: "Please sign using your mouse, trackpad, or finger (on touch devices)"

Canvas element: 400px wide, 150px tall, light gray background
Border: 2px dashed gray
Watermark: "Sign here" in light gray centered text
Mouse events: onMouseDown start path, onMouseMove draw, onMouseUp end path
Touch events: same with touch coordinates (prevent page scroll during signing)
Line style: width 2px, black, smooth bezier curves

Below canvas:
"Clear" button (resets canvas)
"Your name: {firstName} {lastName}" shown below as confirmation

Validation before final submit:

ID front must be uploaded

ID back uploaded OR passport checkbox checked

Canvas must not be empty (check if any non-white pixels drawn)

Step 6 consent must be true (verified server-side too)

[← Back] and [Submit My Background Check ✓] buttons

Submit button behavior:

Disable button + show spinner

Call PUT /api/v1/wizard/:orderId/step/7 with { signatureBase64: canvas.toDataURL('image/png'), consentGiven: true }

Call POST /api/v1/wizard/:orderId/submit

On success: redirect to /wizard/:orderId/complete

On error: re-enable button, show error toast

7.6 WizardCompletePage (/wizard/:orderId/complete)
Full-page celebration/confirmation screen. No sidebar.

Center of page:

Large animated ✓ checkmark (green, CSS animation — grows in)

Heading: "You're all done!"

Subheading: "Your background check information has been submitted to {companyName}"

Info card:

Reference Number: {orderNumber}

Position: {positionTitle}

Submitted: {today's date}

Estimated Completion: {estimatedCompletionDate}

Message: "What happens next?

Chexpro will verify your information with our trusted partners

You'll receive an email when your check is complete

{companyName} will be notified of the results"

Buttons:

[Track My Check Status →] → /checks/:orderId

[Go to Dashboard] → /dashboard

7.7 ChecksListPage (/checks)
Title: "My Background Checks"

Fetch: GET /api/v1/checks
Show list/cards for each check:

Card layout:

Left: Status badge (large, color-coded)

Center: Company name + position title + package name

Right: Submission date + estimated completion

Bottom bar: Progress indicator showing check stages
[Submitted] → [In Progress] → [Review] → [Complete]
Filled steps shown in green/blue based on current status

Status color map:

draft: gray

awaiting_applicant_info: yellow ("Waiting for your information")

data_verification: purple ("Verifying your information")

in_progress: blue ("Processing")

pending_review: orange ("Under review")

requires_action: red ("Action needed") — show ! badge

completed: green ("Complete")

cancelled: gray muted ("Cancelled")

If status = 'awaiting_applicant_info' and wizard NOT completed:
Show prominent [Complete Your Information →] button in yellow

[View Details] button on each card → /checks/:orderId

Empty state: "No background checks yet."

7.8 CheckDetailPage (/checks/:orderId)
Fetch: GET /api/v1/checks/:orderId and GET /api/v1/checks/:orderId/timeline

Layout: Two columns on desktop, single column on mobile

LEFT COLUMN: Order Summary Card

Status badge (large, color-coded)

Order reference number

Company name + company logo (if available)

Position title

Package name + services list

Submitted date

Estimated completion date

Completed date (if completed)

If requires_action: show yellow action banner:
"Action Required: {latestTimelineEntry.notes}"
[Contact Us] button

If completed: show green complete banner:
"Your background check is complete."
[Download Report] button (calls GET /api/v1/checks/:orderId/report)
If report not ready: show disabled button with tooltip "Report not yet available"

RIGHT COLUMN: Status Timeline
Vertical timeline (most recent at top):
Each entry:

Colored dot (matching status color)

Status label (bold)

Description text

Timestamp (formatted: "Feb 19, 2026 at 2:30 PM")

Notes (if any — some notes are internal and won't be returned by API)

At bottom of timeline: "Check submitted on {date}"

Below timeline: Documents Section
Show uploaded documents:

File name + type + size + upload date

Download button per document

Add more documents button → modal with upload zone

Poll for updates every 60 seconds using TanStack Query refetchInterval.
When status changes (detected by refetch): show toast "Status updated: {newStatus}"

7.9 DocumentsPage (/documents)
Title: "My Documents"
Instruction: "Documents you've uploaded for your background checks."

Fetch: GET /api/v1/documents

Filter tabs: All | Photo ID | Proof of Address | Other

Table/grid layout:
Columns: Document Name | Type | Linked Check | Uploaded | Size | Actions

Actions:

[Download] — opens file in new tab

[Delete] — only shown if check is not completed
Confirm dialog: "Delete this document? This cannot be undone."

[+ Upload Document] button top-right:
Opens modal with:

Select Check (dropdown of their orders)

Document Type (select)

Upload zone (same component as wizard)

7.10 ProfilePage (/profile)
Title: "My Account"

Two sections:

Section A — Personal Information:
Fetch: GET /api/v1/profile
Show: Full Name, Email (read-only), Phone, Preferred Name
[Edit] button → enables form
[Save Changes] button → PUT /api/v1/profile
Show success toast on save.

Section B — Security:
"Change Password" (collapsible section)
Fields: Current Password, New Password, Confirm New Password
Submit → PUT /api/v1/profile/password
Show success toast.

Section C — Notification Preferences:
Toggles (saved to communicationPrefs):

Email notifications for status updates (default: on)

Email notifications when check is complete (default: on)

Email reminders to complete wizard (default: on)
[Save Preferences] → PUT /api/v1/profile

Section D — Account (danger zone, red border):
"Delete My Account"
Warning: "This will permanently delete your account and all data."
[Delete Account] button → shows confirmation modal
Modal requires typing "DELETE MY ACCOUNT" + entering password
Submit → DELETE /api/v1/profile/account

7.11 NotificationsPage (/notifications)
Title: "Notifications"

[Mark All Read] button top-right

List of notifications, sorted newest first:
Each item:

Icon (different per notification type)

Title (bold if unread)

Message text

Timestamp

Linked check reference (clickable → /checks/:orderId)

Unread: highlighted background

Notification types and icons:

status_update: RefreshCw (blue)

requires_action: AlertCircle (red)

check_complete: CheckCircle (green)

report_ready: FileText (green)

adverse_action: AlertTriangle (orange)

reminder: Clock (yellow)

Click on notification → mark as read + navigate to linked check if applicable

Empty state: "You're all caught up! No notifications."

7.12 frontend/src/hooks/useWebSocket.ts
typescript
// Connect to Socket.io at VITE_WS_URL
// Auth: send access token in socket auth
// On connect: 
//   - Join candidate room: socket.emit('join-candidate-room', { candidateId })
//   - Join each check room: socket.emit('join-check-room', { orderId })
// Listen for events:
//   'orderStatusChanged': 
//     - Invalidate TanStack Query ['checks'] and ['check', orderId]
//     - Show toast: "Update: Your {companyName} check status changed to {status}"
//     - Create notification (fetched on next query refresh)
//   'newNotification':
//     - Invalidate ['notifications']
//     - Show toast with notification content
//   'checkComplete':
//     - Show success toast
//     - Invalidate all check queries
// Call this hook inside Layout.tsx
SECTION 8: INFRASTRUCTURE FILES
docker-compose.dev.yml
text
version: '3.8'

services:
  candidate-backend:
    build:
      context: ./backend
      dockerfile: Dockerfile.dev
    container_name: chexpro-candidate-api
    restart: unless-stopped
    ports:
      - "3004:3004"
    environment:
      NODE_ENV: development
      PORT: 3004
    env_file:
      - ./backend/.env
    volumes:
      - ./backend:/app
      - /app/node_modules
      - ./backend/uploads:/app/uploads
    depends_on:
      - redis
    networks:
      - chexpro-network

  candidate-worker:
    build:
      context: ./backend
      dockerfile: Dockerfile.dev
    container_name: chexpro-candidate-worker
    restart: unless-stopped
    environment:
      NODE_ENV: development
    env_file:
      - ./backend/.env
    command: npm run worker
    volumes:
      - ./backend:/app
      - /app/node_modules
    depends_on:
      - redis
    networks:
      - chexpro-network

  redis:
    image: redis:7-alpine
    container_name: chexpro-candidate-redis
    restart: unless-stopped
    ports:
      - "6381:6379"
    volumes:
      - redis_candidate_data:/data
    networks:
      - chexpro-network

volumes:
  redis_candidate_data:

networks:
  chexpro-network:
    name: chexpro-network
    driver: bridge
Note: MySQL is NOT in this compose file because it's shared with the
Client Portal. This service connects to the existing MySQL instance.

pm2.ecosystem.config.js
javascript
module.exports = {
  apps: [
    {
      name: 'candidate-api',
      script: './backend/dist/index.js',
      instances: 2,
      exec_mode: 'cluster',
      watch: false,
      max_memory_restart: '512M',
      env_production: {
        NODE_ENV: 'production',
        PORT: 3004
      },
      error_file: '/var/log/chexpro-candidate/api-error.log',
      out_file: '/var/log/chexpro-candidate/api-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true
    },
    {
      name: 'candidate-worker',
      script: './backend/dist/worker.js',
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      max_memory_restart: '256M',
      env_production: {
        NODE_ENV: 'production'
      },
      error_file: '/var/log/chexpro-candidate/worker-error.log',
      out_file: '/var/log/chexpro-candidate/worker-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
    }
  ]
};
nginx/mycheck.chexpro.com.conf
text
server {
    listen 80;
    server_name mycheck.chexpro.com candidate-api.chexpro.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name mycheck.chexpro.com;

    ssl_certificate /etc/letsencrypt/live/chexpro.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/chexpro.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers on;

    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; connect-src 'self' https://candidate-api.chexpro.com wss://candidate-api.chexpro.com;" always;

    root /var/www/candidate-frontend/build;
    index index.html;

    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}

server {
    listen 443 ssl http2;
    server_name candidate-api.chexpro.com;

    ssl_certificate /etc/letsencrypt/live/chexpro.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/chexpro.com/privkey.pem;

    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    limit_req_zone $binary_remote_addr zone=candidate_api:10m rate=60r/m;

    location / {
        limit_req zone=candidate_api burst=20 nodelay;
        proxy_pass http://127.0.0.1:3004;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_connect_timeout 60s;
        proxy_read_timeout 60s;
    }

    location /socket.io/ {
        proxy_pass http://127.0.0.1:3004;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_read_timeout 86400;
    }
}
SECTION 9: PRISMA SCHEMA ADDITIONS
In backend/prisma/schema.prisma:
Copy the FULL schema from the Client Portal exactly.
Then ADD these two new models at the end:

text
model CandidateProfile {
  id                  String    @id @default(uuid())
  userId              String    @unique @map("user_id")
  preferredName       String?   @map("preferred_name")
  communicationPrefs  Json?     @map("communication_prefs")
  timezone            String?   @default("America/Toronto")
  language            String?   @default("en")
  lastActiveAt        DateTime? @map("last_active_at")
  createdAt           DateTime  @default(now()) @map("created_at")
  updatedAt           DateTime  @updatedAt @map("updated_at")
  user                User      @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("candidate_profiles")
}

model CandidateInvitation {
  id                       String    @id @default(uuid())
  orderId                  String    @map("order_id")
  applicantEmail           String    @map("applicant_email")
  invitationToken          String    @unique @map("invitation_token")
  tokenExpiresAt           DateTime  @map("token_expires_at")
  registrationCompletedAt  DateTime? @map("registration_completed_at")
  userId                   String?   @map("user_id")
  createdAt                DateTime  @default(now()) @map("created_at")

  @@index([invitationToken])
  @@index([applicantEmail])
  @@map("candidate_invitations")
}
Also add to the User model (find the User model and add):
candidateProfile CandidateProfile?

Then run: npx prisma migrate dev --name add_candidate_tables

SECTION 10: SEED DATA
backend/prisma/seed.ts should create:

One test candidate user:
email: candidate@test.com
password: Demo@123456 (bcrypt hashed, rounds 12)
role: 'candidate'