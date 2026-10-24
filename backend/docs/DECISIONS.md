# LegalHub Architecture Decision Records (ADRs)

This document formally records the architectural choices, trade-offs, and rationale behind the LegalHub backend implementation.

---

### ADR 1: Node.js 20+ (LTS) and Express.js
* **Decision:** Selected Node.js 20+ with Express as the backend runtime and web framework.
* **Context:** The application requires high I/O throughput for API endpoints, JSON serialization, and modular routing.
* **Rationale:** Node's asynchronous event-driven model handles concurrent API traffic with low memory footprints. Express provides clean middleware pipelines (`helmet`, `cors`, `rateLimit`, `verifyToken`) without vendor lock-in.

---

### ADR 2: PostgreSQL with Sequelize ORM & CLI Migrations
* **Decision:** Used PostgreSQL hosted on Supabase, managed via Sequelize ORM with version-controlled migrations.
* **Context:** A legal marketplace requires ACID compliance, relational integrity, unique indexing, and native array support.
* **Rationale:** Relational integrity ensures users cannot submit orphaned applications. Migrations ensure schema changes are auditable and reproducible across team members rather than manually edited in pgAdmin.
* **Alternative Rejected:** Raw SQL queries (susceptible to SQL injection if unparameterized, difficult schema tracking).

---

### ADR 3: Zod Schema Validation
* **Decision:** Adopted Zod for all incoming request validation (`req.body`, `req.query`, `req.params`).
* **Context:** Rejecting malformed inputs before reaching services or databases prevents corrupt data and unpredictable server faults.
* **Rationale:** Zod provides composable, declarative schemas with custom error mappings and array refinements (e.g. 1–5 practice areas, min 10-char rejection reasons). It formats field-level validation errors into `{ "error": "...", "details": [{ "field": "...", "message": "..." }] }` with status 400.

---

### ADR 4: UUIDv4 Primary Keys vs Sequential Auto-Incrementing Integers
* **Decision:** Used UUIDv4 (`DataTypes.UUID`) for all database primary keys (`users.id`, `lawyer_applications.id`).
* **Context:** Sequential IDs (e.g. `1, 2, 3...`) leak business metrics (e.g., total registered lawyers) and expose public directories to sequential horizontal scraping (`GET /lawyers/1`, `GET /lawyers/2`).
* **Rationale:** UUIDs are cryptographically random, globally unique, prevent enumeration attacks, and allow safe distributed record creation.

---

### ADR 5: Bcrypt with 12 Salt Rounds & Timing Attack Defense
* **Decision:** Used `bcryptjs` with 12 salt rounds for password storage, combined with dummy hash comparisons.
* **Context:** High-speed hashing algorithms like MD5 or SHA-256 are vulnerable to modern GPU rainbow-table cracking. Also, variable response times during login allow attackers to enumerate valid email addresses.
* **Rationale:** Bcrypt's adaptive cost factor makes brute-forcing computationally prohibitive. When a user is not found during login, our auth service executes a dummy bcrypt comparison against a precomputed hash so execution times remain indistinguishable from existing accounts.

---

### ADR 6: Account Lockout Policy (5 Failed Logins $\rightarrow$ 15-Minute Lock)
* **Decision:** Implemented automatic account lockout tracking via `failedLoginAttempts` and `lockedUntil`.
* **Context:** Brute-force dictionary attacks attempt thousands of common passwords against known emails.
* **Rationale:** After 5 consecutive failed login attempts, the account is locked for 15 minutes. Attempting to log in during this window returns HTTP 401 with remaining minutes, neutralizing automated credential stuffing.

---

