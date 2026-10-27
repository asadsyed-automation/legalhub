# LegalHub Engineering Guide: Part I (Case Entries & Court Hearings)

> **Final Year Project (FYP) — Emerson University Multan**  
> **Student Developers:** Syed Asad, Muhammad Aqeel, Mubashir Mehmood  
> **Module:** Phase 3 — Case Journey (Part I: Case Entries & Court Hearings)  
> **Scope:** Case Diary Timeline, Hearing Scheduling, Quick Judicial Outcomes & Strict Lawyer/Client Privilege Boundaries

---

## 1. Real-Life Pakistani Analogy & Core Philosophy

### The Real-World Parallel: The Advocate's Daily Diary (*Roznamcha*) & Cause List (*Peshian*)
In Pakistani legal chambers across the District Courts (*Kachehri*) and High Court Benches (e.g. Multan, Rawalpindi, Bahawalpur):
* **The Case Diary (*Roznamcha / Basta Diary*):** Every active case file folder (*Basta*) contains a chronological sequence of proceedings. When an advocate files an amended plaint, receives a certified order sheet from the court reader (*Ahlmad*), or jots down personal thoughts on witness credibility, they write an **entry** in the file.
  * **Private Notes vs. Shared Filings:** If the advocate writes an internal memo such as *"Cross-examination strategy: ask defendant about mutation registry date"*, this is strictly **Private** (`visibility: 'private'`). The client must never see confidential trial notes. However, if the advocate summarizes the court's interim order (*Hukam-e-Imtinaee* / injunction), they mark it **Shared** (`visibility: 'shared'`) so the client can read the progress from home.
* **The Court Hearing (*Peshi*):** Litigants are anxious about court dates. When a case is fixed for hearing, the judge presides in open court (*Adalat*). 
  * At the end of the day, the judge announces the **outcome** (e.g., *"Adjourned for Defendant's Written Statement"*), reasons for adjournment, and fixes the **next date** (*Agli Tareekh*).
  * The advocate enters this into LegalHub. They write a technical judicial note for chamber records (`note: 'Judge directed respondent under Order 8 Rule 1'`), and a simplified, plain Urdu/English message for the client (`clientExplanation: 'The other side requested more time to submit their reply. Next date is fixed for reply.'`).
  * The client can see the outcome and explanation, but **never** the advocate's internal private note.

---

## 2. Technical Architecture & Database Design

### 2.1 Entity Relationship Overview
```
+-------------------------------------------------------------+
|                           Case                              |
|  - id (UUID, PK)                                            |
|  - lawyerId (UUID, FK -> users) [NOT NULL]                  |
|  - clientId (UUID, FK -> users) [NULLABLE]                  |
|  - court (VARCHAR 255) [NOT NULL]                           |
|  - status (ENUM: Prospect, Active, ...)                     |
+-------------------------------------------------------------+
       | 1                                 | 1
       |                                   |
       v N (CASCADE)                       v N (CASCADE)
+-------------------------------+   +-------------------------------------+
|          CaseEntry            |   |               Hearing               |
|  - id (UUID, PK)              |   |  - id (UUID, PK)                    |
|  - caseId (UUID, FK)          |   |  - caseId (UUID, FK)                |
|  - entryDate (DATEONLY)       |   |  - scheduledAt (TIMESTAMP UTC)      |
|  - entryType (petition, ...)  |   |  - court (VARCHAR, default case's)  |
|  - title (VARCHAR 150)        |   |  - bench (VARCHAR 120)              |
|  - body (TEXT 5000)           |   |  - stage (Pleadings, Issues, ...)   |
|  - visibility (private/shared)|   |  - outcome (VARCHAR 300)            |
|                               |   |  - nextDate (DATEONLY)              |
|                               |   |  - adjournmentReason (VARCHAR 300)  |
|                               |   |  - note (TEXT 2000, LAWYER ONLY)    |
|                               |   |  - clientExplanation (TEXT 1000)    |
|                               |   |  - visibility (private/shared)      |
+-------------------------------+   +-------------------------------------+
```

### 2.2 Security & Privacy Boundaries
1. **Confidentiality:** All entries and hearings are strictly scoped to `lawyerId = req.user.id`. No other lawyer can read or update these records (`403 Forbidden`).
2. **Admin Exclusion:** Any request by `admin` to case entries or hearings returns an immediate `403 Forbidden`.
3. **Client Whitelist Projection:** Linked clients (`clientId = req.user.id`) receive only an immutable, sanitized view of shared records:
   * **Entries:** Only where `visibility === 'shared'`. Whitelist: `{ id, caseId, entryDate, entryType, title, body, visibility, createdAt, updatedAt }`.
   * **Hearings:** Only where `visibility === 'shared'`. Whitelist: `{ id, caseId, scheduledAt, court, bench, stage, outcome, nextDate, adjournmentReason, clientExplanation, visibility, createdAt, updatedAt }`. The private `note` field is **STRICTLY CENSORED** and never sent to clients.
