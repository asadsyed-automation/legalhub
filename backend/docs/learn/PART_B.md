# LegalHub Backend Core - Learning Guide: Part B (Lawyer Onboarding, Admin Review & Public Directory)

Welcome to Part B of the LegalHub backend learning guide. This guide explains how advocate credentials are submitted, verified, reviewed by administrators, and safely projected to the public.

---

## 1. High-Level Explanation & Pakistani Real-Life Analogy

### Real-Life Analogy: The Pakistan Bar Council Enrollment & Court Gazette
In Pakistan, any citizen can consult the law, but nobody can appear before a judge in court without being verified by their statutory Bar Council (e.g. Punjab Bar Council, Sindh Bar Council, Islamabad Bar Council).

1. **The Application Window (`POST /api/v1/lawyer/application`):**
   - A registered advocate visits the Bar Council registration office.
   - They submit their official Enrolment Number (e.g., `PBC-89102`), Court Qualification level (Advocate Lower Courts, High Court, or Supreme Court), years of experience, and their active practice areas (e.g., Criminal, Corporate).
   - **Composite Unique License Rule:** The database guarantees that no two lawyers can ever submit the exact same Enrolment Number under the same Bar Council. If another applicant attempts to claim an existing license number, the database immediately halts the transaction.
2. **The Registrar Review Committee (`Admin Endpoints`):**
   - The application is placed in an official scrutiny queue with status **`pending`**.
   - The Court Registrar (System Admin) inspects the submitted record against verified bar records.
   - The Registrar has two choices:
     - **Approve:** Sets status to `approved`, stamping `reviewedBy` (Admin UUID) and `reviewedAt` (timestamp).
     - **Reject:** The Registrar must supply an official written explanation of at least 10 characters (e.g. *"Bar council enrolment card expired or certificate unverified"*).
3. **The Re-submission Workflow (`PUT /api/v1/lawyer/application`):**
   - An advocate whose application was rejected can correct their information and re-submit.
   - Upon updating, the system automatically transitions the status back to **`pending`**, clears out the old rejection reason, and places it back in the Registrar's queue.
   - Once an application is **`approved`**, the advocate cannot casually change their verified credentials without going through formal re-verification.
4. **The Public High Court Directory (`Public Directory API`):**
   - Citizens searching for legal assistance can browse verified advocates by city and practice area with pagination.
   - **Strict Privacy Rule:** Only `approved` lawyers appear. Any `pending` or `rejected` lawyer is strictly hidden from public view.
   - **Data Shielding / Projection:** The public sees the advocate's professional profile: name, city, practice areas, court level, bar council, experience, and bio. Their private email, personal chamber address, and internal enrolment number are **never** leaked to the public.

---

## 2. Technical Terms Defined

| Term | Plain English Definition |
| :--- | :--- |
| **Foreign Key (FK)** | A database column that establishes a direct link between two tables (e.g., `lawyer_applications.userId` referencing `users.id`), ensuring an application cannot exist without a valid user account. |
| **Composite Unique Index** | A database constraint spanning multiple columns (e.g. `[barCouncil, enrolmentNo]`) ensuring that their combined values are globally unique across the entire table. |
| **State Machine / State Transition** | An architectural pattern that enforces valid status transitions (e.g., `pending` $\rightarrow$ `approved` OR `pending` $\rightarrow$ `rejected` $\rightarrow$ `pending`). Disallowed transitions trigger HTTP 409 Conflict. |
| **Data Projection / DTO** | The practice of explicitly selecting only authorized fields before returning data to the client, preventing internal or sensitive data (like emails or home addresses) from leaking. |
| **PostgreSQL Array Type (`ARRAY(TEXT)`)** | A native PostgreSQL data type allowing a single column to store an ordered list of strings (e.g., legal practice areas like `['Criminal', 'Corporate']`). |
| **Pagination (`page`, `limit`, `total`)** | Slicing large result sets into smaller, indexed subsets so the server and network are never overloaded by returning thousands of records at once. |

---

## 3. File-by-File Summary

