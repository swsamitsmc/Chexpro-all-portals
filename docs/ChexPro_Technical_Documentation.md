# ChexPro Website Technical Documentation

## 1. Introduction & Purpose

### 1.1. Project Overview
The ChexPro website is a modern, responsive platform designed to:
- **Generate Leads**: Via Contact and Demo Request forms.
- **Provide Information**: Detail services, compliance, resources, and contact options.
- **Enable Self-Service**: A client login portal for managing background checks and reports.

### 1.2. Target Audience
- **Potential Clients**: Businesses, landlords, staffing firms.
- **Existing Clients**: US Employers (manage checks), Candidates (view reports).
- **ChexPro Team**: Access internal tools.

## 2. Frontend Technology Stack

### 2.1. Core Technologies
- **Framework**: React v18.2.0
- **Build Tool**: Vite
- **Language**: JavaScript + JSX
- **Styling**: Tailwind CSS v3.3.3
- **Animation**: Framer Motion v10.16.4
- **Routing**: React Router DOM v6.16.0
- **UI Library**: ShadCN (Radix UI)

### 2.2. Routing
- **Library**: React Router DOM v6.16.0
- **Setup**: `src/App.jsx` with lazy-loaded pages.

### 2.3. State Management
- `useState`, `useReducer`, and the Context API are used for state management.

### 2.4. Styling
- Tailwind CSS v3.3.3 with custom theming in `src/index.css`.

## 3. Backend Architecture

### 3.1. Framework and Language
- **Framework**: Node.js with Express.js
- **Language**: JavaScript

### 3.2. API Design
- **Protocol**: RESTful API
- **Endpoints**:
  - `POST /api/form/contact`: Submits the contact form.
  - `POST /api/form/demo`: Submits the demo request form.
  - `GET /health`: Health check endpoint.

### 3.3. Security
- **Input Validation**: `express-validator` is used to validate and sanitize all incoming form data.
- **Rate Limiting**: `express-rate-limit` is implemented to prevent brute-force and denial-of-service attacks.
- **XSS Protection**: All user-provided data is escaped before being rendered in emails to prevent Cross-Site Scripting (XSS) attacks.
- **Environment Variables**: Sensitive information such as API keys and database credentials are stored in a `.env` file and are not committed to version control.

## 4. Development & Deployment Workflow

### 4.1. Local Development
- **Frontend**:
  ```bash
  cd frontend
  npm install
  npm run dev
  ```
- **Backend**:
  ```bash
  cd server
  npm install
  npm start
  ```

### 4.2. Git Workflow
- **Repository**: Private GitHub repository.
- **Branching**: GitHub Flow (`feat/`, `fix/` branches, PRs to `main`).
- **Commits**: Conventional Commits style (`type(scope): subject`).

## 5. Dependencies

### 5.1. Frontend Dependencies
```json
{
  "dependencies": {
    "@radix-ui/react-accordion": "^1.1.2",
    "@radix-ui/react-alert-dialog": "^1.0.5",
    "@radix-ui/react-avatar": "^1.0.3",
    "@radix-ui/react-checkbox": "^1.0.4",
    "@radix-ui/react-dialog": "^1.0.5",
    "@radix-ui/react-dropdown-menu": "^2.0.5",
    "@radix-ui/react-label": "^2.0.2",
    "@radix-ui/react-navigation-menu": "^1.1.4",
    "@radix-ui/react-slider": "^1.1.2",
    "@radix-ui/react-slot": "^1.0.2",
    "@radix-ui/react-tabs": "^1.0.4",
    "@radix-ui/react-toast": "^1.1.5",
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.0.0",
    "framer-motion": "^10.16.4",
    "lucide-react": "^0.292.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-helmet-async": "^2.0.5",
    "react-router-dom": "^6.16.0",
    "tailwind-merge": "^1.14.0",
    "tailwindcss-animate": "^1.0.7"
  },
  "devDependencies": {
    "@types/node": "^20.8.3",
    "@types/react": "^18.2.15",
    "@types/react-dom": "^18.2.7",
    "@vitejs/plugin-react": "^4.0.3",
    "autoprefixer": "^10.4.16",
    "eslint": "^8.57.1",
    "eslint-config-react-app": "^7.0.1",
    "postcss": "^8.4.31",
    "tailwindcss": "^3.3.3",
    "terser": "^5.39.0",
    "vite": "^7.0.6"
  }
}
```

### 5.2. Backend Dependencies
```json
{
  "dependencies": {
    "cors": "^2.8.5",
    "dotenv": "^16.4.5",
    "express": "^4.19.2",
    "express-validator": "^7.1.0",
    "nodemailer": "^6.9.14",
    "express-rate-limit": "^7.3.1"
  }
}
```