### ADR 7: Strict 4-Layer Separation of Concerns
* **Decision:** Architecture strictly divided into Route $\rightarrow$ Controller $\rightarrow$ Service $\rightarrow$ Model.
* **Context:** Monolithic route files that mix SQL queries, JWT parsing, and HTTP headers become impossible to unit test and maintain.
* **Rationale:**
  * **Routes:** URL path declarations, middleware attachment, and rate limiters.
  * **Controllers:** Pure HTTP transport (reads `req`, invokes services, returns `res`).
  * **Services:** Pure business rules independent of HTTP frameworks.
  * **Models:** Database tables, relations, and serialization overrides.

---

### ADR 8: Data Shielding & Projection for Public Lawyer Profiles
* **Decision:** Implemented explicit Data Transfer Object (DTO) projection for public endpoints.
* **Context:** Public directory visitors need to inspect credentials, but advocates' personal email addresses, private chamber addresses, and internal Bar Council enrolment numbers must not be scraped or exposed.
* **Rationale:** All directory endpoints project only public-safe fields (`name`, `city`, `practiceAreas`, `courtLevel`, `barCouncil`, `experienceYears`, `bio`), guaranteeing zero leakage of Personally Identifiable Information (PII).

---

### ADR 9: PostgreSQL Native Arrays (`ARRAY(TEXT)`) for Practice Areas
* **Decision:** Stored practice areas directly as PostgreSQL text arrays instead of a separate many-to-many join table.
* **Context:** Advocates select between 1 and 5 legal practice areas from a standardized list.
* **Rationale:** In-row array storage simplifies database queries while maintaining high-performance containment queries via Sequelize's `[Op.contains]` operator (which compiles to PostgreSQL's `@>` operator).

---

### ADR 10: Composite Unique Constraint on `(barCouncil, enrolmentNo)`
* **Decision:** Created a composite unique index on `barCouncil` and `enrolmentNo`.
* **Context:** Different provincial bar councils (e.g. Punjab vs Sindh) issue licenses independently. An enrolment number is unique within its bar council.
* **Rationale:** Prevents duplicate or fraudulent registrations where an impostor attempts to register with another advocate's existing license number.

---

### ADR 11: Supabase PgBouncer Port Strategy
* **Decision:** Configured migrations to run on Port 5432 (Session Mode) and the API server/tests on Port 6543 (Transaction Mode).
* **Context:** `sequelize-cli db:migrate` uses PostgreSQL advisory locks (`pg_try_advisory_lock`) to ensure migrations run atomically. Supabase's transaction pooler (port 6543) disallows session locks.
* **Rationale:** Port 5432 is used for migration scripts that require session-level locks. Port 6543 with `keepAlive: true` is used for high-concurrency API and test traffic to prevent connection pool exhaustion.

---

### ADR 12: Pure Functional Slot Slicing Engine (UTC & Asia/Karachi Timezone)
* **Decision:** Built a pure functional slot generation engine (`availability.service.js`) that slices weekly rules into discrete intervals on-the-fly without storing unbooked slots in the database.
* **Context:** Pre-generating calendar slots in a database table creates millions of empty rows, risks timezone drift, and requires complex background cron jobs for updates.
* **Rationale:** Slicing rules dynamically guarantees zero storage overhead and immediate consistency when an advocate adjusts availability or blocks a holiday. All slot math calculates strictly in UTC with explicit conversion to `Asia/Karachi` (UTC+5), enforcing a minimum lead time (`MIN_LEAD_MINUTES = 120`).

---

### ADR 13: Partial Unique Index Double-Booking Prevention (`bookings_lawyer_open_slot_idx`)
* **Decision:** Enforced double-booking prevention at the PostgreSQL database level using a partial unique index:
  `CREATE UNIQUE INDEX bookings_lawyer_open_slot_idx ON bookings ("lawyerId", "startsAt") WHERE status IN ('requested', 'accepted', 'paid', 'confirmed', 'pending')`.
