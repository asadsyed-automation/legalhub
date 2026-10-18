# LegalHub - Legal Marketplace for Pakistan 🇵🇰

A modern, secure, and production-grade backend API core for **LegalHub**, a digital legal services marketplace connecting citizens and corporate clients with verified Pakistani advocates across all provincial Bar Councils and Court Levels.

Built with **Node 20+**, **Express**, **PostgreSQL** (via Supabase), and **Sequelize ORM**, following strict separation of concerns (**Route $\rightarrow$ Controller $\rightarrow$ Service $\rightarrow$ Model**).

---

## 🚀 Technology Stack
* **Runtime:** Node.js 20+ (LTS)
* **Framework:** Express.js
* **Database & ORM:** PostgreSQL (via Supabase) with Sequelize ORM & CLI Migrations
* **Validation:** Zod (strict schema validation on all inputs)
* **Security & Auth:** JWT (JSON Web Tokens), Bcryptjs (12 salt rounds), Helmet, CORS, Express-Rate-Limit
* **Testing:** Jest + Supertest (46 integration tests across 4 test suites)

---

## 🏛️ Architecture & Clean Layering
```text
Route  -->  Controller (HTTP Only)  -->  Service (Business Rules)  -->  Model (Sequelize/PostgreSQL)
```
* **No business logic in routes or controllers.**
* **Fail-Fast Configuration:** `src/config/env.js` validates all environment variables at startup and halts boot if any are missing or invalid.
* **Defense in Depth:**
  * Password hashes permanently stripped via `User.prototype.toJSON()`.
  * Dummy bcrypt comparison on invalid emails to prevent timing attacks.
  * 5 consecutive failed logins trigger a 15-minute account lockout.
  * Admin accounts can never be created via public APIs (seed script only).
  * Strict data projection on public directory endpoints to prevent PII leakage (email, chamber address, enrolment number).

---

## 💻 Windows Local Setup & Execution Guide

Follow these exact steps in Windows PowerShell:

### 1. Clone & Enter Project Directory
```powershell
git clone https://github.com/asadsyed-automation/legalhub.git
cd legalhub\backend
```

### 2. Install Dependencies
```powershell
npm.cmd install
```

### 3. Configure Environment Variables
Create `.env` from the template:
```powershell
Copy-Item .env.example .env
```
Open `.env` and configure your Supabase connection string:
```dotenv
DATABASE_URL=postgresql://postgres.<project_ref>:<encoded_password>@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres
DB_SSL=true
PORT=4000
JWT_SECRET=your_super_secret_jwt_key_that_is_at_least_32_characters_long_min
FRONTEND_URLS=http://localhost:3000,http://localhost:5173
ADMIN_EMAIL=admin@legalhub.pk
ADMIN_PASSWORD=AdminSecurePassword123!
```
*(Note: If your password contains `@` or `#`, encode them as `%40` and `%23`)*.

### 4. Run Migrations & Seed Initial Admin
```powershell
# Run migrations on session pooler (port 5432) or standard connection
npm.cmd run migrate

# Seed the initial system administrator
npm.cmd run seed:admin
```

### 5. Start Development Server
```powershell
npm.cmd run dev
```
The server will boot and listen on `http://localhost:4000`. Test the health check:
```powershell
curl http://localhost:4000/api/v1/health
```

### 6. Run Automated Test Suite
```powershell
npm.cmd test
```
Executes all 46 integration tests across health, auth, role, and lawyer suites.

---

## 📜 Available NPM Scripts

| Script | Command | Purpose |
| :--- | :--- | :--- |
| `npm run dev` | `nodemon src/server.js` | Starts server with live reload for development |
| `npm run start` | `node src/server.js` | Starts production server |
| `npm test` | `jest --runInBand --detectOpenHandles --forceExit` | Runs the full integration test suite |
| `npm run migrate` | `sequelize-cli db:migrate` | Applies pending database migrations |
| `npm run migrate:undo` | `sequelize-cli db:migrate:undo` | Rolls back the most recent migration |
| `npm run seed:admin` | `node scripts/seedAdmin.js` | Safely seeds the initial administrator |

---

## 📚 Documentation Index

| Document | Purpose |
| :--- | :--- |
| [`docs/API_CONTRACT.md`](file:///d:/BS%20CS/FYP/legalhub/backend/docs/API_CONTRACT.md) | **Frontend Source of Truth:** Complete endpoint specifications, headers, payloads, and response shapes. |
| [`docs/DB_DESIGN.md`](file:///d:/BS%20CS/FYP/legalhub/backend/docs/DB_DESIGN.md) | **Database Architecture:** Visual Mermaid Entity-Relationship Diagram (ERD), table definitions, and indexes. |
| [`docs/DECISIONS.md`](file:///d:/BS%20CS/FYP/legalhub/backend/docs/DECISIONS.md) | **Architecture Decision Records (ADRs):** Rationale behind all 11 core technical choices. |
| [`docs/DEPLOY_RENDER.md`](file:///d:/BS%20CS/FYP/legalhub/backend/docs/DEPLOY_RENDER.md) | **Production Deployment Blueprint:** Step-by-step PaaS deployment guide for Render. |
| [`docs/postman_collection.json`](file:///d:/BS%20CS/FYP/legalhub/backend/docs/postman_collection.json) | **Postman v2.1 Collection:** Ready-to-import requests with dynamic `{{token}}` variable capture. |
| [`docs/learn/PART_A.md`](file:///d:/BS%20CS/FYP/legalhub/backend/docs/learn/PART_A.md) | **Learning Guide A:** Foundations, JWT, Bcrypt, lockout, request trace, viva Q&A. |
| [`docs/learn/PART_B.md`](file:///d:/BS%20CS/FYP/legalhub/backend/docs/learn/PART_B.md) | **Learning Guide B:** Lawyer onboarding, Bar Council verification, admin review, and directory. |
| [`docs/learn/PART_C.md`](file:///d:/BS%20CS/FYP/legalhub/backend/docs/learn/PART_C.md) | **Learning Guide C:** Complete handover checklist, 10 master viva questions, and error guide. |

---

## 👨‍💻 Author
**Asad Syed** - Final Year Project (BS Computer Science)
