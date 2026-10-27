# LegalHub Engineering Guide: Part H (Cases, Parties & Access Boundaries)

> **Final Year Project (FYP) — Emerson University Multan**  
> **Student Developers:** Syed Asad, Muhammad Aqeel, Mubashir Mehmood  
> **Module:** Phase 3 — Case Journey (Part H: Cases & Confidential Case Files)  
> **Scope:** Advocate Case File Management, Parties, Status Event Audit Log & Strict Client Projection Whitelist

---

## 1. Real-Life Pakistani Analogy & Core Philosophy

### The Real-World Parallel: The Advocate's Registered Chamber File (*Basta*)
In a Pakistani District Court (Kachehri) or High Court bench (e.g., Multan High Court Bar or District Bar Association):
* **The Advocate's Chamber (*Daftar*):** When an advocate accepts a brief or suit (e.g., a partition suit or revenue petition), they open an individual file folder (*Basta*). The advocate enters the plaintiff, defendant, court branch, FIR/Suit number, and hearing notes. 
* **Walk-in Clients vs. Portal Bookings:** If a walk-in client comes directly into the chamber from the courthouse corridor, the advocate opens a file immediately without an online booking (`clientId = null`). However, if an online citizen booked and completed a paid consultation through LegalHub, the advocate links that verified consultation (`bookingId`). The platform automatically links the verified client (`clientId`) so the client can track case stages from their home dashboard.
* **Why the Platform Admin Must Never See Inside the File:** A court registrar or court staff employee does not have permission to rummage through a lawyer's confidential working files and client notes without a judicial warrant. Similarly, on LegalHub, platform administrators are strictly forbidden (`403 Forbidden`) from viewing case files. Admin accounts exist purely to verify bar council credentials and moderate disputes, not to snoop on attorney-client privileged matters.
* **The Whitelist Notice Board (Projection):** When a citizen visits the court to see case progress, the cause list on the court notice board shows only the suit title, court room, stage, and next hearing date. It does not publish the lawyer's internal audit logs, internal database keys, or client contact details. LegalHub achieves this through a **strict client projection whitelist**.

---

## 2. Technical Architecture & Database Design

### 2.1 Entity Relationship Overview
```
+-------------------------------------------------------------+
|                           User                              |
+-------------------------------------------------------------+
       | 1 (lawyer)                        | 1 (client)
       |                                   |
       v N                                 v N
+-------------------------------------------------------------+
|                           Case                              |
|  - id (UUID, PK)                                            |
|  - lawyerId (UUID, FK -> users) [NOT NULL]                  |
|  - clientId (UUID, FK -> users) [NULLABLE]                  |
|  - bookingId (UUID, FK -> bookings, UNIQUE) [NULLABLE]      |
|  - title (VARCHAR 255) [NOT NULL]                           |
|  - practiceArea (VARCHAR 50) [NOT NULL]                     |
|  - court (VARCHAR 255) [NOT NULL]                           |
|  - caseOrFirNumber (VARCHAR 100)                            |
|  - filingDate (DATEONLY)                                    |
|  - status (ENUM: Prospect, Active, Stay, ...)               |
|  - stage (ENUM: Pre-filing, Notice, Evidence, ...)          |
|  - nextHearing (TIMESTAMP WITH TIME ZONE)                   |
+-------------------------------------------------------------+
       | 1                                 | 1
       |                                   |
       v N                                 v N
+------------------------+      +-------------------------------+
|       CaseParty        |      |       CaseStatusEvent         |
|  - id (UUID, PK)       |      |  - id (UUID, PK)              |
|  - caseId (UUID, FK)   |      |  - caseId (UUID, FK)          |
|  - name (VARCHAR 255)  |      |  - fromStatus, toStatus       |
|  - roleLabel (VARCHAR) |      |  - fromStage, toStage         |
|                        |      |  - changedBy (UUID, FK)       |
+------------------------+      +-------------------------------+
```

### 2.2 Security & Privacy Boundaries
1. **Confidentiality:** Cases are strictly scoped to `lawyerId = req.user.id`. No other lawyer can read or update the file (`403 Forbidden`).
2. **Admin Exclusion:** Any request by `admin` to `/api/v1/cases` returns an immediate `403 Forbidden`.
3. **Client Whitelist Projection:** Linked clients (`clientId = req.user.id`) receive only an immutable, sanitized view:
   * **Allowed Fields:** `id`, `title`, `court`, `practiceArea`, `status`, `stage`, `caseOrFirNumber`, `filingDate`, `parties`, `nextHearing`, `createdAt`, `updatedAt`.
   * **Forbidden / Excluded Fields:** `lawyerId`, `clientId`, `bookingId`, `statusEvents`, internal user objects, notes, and emails.
