# LegalHub Frontend Learning Guide — Part 1: Architecture, Authentication & Dashboards

Welcome to Part 1 of the LegalHub Frontend Learning Guide. This document details the architectural foundation of our Single-Page Application (SPA) built with React and Vite, explaining how client-side authentication interacts securely with our Express/PostgreSQL backend.

---

## 1. High-Level Explanation & Pakistani Real-Life Analogy

### Real-Life Analogy: The High Court Gate, Visitor Badges & Security Chambers
Imagine visiting the **Lahore High Court** or **Sindh High Court**:

1. **The Reception Counter (`/login` & `/register`):**
   * When you arrive at the outer gate, you present your credentials (email & password).
   * Once verified, the registrar issues you a laminated **Visitor Badge with a stamped QR code** (our **JWT Token**).
2. **Your Pocket (`localStorage`):**
   * You place this badge in your pocket. Every time you enter a new corridor, security guards ask to see it. In code, an **Axios Interceptor** automatically pulls this badge from `localStorage` and presents it with every outbound request (`Authorization: Bearer <token>`).
3. **The Central Security Desk (`AuthContext`):**
   * The court keeps an active record of who is inside. Even if you step out to the cafeteria and return (**refreshing the browser tab**), the front desk quickly re-verifies your badge (`GET /api/v1/auth/me`) so you don't have to queue up outside all over again.
4. **The Corridor Checkposts (`ProtectedRoute`):**
   * The public courtyard is open to all visitors (**Public Routes**).
   * The advocates' study chamber has a guard who only permits individuals in black robes (**`allowedRoles=['lawyer']`**).
   * The Chief Justice's registry only admits court administrators (**`allowedRoles=['admin']`**).
5. **The Golden Rule: Client-Side vs Server-Side Security:**
   * The corridor guard turning you away is purely for **navigation convenience and User Experience (UX)**.
   * The actual locked door and armed officer behind the desk (**The Backend API**) is what strictly enforces security. Even if a clever user modifies their client-side code to pretend to be an admin, the backend immediately rejects their request with `HTTP 403 Forbidden`.

---

## 2. Technical Terms Defined

| Term | Plain English Definition |
| :--- | :--- |
| **Vite** | A modern, lightning-fast frontend build tool and local dev server that uses native ES modules to compile React applications in milliseconds. |
| **Axios Interceptor** | A middleware pipeline function in Axios that automatically executes before every HTTP request leaves the browser (attaching the `Authorization: Bearer <token>` header) or immediately when a response arrives. |
| **React Context (`AuthContext`)** | A built-in React mechanism for sharing global data (like the logged-in user profile and auth token) across all components without manually passing props through every layer of the tree. |
| **`localStorage`** | A persistent browser key-value store that survives browser tab closures and page reloads, used to persist the user's JWT token between visits. |
| **Protected Route** | A higher-order component or route wrapper that checks if a user is authenticated and possesses the required role before rendering child page components; otherwise, it redirects them to `/login` or `/dashboard`. |
| **Client-Side vs Server-Side RBAC** | Client-side checks are purely for UX (hiding buttons or routing away). Server-side checks (our backend `requireRole` middleware) are the *only* true security boundary. |
| **Controlled Component** | A React form element (like `<input>` or `<select>`) whose current value is driven by React component state (`useState`), ensuring instant validation and controlled submission. |
| **`VITE_` Environment Variables** | Environment variables prefixed with `VITE_` (e.g., `VITE_API_URL`) that Vite automatically injects into client-side code at compile time via `import.meta.env`. |

---

## 3. Part 1 File-by-File Summary Table

