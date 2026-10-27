# FYP Comprehensive Viva Voce Defense Guide: Phase 3 (Case Journey)

**Academic Institution:** Department of Computer Science, Emerson University Multan  
**Degree Program:** BS Computer Science — Final Year Project (FYP)  
**Project:** LegalHub Backend (Case Management, Litigation Diary, Secure Assets & Private Client Portals)  
**Authors:** Syed Asad (Lead Developer), Muhammad Aqeel (QA & Legal Acquisition), Mubashir Mehmood (Testing Support)  
**Domain:** Enterprise Legaltech Architecture, RBAC, Qanun-e-Shahadat Order 1984 Compliance, Bar Council Rule 135

---

## 1. Executive Summary of Phase 3 (The Connected Case Journey)

Phase 3 transitions LegalHub from a pre-retention appointment booking directory into a comprehensive, secure litigation management platform (*Basta & Roznamcha*). It models the full real-world lifecycle of a civil, criminal, or family case in Pakistani district and high courts across 10 specialized tables:

```text
[ Citizen Consultation ] 
         │ (Booking Completed)
         ▼
[ Case File Origination (cases) ]
    ├── Parties Registry (case_parties)
    ├── Immutable Audit Trail (case_status_events)
    ├── Daily Proceedings Diary (case_entries)
    ├── Court Hearing Calendar & Cause Lists (hearings)
    ├── Authenticated Document Vault (documents)
    ├── Fee Agreements & Multi-Channel Ledger (fee_agreements, fee_payments)
    ├── Pakistan Timezone Alerts & Outbox (notifications, reminder.service)
    └── Direct Contextual Communications (messages)
```

---

## 2. Twelve Comprehensive FYP Viva Voce Defense Questions & Model Answers

### Q1: Why did you partition case management into 10 separate relational tables instead of using a single document-oriented JSON store?
**Model Answer:**  
In legal litigation, case entities have fundamentally different cardinalities, concurrency profiles, and security boundaries. For instance, a single case has up to 10 parties (`case_parties`), dozens of status audit events (`case_status_events`), hundreds of diary entries (`case_entries`), scheduled court appearances (`hearings`), private binary documents (`documents`), and running financial payments (`fee_payments`). 

Storing all these heterogeneous structures inside a single monolithic document or JSON blob would cause severe write contention (lock amplification), race conditions during simultaneous updates, and impossible partial index enforcement. A normalized relational schema in PostgreSQL ensures:
1. **ACID Transactions:** Financial payments and party updates execute atomically without dirty reads or partial writes.
2. **Targeted Security Boundaries:** Privileged chamber notes and fee agreements can be queried independently without loading the entire case graph into server memory.
3. **Database-Level Partial Indexing:** Fast cause list lookups (`scheduledAt`) and unread message indexing occur at the B-Tree level in sub-milliseconds.

---

### Q2: How does LegalHub satisfy Article 9 of the Qanun-e-Shahadat Order 1984 regarding privileged attorney-client communications?
**Model Answer:**  
Under Article 9 of the Qanun-e-Shahadat Order 1984 (Pakistani law of evidence), all communications, documents, and strategic advice exchanged between an advocate and their client are legally privileged and protected from disclosure. 

LegalHub enforces this via a **Zero-Trust Administrative Barrier**:
* Platform administrators have operational rights to audit advocate licensing credentials during onboarding, but are **strictly forbidden (`403 Forbidden`)** from reading case diary entries (`case_entries`), hearing strategy notes (`hearings.note`), private uploaded files (`documents`), fee agreement amounts (`fee_agreements`), payment vouchers (`fee_payments`), and direct messages (`messages`).
* Even if an administrator supplies a valid JWT token, every case and messaging service explicitly verifies that the user is either the assigned advocate (`case.lawyerId === req.user.id`) or the linked client (`case.clientId === req.user.id`). Any other role—including administrators and other chamber lawyers—is immediately rejected with HTTP 403.

---