4. **Audit Immutability:** Any change in `status` or `stage` automatically creates an immutable audit row in `case_status_events` with `changedBy` and timestamp.

---

## 3. Student Hands-On Exercises

### Exercise 1: Chamber Walk-in Case Creation & Party Limit Verification
**Objective:** Verify that an advocate can create an offline case with multiple parties, and observe the Zod schema boundary rejecting more than 10 parties.
1. Log in as an approved advocate (`ahmed.lawyer@example.pk`).
2. Send a `POST /api/v1/cases` payload with 2 parties:
   ```json
   {
     "title": "Chamber Walk-in Revenue Suit",
     "practiceArea": "Property",
     "court": "District Court, Multan",
     "caseOrFirNumber": "Suit No. 104/2026",
     "filingDate": "2026-10-15",
     "parties": [
       { "name": "Haji Ghulam Rasool", "roleLabel": "Plaintiff" },
       { "name": "Muhammad Akhtar", "roleLabel": "Defendant" }
     ]
   }
   ```
3. Observe that the case is created with `clientId: null`, `bookingId: null`, and `status: "Prospect"`.
4. Now, attempt to send a payload with 11 party entries in the array.
5. **Expected Observation:** The request is rejected with `400 Bad Request` and `res.body.details` contains `"Cannot exceed 10 parties per case"`.

### Exercise 2: Completed Booking Linkage & Late Linking Flow
**Objective:** Understand how consultation bookings transition into active formal court cases.
1. Create a consultation booking between client Ali and advocate Ahmed.
2. Advance the booking to `completed` via the booking workflow (`POST /bookings/:id/complete`).
3. Create a case linking `bookingId: <completed_booking_id>`. Verify that `clientId` is automatically set to Ali's ID without the advocate having to specify it manually.
4. Attempt to create a *second* case linking the exact same `bookingId`.
5. **Expected Observation:** The system returns `409 Conflict` (`"This consultation booking is already linked to an existing case file"`).
6. Create an advocate-only case (`bookingId: null`). Then issue a `PATCH /api/v1/cases/:id` sending `{ "bookingId": <another_completed_booking_id> }`.
7. **Expected Observation:** Late linking succeeds (`200 OK`) and the case is now linked to that client. Attempting a subsequent link returns `409 Conflict`.

### Exercise 3: Client Projection Whitelist & Data Leakage Prevention
**Objective:** Test the security boundary ensuring clients never receive internal foreign keys, lawyer IDs, or status event audits.
1. Log in as the linked client Ali.
2. Request `GET /api/v1/cases/:id` using the ID of the linked case.
3. Inspect the returned JSON payload keys.
4. **Verification Checklist:**
   * `data.lawyerId` must be `undefined`.
   * `data.clientId` must be `undefined`.
   * `data.bookingId` must be `undefined`.
   * `data.statusEvents` must be `undefined`.
   * `data.parties` must be present with only `[{ id, name, roleLabel }]`.
5. Now log in as an unlinked client and request the same ID.
6. **Expected Observation:** The system immediately returns `403 Forbidden`.

---

## 4. Final Year Project Viva Defense Questions & Answers

### Q1: Why are platform administrators returned HTTP 403 Forbidden on case management endpoints?
**Answer:**  
Under Section 126 of the **Qanun-e-Shahadat Order 1984** (Pakistani law governing professional communications and attorney-client privilege), all confidential communications between an advocate and client are privileged. In LegalHub, platform administrators are operational managers responsible for credential verification and system moderation; they are neither parties to the litigation nor licensed advocates representing the client. Exposing client case files and litigation strategies to administrators would violate privilege and privacy. Thus, the backend enforces a zero-trust boundary returning `403 Forbidden` for `admin` on `/api/v1/cases`.

### Q2: Why does the system only permit linking bookings with status `'completed'`?
**Answer:**  
A consultation booking represents an exploratory inquiry or preliminary interview. Until the advocate marks the consultation as `'completed'`, no formal legal relationship or mandate has been finalized. Furthermore, if a pending or cancelled booking could be converted into a case, unverified or unpaid inquiries could clutter active litigation records. Restricting linkage strictly to `completed` bookings ensures a verifiable audit trail and prevents premature case creation.