| File | What It Does (2–3 plain sentences) |
| :--- | :--- |
| `migrations/20261018000001-create-lawyer-applications.js` | Database migration that creates the `lawyer_applications` table with foreign key constraints, status ENUM, PostgreSQL text arrays, and a composite unique index on `(barCouncil, enrolmentNo)`. |
| `src/models/lawyerApplication.model.js` | Defines the Sequelize `LawyerApplication` model with field validations, status defaults, and timestamps. |
| `src/models/index.js` | Registers the `LawyerApplication` model and establishes 1-to-1 relationships between `User` and `LawyerApplication` (with cascading deletions). |
| `src/modules/lawyer/lawyer.schemas.js` | Enforces Zod validation on application submissions and updates, verifying fields against approved Pakistani Bar Councils, Court Levels, cities, 1–5 practice areas, and 0–60 years of experience. |
| `src/modules/lawyer/lawyer.service.js` | Business logic for lawyer applications: prevents duplicate submissions, checks for license collisions, fetches personal applications, and enforces that `PUT` updates can only occur on `rejected` applications. |
| `src/modules/lawyer/lawyer.controller.js` | HTTP transport controller for lawyer onboarding endpoints, parsing `req` and returning standardized JSON responses. |
| `src/modules/lawyer/lawyer.routes.js` | Binds `/application` endpoints (`POST`, `GET`, `PUT`), protecting them with `verifyToken` and `requireRole('lawyer')`. |
| `src/modules/admin/admin.schemas.js` | Validates admin review inputs, requiring a minimum 10-character explanation for rejections and validating query status filters. |
| `src/modules/admin/admin.service.js` | Admin business rules: lists applications with optional status filters, verifies that only `pending` records can be approved or rejected (returning 409 otherwise), and stamps reviewer ID and timestamp. |
| `src/modules/admin/admin.controller.js` | HTTP controller for admin application review, approving or rejecting lawyer submissions. |
| `src/modules/admin/admin.routes.js` | Declares admin endpoints under `/api/v1/admin/applications`, protected by `verifyToken` and `requireRole('admin')`. |
| `src/modules/directory/directory.service.js` | Queries approved lawyers using PostgreSQL array containment (`[Op.contains]`), applies pagination (default 20, max 50), and projects only safe public fields. |
| `src/modules/directory/directory.controller.js` | HTTP controller handling public directory requests and individual lawyer detail queries. |
| `src/modules/directory/directory.routes.js` | Publicly accessible routes mounted at `/api/v1/lawyers` requiring no authentication token. |
| `tests/lawyer.test.js` | Comprehensive integration tests verifying RBAC (403s), application submission (201), duplicate prevention (409), admin approval/rejection lifecycle, re-submission, privacy leakage prevention, and directory filters. |

---

## 4. End-to-End Request Trace: `PATCH /api/v1/admin/applications/:id/approve`

Here is what happens under the hood when a System Admin approves a lawyer's onboarding application:

```text
[Client Request: PATCH /api/v1/admin/applications/c4a921d0-.../approve]
        │   Header: Authorization: Bearer <Admin_JWT>
        ▼
1. Express Layer (`src/app.js`):
   - `helmet()` applies secure HTTP response headers.
   - `cors()` verifies the request origin against `FRONTEND_URLS`.
        │
        ▼
2. Route Pipeline (`src/modules/admin/admin.routes.js`):
   - `verifyToken`: Decodes JWT, validates signature, and attaches claims `{ id: "...", role: "admin" }` to `req.user`.
   - `requireRole('admin')`: Confirms `req.user.role === 'admin'`. If a client or lawyer token was passed, immediately returns 403 Forbidden.
        │
        ▼
3. Controller (`src/modules/admin/admin.controller.js`):
   - Extracts `req.params.id` and `req.user.id`.
   - Invokes `adminService.approveApplication(req.params.id, req.user.id)`.
        │
        ▼
4. Service Layer (`src/modules/admin/admin.service.js`):
   - Finds application by primary key: `LawyerApplication.findByPk(applicationId)`.
   - If not found: Throws `AppError('Lawyer application not found', 404)`.
   - **State Machine Guard:** Checks `if (application.status !== 'pending')`.
     - *If already approved or rejected:* Throws `AppError('Only pending applications can be approved', 409)`.
   - **Audit Stamping:** Updates record in PostgreSQL:
     - `status = 'approved'`
     - `reviewedBy = adminId`
     - `reviewedAt = new Date()`
     - `rejectionReason = null`
        │
        ▼
5. Database Layer (PostgreSQL via Sequelize):
   - Executes parameterized query:
     `UPDATE "lawyer_applications" SET "status" = 'approved', "reviewedBy" = $1, "reviewedAt" = $2 WHERE "id" = $3;`
        │
        ▼
6. Response Delivery:
   - Controller returns HTTP 200 OK with the updated application object.
   - The lawyer is now instantly queryable in the public directory `GET /api/v1/lawyers`.
```

