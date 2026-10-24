# LegalHub FYP Viva & Defense Examination Guide
## Department of Computer Science, Emerson University Multan
**Project Name:** LegalHub — Online Legal Marketplace for Pakistan  
**Team Members:** Syed Asad (Lead Developer), Muhammad Aqeel (Docs / QA), Mubashir Mehmood (QA Support)

---

### Question 1: How does your system ensure that two clients cannot book the same lawyer for the exact same consultation time slot simultaneously?
> **Answer:**  
> We enforce double-booking prevention at two layers:
> 1. **Application Layer:** When a client initiates a booking, our slot engine verifies that the requested UTC timestamp does not overlap with any existing open booking for that lawyer.
> 2. **Database Engine Layer (Zero-Race Guarantee):** Even if two concurrent requests bypass application memory at the exact same millisecond, PostgreSQL stops the collision via a **partial unique B-Tree index**:
>    ```sql
>    CREATE UNIQUE INDEX bookings_lawyer_open_slot_idx
>    ON bookings ("lawyerId", "startsAt")
>    WHERE status IN ('requested', 'accepted', 'paid', 'confirmed', 'pending');
>    ```
>    PostgreSQL atomically aborts the second insert with a unique constraint violation, which our centralized error middleware catches and translates into an HTTP `409 Conflict` message. When a booking is rejected, cancelled, or expired, it drops out of the partial index, instantly freeing the slot without needing manual index manipulation.

---

### Question 2: Why did you implement a pure functional slot engine rather than storing pre-generated available slots in a database table?
> **Answer:**  
> Pre-generating calendar slots in a database table has three severe flaws:
> 1. **Database Bloat:** Generating 30-minute intervals for 100 lawyers over 90 days creates over 150,000 table rows, 98% of which are never booked.
> 2. **Stale Cache & Cron Overhead:** If a lawyer blocks tomorrow for an emergency court hearing in Lahore High Court, a background cron job would have to search and delete hundreds of rows.
> 3. **Timezone Drift:**
> In our pure functional design (`availability.service.js`), we only store lightweight rules (e.g., *"Monday 09:00–17:00"*). When a client searches for dates, the engine slices the rule into discrete UTC intervals in memory in less than 5 milliseconds, strips blocked dates and booked slots, and returns the real-time availability.

---

### Question 3: How does LegalHub comply with Pakistan Bar Council Rule 135 regarding advocate advertising?
> **Answer:**  
> Under Rule 135 of the Legal Practitioners and Bar Councils Rules 1976, advocates in Pakistan are strictly prohibited from commercial solicitation, paying for advertisement billboards, or claiming subjective superiority (*"Top Lawyer"*, *"Best Criminal Advocate"*).  
> To remain in strict statutory compliance:
> 1. **Neutral Alphabetical / Score Sorting:** We do not offer paid priority listings, "Featured" badges, or commercial ranking boosts.
> 2. **Rule-Based Matching Engine:** Candidate matching is deterministic and objective based on practice area, city, court level, fee compatibility, and language.
> 3. **Admin-Reviewed Status:** We never claim "Official Bar Council Verification". We term practitioner status as **"Admin-Reviewed"** or **"Credentials Reviewed"**.
> 4. **Verified Post-Consultation Reviews Only:** Reviews can only be submitted by clients who have completed a booked consultation, preventing promotional spam and commercial puffery.

---

### Question 4: Explain your Finite State Machine (FSM) for consultations. What is "Lazy Expiry" and why is it superior to a background cron job?
> **Answer:**  
> A consultation booking transitions through a deterministic state machine:  
> `requested -> accepted -> paid -> confirmed -> completed`  
> (with terminal states `declined`, `cancelled`, `expired`, `refunded`).  
> 
> **Lazy Expiry:** Rather than running an aggressive Node.js `setInterval` or cron polling worker every minute—which wastes CPU cycles and database connections—each booking carries an `expiresAt` timestamp (24h for requests, 12h for payments). Whenever an actor attempts to read or mutate a booking (`applyLazyExpiry`), the service checks if `Date.now() > expiresAt`. If elapsed, it atomically mutates the status to `expired` and logs a transition audit event. This guarantees instant slot release without recurring background polling overhead.

---

### Question 5: Why did you separate consultation notes into a dedicated table rather than adding a `notes` column to the `bookings` table?
> **Answer:**  
> This addresses **privilege isolation and attorney-client confidentiality**. In Pakistani legal practice, an advocate's case diary (*Basta*) contains internal case strategy, limitation period analyses under the Limitation Act 1908, and investigative doubts.  
> The `bookings` record is a bilateral transaction shared between client and advocate. If consultation notes lived in `bookings`, any inadvertent omission in SQL attribute masking (`SELECT * FROM bookings`) would leak privileged attorney work product to the client. Isolating them into `consultation_notes` with dedicated routes (`GET/PUT /bookings/:id/notes`) protected by `requireApprovedLawyer` guarantees that clients can never access an advocate's strategic notes (`403 Forbidden`).

---