### Q3: How does LegalHub protect against client data leakage when serving case details to a client?
**Answer:**  
Instead of returning the raw Sequelize model instance or relying on blanket object spread (`{ ...caseRecord }`), the service layer uses a strict whitelist projection function (`projectCaseForClient`). It explicitly constructs a new object containing only client-facing attributes (`id`, `title`, `court`, `practiceArea`, `status`, `stage`, `caseOrFirNumber`, `filingDate`, `parties`, `nextHearing`, `createdAt`, `updatedAt`). Sensitive internal fields like `lawyerId`, `clientId`, `bookingId`, `statusEvents`, and internal lawyer notes are never copied, ensuring zero data leakage regardless of future model changes.

### Q4: Why is `bookingId` enforced with a unique constraint in the `cases` table?
**Answer:**  
In Pakistani legal practice, a single consultation booking addresses a specific legal dispute or transaction. Permitting multiple cases to reference the same `bookingId` would create race conditions, ambiguous client linkage, and data corruption in dispute tracking. The PostgreSQL unique constraint on `cases.bookingId` provides database-level enforcement, complemented by a service-level pre-check that returns an informative `409 Conflict`.

### Q5: How does the system handle party updates during `PATCH /api/v1/cases/:id` without orphaned records?
**Answer:**  
Case party management implements an atomic **full replacement** pattern inside an isolated Sequelize transaction (`managed transaction`). When a `parties` array is supplied in a PATCH request, the service executes `CaseParty.destroy({ where: { caseId: caseRecord.id }, transaction })` followed by `CaseParty.bulkCreate(...)`. If any insertion fails, the entire transaction rolls back, preventing orphaned party rows or inconsistent states.

---

## 5. Thunder Client / Automated HTTP Test Script

```json
{
  "clientName": "Thunder Client",
  "collectionName": "LegalHub - Phase 3 Part H (Cases)",
  "dateExported": "2026-10-24",
  "version": "1.1",
  "requests": [
    {
      "name": "1. Login Advocate Sardar Sikandar",
      "method": "POST",
      "url": "http://localhost:4000/api/v1/auth/login",
      "body": {
        "type": "json",
        "raw": "{\n  \"email\": \"sikandar.adv@demo.legalhub.local\",\n  \"password\": \"Advocate@12345\"\n}"
      }
    },
    {
      "name": "2. Create Walk-in Chamber Case",
      "method": "POST",
      "url": "http://localhost:4000/api/v1/cases",
      "headers": [
        { "name": "Authorization", "value": "Bearer {{advocate_token}}" }
      ],
      "body": {
        "type": "json",
        "raw": "{\n  \"title\": \"Mian Channu Agricultural Land Partition\",\n  \"practiceArea\": \"Property\",\n  \"court\": \"District Court, Multan\",\n  \"caseOrFirNumber\": \"Suit No. 412/2026\",\n  \"filingDate\": \"2026-10-24\",\n  \"parties\": [\n    { \"name\": \"Chaudhry Riaz Ahmad\", \"roleLabel\": \"Plaintiff\" },\n    { \"name\": \"Sub-Registrar Revenue Multan\", \"roleLabel\": \"Respondent No. 1\" }\n  ]\n}"
      }
    },
    {
      "name": "3. List Cases (Advocate)",
      "method": "GET",
      "url": "http://localhost:4000/api/v1/cases?page=1&limit=10",
      "headers": [
        { "name": "Authorization", "value": "Bearer {{advocate_token}}" }
      ]
    },
    {
      "name": "4. Update Status & Stage (Advocate)",
      "method": "PATCH",
      "url": "http://localhost:4000/api/v1/cases/{{case_id}}",
      "headers": [
        { "name": "Authorization", "value": "Bearer {{advocate_token}}" }
      ],
      "body": {
        "type": "json",
        "raw": "{\n  \"status\": \"Active\",\n  \"stage\": \"Notice Issued\"\n}"
      }
    },
    {
      "name": "5. Client Access Linked Case",
      "method": "GET",
      "url": "http://localhost:4000/api/v1/cases/{{case_id}}",
      "headers": [
        { "name": "Authorization", "value": "Bearer {{client_token}}" }
      ]
    },
    {
      "name": "6. Admin Access Attempt (Must Return 403)",
      "method": "GET",
      "url": "http://localhost:4000/api/v1/cases/{{case_id}}",
      "headers": [
        { "name": "Authorization", "value": "Bearer {{admin_token}}" }
      ]
    }
  ]
}
```