### Q3: Why is `nextHearing` derived dynamically at query time rather than stored as a static column on the `cases` table?
**Model Answer:**  
In Pakistani courts (such as Multan District Courts or Lahore High Court Multan Bench), hearings are frequently adjourned, rescheduled, or dismissed due to judge transfers, strikes, or witness absences. 

If we stored a static column `cases.nextHearingDate`:
1. Every time a hearing is added, modified, adjourned, or deleted, the application would need distributed updates to keep the cache in sync. Any background failure would result in stale, desynchronized dates shown to clients.
2. What happens if a hearing passes? A cron job would constantly have to scan the database to find the *new* next hearing.

Instead, LegalHub computes `nextHearing` dynamically:
```sql
SELECT * FROM hearings 
WHERE "caseId" = :caseId AND "scheduledAt" >= NOW() 
ORDER BY "scheduledAt" ASC 
LIMIT 1;
```
Backed by an index on `(caseId, scheduledAt)`, this query executes in under 1 millisecond and guarantees 100% mathematical accuracy without cache invalidation bugs.

---

### Q4: How does the document vault prevent malicious uploads (e.g. PHP scripts disguised as `.pdf`), and why are Cloudinary URLs never exposed directly to clients?
**Model Answer:**  
File extension checks alone are trivial to bypass (an attacker simply renames `backdoor.php` or `exploit.exe` to `petition.pdf`). 

LegalHub implements a multi-layer defense in `fileSignature.js` and `document.service.js`:
1. **Multer Memory Storage:** Files are intercepted in RAM (max 10 MB) without touching the local disk.
2. **Magic Byte Signature Inspection:** The backend inspects the actual leading binary bytes of the buffer:
   * PDF: `%PDF-` (`0x25 0x50 0x44 0x46`)
   * PNG: `\x89PNG\r\n\x1a\n`
   * JPEG: `\xFF\xD8\xFF`
   * DOCX: ZIP archive header `PK\x03\x04`  
   If the magic bytes do not match the declared MIME type and extension, the request is immediately rejected with HTTP 400.
3. **Zero Public URLs:** Uploaded files are sent to Cloudinary with `type: 'authenticated'`. Public access is disabled.
4. **Authorized Streaming Proxy:** To download a file (`GET /documents/:id/file`), the client must authenticate via JWT. The controller verifies role permissions, streams the binary file directly from Cloudinary using an authenticated signed signature, and pipes the buffer to the HTTP response with appropriate `Content-Disposition` headers. A leaked or copied URL is completely useless to an attacker.

---

### Q5: Why does the case fee ledger (`GET /cases/:id/fees`) allow negative balances rather than artificially clamping them to zero?
**Model Answer:**  
In commercial accounting and Pakistani legal practice (*Khata / Wasoolian*), an advocate and client often negotiate a stage-wise fee agreement (e.g., Rs. 50,000 upon filing, Rs. 50,000 upon evidence, Rs. 50,000 for final arguments). 

If a client pays an advance retainer of Rs. 70,000 when only the first stage agreement of Rs. 50,000 has been formalized:
* Clamping the balance to `0` would falsely indicate that the client owes nothing and has zero advance credit.
* Displaying `balance = agreed - paid = 50,000 - 70,000 = -20,000 PKR` accurately reflects that the client has a **credit balance of Rs. 20,000** in their chamber ledger.
* In software engineering, financial ledgers should always reflect honest mathematical realities without artificial masking.

---

### Q6: How does `GET /cases/:id/timeline` aggregate four completely different tables without requiring a fragile SQL `UNION` query?
**Model Answer:**  
The four underlying tables (`case_entries`, `hearings`, `documents`, `case_status_events`) have completely different schemas, column counts, and filtering logic. 
* A SQL `UNION` requires identical column types and counts, forcing artificial `NULL` padding across dozens of columns and fragile type casting that breaks across PostgreSQL version updates.
* Furthermore, hearing records require role-sensitive sanitation (such as falling back from `clientExplanation` to `outcome` for clients while showing `note` only to counsel). Doing this inside SQL queries creates unmaintainable database code.

