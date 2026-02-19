# ChexPro Admin Portal

Internal Operations Management System for ChexPro Background Check Services.

## Project Structure

```
Chexpro Admin Portal/
├── backend/                 # Express + TypeScript API
│   ├── prisma/
│   │   └── schema.prisma   # Database schema (shared with Client Portal)
│   ├── src/
│   │   ├── config/         # Environment, Prisma, Logger configs
│   │   ├── middleware/     # Auth, Error Handler, Rate Limiter
│   │   ├── routes/         # API routes (auth, orders, etc.)
│   │   ├── types/          # TypeScript types & permissions
│   │   ├── utils/          # Response helpers
│   │   └── index.ts        # Entry point
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/                # React + Vite + TypeScript
│   ├── src/
│   │   ├── components/     # Layout, Sidebar, Header
│   │   ├── pages/          # Dashboard, Orders, Clients, etc.
│   │   ├── store/          # Zustand auth store
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── index.css       # Tailwind + theme variables
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.ts
│
└── README.md
```

## Tech Stack

### Backend
- **Node.js + Express** - REST API framework
- **TypeScript** - Type safety
- **Prisma ORM** - Database access (MySQL, shared with Client Portal)
- **JWT + Passport** - Authentication
- **Socket.io** - Real-time updates
- **Bull + Redis** - Job queues (configured, ready to use)
- **Winston** - Logging

### Frontend
- **React 18 + TypeScript** - UI framework
- **Vite** - Build tool
- **Tailwind CSS** - Styling (matches main website theme)
- **Zustand** - State management
- **TanStack Query** - Server state
- **React Router** - Navigation
- **Recharts** - Charts
- **Lucide React** - Icons

## Features by Phase

### ✅ Phase 1: Foundation (Complete)
- Project structure for backend and frontend
- Database schema with admin-specific tables
- Authentication system with JWT, MFA support
- Role-based access control (7 roles)
- Responsive layout with collapsible sidebar
- Dark mode support
- Login page with MFA flow
- Dashboard placeholder with stat cards

### 🔜 Phase 2: Dashboard Widgets
- Order overview widget
- SLA status widget
- My workload widget
- Quality metrics widget
- Client activity widget
- Vendor performance widget

### 🔜 Phase 3: Order Processing
- Order queue management
- Order detail view (3-panel layout)
- Status workflow management
- Bulk order processing

### 🔜 Phase 4: Client Credentialing
- Credentialing workflow wizard
- Business verification checklist
- Compliance documentation tracking

### 🔜 Phase 5: Vendor Management
- Vendor dashboard and configuration
- Pricing management
- Performance metrics
- Intelligent routing engine

### 🔜 Phase 6: Quality Assurance
- QA queue dashboard
- Review interface with checklist
- Pass/Fail workflow

### 🔜 Phase 7: Adjudication System
- Adjudication queue
- Individualized assessment forms
- Matrix builder for auto-screening

### 🔜 Phase 8: Additional Modules
- Reports & analytics
- Team management
- SLA monitoring
- Compliance tools

## Getting Started

### Prerequisites
- Node.js 18+
- MySQL 8.0 (shared with Client Portal)
- Redis (for queues and caching)

### Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your database credentials

# Generate Prisma client
npx prisma generate

# Run migrations (adds admin tables to shared DB)
npx prisma migrate dev --name init_admin

# Run development server
npm run dev
```

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Run development server
npm run dev
```

### Access
- Frontend: http://localhost:3001
- Backend API: http://localhost:3002
- API Health: http://localhost:3002/health

## Admin Roles

| Role | Description |
|------|-------------|
| `super_admin` | Full system access |
| `operations_manager` | View all orders, reassign, override SLA |
| `processor` | Process assigned orders |
| `qa_specialist` | Review reports before delivery |
| `client_success_mgr` | Manage client settings |
| `credentialing_spec` | Onboard new clients |
| `compliance_officer` | Compliance & audit access |

## Theme Colors (Matches Main Website)

- **Primary Blue**: `hsl(217 91% 60%)` - #2563EB
- **Accent Teal**: `hsl(170 45% 50%)`
- **Secondary Grey**: `hsl(220 13% 91%)`

## License

