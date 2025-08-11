# Copilot Instructions for ChexPro Website with Backend

## Project Overview
- **Frontend:** React (Vite, Tailwind CSS, Framer Motion), located in `frontend/`. Uses component-based architecture, custom hooks, and supports internationalization (i18n) for 4 languages. Key config: `frontend/src/config/`, i18n: `frontend/src/i18n/locales/`.
- **Backend:** Node.js (Express), located in `server/`. Implements SOC2-compliant security, MySQL integration, session management, and SMTP email delivery. Key config: `server/config/`, routes: `server/routes/`, utilities: `server/utils/`.

## Architecture & Data Flow
- **Frontend** communicates with **backend** via REST API endpoints (see `server/routes/`).
- **Forms** (contact, demo) POST to `/api/form/contact` and `/api/form/demo`.
- **Authentication** via `/api/auth/login` and `/api/auth/logout`.
- **Session management** uses secure cookies and database-backed sessions.
- **Internationalization**: Language files in `frontend/src/i18n/locales/`.
- **Monitoring**: Metrics and health endpoints (`/api/metrics`, `/health`).

## Developer Workflows
- **Install dependencies:**
  - Frontend: `cd frontend; npm install`
  - Backend: `cd server; npm install`
- **Environment config:**
  - Backend: `.env` in `server/` (see README for required vars)
  - Frontend: `.env` in `frontend/` (see README)
- **Run servers:**
  - Backend: `cd server; npm start`
  - Frontend: `cd frontend; npm run dev`
- **Validate backend config:** `cd server; npm run validate-config`
- **Lint:**
  - Frontend: `npm run lint` in `frontend/`
  - Backend: `npm run lint` in `server/`
- **Build frontend:** `npm run build` in `frontend/`

## Conventions & Patterns
- **Components:** Place reusable UI in `frontend/src/components/`. Use error boundaries for robustness.
- **Custom hooks:** Store in `frontend/src/hooks/`.
- **Config separation:** Use `config/` folders for environment and app settings.
- **Security:** Always validate and sanitize inputs (see `server/middleware/`).
- **Session & Auth:** Use bcrypt for password hashing, sessions stored in DB.
- **Monitoring:** Use provided endpoints for health and metrics.

## Integration Points
- **MySQL:** Config in `server/config/db.js`, schema in `server/sql/schema.sql`.
- **SMTP:** Email config in `server/utils/emailConfig.js` and `.env`.
- **Google Analytics:** Frontend config via `.env` and `frontend/src/lib/googleAnalytics.js`.

## Key Files & Directories
- `frontend/src/pages/` — Page components
- `frontend/src/components/` — UI components
- `frontend/src/hooks/` — Custom React hooks
- `frontend/src/config/` — Frontend config
- `frontend/src/i18n/` — Internationalization
- `server/routes/` — API endpoints
- `server/utils/` — Backend utilities
- `server/config/` — Backend config
- `server/sql/schema.sql` — DB schema

## Example Patterns
- **Form submission:** See `server/routes/forms.js` and corresponding frontend pages.
- **Error boundaries:** See `frontend/src/components/ErrorBoundary.jsx`.
- **Cookie consent:** See `frontend/src/components/CookieConsent.jsx` and related hooks.

## References
- For deployment, see `docs/DEPLOYMENT.md`.
- For SOC2 handover, see `docs/PROJECT_HANDOVER.md`.

---

**Feedback requested:** If any section is unclear or missing, please specify so it can be improved for future AI agents.