| File | What It Does (2–3 plain sentences) |
| :--- | :--- |
| `frontend/package.json` | Configures the frontend application with React 18, Vite, React Router DOM, and Axios. Defines build, preview, and ESLint scripts with zero external UI or animation libraries. |
| `frontend/vite.config.js` | Configures the Vite development server on port 3000 and registers the `@vitejs/plugin-react` plugin for fast JSX compilation. |
| `frontend/index.html` | The single HTML5 entry page that loads the Inter web font from Google Fonts, defines meta tags, and mounts the React root `<div>`. |
| `frontend/src/styles/tokens.css` | Defines all CSS variables and design tokens, including Pakistan green primary (`#0F5C3C`), charcoal text (`#101512`), off-white background (`#F9FAFB`), and danger crimson (`#D64545`). |
| `frontend/src/styles/index.css` | Implements global CSS resets, typography rules, card containers, button variants (`.btn-primary`, `.btn-secondary`), and alert notification banners. |
| `frontend/src/constants/index.js` | Exports immutable frontend constants including user roles (`client`, `lawyer`, `admin`), application statuses, and Pakistani legal options (cities, bar councils, practice areas). |
| `frontend/src/api/client.js` | Sets up the central Axios instance with a request interceptor that attaches the JWT Bearer token and a response interceptor that normalizes error objects from the backend API contract. |
| `frontend/src/api/auth.api.js` | Encapsulates authentication HTTP calls (`register`, `login`, `getMe`) targeting the Express backend. |
| `frontend/src/context/AuthContext.jsx` | Provides global authentication state, token storage in `localStorage`, session verification on page reload, and `login`/`register`/`logout` methods to all components. |
| `frontend/src/components/FormField.jsx` | Reusable form control component supporting text inputs, dropdown selects, and textareas with inline Zod validation error messages. |
| `frontend/src/components/StatusBadge.jsx` | Reusable UI badge that renders color-coded capsules for user roles (`client`, `lawyer`, `admin`) and application statuses (`pending`, `approved`, `rejected`). |
| `frontend/src/components/Navbar.jsx` | Responsive navigation header displaying the LegalHub scales icon, public links, role-specific navigation, and user session controls. |
| `frontend/src/components/ProtectedRoute.jsx` | Route guard component that verifies authentication, renders a loading spinner during session checks, and enforces role-based access before rendering pages. |
| `frontend/src/pages/Home.jsx` | Public landing page featuring an introduction to LegalHub, call-to-action buttons for citizens and advocates, and three core trust pillars. |
| `frontend/src/pages/Register.jsx` | User registration page with client/lawyer role selection, handling field-level Zod validation errors and routing directly to the appropriate dashboard. |
| `frontend/src/pages/Login.jsx` | Sign-in page with email/password inputs, destination return routing, and specialized alerts for 15-minute brute-force account lockouts. |
| `frontend/src/pages/Dashboard.jsx` | Role-differentiated dashboard rendering custom portals: client legal search, lawyer Bar Council verification status, and administrator audit controls. |
| `frontend/src/pages/NotFound.jsx` | Standard 404 page for unmatched routes with a clean navigation link back to the homepage. |
| `frontend/src/App.jsx` | The top-level router layout structuring public, protected, and role-guarded routes within the application navbar and footer. |
| `frontend/src/main.jsx` | Entry file that bootstraps the React application by wrapping `App` inside `BrowserRouter` and `AuthProvider`. |

---

## 4. Master Request Trace: End-to-End Login Flow

Here is the exact trace of what happens when a user signs in:

```text
1. USER ACTION: Click "Sign In" on /login
   - User types "advocate@legalhub.pk" and password into controlled FormFields.
   - User clicks the submit button. Form fires handleSubmit(e).

2. REACT COMPONENT STATE (Login.jsx):
   - Button enters loading state: spinner appears, inputs disabled to prevent double-submit.
   - Calls `login({ email, password })` from `useAuth()`.

3. AUTH CONTEXT & API CLIENT (AuthContext.jsx -> client.js):
   - `authApi.login()` executes `apiClient.post('/auth/login', payload)`.
   - Outbound HTTP POST request sent to `http://localhost:4000/api/v1/auth/login`.

4. BACKEND PROCESSING & DATABASE (Express -> PostgreSQL):
   - Zod middleware validates email and password schema.
   - authService fetches user from Supabase, checks `lockedUntil`.
   - authService runs constant-time `bcrypt.compare`.
   - Resets `failedLoginAttempts = 0` and signs a JWT valid for 2 hours.
   - Backend returns HTTP 200:
     { "success": true, "data": { "token": "ey...", "user": { "id": "...", "role": "lawyer" } } }

5. RESPONSE INTERCEPTOR & PERSISTENCE:
   - Axios response interceptor extracts `response.data`.
   - AuthContext receives payload:
     * Saves `localStorage.setItem('legalhub_token', authToken)`.
     * Updates React state: `setUser(loggedInUser)`, `setToken(authToken)`.

6. REDIRECTION & ROUTE GUARDS:
   - `useNavigate()` triggers transition to `/dashboard`.
   - `ProtectedRoute` evaluates `isAuthenticated === true` and allows rendering.
   - `Dashboard.jsx` detects `user.role === 'lawyer'` and dynamically mounts the Advocate Verification portal.