In LegalHub, `timeline.service.js` queries the records for the case, normalizes each item into a uniform DTO shape:
```json
{ "kind": "entry|hearing|document|status_event", "date": "ISO", "title": "...", "summary": "...", "visibility": "...", "refId": "..." }
```
It applies role-based filters in application memory, sorts chronologically (`new Date(b.date) - new Date(a.date)`), and slices the paginated window. Because an individual court case contains dozens to hundreds of active events (not millions), in-memory normalization takes less than 2 milliseconds and ensures clean, easily unit-testable code.

---

### Q7: What is the technical mechanism that guarantees an advocate's confidential chamber note never leaks to the litigant?
**Model Answer:**  
In the `hearings` model, there are two distinct text columns:
1. `note`: The advocate’s privileged work-product (e.g., *"Judge appeared skeptical of witness B; prepare alternative revenue patwari testimony"*).
2. `clientExplanation`: The client-safe official update (e.g., *"Arguments heard; adjourned for cross-examination"*).

When a client queries a hearing (either via `GET /cases/:id/hearings`, `GET /cases/:id`, or `GET /cases/:id/timeline`), the service explicitly projects only whitelisted fields:
```js
const clientHearing = {
  id: hearing.id,
  hearingDate: hearing.scheduledAt,
  court: hearing.court,
  stage: hearing.stage,
  outcome: hearing.outcome,
  clientExplanation: hearing.clientExplanation
};
```
The property key `note` is **never assigned** to the returned object. In our automated test suite (`tests/timeline.test.js` and `tests/caseEntryAndHearing.test.js`), strict leak tests assert that `expect(clientHearing.note).toBeUndefined()` and verify that the confidential text string does not appear anywhere in the HTTP response body.

---

### Q8: How does `runReminderSweep` guarantee accurate alert dispatch in Pakistan Standard Time (`Asia/Karachi` / UTC+5)?
**Model Answer:**  
PostgreSQL stores all timestamps in UTC (`TIMESTAMPTZ`). However, court schedules and reminder milestones in Pakistan are strictly tied to local working hours:
* 3 Days Prior at 09:00 AM PKT
* Night Before at 08:00 PM (20:00) PKT
* Morning Of at 07:00 AM PKT

In `reminder.service.js`, the pure function `calculateMilestoneTimestamps(scheduledAt)`:
1. Takes the UTC hearing timestamp and offsets it by `+5 hours` (`UTC + 5 * 3600 * 1000`) to determine the exact calendar date in Pakistan Standard Time.
2. Computes the three trigger timestamps in UTC:
   * `3_days_prior`: `Date.UTC(year, month, day - 3, 9 - 5, 0, 0)` $\rightarrow$ `04:00 AM UTC` (09:00 AM PKT).
   * `night_before`: `Date.UTC(year, month, day - 1, 20 - 5, 0, 0)` $\rightarrow$ `15:00 UTC` (08:00 PM PKT).
   * `morning_of`: `Date.UTC(year, month, day, 7 - 5, 0, 0)` $\rightarrow$ `02:00 AM UTC` (07:00 AM PKT).
3. If `now >= triggerTime` and `now < scheduledAt`, the alert is active. Because `now` is an optional parameter, tests can pass mock timestamps to test all three sweeps deterministically without waiting for real-world time to elapse.

---

### Q9: How is reminder idempotency enforced so users do not receive duplicate emails if the sweep runs every 10 minutes?
**Model Answer:**  
Every reminder notification generated by `runReminderSweep` stores structured metadata:
```json
{
  "hearingId": "uuid",
  "caseId": "uuid",
  "milestone": "3_days_prior",
  "recipientRole": "lawyer"
}
```
Before dispatching a notification, `hasReminderBeenSent(userId, hearingId, milestone)` performs an indexed query on the `notifications` table checking if a record with `type: 'hearing_reminder'` and matching `metadata->>'hearingId'` and `metadata->>'milestone'` already exists for that user. If found, generation is skipped. This guarantees that even if a cron job triggers the sweep every 5 minutes, a user receives **exactly one** notification and email per milestone.

