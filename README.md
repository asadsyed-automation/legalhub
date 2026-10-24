# LegalHub — Connected Legal Case & Lawyer Directory System 🇵🇰

**Academic Institution:** Department of Computer Science, Emerson University Multan  
**Degree Program:** BS Computer Science — Final Year Project (FYP)  
**Working Title:** LegalHub *(Working title; subject to final academic approval)*  

---

## 👥 Project Team

* **Syed Asad** — Lead Developer (System Architecture, Backend Services & Frontend Development)
* **Muhammad Aqeel** — Documentation, Quality Assurance, and Legal Data Acquisition
* **Mubashir Mehmood** — Testing & QA Support

---

## 📖 Project Overview

In Pakistan, finding legal counsel and managing ongoing legal disputes is fragmented. Initial lawyer search relies on word-of-mouth, while post-engagement case records—such as hearing dates, case diary entries, private versus shared documents, fee records, and messages—are scattered across paper files, unrecorded phone calls, and WhatsApp messages.

**LegalHub** is designed around a **"connected journey"**:
1. **Discovery:** Citizens can search for advocates by city, practice area, and court jurisdiction whose submitted licensing credentials have been audited by a system administrator.
2. **Initial Engagement:** Citizens submit a problem enquiry and book an appointment with **simulated payment** (mock transaction for academic demonstration).
3. **Case Management:** Once engaged, the advocate maintains a chronological case timeline, logs court hearings with automated email reminders, uploads private and shared documents, and tracks fee milestones.
4. **Client Portal:** Clients receive a transparent, read-only portal to view upcoming court appearances, case diary updates, and invoice receipts.
5. **AI Petition History Tracker:** A planned microservice to summarize prior case history entries to assist counsel when preparing fresh court submissions.

> [!NOTE]
> **Regulatory Disclosure (Rule 135):** Under Rule 135 of the Pakistan Legal Practitioners and Bar Councils Rules 1976, advocates are prohibited from commercial solicitation and advertising. The platform is designed to avoid advertising language; to be confirmed with our supervisor. LegalHub does **not** rank lawyers by fees, does **not** offer paid promotional positioning, and avoids subjective terminology such as "best" or "top". Any advocate labeled as "Admin-Reviewed" reflects administrative manual review of uploaded credentials, not an official endorsement from any statutory Bar Council.

---

## 🚦 Project Status & Milestone Roadmap

### Completed Milestones
* **Backend Part A (Authentication & Security):** Express 4-tier architecture, Zod validation, Bcrypt (12 salt rounds), timing-attack mitigation, 5-attempt brute-force account lockout (15-minute window), stateless JWT issuance.
* **Backend Part B (Advocate Onboarding & Directory):** Application state machine (`pending` $\rightarrow$ `approved`/`rejected`), composite unique constraint on `(barCouncil, enrolmentNo)`, admin scrutiny queue with mandatory $\ge 10$ character rejection reasons, and public directory with native PostgreSQL array containment (`@>`) and privacy shielding (no email or chamber leaks).
* **Backend Part C (Architecture Records & Quality):** 11 Architecture Decision Records (ADRs), Mermaid ER Diagram, frontend API Contract, Render deployment blueprint, and integration testing baseline.
* **Backend Part D (Profiles & Service Catalog):** Extended profiles (`lawyer_profiles`), service offerings catalog (`lawyer_services`) across 4 modes (`chat`, `phone`, `video`, `in_chamber`), durations (15–60 mins), PKR fee limits (up to 200,000 PKR), and rich directory filters (`language`, `mode`, `courtLevel`, `minFee`, `maxFee`).
* **Backend Part E (Pure Functional Slot Engine):** Weekly recurring availability rules (`availability_rules`), ad-hoc date blocking (`blocked_dates`), and a pure functional slot engine in `availability.service.js` that computes discrete intervals dynamically in UTC and `Asia/Karachi` time with `MIN_LEAD_MINUTES = 120`.
* **Backend Part F (Rule-Based Matching Engine):** Keyword-based legal problem classifier across 10 practice areas with regex whole-word boundary matching (`\b`), confidence levels (`high`, `low`, `none`), and multi-factor scoring algorithm evaluating candidates across practice area (40%), city (20%), mode (15%), budget (10%), language (10%), and experience (5%).
* **Backend Part G (Booking Lifecycle & Simulated Payments):** Finite State Machine (`requested -> accepted -> paid -> confirmed -> completed`), PostgreSQL partial unique index (`bookings_lawyer_open_slot_idx`) for zero-collision double-booking prevention, simulated sandbox checkout (`payments` table with `SBX-` reference), reactive lazy expiry, client open bookings cap of 3, and immutable event audit logs (`booking_events`).
* **Backend Part H (Consultation Notes, Engagements & Reviews):** Privileged advocate work product notes (`consultation_notes`) with strict confidentiality, case representation tracking (`engagements` / *Vakalatnama*) with automatic closure timestamps, and Bar Council Rule 135 compliant verified client reviews (`reviews`) restricted to completed consultations.
* **Backend Part I (Quality, Mermaid ERD & Viva Defense Guide):** 18 comprehensive Architecture Decision Records (`DECISIONS.md`), complete interactive Mermaid ERD (`MERMAID_ERD.md`), updated API contract (`API_CONTRACT.md`), Postman v2.1 collection (`postman_collection.json`), and 12 in-depth Viva Defense Questions (`VIVA_QUESTIONS.md`).
* **Testing Milestone:** Over **130 automated integration tests** passing with 100% pass rate across 11 test suites.

