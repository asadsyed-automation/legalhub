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