4. **Dynamic `nextHearing` Computation:** `nextHearing` on `/api/v1/cases` and `/api/v1/cases/:id` is dynamically computed on-the-fly as the earliest future hearing (`scheduledAt >= now()`), avoiding stale database columns.

---

## 3. Student Hands-On Exercises

### Exercise 1: Create Private Chamber Note vs. Shared Injunction Order
**Objective:** Verify that an advocate can record both confidential trial work-product and client-facing court progress, and observe how client access filters private entries.
1. Log in as an approved advocate (`sikandar.adv@demo.legalhub.local`).
2. Post a private diary entry:
   ```json
   POST /api/v1/cases/:id/entries
   {
     "entryDate": "2026-10-27",
     "entryType": "note",
     "title": "Cross-examination strategy on Patwari",
     "body": "Cross-examination must verify mutation registry 104/1994.",
     "visibility": "private"
   }
   ```
3. Post a shared court order:
   ```json
   POST /api/v1/cases/:id/entries
   {
     "entryDate": "2026-10-27",
     "entryType": "order",
     "title": "Interim Status Quo Granted",
     "body": "Civil Judge granted status quo restraining construction.",
     "visibility": "shared"
   }
   ```
4. Now, log in as the linked client and call `GET /api/v1/cases/:id/entries`.
5. **Expected Observation:** The client receives only the shared order. The private trial strategy note is completely absent from the returned list.

### Exercise 2: Court Hearing Scheduling & Quick Outcome Recording
**Objective:** Schedule an upcoming hearing (*Peshi*), observe dynamic `nextHearing` calculation, and record a quick outcome after court proceedings.
1. As advocate, schedule an upcoming hearing for next week:
   ```json
   POST /api/v1/cases/:id/hearings
   {
     "scheduledAt": "2026-11-10T09:30:00.000Z",
     "bench": "Court Room No. 3",
     "stage": "Issues",
     "note": "Bring original registered sale deed.",
     "clientExplanation": "Judge will frame legal issues based on pleadings."
   }
   ```
2. Request `GET /api/v1/cases/:id`. Notice that `nextHearing` now automatically contains this upcoming hearing!
3. Simulate court conclusion by submitting a quick outcome:
   ```json
   PATCH /api/v1/hearings/:id/outcome
   {
     "outcome": "Issues framed; fixed for Plaintiff Evidence.",
     "nextDate": "2026-11-25",
     "adjournmentReason": "Adjourned for evidence"
   }
   ```
4. **Expected Observation:** Hearing record updates with outcome and next date without modifying other case attributes.

### Exercise 3: Cross-Case Cause List Query & Client Note Censorship
**Objective:** Test the cause list endpoint across multiple cases and verify that the private note field never leaks to a client.
1. As client, request `GET /api/v1/hearings`.
2. Inspect every item in `res.body.data.items`.
3. **Verification Checklist:**
   * Every item has `visibility: "shared"`.
   * `item.clientExplanation` is visible.
   * `item.note` is strictly `undefined`.
   * Requesting as `admin` returns `403 Forbidden`.

---

## 4. Final Year Project Viva Defense Questions & Answers

### Q1: Why are case entries and court hearings never deleted by the platform?
**Answer:**  
In Pakistani judicial administration, court proceedings constitute an official permanent record (*Misal*). In an electronic practice management system, allowing unilateral deletion of hearing records or case diary entries would destroy the evidentiary audit trail, complicate dispute resolution between client and counsel, and compromise accountability. Instead of deletion, LegalHub permits assigned advocates to edit or amend entries, while preserving timestamps (`createdAt`, `updatedAt`) for full traceability.

### Q2: Why is `nextHearing` calculated dynamically instead of stored as a static column on the `cases` table?
**Answer:**  
Storing `nextHearing` as a static column introduces denormalization and concurrency race conditions. If a hearing is rescheduled, cancelled, or concluded, or if time passes naturally beyond the hearing date, a stored column becomes stale unless updated by complex distributed triggers or cron jobs. By querying the earliest future hearing (`scheduledAt >= now() ORDER BY scheduledAt ASC LIMIT 1`), the system guarantees 100% real-time accuracy with zero risk of stale date bugs.

### Q3: Why does `hearings` provide two distinct note fields: `note` and `clientExplanation`?
**Answer:**  
In Pakistani legal practice, an advocate's thoughts often include privileged trial tactics, confidential evidentiary evaluations, or procedural technicalities (e.g., *"Witness demeanor was shaky under cross; verify Order 13 CPC filings"*). Sharing this raw text with a client could cause confusion or compromise trial strategy. The dual-field pattern provides `note` as an internal attorney-client privileged chamber record, while `clientExplanation` provides a layman-accessible summary designed specifically for litigant transparency.

