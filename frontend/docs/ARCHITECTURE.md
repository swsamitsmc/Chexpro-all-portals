# ChexPro Website Technical Documentation

## 1. Introduction & Purpose

### 1.1. Project Overview:
The ChexPro website serves as a multifaceted online platform designed to:
- **Generate Leads:** Attract new potential clients interested in background screening services.
- **Facilitate Direct Service Sales:** Provide a pathway for clients to purchase services.
- **Act as an Information Portal:** Offer detailed information about ChexPro's services, compliance, resources, and contact options.
- **Enable Client Self-Service:** Provide a dedicated "Client Login" area where existing clients can access their accounts to initiate and manage background checks for their candidates.

### 1.2. Target Audience:
The primary users of this website include:
- **Potential Clients:** Businesses, landlords, staffing firms, and individuals seeking background screening services.
- **Existing Clients:** Registered users who require access to their accounts for managing services.
- **Internal Staff:** Potentially for accessing specific internal resources or information.
- **Job Seekers:** Potentially for understanding the background check process or accessing their own reports.
- **Landlords:** Specifically targeted for tenant screening services.

## 2. Frontend Technology Stack

### 2.1. Core Technologies:
- **Framework:** React v18.2.0
- **Build Tool:** Vite v4.4.5
- **Language:** JavaScript (with JSX for React components)
- **Styling:** Tailwind CSS v3.3.3 (with custom theming via CSS variables and PostCSS)
- **Animation:** Framer Motion v10.16.4
- **Routing:** React Router DOM v6.16.0
- **UI Library:** ShadCN UI components (derived from @radix-ui/* dependencies)

### 2.2. Vite Configuration (`vite.config.js` Analysis):
The `vite.config.js` file (located in the project root) defines the build process and development server behavior. Key aspects include:
- **@vitejs/plugin-react:** Standard plugin for React fast refresh during development.
- **Path Aliases (@):** Configured to resolve to the `src` directory. This allows for cleaner imports, e.g., `import MyComponent from '@/components/MyComponent'` instead of relative paths.
- **Custom Error Handling (Horizons Integrations):** This is a significant customization. The configuration injects several custom JavaScript snippets directly into the `index.html` during the build process. These scripts are designed for enhanced error reporting and debugging, likely integrated with an external monitoring system or development environment named "Horizons". They capture:
    - Vite overlay errors (development build errors).
    - Runtime JavaScript errors (`window.onerror`).
    - Console errors (by monkey-patching `console.error`).
    - Fetch API errors (by monkey-patching `window.fetch`) for non-HTML responses.
    - *Impact*: Developers should be aware that `console.error` and `window.fetch` behavior are intercepted. The use of `window.parent.postMessage` suggests these errors are communicated to an embedding parent window or debugging tool.
- **Custom Logger:** Suppresses specific `CssSyntaxError: [postcss]` warnings in the console, which might occur during Tailwind CSS processing.
- **Server Configuration:**
    - `cors: true`: Enables Cross-Origin Resource Sharing for the development server.
    - `headers: { 'Cross-Origin-Embedder-Policy': 'credentialless' }`: A security header related to embedding content.
    - `allowedHosts: true`: Allows requests from any host during development.
- **`console.warn = () => {};`**: This line directly silences all `console.warn` messages in the development console. While it cleans up output, it might hide important warnings.

```javascript
import path from 'node:path';
import react from '@vitejs/plugin-react';
import { createLogger, defineConfig } from 'vite';

const configHorizonsViteErrorHandler = `
const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
        for (const addedNode of mutation.addedNodes) {
            if (
                addedNode.nodeType === Node.ELEMENT_NODE &&
                (
                    addedNode.tagName?.toLowerCase() === 'vite-error-overlay' ||
                    addedNode.classList?.contains('backdrop')
                )
            ) {
                handleViteOverlay(addedNode);
            }
        }
    }
});

observer.observe(document.documentElement, {
    childList: true,
    subtree: true
});

function handleViteOverlay(node) {
    if (!node.shadowRoot) {
        return;
    }

    const backdrop = node.shadowRoot.querySelector('.backdrop');

    if (backdrop) {
        const overlayHtml = backdrop.outerHTML;
        const parser = new DOMParser();
        const doc = parser.parseFromString(overlayHtml, 'text/html');
        const messageBodyElement = doc.querySelector('.message-body');
        const fileElement = doc.querySelector('.file');
        const messageText = messageBodyElement ? messageBodyElement.textContent.trim() : '';
        const fileText = fileElement ? fileElement.textContent.trim() : '';
        const error = messageText + (fileText ? ' File:' + fileText : '');

        window.parent.postMessage({
            type: 'horizons-vite-error',
            error,
        }, '*');
    }
}
`;

const configHorizonsRuntimeErrorHandler = `
window.onerror = (message, source, lineno, colno, errorObj) => {
    const errorDetails = errorObj ? JSON.stringify({
        name: errorObj.name,
        message: errorObj.message,
        stack: errorObj.stack,
        source,
        lineno,
        colno,
    }) : null;

    window.parent.postMessage({
        type: 'horizons-runtime-error',
        message,
        error: errorDetails
    }, '*');
};
`;

const configHorizonsConsoleErrroHandler = `
const originalConsoleError = console.error;
console.error = function(...args) {
    originalConsoleError.apply(console, args);

    let errorString = '';

    for (let i = 0; i < args.length; i++) {
        const arg = args[i];
        if (arg instanceof Error) {
            errorString = arg.stack || \`${arg.name}: ${arg.message}\`;
            break;
        }
    }

    if (!errorString) {
        errorString = args.map(arg => typeof arg === 'object' ? JSON.stringify(arg) : String(arg)).join(' ');
    }

    window.parent.postMessage({
        type: 'horizons-console-error',
        error: errorString
    }, '*');
};
`;

const configWindowFetchMonkeyPatch = `
const originalFetch = window.fetch;

window.fetch = function(...args) {
    const url = args[0] instanceof Request ? args[0].url : args[0];

    // Skip WebSocket URLs
    if (url.startsWith('ws:') || url.startsWith('wss:')) {
        return originalFetch.apply(this, args);
    }

    return originalFetch.apply(this, args)
        .then(async response => {
            const contentType = response.headers.get('Content-Type') || '';

            // Exclude HTML document responses
            const isDocumentResponse =
                contentType.includes('text/html') ||
                contentType.includes('application/xhtml+xml');

            if (!response.ok && !isDocumentResponse) {
                    const responseClone = response.clone();
                    const errorFromRes = await responseClone.text();
                    const requestUrl = response.url;
                    console.error(\`Fetch error from ${requestUrl}: ${errorFromRes}\`);
            }

            return response;
        })
        .catch(error => {
            if (!url.match(/\\.html?$/i)) {
                console.error(error);
            }

            throw error;
        });
};
`;

const addTransformIndexHtml = {
    name: 'add-transform-index-html',
    transformIndexHtml(html) {
        return {
            html,
            tags: [
                {
                    tag: 'script',
                    attrs: { type: 'module' },
                    children: configHorizonsRuntimeErrorHandler,
                    injectTo: 'head',
                },
                {
                    tag: 'script',
                    attrs: { type: 'module' },
                    children: configHorizonsViteErrorHandler,
                    injectTo: 'head',
                },
                {
                    tag: 'script',
                    attrs: {type: 'module'},
                    children: configHorizonsConsoleErrroHandler,
                    injectTo: 'head',
                },
                {
                    tag: 'script',
                    attrs: { type: 'module' },
                    children: configWindowFetchMonkeyPatch,
                    injectTo: 'head',
                },
            ],
        };
    },
};

console.warn = () => {};

const logger = createLogger()
const loggerError = logger.error

logger.error = (msg, options) => {
    if (options?.error?.toString().includes('CssSyntaxError: [postcss]')) {
        return;
    }

    loggerError(msg, options);
}

export default defineConfig({
    customLogger: logger,
    plugins: [react(), addTransformIndexHtml],
    server: {
        cors: true,
        headers: {
            'Cross-Origin-Embedder-Policy': 'credentialless',
        },
        allowedHosts: true,
    },
    resolve: {
        extensions: ['.jsx', '.js', '.tsx', '.ts', '.json', ],
        alias: {
            '@': path.resolve(__dirname, './src'),
        },
    },
});
2.3. Routing:
Library: React Router DOM (v6.16.0).
Setup: Routing is defined declaratively within src/App.jsx using the Routes and Route components.
Dynamic Page Loading (Lazy Loading): All primary page components (e.g., HomePage, AboutUsPage) are lazy-loaded using React.lazy() and Suspense. This improves initial load times by fetching component JavaScript bundles only when needed.
Pathing:
/ maps to the HomePage component.
/about maps to AboutUsPage.
/services maps to ServicesPage, and so on, following the navigation structure.
* (wildcard) maps to NotFoundPage for any unmatched URLs.
Page Transitions: Framer Motion's AnimatePresence component is used around the Routes to enable custom page transition animations (likely utilizing the PageTransition component/hook).
Protected Routes: As of now, there is no explicit authentication logic gating routes directly within the React Router setup. The "Client Login" page will likely handle authentication and then manage user access internally.
2.4. State Management:
Current Approach: The project does not currently utilize a third-party global state management library (e.g., Redux, Zustand).
Implementation: State is primarily managed using React's built-in hooks:
useState for component-local state.
useReducer for more complex state logic within individual components.
It is possible that React's Context API is used for sharing global data (like user authentication status or theme settings) across components without prop drilling, though specific instances require code review.
2.5. Styling:
Primary Tool: Tailwind CSS (v3.3.3). Styles are primarily applied using Tailwind's utility classes directly within JSX.
Configuration (tailwind.config.js):
darkMode: ['class']: Enables dark mode toggling by adding/removing a dark class on the HTML or body element.
content: Configured to scan all JSX files in pages, components, app, and src directories to ensure all used Tailwind classes are included in the final build.
Custom Container: Defines a responsive container with specific padding and breakpoints (sm, md, lg, xl, 2xl, with 2xl at 1400px).
Extended Colors: Defines a custom color palette using CSS variables, facilitating consistent branding and easy theme changes. This includes primary (ChexPro Blue), secondary (Light Grey), and accent (Muted Teal/Calm Green), along with standard UI colors.
Custom Border Radius: Defines lg, md, sm border radii based on a global --radius CSS variable.
Custom Keyframes and Animations: Includes custom CSS keyframes (accordion-down, accordion-up, fadeIn, slideInUp) which are then exposed as Tailwind animations.
Plugins: Uses tailwindcss-animate for additional animation utilities.
Global Styles (src/index.css):
Imports Tailwind's base, components, and utilities layers.
Defines the CSS variables used for the custom color palette and border radii in both light (:root) and dark (.dark) modes.
Applies global base styles for HTML elements like * (borders), body (background, text color, font-family 'Inter'), and consistent typography for headings (h1-h6) and paragraphs.
Includes custom CSS classes like .gradient-bg (for linear gradients) and .glassmorphism (for a glass-like visual effect, with dark mode adjustments).
<!-- end list -->

CSS

@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 100%; /* White */
    --foreground: 224 71.4% 4.1%; /* Dark Blue/Black */

    --card: 0 0% 100%;
    --card-foreground: 224 71.4% 4.1%;

    --popover: 0 0% 100%;
    --popover-foreground: 224 71.4% 4.1%;

    --primary: 217 91% 60%; /* ChexPro Blue */
    --primary-foreground: 0 0% 98%; /* White */

    --secondary: 220 13% 91%; /* Light Grey */
    --secondary-foreground: 220 9% 34%; /* Darker Grey */
    
    --accent: 170 45% 50%; /* Muted Teal/Calm Green */
    --accent-foreground: 0 0% 98%; /* White */

    --muted: 220 14.3% 95.9%;
    --muted-foreground: 220 8.9% 46.1%;

    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 0 0% 98%;

    --border: 220 13% 85%; /* Lighter Grey for borders */
    --input: 220 13% 80%; /* Slightly darker for input borders */
    --ring: 217 91% 60%; /* ChexPro Blue for focus rings */

    --radius: 0.5rem;
  }

  .dark {
    --background: 224 71.4% 4.1%;
    --foreground: 0 0% 98%;

    --card: 224 71.4% 4.1%;
    --card-foreground: 0 0% 98%;

    --popover: 224 71.4% 4.1%;
    --popover-foreground: 0 0% 98%;

    --primary: 217 91% 60%;
    --primary-foreground: 0 0% 98%;
    
    --secondary: 220 13% 18%; /* Dark Grey */
    --secondary-foreground: 0 0% 98%; /* White */

    --accent: 170 45% 50%;
    --accent-foreground: 0 0% 98%;

    --muted: 220 13% 25%;
    --muted-foreground: 220 8.9% 66.1%;
    
    --destructive: 0 62.8% 30.6%;
    --destructive-foreground: 0 0% 98%;

    --border: 220 13% 30%;
    --input: 220 13% 35%;
    --ring: 217 91% 60%;
  }
}

