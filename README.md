# LegalHub - Verified Legal Marketplace for Pakistan 🇵🇰

A modern, production-grade, full-stack digital legal marketplace built for Pakistan. **LegalHub** connects citizens, businesses, and corporate clients with verified Pakistani advocates licensed across all provincial Bar Councils (Punjab, Sindh, Khyber Pakhtunkhwa, Balochistan, Islamabad) and Court Levels (Lower Courts, High Court, Supreme Court).

---

## 🏛️ System Architecture

```text
                                       +-----------------------------------+
                                       |      Browser / Client Device      |
                                       +-----------------+-----------------+
                                                         |
                                                         | HTTP / REST (JSON)
                                                         v
                                       +-----------------------------------+
                                       |    React 18 + Vite (Port 3000)    |
                                       |  - CSS Tokens & Custom Styling    |
                                       |  - React Router DOM (RBAC UX)     |
                                       |  - Axios (Auto-JWT Interceptor)   |
                                       +-----------------+-----------------+
                                                         |
                                                         | Authorization: Bearer <token>
                                                         v
                                       +-----------------------------------+
                                       |     Express.js API (Port 4000)    |
                                       |  - 4-Tier Layered Architecture    |
                                       |  - Zod Fail-Fast Validation       |
                                       |  - Timing Attack & Lockout Guards |
                                       |  - Privacy Shielding Projections  |
                                       +-----------------+-----------------+
                                                         |
                                                         | SSL Connection Pooler (PgBouncer)
                                                         v
                                       +-----------------------------------+
                                       |  PostgreSQL Database (Supabase)   |
                                       |  - Composite Unique Licensing     |
                                       |  - Native Array Containment (@>)  |
                                       |  - Cascading Integrity            |
                                       +-----------------------------------+
```

---

## 🚀 Full-Stack Technology Stack

### Backend Core (`/backend`)
* **Runtime:** Node.js 20+ (LTS)
* **Framework:** Express.js
* **Database & ORM:** PostgreSQL on Supabase managed via Sequelize ORM & CLI Migrations
* **Schema Validation:** Zod (fail-fast parameter, body, and query validation)
* **Authentication & Cryptography:** JWT (JSON Web Tokens), Bcryptjs (12 salt rounds with timing-attack prevention)
* **Security Middleware:** Helmet, CORS whitelist, Express-Rate-Limit, 5-attempt account lockout
* **Automated Testing:** Jest + Supertest (**46 integration tests passing across 4 suites**)

### Frontend Web Portal (`/frontend`)
* **Framework:** React 18 + Vite
* **Routing & Guards:** React Router DOM v6 with role-guarded `ProtectedRoute` components
* **HTTP Client:** Axios with automated request interceptors (JWT injection) and error normalizers
* **Design System:** Pure CSS tokens (`#0F5C3C` Pakistan Green, `#101512` Text, `#F9FAFB` Background, `#D64545` Danger) with zero external UI or animation libraries
* **State Management:** React Context API (`AuthContext`) with persistent `localStorage` session verification

---

## 📂 Project Repository Structure

```text
legalhub/
├── README.md                          <- Master full-stack project documentation
├── backend/                           <- Express & PostgreSQL backend service
│   ├── src/
│   │   ├── config/                    <- Fail-Fast env validator & Sequelize connection
│   │   ├── constants/                 <- Bar Councils, Court Levels, Cities, Practice Areas
│   │   ├── middleware/                <- JWT auth, requireRole RBAC, Zod validate, errorHandler
│   │   ├── models/                    <- User & LawyerApplication Sequelize models
│   │   └── modules/
│   │       ├── auth/                  <- Register, Login, Me (/api/v1/auth)
│   │       ├── lawyer/                <- Application submission (/api/v1/lawyer)
│   │       ├── admin/                 <- Scrutiny queue, approvals, rejections (/api/v1/admin)
│   │       └── directory/             <- Public directory & profile search (/api/v1/lawyers)
│   ├── migrations/                    <- Atomic database migrations (users, lawyer_applications)
│   ├── tests/                         <- 46 Jest integration tests (auth, lawyer, role, health)
│   └── docs/                          <- API Contract, DB Design ERD, 11 ADRs, Render guide
│
└── frontend/                          <- React 18 + Vite client application
    ├── src/
    │   ├── api/                       <- Axios client & modular API service functions
    │   ├── components/                <- Navbar, ProtectedRoute, FormField, StatusBadge
    │   ├── constants/                 <- Frontend constants matching backend contracts
    │   ├── context/                   <- AuthContext global session manager
    │   ├── pages/                     <- Home, Login, Register, Dashboard, LawyerApplication,
    │   │                                 AdminQueue, LawyersList, LawyerProfile, NotFound
    │   └── styles/                    <- tokens.css (brand colors) and index.css (utilities)
    └── docs/learn/                    <- Student learning guides for Part 1 & Part 2
```

---

## 💻 Windows Local Setup & Execution Guide

Follow these exact steps in Windows PowerShell to run the complete system locally:

### 1. Clone the Repository
```powershell
git clone https://github.com/asadsyed-automation/legalhub.git
cd legalhub
```

---

### 2. Backend Setup & Startup (Port 4000)

```powershell
cd backend

# Install dependencies
npm.cmd install

# Create local environment file
Copy-Item .env.example .env
```