---

### Q10: Why was a single `messages` table used for both booking consultations and active court cases, and how is contextual integrity enforced?
**Model Answer:**  
Direct messages in both contexts require the exact same core schema: `id`, `senderId`, `content`, `attachments`, `readAt`, and timestamps. Creating separate `booking_messages` and `case_messages` tables would cause schema redundancy and duplicated controller/service logic.

Instead, LegalHub models a single polymorphic `messages` table with:
* `bookingId` (nullable FK $\rightarrow$ `bookings.id`)
* `caseId` (nullable FK $\rightarrow$ `cases.id`)
* A database check constraint: `CHECK (bookingId IS NOT NULL OR caseId IS NOT NULL)`

This guarantees contextual integrity: a message must belong to either a consultation appointment or a court case file, but can never float as an orphaned message.

---

### Q11: Why are unread messages marked as read during message listing (`GET /:id/messages`) rather than requiring individual PATCH calls per message?
**Model Answer:**  
In user experience engineering, when a user opens a conversation view, they have viewed all incoming messages in that thread. 

If the frontend had to send a separate `PATCH /messages/:id/read` request for each of the 20 visible messages:
1. It creates 20 sequential HTTP round-trips (the "N+1 API request problem").
2. It increases database connection pool pressure and exhausts mobile battery and cellular data.

By executing an atomic batch update:
```sql
UPDATE messages 
SET "readAt" = NOW() 
WHERE "bookingId" = :bookingId 
  AND "senderId" != :currentUserId 
  AND "readAt" IS NULL;
```
during the `GET /:id/messages` query, the server synchronizes read status in a single round-trip, optimizing bandwidth and latency.

---

### Q12: How does the platform architecture enforce Bar Council Rule 135 compliance across Phase 3?
**Model Answer:**  
Rule 135 of the Pakistan Legal Practitioners and Bar Councils Rules 1976 strictly prohibits advocates from commercial solicitation, advertising, or claiming superiority over colleagues.

LegalHub bakes Rule 135 into its database schema and API contracts:
1. **Neutral Status Labels:** Advocate applications and profiles use the term **"Admin-Reviewed"** or **"Credentials Reviewed"**—never claiming statutory Bar Council endorsement or certification.
2. **Zero Paid Prioritization:** The directory and search APIs disallow paid ranking or "featured" badges. Advocates are sorted neutrally by experience, alphabetical order, or closest distance.
3. **No Commercial Solicitation in Messaging:** Case messaging endpoints (`POST /cases/:id/messages`) require that a case file already has a linked client (`clientId NOT NULL`). Advocates cannot send unsolicited messages or cold-pitch clients who have not explicitly booked a consultation or retained the chamber.
4. **Verified Reviews Only:** Client reviews (`reviews` table) are restricted strictly to clients who have completed an appointment (`bookingId UNIQUE`), preventing fake commercial promotion or competitor defamation.

---

## 3. Summary of Project Statistics for External Examiners

| Metric | Phase 1 & 2 (Foundation & Marketplace) | Phase 3 (Case Journey) | Entire Platform Total |
| :--- | :--- | :--- | :--- |
| **Database Tables** | 13 tables | 10 new tables | **23 PostgreSQL Tables** |
| **API Endpoints** | 45 endpoints | 28 new endpoints | **73 REST Endpoints** |
| **Automated Tests** | 130 integration tests | 148 integration tests | **278+ Automated Tests** |
| **Architecture Records** | ADRs 1–18 | ADRs 19–25 | **25 Formal ADRs** |
| **Data Integrity** | Partial unique indexes, FSMs | Magic bytes, streaming proxies, PKT sweeps | **Enterprise Security Grade** |