```

---

## 5. Three Practical Exercises for the Student

1. **Exercise 1 (Form Reset & UX):**
   * In `Register.jsx`, modify the form state so that if registration fails due to a `VALIDATION_ERROR`, the password input is automatically cleared for security while preserving the user's name and email.
2. **Exercise 2 (Session Expiry Simulation):**
   * Open Chrome DevTools (`F12`), go to the **Application** tab $\rightarrow$ **Local Storage**, and alter the `legalhub_token` by deleting its last 5 characters. Refresh the page and observe how `AuthContext` catches the `401 Unauthorized` response from `GET /api/v1/auth/me`, removes the corrupted token, and gracefully transitions the user to the unauthenticated view without crashing.
3. **Exercise 3 (Client-Side Role Tampering):**
   * Temporarily edit `Dashboard.jsx` to force `user.role = 'admin'` on the client side. Observe that while the admin cards appear on the UI, clicking any action that calls a backend admin endpoint immediately results in a `403 Forbidden` response, proving that client-side role checks are only cosmetic.

---

## 6. Five Comprehensive Viva Questions & Model Answers

### Q1: Why do we store the JWT token in `localStorage`, and what is the security trade-off?
> **Model Answer:** `localStorage` allows the token to persist across browser refreshes and tab closures, providing a seamless Single-Page Application user experience. The security trade-off is that `localStorage` is accessible to client-side JavaScript, making it theoretically vulnerable to Cross-Site Scripting (XSS) attacks. An alternative is HTTP-only cookies, which protect against XSS but introduce Cross-Site Request Forgery (CSRF) concerns and require additional backend cookie configurations.

### Q2: What is an Axios Interceptor, and why is it superior to manually adding headers to every API call?
> **Model Answer:** An Axios Interceptor is a centralized middleware that intercepts requests before they leave the browser or responses before they reach the component. By attaching the `Authorization: Bearer <token>` header in an interceptor (`client.js`), we ensure consistent authentication across dozens of endpoints with zero code duplication. If token storage or header formats change in the future, we only have to update a single file.

### Q3: Why does our application use both client-side and server-side role checks?
> **Model Answer:** Client-side role checks (in `ProtectedRoute` and conditional rendering in `Dashboard`) exist exclusively for **User Experience (UX)**. They prevent confusing users by hiding portals they cannot use and redirecting them away from unauthorized screens. Server-side checks (our backend `requireRole` middleware) represent the **true security boundary**. Because client code can be modified in browser developer tools, server-side authorization is non-negotiable.

### Q4: How does `AuthContext` handle page reloads without forcing the user to log in again?
> **Model Answer:** When the page reloads, React component memory is wiped, but `localStorage` remains intact. During initialization, `AuthContext` executes a `useEffect` hook that reads the stored token and calls `GET /api/v1/auth/me`. If the token is valid, the user's profile is restored into React state and `loading` is set to `false`. If the token has expired or been revoked, `AuthContext` wipes `localStorage` and resets state to `null`.

### Q5: How does our frontend display detailed validation errors sent by backend Zod schemas?
> **Model Answer:** Our backend API contract returns a standardized validation error format: `{ success: false, error: { code: 'VALIDATION_ERROR', message: 'Validation failed', details: [{ field: 'password', message: '...' }] } }`. In `Register.jsx`, our `catch` block inspects `error.details`, constructs an error map indexed by field name (`{ password: '...' }`), and passes each error directly to the corresponding `FormField` component to display red inline error messages under the relevant input.

---

## 7. Real-World Errors Encountered & How to Memorize Them

1. **The Rollup Windows Binary Resolution Bug (`@rollup/rollup-win32-x64-msvc`):**
   * *What Happened:* When running `npm run build` on Windows, Rollup failed with `Cannot find module @rollup/rollup-win32-x64-msvc`.
   * *Root Cause:* Npm on Windows sometimes skips platform-specific optional binaries during initial installation.
   * *The Fix:* Explicitly installed `@rollup/rollup-win32-x64-msvc` as a development dependency.
   * *Viva Lesson:* *Platform-specific binary dependencies on Windows may need explicit installation.*

2. **JSX Unescaped Entities (`react/no-unescaped-entities`):**
   * *What Happened:* ESLint flagged raw apostrophes in text like `Pakistan's`.
   * *Root Cause:* HTML parsers historically treated unescaped quotes ambiguously in XML/JSX.
   * *The Fix:* Configured ESLint rule to `'react/no-unescaped-entities': 'off'` for cleaner JSX strings.