@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground;
    font-family: 'Inter', sans-serif; /* Consider adding a font */
  }
  h1, h2, h3, h4, h5, h6 {
    @apply font-semibold tracking-tight;
  }
  h1 { @apply text-4xl lg:text-5xl; }
  h2 { @apply text-3xl lg:text-4xl; }
  h3 { @apply text-2xl lg:text-3xl; }
  p { @apply leading-relaxed; }
}

.gradient-bg {
  background: linear-gradient(135deg, hsl(var(--primary) / 0.8), hsl(var(--accent) / 0.7));
}

.glassmorphism {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.dark .glassmorphism {
  background: rgba(10, 25, 47, 0.1); /* Adjust dark mode glass color */
  border: 1px solid rgba(200, 200, 200, 0.1);
}

/* For animations */
.animated-item {
  opacity: 0;
}
2.6. Animation Library:
Library: Framer Motion (v10.16.4).
Usage: Used for declarative animations, including page transitions (via PageTransition and AnimatePresence in App.jsx) and element-specific animations (e.g., using motion.h1 and motion.div with initial, animate, transition, and variants props).
Common Patterns: The project utilizes reusable variants objects like fadeInStagger and fadeInItem (seen in HomePage.jsx) to apply consistent staggered animations to lists of elements. The PageTransition component likely wraps individual pages to provide consistent entry/exit animations.
3. Data Flow and Backend Integration
3.1. Current Backend Interaction:
Status: As of the current development phase, the ChexPro frontend application does not directly interact with its own custom backend API or any specific third-party APIs for dynamic content or core business logic.
Content Source: All website content (text, images, service descriptions, testimonials, etc.) is currently hardcoded directly within the React components, primarily within the src/pages/ and src/components/ directories.
Future Development: The presence of a "Client Login" page strongly implies a future integration with an authentication system and a backend service to handle client-specific functionalities (e.g., initiating background checks, accessing client dashboards). The specific technology stack for this future backend is currently undetermined.
3.2. API Call Mechanisms:
Current State: There are no apparent established patterns or dedicated utility files (e.g., src/lib/api.js or src/utils/api.js) for making API calls, which is consistent with a static frontend.
Potential for Future: The vite.config.js includes a custom JavaScript snippet (configWindowFetchMonkeyPatch) that intercepts window.fetch calls for error reporting. This suggests that if future API interactions are implemented, they would likely utilize the standard Fetch API, and this custom error reporting mechanism would automatically apply. Developers should be aware of this.
3.3. External Services/Integrations:
Current State: Other than the implied future connection for "Client Login," there are no readily identifiable direct integrations with specific third-party services (e.g., CRM, analytics, payment gateways, live chat, or reCAPTCHA) within the current codebase.
Future Considerations: Any future integration with third-party services would need to be explicitly documented here (e.g., Google Analytics, Intercom chat, payment processors, etc.).
3.4. Data Persistence (Frontend):
Current State: There is no explicit client-side data persistence mechanism (e.g., localStorage, sessionStorage, IndexedDB) evident in the provided code or file structure for storing user preferences, authentication tokens, or other persistent data.
Future Considerations: When authentication and user-specific features are implemented, it will be necessary to define and document a strategy for storing authentication tokens (e.g., HTTP-only cookies, localStorage) and user session data.
4. Development & Deployment Workflow
4.1. Local Development Workflow:
Getting Latest Code: Developers should always begin by pulling the latest changes from the main branch to ensure they are working with the most up-to-date codebase:
Bash

git pull origin main
Installing Dependencies: On initial project setup, or if the package.json file has been updated, install/update project dependencies:
Bash

npm install
Starting Development Server: To run the local development server with hot module replacement (HMR), allowing real-time preview of changes:
Bash

npm run dev
The application will typically be accessible in your web browser at http://localhost:5173/.
Key Files/Folders for Development:
src/pages/: Contains the main page components (e.g., HomePage.jsx, AboutUsPage.jsx). This is the primary location for adding or modifying page-specific content and features.
src/components/: Houses reusable UI components (e.g., Header.jsx, Footer.jsx, components from src/components/ui/). New reusable elements should be created or modified here.
src/assets/ or public/: Directories for static assets like images, fonts, and other files served directly by the web server.
src/index.css: Defines global styles, Tailwind CSS imports, and CSS variables for the application's theming.
tailwind.config.js: Configuration file for Tailwind CSS, including custom colors, breakpoints, animations, etc.
vite.config.js: Vite build tool configuration, including path aliases and custom error handlers.
4.2. Code Style & Linting:
Tooling: ESLint is configured (indicated by eslint and eslint-config-react-app in devDependencies) to enforce code quality and consistency.
Enforcement: Developers should adhere to the rules defined in the project's ESLint configuration. It is highly recommended to configure VS Code or other IDEs to automatically lint and potentially fix issues on file save.
Formatting: While not explicitly configured with Prettier yet, it is strongly recommended to integrate a code formatter like Prettier to ensure consistent code formatting across the project.
4.3. Version Control (Git & GitHub):
Repository: The project source code is version-controlled on a private GitHub repository: https://github.com/swsamitsmc/chexprowebsite.
Branching Strategy (Recommended):
GitHub Flow: This strategy is recommended for its simplicity and effectiveness, especially for a small team or solo developer.
main branch: This branch must always remain stable and deployable. Direct commits to main are strictly prohibited.
Feature Branches: For every new feature, bug fix, or significant content update, a new branch must be created from main. Use descriptive branch names (e.g., feature/add-contact-form, bugfix/homepage-typo, content/update-services-page).
Pull Requests (PRs): Once work on a feature branch is complete, a Pull Request should be opened to merge it back into main. PRs facilitate code review and automated checks.
Merge: After review (and successful tests), the feature branch can be merged into main. It's recommended to squash or rebase commits during merge to maintain a clean and linear main branch history. Delete the feature branch after merging.
Commit Message Convention (Recommended):
Use a simplified Conventional Commits style for clear and standardized commit history, which can be useful for understanding changes and generating changelogs.
Format: <type>(<scope>): <subject>
type: Categorizes the change (e.g., feat for new features, fix for bug fixes, docs for documentation, style for formatting, refactor for code restructuring, test for adding tests, chore for build/tooling changes, content for content updates).
scope (optional): The specific part of the codebase affected (e.g., homepage, services, header, auth).
subject: A concise, imperative mood description (typically 50-70 characters).
Examples:
feat(contact): Add functional contact form
fix(header): Correct navigation link for about page
content(homepage): Update hero section text
docs: Add initial technical documentation
chore: Update dependencies
4.4. Deployment (to Hostinger Shared Hosting):
Target Domain: The website will be deployed to http://chexpro.com.
Build Process: The command npm run build generates optimized and minified static assets for production deployment. The output files are placed in the dist directory (typically located in the project root).
Deployment Method: For now, deployment will be a manual process via Hostinger File Manager.
Process:
Run npm run build on your local machine to create the production-ready files in the dist folder.
Access the Hostinger File Manager for the chexpro.com domain.
Upload the contents of the local dist folder (not the dist folder itself) to the root directory where your domain points (e.g., public_html or a specific subdirectory set for your domain).
Hostinger Specifics & Considerations:
.htaccess: The public/.htaccess file is crucial for enabling client-side routing with React Router on shared hosting environments like Hostinger. It ensures that all non-file/directory requests are redirected to index.html, allowing the React application to handle the routing. The current .htaccess file is:
<!-- end list -->

Apache

<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule ^ index.html [L]
</IfModule>

<IfModule mod_headers.c>
  Header set X-Powered-By "Hostinger Horizons"
</IfModule>
- **Node.js Environment:** The Hostinger server does **not** need Node.js installed or running to serve the built React application, as it consists purely of static HTML, CSS, and JavaScript files. Your local Node.js setup is only required for development and the build process.
- **PHP:** PHP is not relevant to this frontend application unless a PHP-based backend is introduced on the Hostinger server in the future.
- **Server Configuration/Limits:** While typically stable for static sites, always be mindful of Hostinger's [shared hosting resource limits](https://www.hostinger.com/help/premium-web-hosting-features-and-limits) (inodes, CPU, RAM, I/O) if the site grows significantly in size or traffic.
4.5. Testing Strategy (Recommended):
A rigorous, multi-layered testing strategy is recommended to ensure the quality and stability of the ChexPro website.

1. Unit Testing (React Components & Utility Functions):

Purpose: To test individual React components in isolation and pure utility functions. This ensures each small piece of the application behaves as expected, renders correctly, and responds to user interactions.
Tools:
Jest: A powerful JavaScript testing framework.
React Testing Library (RTL): A complementary library to Jest that encourages testing components in a way that simulates user interaction, focusing on the user experience rather than internal implementation details.
Implementation Steps:
Install Jest, React Testing Library, and any necessary Jest DOM matchers:
Bash

npm install --save-dev jest @testing-library/react @testing-library/jest-dom
Configure Jest (often via a jest.config.js file in the project root).
Create dedicated test files (e.g., .test.js or .spec.js) alongside the components or in a central __tests__ directory.
Write tests for pure functions (e.g., in src/lib/utils.js) and individual React components (e.g., Button.jsx, Header.jsx, or smaller, extracted sections from page components like HomePage.jsx).
2. End-to-End (E2E) Testing:

Purpose: To simulate real user scenarios across the entire application, interacting with the built or deployed site in a live browser environment. This verifies that all integrated parts of the application (components, routing, future API interactions) work seamlessly together.
Tools:
Cypress: A popular, easy-to-use E2E testing framework that runs tests directly in the browser. It excels at testing user flows, form submissions, and overall UI functionality.
Implementation Steps:
Install Cypress:
Bash

npm install --save-dev cypress
Configure Cypress (typically in a cypress.config.js file).
Write tests that simulate user actions like navigating between pages, clicking buttons, filling out forms (when available), and asserting that specific content appears or actions occur on the page.
These tests can be run locally against your development build (npm run dev or npm run preview) or against your deployed site on chexpro.com.
Recommendation: Begin by setting up Unit Testing with Jest and React Testing Library as it forms the fundamental layer for component correctness. Once that is established, integrate Cypress for End-to-End testing to cover critical user flows and ensure overall application integrity.

4.6. Documentation Location & Maintenance:
Location: This comprehensive technical documentation will primarily reside in the project's DokuWiki installation. Key summaries and links to relevant DokuWiki pages will also be maintained in markdown files (e.g., README.md, docs/ARCHITECTURE.md) within the Git repository for quick reference.
Maintenance: You are currently responsible for updating and maintaining this documentation. It is crucial to review and update this document regularly, especially after major feature implementations, architectural changes, or significant dependency updates, to ensure it remains accurate and useful for all current and future contributors.
5. Dependencies and Dev Dependencies
5.1. Runtime Dependencies (dependencies):
These are packages required for the application to run in production.

JSON

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
  "react-router-dom": "^6.16.0",
  "tailwind-merge": "^1.14.0",
  "tailwindcss-animate": "^1.0.7"
}
@radix-ui/: Core components used by ShadCN UI for accessibility and functionality (e.g., Accordion, Dialog, Dropdown Menu).
class-variance-authority, clsx, tailwind-merge, tailwindcss-animate: Utilities for building and managing Tailwind CSS classes, especially for component variants and conditional styling.
framer-motion: Animation library.
lucide-react: Icon library for React.
react, react-dom: Core React libraries.
react-router-dom: For client-side routing.
5.2. Development Dependencies (devDependencies):
These packages are only required during development and build processes.

JSON

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
  "vite": "^4.4.5"
}
@types/: TypeScript type definitions for Node.js, React, and React DOM. (Indicates potential for TypeScript or at least type-checking).
@vitejs/plugin-react: Vite plugin for React Fast Refresh.
autoprefixer, postcss: PostCSS plugins used by Tailwind CSS for vendor prefixing and CSS processing.
eslint, eslint-config-react-app: Tools for static code analysis and enforcing code style.
tailwindcss: The core Tailwind CSS framework.
terser: JavaScript minifier used during the build process.
vite: The build tool itself.
<!-- end list -->