### Question 6: What is the difference between a Consultation and an Engagement in LegalHub?
> **Answer:**  
> - **Consultation (`bookings`):** A single, time-bound legal appointment (15 to 60 minutes) conducted via video, phone, chat, or in-chamber for preliminary advisory and problem assessment.
> - **Engagement (`engagements`):** The formal, ongoing representation of a client by an advocate in a court of law pursuant to an executed power of attorney (*Vakalatnama*).  
> Once a consultation concludes, the advocate and client can convert the interaction into an ongoing legal engagement with title, court level, practice area, status (`active` vs `closed`), and lifecycle audit timestamps.

---

### Question 7: How does your authentication system prevent brute-force attacks and credential enumeration?
> **Answer:**  
> 1. **Bcrypt with 12 Salt Rounds:** Passwords are hashed with an adaptive work factor that makes GPU-based rainbow table cracking computationally prohibitive.
> 2. **Timing Attack Neutralization:** If an attacker attempts to log in with an email that does not exist in our database, the auth service executes a dummy bcrypt comparison against a pre-computed hash. Both existing and non-existing accounts take the exact same amount of server processing time (~80ms), preventing username enumeration.
> 3. **Automatic Account Lockout:** After 5 consecutive failed login attempts, the account is locked for 15 minutes (`lockedUntil = now + 15 mins`), stopping automated dictionary attacks.

---

### Question 8: Why did you choose UUIDv4 for primary keys instead of sequential auto-incrementing integers?
> **Answer:**  
> Sequential integers (1, 2, 3...) introduce severe security and business vulnerabilities:
> 1. **Sequential Enumeration / Insecure Direct Object References (IDOR):** An attacker can easily crawl the entire database by iterating through integers (`/api/v1/lawyers/1`, `/api/v1/lawyers/2`).
> 2. **Business Intelligence Leakage:** If a competitor signs up and gets user ID `104`, they know LegalHub only has 104 registered users.
> UUIDv4 generates cryptographically random 128-bit identifiers, preventing IDOR scraping and business metric leakage.

---

### Question 9: Why did you implement simulated sandbox payments rather than integrating live Easypaisa or JazzCash in this undergraduate project?
> **Answer:**  
> In Pakistan, integrating live production payment gateways (such as 1Link, Easypaisa Merchant, or JazzCash API) requires formal corporate registration (SECP incorporation), NTN certificate, corporate bank account, and commercial merchant contracts—which undergraduate university students cannot legally obtain.  
> Instead of building an insecure or counterfeit mock, we modeled the payment flow strictly according to standard two-phase gateway specifications:
> - An in-platform checkout (`POST /bookings/:id/pay`) that records transaction amount in PKR, method (`sandbox`), deterministic transaction reference (`SBX-timestamp-hash`), and updates payment status.
> - Cancellations and administrator interventions automatically execute refund transitions, validating the complete financial state machine.

---

### Question 10: How do you handle database connection pooling between migration scripts and high-concurrency API test suites on Supabase?
> **Answer:**  
> Supabase provides two database ports via PgBouncer:
> - **Port 5432 (Session Mode):** Used for Sequelize database migrations (`sequelize-cli db:migrate`). Migrations require PostgreSQL advisory locks (`pg_try_advisory_lock`) to guarantee atomic schema execution, which transaction poolers disallow.
> - **Port 6543 (Transaction Mode):** Used for the Express backend server and automated Jest test suites. It manages pooling efficiently under high concurrency and prevents remote TLS connection teardowns using `min: 1`, `idle: 60000`, and `evict: 30000`.

---

### Question 11: How does your rule-based matching engine score advocates without using heavy machine learning models?
> **Answer:**  
> Legal intake requires predictability, explainability, and speed. Our matching engine operates in two phases:
> 1. **Whole-Word Regular Expression Classification:** Matches user legal problem descriptions against a legal lexicon across 10 categories (Criminal, Civil, Family, Property, Corporate, Labor, Tax, Constitutional, Banking, Consumer). It enforces whole-word boundaries (`\b`) to prevent false positive substring matches.
> 2. **Multi-Factor Weighted Scoring:** Scored candidates are evaluated against explicit weights: Practice Area match (40%), City proximity (20%), Consultation mode (15%), Budget fit (10%), Language match (10%), and Experience (5%). Each result includes plain-English match reasons (e.g. *"In-person chamber available in Multan"*), providing complete algorithmic transparency.

---

### Question 12: How is software quality and maintainability verified in your repository?
> **Answer:**  
> Our repository follows the 4-layer architecture (Routes -> Controllers -> Services -> Models) with automated testing:
> - 100% automated test coverage across all major feature slices: Authentication, Lawyer Applications, Public Directory, Availability & Slots, Bookings, Lifecycle & Payments, Pre-booking Enquiries, Matching Engine, Consultation Notes, Engagements, and Reviews.
> - Over 130 automated integration tests execute with zero failures against a live PostgreSQL database.
> - Every API response strictly conforms to our version-controlled `backend/docs/API_CONTRACT.md` and complete Postman v2.1 collection.