Open `backend/.env` and configure your credentials:
```dotenv
DATABASE_URL=postgresql://postgres.<project_ref>:<password>@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres
DB_SSL=true
PORT=4000
JWT_SECRET=your_super_secret_jwt_key_that_is_at_least_32_characters_long_min
FRONTEND_URLS=http://localhost:3000,http://localhost:5173
ADMIN_EMAIL=admin@legalhub.pk
ADMIN_PASSWORD=AdminSecurePassword123!
```
*(Note: If your database password contains `@` or `#`, encode them as `%40` and `%23`)*.

```powershell
# Run database migrations
npm.cmd run migrate

# Seed the initial Court Administrator account
npm.cmd run seed:admin

# Run all 46 automated integration tests
npm.cmd test

# Start backend development server
npm.cmd run dev
```
Backend API will listen on: **`http://localhost:4000`**

---

### 3. Frontend Setup & Startup (Port 3000)

Open a **new PowerShell window** and run:

```powershell
cd legalhub\frontend

# Install dependencies
npm.cmd install

# Create frontend environment file
Copy-Item .env.example .env

# Verify linter and production bundle
npm.cmd run lint
npm.cmd run build

# Start frontend development server
npm.cmd run dev
```
Frontend Web Portal will open on: **`http://localhost:3000`**

---

## 📋 API Endpoints Inventory

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/health` | Public | System uptime and health check |
| `POST` | `/api/v1/auth/register` | Public | Register citizen (`client`) or advocate (`lawyer`) |
| `POST` | `/api/v1/auth/login` | Public | Authenticate user, check 15-min lockout, return JWT |
| `GET` | `/api/v1/auth/me` | Authenticated | Retrieve profile of authenticated user |
| `POST` | `/api/v1/lawyer/application` | Lawyer Only | Submit initial Bar Council verification petition |
| `GET` | `/api/v1/lawyer/application` | Lawyer Only | Fetch advocate's own application status |
| `PUT` | `/api/v1/lawyer/application` | Lawyer Only | Re-submit corrected credentials after rejection |
| `GET` | `/api/v1/admin/applications` | Admin Only | List applications filtered by status (`pending`, `approved`, `rejected`) |
| `PATCH`| `/api/v1/admin/applications/:id/approve` | Admin Only | Approve advocate and publish to directory |
| `PATCH`| `/api/v1/admin/applications/:id/reject`  | Admin Only | Reject application with mandatory $\ge 10$ char reason |
| `GET` | `/api/v1/lawyers` | Public | Search verified lawyers by city, practice area, and page |
| `GET` | `/api/v1/lawyers/:id` | Public | View verified advocate profile with privacy shielding |

---

## 🖥️ Frontend Routes Inventory

| Route | Guard | Description |
| :--- | :--- | :--- |
| `/` | Public | Home landing page with Pakistani legal trust pillars |
| `/login` | Public | Authentication page with lockout alerts |
| `/register` | Public | Registration page with role selector (`client` / `lawyer`) |
| `/lawyers` | Public | Verified directory search with city and practice filters |
| `/lawyers/:id` | Public | Public advocate profile with data shielding |
| `/dashboard` | Authenticated | Dynamic dashboard morphing to Client, Lawyer, or Admin view |
| `/lawyer/application` | Lawyer Only | Advocate licensing petition form and status tracking |
| `/admin/queue` | Admin Only | Court Administrator audit table and rejection modal |
| `*` | Public | 404 Not Found page |

---

## 📚 Complete Learning Guides Index

For students, evaluators, and viva examination preparation:

* [`backend/docs/API_CONTRACT.md`](file:///d:/BS%20CS/FYP/legalhub/backend/docs/API_CONTRACT.md) — Frontend team source of truth.
* [`backend/docs/DB_DESIGN.md`](file:///d:/BS%20CS/FYP/legalhub/backend/docs/DB_DESIGN.md) — Visual Mermaid ER diagram & database architecture.
* [`backend/docs/DECISIONS.md`](file:///d:/BS%20CS/FYP/legalhub/backend/docs/DECISIONS.md) — 11 formal Architecture Decision Records (ADRs).
* [`backend/docs/DEPLOY_RENDER.md`](file:///d:/BS%20CS/FYP/legalhub/backend/docs/DEPLOY_RENDER.md) — Cloud deployment manual for Render PaaS.
* [`backend/docs/learn/PART_A.md`](file:///d:/BS%20CS/FYP/legalhub/backend/docs/learn/PART_A.md) — Auth, cryptography, lockout, and timing attack defenses.
* [`backend/docs/learn/PART_B.md`](file:///d:/BS%20CS/FYP/legalhub/backend/docs/learn/PART_B.md) — Bar Council licensing, composite unique constraints, admin review.
* [`backend/docs/learn/PART_C.md`](file:///d:/BS%20CS/FYP/legalhub/backend/docs/learn/PART_C.md) — Master handover checklist and 10 comprehensive viva questions.
* [`frontend/docs/learn/FRONT_PART_1.md`](file:///d:/BS%20CS/FYP/legalhub/frontend/docs/learn/FRONT_PART_1.md) — Frontend architecture, High Court Gate analogy, AuthContext.
* [`frontend/docs/learn/FRONT_PART_2.md`](file:///d:/BS%20CS/FYP/legalhub/frontend/docs/learn/FRONT_PART_2.md) — Marketplace lifecycle, URL parameter sync, privacy shielding.

---

## 👨‍💻 Project Developer
**Asad Syed** — Final Year Project (BS Computer Science)