---

## 5. Three Hands-On Exercises (Do Yourself Without AI)

To master this code before speaking with your supervisor:

1. **Exercise 1 - Add an Enrolment Format Validator:**
   - In `src/modules/lawyer/lawyer.schemas.js`, write a custom Zod refinement (`.refine()`) on `enrolmentNo` to verify that the enrolment string starts with a 3-letter prefix (like `PBC-`, `SBC-`, or `IBC-`) followed by numbers.
2. **Exercise 2 - Test Private Field Leakage Manually:**
   - Use Postman, Thunder Client, or curl to fetch an approved lawyer via `GET /api/v1/lawyers`.
   - Inspect the response JSON key-by-key. Verify that `email`, `chamberAddress`, and `enrolmentNo` are absent from the payload.
3. **Exercise 3 - Verify the State Machine Constraint:**
   - Register a lawyer and submit an application.
   - As an admin, approve the application.
   - Send another `PATCH /approve` request to the same application ID. Observe that your server correctly rejects it with `409 Conflict` because only `pending` records can be approved.

---

## 6. Five Viva Questions & Model Answers

### Q1: Why do we have a composite unique constraint on `(barCouncil, enrolmentNo)`?
> **Model Answer:** In Pakistan, each provincial Bar Council maintains its own independent licensing roll. Two different bar councils could conceivably issue the same number (e.g. 5001), but within the same Bar Council, an enrolment number must be unique. The composite unique constraint prevents fraudulent duplicate registrations under the same council.

### Q2: Why is the lawyer public profile separated into a "Data Projection" instead of returning the raw database row?
> **Model Answer:** Raw database rows contain sensitive and confidential information, such as personal email addresses, private chamber suites, internal license IDs, and admin review notes. Data projection (DTO) guarantees that only authorized, public-safe fields (`name`, `city`, `practiceAreas`, `courtLevel`, `experience`, `bio`) are transmitted over the wire, protecting lawyer privacy.

### Q3: Why does `PUT /api/v1/lawyer/application` only work when status is `rejected`?
> **Model Answer:** This enforces a strict lifecycle state machine. Once an advocate's credentials have been vetted and stamped as `approved` by an administrator, the advocate cannot casually change their details without re-verification. They can only edit their application if an admin previously rejected it with feedback, and saving automatically resets the status back to `pending`.

### Q4: How does PostgreSQL handle filtering arrays like `practiceAreas`?
> **Model Answer:** Unlike traditional SQL databases that require a separate many-to-many join table for tags, PostgreSQL provides native array data types (`TEXT[]`). We use Sequelize's `[Op.contains]` operator, which compiles to PostgreSQL's `@>` (array containment) operator, allowing high-performance searches for lawyers possessing a specific practice area.

### Q5: What is the purpose of recording `reviewedBy` and `reviewedAt`?
> **Model Answer:** This provides an administrative audit record. In a legal marketplace, accountability is paramount. If an unauthorized individual is approved, the system can immediately identify which administrator approved the application and at what exact date and time.

---

## 7. Common Pitfalls & Mistakes to Avoid

1. **Accidentally Leaking Private Fields in Public Endpoints:**
   - *Mistake:* Returning `res.json(application)` directly in `GET /api/v1/lawyers/:id`.
   - *Fix:* Always passing the record through `projectPublicLawyer()` to strip `chamberAddress`, `email`, and `enrolmentNo`.
2. **Missing Status Filter on Public Directory:**
   - *Mistake:* Querying `LawyerApplication.findAll()` without `where: { status: 'approved' }`.
   - *Fix:* Hardcoding the approved status check so unverified or rejected applicants are never displayed.
3. **Allowing Free-Text Cities or Bar Councils:**
   - *Mistake:* Accepting arbitrary user input like `"pbc"` or `"lhr"`.
   - *Fix:* Validating strictly against standardized constants using Zod enums (`BAR_COUNCILS`, `CITIES`, `COURT_LEVELS`).
4. **Ignoring Conflict Checks on Re-submission:**
   - *Mistake:* Allowing a rejected lawyer to change their `enrolmentNo` to one already taken by someone else on `PUT`.
   - *Fix:* Checking for collision against other records (`id != currentId`) before saving.
