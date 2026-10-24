# LegalHub — Project Brief & Architecture Specification

**Academic Institution:** Emerson University Multan, Department of Computer Science  
**Degree Program:** BS Computer Science (Final Year Project)  
**Project Working Title:** LegalHub *(Final title pending supervisor approval)*  
**Core Team:**
* **Syed Asad** — Lead Developer (Architecture, Backend & Frontend Development)
* **Muhammad Aqeel** — Documentation, Quality Assurance, and Legal Data
* **Mubashir Mehmood** — Testing & QA Support

---

## 1. Problem Statement & Market Context

In Pakistan, citizens and commercial clients struggle to find, verify, and engage qualified advocates. When legal representation is secured, the post-engagement lifecycle—such as court hearing dates, case diary entries, private versus shared documents, fee milestones, and client communications—is scattered haphazardly across paper files, unrecorded phone calls, and informal WhatsApp chats.

Two existing digital products in Pakistan address parts of this problem:
1. **WakeelDesk:** Provides a digital case diary and practice management system for advocates, but lacks an integrated, transparent client journey from initial search to final resolution.
2. **Pakistan Law Bot:** Focuses on legal query automation and AI legal information, but does not provide end-to-end case tracking or shared records between client and counsel.

**The Core Opportunity ("The Connected Journey"):**  
LegalHub unifies the entire client-advocate relationship into a single continuous record:
$$\text{Problem Description} \longrightarrow \text{Admin-Reviewed Discovery} \longrightarrow \text{Free Enquiry} \longrightarrow \text{Simulated Booking} \longrightarrow \text{Consultation} \longrightarrow \text{Engagement} \longrightarrow \text{Case Lifecycle}$$

---

## 2. Product Personas & Roles

*Constraint: One account per identity/agency. One primary role per account.*

1. **Visitor:** Unauthenticated public user. Can browse the legal directory, filter by city and practice area, view public advocate credentials, and submit a preliminary problem inquiry.
2. **Client:** Authenticated citizen or corporate representative. Can submit enquiries, book consultations (with simulated payment), view their consultation notes, review cases in a read-only portal, and track upcoming court hearings.
3. **Lawyer (Advocate):** Authenticated legal practitioner. Submits Bar Council credentials and chamber information for administrative review, defines consultation availability and services, records case entries and hearing dates, manages fee logs, and communicates with clients.
4. **Law Firm (Chamber Agency):** Authenticated legal firm or chamber administrator. Registers to coordinate associate advocates, monitor firm client engagements, and manage shared chamber matters in a clean, lightweight manner.
5. **Admin (Court Administrator / Registrar):** Staff user. Manages the review queue, audits submitted lawyer credentials against Bar Council rosters, approves or rejects applications with constructive reasons, and oversees marketplace integrity.

---

## 3. Project Scope: In-Scope vs Out-of-Scope

### In-Scope (MVP Target)
* **Authentication & Identity:** User registration for clients, advocates, and law firms; password hashing (Bcrypt 12 rounds), 15-minute brute-force lockout, role-based access control. *(Note: Direct registration is utilized; external email OTP via Resend is deferred until custom domain configuration).*
* **Advocate Onboarding & Audit:** Application submission, composite unique license enforcement `(barCouncil, enrolmentNo)`, admin review queue (approve/reject with $\ge 10$ character reasons), public directory with data shielding.
* **Advocate Profile & Availability:** Detailed profiles, defined legal services/fees, weekly appointment slots.
* **Matching & Discovery:** Rule-based search with transparent "why this match" justification (no black-box algorithms).
* **Consultation Booking:** Appointment booking state machine with **simulated payment** (mock transaction for academic demonstration).
* **Engagement & Case Management:** Case diary timeline, court hearing schedule with automated email reminders, private vs. shared document storage, fee milestone tracking, and in-platform messaging.
* **Client Read-Only Portal:** Transparent dashboard for clients to inspect their case timeline, upcoming hearings, and invoices without editing rights.
* **Reviews & Feedback:** Permitted **only** after a consultation is completed to prevent fraudulent reviews.
* **AI Petition History Tracker:** A single focused Python FastAPI microservice that summarizes prior case entries to assist the advocate before filing a new pleading.
* **Admin Dashboard:** Platform overview and verification queue metrics.

### Explicitly Out-of-Scope (Excluded from MVP)
* Enterprise ERP, multi-branch multi-currency accounting, or payroll suites.
* Task management or project management suites.
* Real payment gateway integration (Stripe, JazzCash, EasyPaisa) or escrow handling.
* Subscription plans or recurring SaaS billing.
* Urdu language localization (English only).
* WhatsApp or SMS integration (standard email notifications only).
* Video calling infrastructure (consultation booking manages time slots; actual conference is external or simulated).
* Judgment / Case law search database.
* AI legal advice, predictive case outcomes, or chatbots beyond the petition history tracker.

---

## 4. Technical Architecture

* **Backend API (`/backend`):** Node.js 20+ (LTS), Express.js, Sequelize ORM, PostgreSQL (hosted on Supabase), Zod validation, JWT stateless auth. Follows strict 4-tier layering: `Route -> Controller -> Service -> Model`.
* **Frontend Portal (`/frontend`):** React 18, Vite, React Router DOM, Axios (with JWT interceptors), Vanilla CSS using strict design tokens (`tokens.css`).
* **Database Strategy:** Dual-port access on Supabase: Port 5432 (Session Pooler) for migrations and persistent servers; Port 6543 (Transaction Pooler) for stateless queries.
* **Future Microservices (Post-MVP):**
  * File Storage: Cloudinary (signed client uploads).
  * Real-time Chat: Socket.io.
  * AI Service: Python FastAPI with LangChain / LLM summarizer for petition history.

---

## 5. Regulatory Caution: Rule 135 Considerations

Under **Rule 135 of the Pakistan Legal Practitioners and Bar Councils Rules 1976**, advocates in Pakistan are restricted from soliciting work or publishing commercial advertisements. The platform is designed to avoid advertising language; to be confirmed with our supervisor.

To maintain ethical and compliant positioning:
1. **No "Top", "Best", or "Premier" Claims:** All platform copy must use objective, neutral descriptions (e.g., "Practicing Advocates", "Directory", "Experience Years").
2. **No Paid Placement or Sponsored Ranking:** Search results must follow deterministic sorting (experience, location, alphabetical) and never paid promotion.
3. **Clear Disclosure on Review Status:** An advocate listed as "Admin-Reviewed" reflects administrative manual review of uploaded credentials, not an official endorsement from any statutory Bar Council.
