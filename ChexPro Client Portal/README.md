# ChexPro Client Portal

Enterprise-grade background check client portal for Chexpro.com.

## Tech Stack
- **Frontend**: React 18 + TypeScript + Tailwind CSS + shadcn/ui
- **Backend**: Node.js + Express + TypeScript + Prisma ORM
- **Database**: MySQL 8.0
- **Cache**: Redis 7
- **Auth**: JWT with refresh token rotation + optional 2FA (TOTP)
- **Real-time**: Socket.io WebSocket
- **Payments**: Stripe
- **Infrastructure**: Docker, Nginx, PM2

## Features
- Client authentication with RBAC (Owner, Admin, Manager, User)
- Background check order creation and management
- 7-step applicant self-service data collection portal
- Real-time order status tracking via WebSocket
- FCRA-compliant adverse action workflow
- Automated adjudication engine
- Continuous monitoring and re-screening
- Dispute resolution management
- Reports & analytics dashboard
- Client branding customization
- Billing & invoice management
- Stripe payment integration

## Local Development Setup

### Prerequisites
- Node.js 20+
- Docker & Docker Compose
- npm

### Quick Start

```bash
# 1. Clone the repository
git clone https://github.com/swsamitsmc/Chexpro-Client-Portal.git
cd Chexpro-Client-Portal

# 2. Configure environment
cp .env.example backend/.env
# Edit backend/.env with your local values

# 3. Start infrastructure (MySQL + Redis)
docker-compose -f docker-compose.dev.yml up -d

# 4. Install dependencies and set up database
cd backend
npm install
npx prisma migrate dev
npx ts-node prisma/seed.ts

# 5. Start backend (Terminal 1)
npm run dev

# 6. Start frontend (Terminal 2)
cd ../frontend
npm install
npm run dev
```