* **Context:** High-concurrency environments experience race conditions where two clients submit requests for the same slot simultaneously. Application-level `Booking.findOne()` checks can suffer from Time-of-Check to Time-of-Use (TOCTOU) races.
* **Rationale:** The partial index offloads locking guarantees to PostgreSQL's B-Tree indexing engine. Any overlapping attempt triggers a `SequelizeUniqueConstraintError`, which our central error middleware maps to HTTP 409 Conflict. Rejected or cancelled bookings naturally fall outside the `WHERE` clause, automatically freeing the slot.

---

### ADR 14: Finite State Machine (FSM) with Reactive Lazy Expiry
* **Decision:** Managed consultation appointment lifecycles via an explicit Finite State Machine with reactive lazy expiration.
* **Context:** Unanswered booking requests or abandoned payments lock lawyer calendar slots indefinitely if not expired. Running recurring background cron pollers introduces unnecessary polling overhead and potential multi-instance race conditions.
* **Rationale:** An FSM lookup table (`ALLOWED_TRANSITIONS`) strictly governs state changes (`requested -> accepted -> paid -> confirmed -> completed`). Timeouts (24 hours for requests, 12 hours for accepted payments) are evaluated reactively during read and mutation queries (`applyLazyExpiry`), guaranteeing instantaneous slot release without background cron overhead.

---

### ADR 15: Two-Phase Simulated Sandbox Payments with Automatic Refund
* **Decision:** Implemented an in-platform sandbox checkout workflow (`POST /bookings/:id/pay`) generating deterministic reference IDs (`SBX-timestamp-hash`).
* **Context:** Third-party Pakistani payment gateways (Easypaisa, JazzCash, Kuickpay) require business registration and production keys that undergraduate FYP sandboxes cannot legally maintain.
* **Rationale:** Simulating checkout via structured database records (`payments` table with `amountPkr`, `method: 'sandbox'`, `reference`, `status`) proves complete financial lifecycle handling. Client cancellations or administrative refund endpoints (`PATCH /admin/bookings/:id/refund`) automatically cascade payment state to `refunded`.

---

### ADR 16: Confidential Attorney-Client Privilege for Consultation Notes (*Basta* Work Products)
* **Decision:** Isolated advocate case observations and strategic planning into a separate `consultation_notes` table with restricted lawyer-only endpoints (`GET/PUT /bookings/:id/notes`).
* **Context:** Initial consultation findings (e.g. limitation periods, land revenue record discrepancies) are privileged legal work products. Storing notes on the client-shared `bookings` record creates severe data leakage risks.
* **Rationale:** Notes are linked 1-to-1 to bookings but are strictly inaccessible to clients (`403 Forbidden`). Only the assigned advocate can upsert notes containing structured JSONB action items and private strategy memos.

---

### ADR 17: Case Representation Continuity (Engagements / Vakalatnama)
* **Decision:** Created an `engagements` entity to track ongoing legal representation beyond one-off 30-minute consultations.
* **Context:** A consultation is merely an initial advisory session. Actual litigation requires a formal power of attorney (*Vakalatnama*), ongoing court dates, and case file management.
* **Rationale:** Engagements allow both clients and advocates to track formal representation (`status: 'active' | 'closed'`), optionally link back to the originating consultation booking, and record timestamped milestones with automatic `closedAt` lifecycle tracking.

---

### ADR 18: Bar Council Rule 135 Compliant Verified Reviews
* **Decision:** Restricted public reviews strictly to clients who have completed an appointment (`booking.status === 'completed'`), bound by a 1-to-1 database constraint (`bookingId UNIQUE`).
* **Context:** Rule 135 of the Legal Practitioners and Bar Councils Rules 1976 prohibits commercial solicitation, misleading advertising, and paid priority sorting for Pakistani advocates. Unrestricted review systems also invite competitor defamation.
* **Rationale:** Restricting reviews to completed consultations guarantees that only verified clients provide feedback. A single review per booking eliminates ballot-stuffing. Ratings range strictly from 1 to 5 stars, and the public API aggregates arithmetic averages without promotional puffery or paid badges.