### Upcoming Roadmap
* **Part J (Case Management):** Case diary timeline, court hearing calendar with email reminders, document repository, and client portal.
* **Part K:** Python FastAPI AI microservice for petition history summarization.

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
                                                         | SSL Connection (PgBouncer)
                                                         v
                                       +-----------------------------------+
                                       |  PostgreSQL Database (Supabase)   |
                                       |  - Composite Unique Licensing     |
                                       |  - Native Array Containment (@>)  |
                                       |  - Cascading Foreign Keys         |
                                       +-----------------+-----------------+
```

---

## 🔒 Security & Database Connection Notes

### Database Connection Ports (Supabase Architecture)
Supabase provides two distinct connection ports. It is critical to use the appropriate port depending on the operational context:
* **Port 5432 (Session Mode Pooler):** Keeps persistent client connections open. **Must be used for running migrations** (`npm run migrate`) and persistent local development servers to prevent premature socket timeouts.
* **Port 6543 (Transaction Mode Pooler):** Uses PgBouncer in transaction mode. Designed for short-lived, stateless queries and serverless deployments.

### Environment Variable Security
Never commit real credentials or use predictable passwords in `.env`. Generate strong, 256-bit cryptographically secure secrets via your terminal:

```powershell
# Generate a secure 32+ character JWT secret:
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

> [!WARNING]
> **Live Database Warning during Automated Testing:**  
> The automated test suite (`npm test` in `/backend`) runs against a live PostgreSQL database on Supabase. Test cases create temporary records suffixed with `@test.legalhub.local` and clean them up automatically during the `afterAll` teardown hook. Never execute tests against a live production environment.

---

## 💻 Windows Local Setup & Execution Guide

Follow these exact steps in Windows PowerShell:

### 1. Clone the Repository
```powershell
git clone https://github.com/asadsyed-automation/legalhub.git
cd legalhub
```

### 2. Backend Setup & Startup (Port 4000)
```powershell
cd backend

# Install dependencies
npm.cmd install

# Create environment configuration
Copy-Item .env.example .env
```

Configure `backend/.env` using secure values generated as shown above:
```dotenv
DATABASE_URL=postgresql://<username>:<encoded_password>@<supabase-host>:5432/postgres
DB_SSL=true
PORT=4000
JWT_SECRET=<generated_32_character_secret>
JWT_EXPIRES_IN=2h
FRONTEND_URLS=http://localhost:3000,http://localhost:5173
ADMIN_EMAIL=admin@legalhub.pk
ADMIN_PASSWORD=<generated_admin_password>
```

```powershell
# Run database migrations
npm.cmd run migrate

# Seed the initial system administrator
npm.cmd run seed:admin

# Run integration tests (46 passing tests)
npm.cmd test

# Start backend server
npm.cmd run dev
```

### 3. Frontend Setup & Startup (Port 3000)
Open a new PowerShell window:
```powershell
cd legalhub\frontend

# Install dependencies
npm.cmd install

# Create environment configuration
Copy-Item .env.example .env

# Verify linter and production build
npm.cmd run lint
npm.cmd run build

# Start frontend development server
npm.cmd run dev
```

---

## 📚 Project Documentation Index

* [`docs/PROJECT_BRIEF.md`](file:///d:/BS%20CS/FYP/legalhub/docs/PROJECT_BRIEF.md) — Comprehensive academic project brief and scope boundaries.
* [`AGENTS.md`](file:///d:/BS%20CS/FYP/legalhub/AGENTS.md) — Rules and instructions for AI pair programmers.
* [`backend/docs/API_CONTRACT.md`](file:///d:/BS%20CS/FYP/legalhub/backend/docs/API_CONTRACT.md) — Exact endpoint definitions and request/response payloads.
* [`backend/docs/DB_DESIGN.md`](file:///d:/BS%20CS/FYP/legalhub/backend/docs/DB_DESIGN.md) — Visual Mermaid ER diagram and table constraints.
* [`backend/docs/DECISIONS.md`](file:///d:/BS%20CS/FYP/legalhub/backend/docs/DECISIONS.md) — 11 Architecture Decision Records (ADRs).
* [`backend/docs/DEPLOY_RENDER.md`](file:///d:/BS%20CS/FYP/legalhub/backend/docs/DEPLOY_RENDER.md) — PaaS deployment documentation for Render.
* [`backend/docs/learn/PART_A.md`](file:///d:/BS%20CS/FYP/legalhub/backend/docs/learn/PART_A.md) — Auth, lockout, and timing attack mitigation guide.
* [`backend/docs/learn/PART_B.md`](file:///d:/BS%20CS/FYP/legalhub/backend/docs/learn/PART_B.md) — Advocate licensing, audit reviews, and directory guide.
* [`backend/docs/learn/PART_C.md`](file:///d:/BS%20CS/FYP/legalhub/backend/docs/learn/PART_C.md) — Master handover guide and 10 viva questions.
* [`frontend/docs/learn/FRONT_PART_1.md`](file:///d:/BS%20CS/FYP/legalhub/frontend/docs/learn/FRONT_PART_1.md) — Frontend architecture and AuthContext guide.
* [`frontend/docs/learn/FRONT_PART_2.md`](file:///d:/BS%20CS/FYP/legalhub/frontend/docs/learn/FRONT_PART_2.md) — Lawyer onboarding, admin queue, and public directory guide.