### Q4: How does the system prevent non-lawyer users from scheduling hearings?
**Answer:**  
The route `/api/v1/cases/:id/hearings` enforces layered authorization middleware: first, `verifyToken` confirms valid JWT authentication; second, `requireApprovedLawyer` verifies that the authenticated user possesses the `lawyer` role and holds an `'approved'` Bar Council credential status; finally, the service layer (`hearing.service.js`) checks that `caseRecord.lawyerId === user.id`. Any attempt by clients, admins, or other lawyers fails with `403 Forbidden`.

### Q5: How is the cause list (`GET /api/v1/hearings`) partitioned between advocates and clients?
**Answer:**  
`listHearingsAcrossCases` inspects `user.role` to apply server-side SQL filters at the database level:
* For an **Advocate**, it queries `Hearings` inner-joined with `Cases` where `case.lawyerId = user.id`.
* For a **Client**, it queries `Hearings` inner-joined with `Cases` where `case.clientId = user.id AND hearing.visibility = 'shared'`.
Furthermore, all client responses are passed through `projectHearingForClient`, guaranteeing that private notes are permanently stripped before JSON serialization.

---

## 5. Thunder Client / Automated HTTP Test Script

```json
{
  "clientName": "Thunder Client",
  "collectionName": "LegalHub - Phase 3 Part I (Case Entries & Hearings)",
  "dateExported": "2026-10-27",
  "version": "1.1",
  "requests": [
    {
      "name": "1. Create Private Diary Note (Advocate)",
      "method": "POST",
      "url": "http://localhost:4000/api/v1/cases/{{case_id}}/entries",
      "headers": [
        { "name": "Authorization", "value": "Bearer {{advocate_token}}" }
      ],
      "body": {
        "type": "json",
        "raw": "{\n  \"entryDate\": \"2026-10-27\",\n  \"entryType\": \"note\",\n  \"title\": \"Confidential Trial Preparation\",\n  \"body\": \"Review revenue Halqa Patwari record before next appearance.\",\n  \"visibility\": \"private\"\n}"
      }
    },
    {
      "name": "2. Create Shared Order Entry (Advocate)",
      "method": "POST",
      "url": "http://localhost:4000/api/v1/cases/{{case_id}}/entries",
      "headers": [
        { "name": "Authorization", "value": "Bearer {{advocate_token}}" }
      ],
      "body": {
        "type": "json",
        "raw": "{\n  \"entryDate\": \"2026-10-27\",\n  \"entryType\": \"order\",\n  \"title\": \"Interim Status Quo Granted\",\n  \"body\": \"Learned Civil Judge Multan was pleased to issue temporary injunction restraining respondents.\",\n  \"visibility\": \"shared\"\n}"
      }
    },
    {
      "name": "3. Schedule Court Hearing (Advocate)",
      "method": "POST",
      "url": "http://localhost:4000/api/v1/cases/{{case_id}}/hearings",
      "headers": [
        { "name": "Authorization", "value": "Bearer {{advocate_token}}" }
      ],
      "body": {
        "type": "json",
        "raw": "{\n  \"scheduledAt\": \"2026-11-15T09:30:00.000Z\",\n  \"bench\": \"Court Room No. 4\",\n  \"stage\": \"Issues\",\n  \"note\": \"Check written statement for denials under Order 8.\",\n  \"clientExplanation\": \"Court will frame legal issues based on pleadings.\",\n  \"visibility\": \"shared\"\n}"
      }
    },
    {
      "name": "4. Quick Outcome Recording (Advocate)",
      "method": "PATCH",
      "url": "http://localhost:4000/api/v1/hearings/{{hearing_id}}/outcome",
      "headers": [
        { "name": "Authorization", "value": "Bearer {{advocate_token}}" }
      ],
      "body": {
        "type": "json",
        "raw": "{\n  \"outcome\": \"Issues framed; fixed for Plaintiff Evidence.\",\n  \"nextDate\": \"2026-11-28\",\n  \"adjournmentReason\": \"Court time elapsed during cause list\"\n}"
      }
    },
    {
      "name": "5. Query Cause List Across Cases (Client)",
      "method": "GET",
      "url": "http://localhost:4000/api/v1/hearings?from=2026-10-01&to=2026-12-31",
      "headers": [
        { "name": "Authorization", "value": "Bearer {{client_token}}" }
      ]
    },
    {
      "name": "6. Admin Access Attempt (Must Return 403)",
      "method": "GET",
      "url": "http://localhost:4000/api/v1/hearings",
      "headers": [
        { "name": "Authorization", "value": "Bearer {{admin_token}}" }
      ]
    }
  ]
}
```
