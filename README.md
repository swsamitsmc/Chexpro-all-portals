# ChexPro Website with SMTP Backend

This project is a modern, responsive website for ChexPro, a fictional company providing background screening services. It features a React-based frontend and a Node.js (Express) backend for handling contact and demo request forms via SMTP.

## Features

- **Responsive Design:** Fully responsive and mobile-friendly layout.
- **Modern Tech Stack:** Built with React, Vite, Tailwind CSS, and Framer Motion.
- **Component-Based Architecture:** Organized into reusable components.
- **Secure Form Handling:** Backend with input validation, rate limiting, and XSS protection.
- **SMTP Integration:** Sends form submissions to designated email addresses.

## Project Structure

```
/
├── docs/                      # Documentation files
├── frontend/                  # React frontend application
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   ├── pages/           # Page components
│   │   └── ...
│   ├── package.json
│   └── ...
└── server/                    # Node.js backend service
    ├── routes/              # API routes
    │   └── forms.js
    ├── index.js             # Main server file
    └── package.json
```

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm

### Installation

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   ```

2. **Install frontend dependencies:**
   ```bash
   cd frontend
   npm install
   ```

3. **Install backend dependencies:**
   ```bash
   cd ../server
   npm install
   ```

### Configuration

1. **Create a `.env` file in the `server` directory.**
2. **Add the following environment variables:**

   ```
   # Server Configuration
   PORT=3000

   # SMTP Server Settings
   SMTP_HOST=your_smtp_host
   SMTP_PORT=your_smtp_port
   SMTP_SECURE=true_or_false
   SMTP_USER=your_smtp_username
   SMTP_PASS=your_smtp_password

   # Email Recipients
   CONTACT_RECIPIENT=contact@example.com
   DEMO_RECIPIENT=demo@example.com
   ```

### Running the Application

1. **Start the backend server:**
   ```bash
   cd server
   npm start
   ```

2. **Start the frontend development server:**
   ```bash
   cd ../frontend
   npm run dev
   ```

The frontend will be available at `http://localhost:5173` and the backend at `http://localhost:3000`.

## Scripts

- `frontend`: `npm run dev` - Starts the development server.
- `frontend`: `npm run build` - Builds the application for production.
- `frontend`: `npm run preview` - Previews the production build.
- `server`: `npm start` - Starts the backend server.
