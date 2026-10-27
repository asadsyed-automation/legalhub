# LegalHub Frontend Engineering Guide: FE-4 (Cases List, New Case & Case Detail Overview)

> **Final Year Project (FYP) — Emerson University Multan**  
> **Student Developers:** Syed Asad, Muhammad Aqeel, Mubashir Mehmood  
> **Module:** Frontend Phase 3 — Connected Case Journey (FE-4: Case Management & Workspace)  
> **Target Scope:** Dual-Role Cases List, New Case Form, Tabbed Case Workspace, Status Transitions & Client Projection Shields

---

## 1. Architectural Philosophy & Real-Life Pakistani Analogy

### The Digital Chamber File (*Basta*) & The Public Notice Board
In Pakistani district courts (*District Courts / Kachehri*) and High Court benches (such as Lahore, Multan, and Rawalpindi):
* **The Advocate's Confidential Folder (*Basta*):** When an advocate accepts a litigation brief, they open an individual file folder. In this folder, the lawyer records the opposing parties, the court room, the case/FIR number, and tracks each procedural hearing. On LegalHub, this is implemented via `/cases/new` and the advocate's `/cases` view.
* **The Notice Board Whitelist (Litigant Privacy Barrier):** Litigant citizens only see official cause list information (*Fehrist-e-Peshian*): the case title, court room, current stage, and next hearing date. They are shielded from internal chamber notes, attorney-client billing strategies, or unlinked case details. In the frontend, client screens are strictly read-only and consume the whitelisted backend projection.
* **Procedural Transition Guard:** In Pakistani court proceedings, transitioning a suit from *Pleadings* to *Evidence* or recording a *Stay Order* is a formal legal event. Our frontend introduces an explicit **Confirmation Dialog (`ConfirmDialog`)** so advocates never alter a case's procedural state accidentally.

---

## 2. Complete Trace: From User Click to Database & Screen Update

Here is the exact journey when an advocate updates a case's status from `Active` to `Stayed`:

```
[ Advocate UI: CaseDetail.jsx ]
       |
       | 1. Selects Status: "Stayed" and clicks "Update Status & Stage"
       v
[ State: setShowConfirmModal(true) ]
       |
       | 2. ConfirmDialog displays with procedural warning
       v
[ Advocate Clicks: "Confirm Transition" in Dialog ]
       |
       | 3. handleConfirmStatusChange() invoked
       v
[ Frontend API: caseApi.updateCase(id, { status: "Stayed", stage: "Evidence" }) ]
       |
       | 4. Axios sends PATCH /api/v1/cases/:id with Bearer JWT
       v
[ Backend Express: case.routes.js -> verifyToken -> requireApprovedLawyer -> validate(updateCaseSchema) ]
       |
       | 5. caseController.updateCase(req, res, next)
       v
[ Service Layer: case.service.js updateCase() ]
       |
       | 6. Begins Managed Sequelize Transaction
       |    - Finds Case by PK
       |    - Verifies case.lawyerId === req.user.id (Ownership Guard)
       |    - Updates case.status = 'Stayed'
       |    - Creates CaseStatusEvent audit row { fromStatus: 'Active', toStatus: 'Stayed', changedBy: user.id }
       |    - Commits Transaction
       v
[ PostgreSQL Database (Supabase) ]
       |
       | 7. Persists UPDATE cases and INSERT INTO case_status_events
       v
[ Backend Formatter: formatCaseForLawyer(updatedCase) ]
       |
       | 8. Returns 200 OK: { success: true, message: 'Case file updated successfully', data: { ...updatedCase } }
       v
[ Frontend Axios Interceptor: client.js ]
       |
       | 9. Unwraps response.data directly
       v
[ React State Update: CaseDetail.jsx ]
       |
       | 10. setCaseData(updated); setUpdateMessage("Case procedural status and stage successfully updated.")
       v
[ Screen Render: Top banner chip updates to "Stay Granted" (danger palette) & audit list updates ]
```

---

## 3. Student Hands-On Exercises

### Exercise 1: Chamber Walk-in Case Creation & Boundary Verification
**Objective:** Verify that an advocate can open a case file without linking a prior booking, and observe dynamic party array boundaries.
1. Log in as advocate `sikandar.adv@demo.legalhub.local`.
2. Navigate to `/cases` and click **"Open New Case File"**.
3. Fill in:
   - **Title:** `Multan Commercial Lease Eviction Appeal`
   - **Practice Area:** `Property`
   - **Court:** `District Court, Multan`
   - **Case / FIR Number:** `Appeal No. 89/2026`
   - **Parties:** Party 1: `Malik Farooq` (`Appellant`), Party 2: `Sheikh Noman` (`Respondent`).
4. Click **"Add Another Party"** and observe the dynamic row appear. Remove it using the trash icon.
5. Submit the form. Verify that you are redirected to `/cases/:id` and that the overview shows both parties accurately.

### Exercise 2: State Transition Confirmation & Audit Trail
**Objective:** Confirm that status transitions require explicit user confirmation and generate an immutable audit log.
1. On the case detail page (`/cases/:id`), locate the **"Procedural Status Transition"** card on the right column.
2. Select **Status:** `Stayed` and **Stage:** `Arguments`.
3. Click **"Update Status & Stage"**.
4. Observe that the modal dialog appears: *"Are you sure you want to transition this case file to Status: 'Stayed' and Stage: 'Arguments'?"*
5. Click **"Cancel"**; observe that no network request is sent.
6. Click the button again and click **"Confirm Transition"**.
7. Observe that the status chip immediately turns to `Stayed` and a new audit event appears in the **Procedural Audit History**.

### Exercise 3: Litigant Client Read-Only Isolation
**Objective:** Verify that a client sees only whitelisted fields and cannot modify case status.
1. Log in as client `ali.client@demo.legalhub.local`.
2. Navigate to `/cases` via the sidebar link **"My Case Files"**.
3. Observe that there is **NO** "Open New Case File" button.
4. Click on a linked case to open `/cases/:id`.
5. Verify that:
   - The status and stage are visible.
   - The **Procedural Status Transition** card is completely absent.
   - Internal foreign keys (`lawyerId`, `bookingId`) are nowhere in the DOM.

---

## 4. Final Year Project Viva Voce Defense Q&As

### Q1: Why is client-side form validation alone insufficient for legal case filing?
**Answer:**  
Client-side validation enhances user experience by giving immediate feedback (such as preventing blank titles or exceeding 150 characters), but it can easily be bypassed using curl or API tools. The backend enforces strict Zod schema validation (`createCaseSchema`) before executing database queries. The frontend mirrors backend validation rules so errors are caught early before network dispatch, but never relies on frontend enforcement for security.

### Q2: Why does the Case Detail workspace employ a tabbed architecture instead of a long scrollable page?
**Answer:**  
A legal case file encompasses diverse procedural domains: diary entries, scheduled hearings, uploaded evidentiary documents, fee ledgers, unified timeline, and direct client messages. Placing all these modules on a single page would create cognitive overload, slow DOM rendering, and cause excessive simultaneous API calls. Tabbed navigation organizes litigation concerns into modular views and prepares the platform for incremental loading.

### Q3: How does the frontend ensure client screens remain strictly read-only?
**Answer:**  
First, UI components conditionally omit interactive controls (e.g., hiding the "Open New Case File" button and the status transition card when `user.role !== ROLES.LAWYER`). Second, even if a malicious user attempts to forge a `PATCH /api/v1/cases/:id` request, the backend API enforces `requireApprovedLawyer` and verifies chamber ownership (`caseRecord.lawyerId === req.user.id`), immediately rejecting unauthorized requests with `403 Forbidden`.

### Q4: Why are case status transitions mediated by a confirmation modal?
**Answer:**  
In litigation practice, modifying a case status (e.g., from `Active` to `Stayed` or `Decided`) triggers downstream implications—such as recording an immutable audit event in `case_status_events` and altering client disclosures. The `ConfirmDialog` modal enforces deliberate user intent, preventing accidental clicks especially on mobile touchscreens.

### Q5: How is mobile responsiveness maintained on a 375px viewport for multi-party court forms?
**Answer:**  
The form uses CSS Grid with media queries: on desktop, fields and party inputs span multiple columns; on viewports under 640px (including 375px iPhone SE), the layout automatically shifts to a single column (`grid-template-columns: 1fr`), form action buttons stack vertically, and the party rows expand to accommodate touch targets without horizontal overflow.

---

## 5. Numbered Manual Test Script

| Step | Action | Credentials | Expected Result |
| :---: | :--- | :--- | :--- |
| **1** | Open `/login` | `sikandar.adv@demo.legalhub.local`<br>`Advocate@12345` | Login succeeds; redirected to advocate dashboard. |
| **2** | Click **"Case Files & Diary"** in sidebar | Advocate session | Navigates to `/cases`. Page displays header, status/court filters, and "Open New Case File" button. |
| **3** | Click **"Open New Case File"** | Advocate session | Navigates to `/cases/new`. Displays 4 form sections: Essentials, Status & Stage, Litigant Parties, and Link Consultation. |
| **4** | Submit empty form | Advocate session | Form is blocked; inline validation errors appear ("Case title is required"). |
| **5** | Fill valid case details | Advocate session | Title: `Kachehri Partition Suit 2026`<br>Practice Area: `Property`<br>Court: `District Court, Multan`<br>Parties: `Chaudhry Akram` (`Petitioner`), `Mian Bashir` (`Respondent`). |
| **6** | Click **"Open Case File (*Basta*)"** | Advocate session | Submits `POST /api/v1/cases`. On success, automatically redirects to `/cases/:id`. |
| **7** | Verify Case Overview tab | Advocate session | Overview displays case metadata, party chips, next hearing status, and the Procedural Status Transition card. |
| **8** | Click **"Entries"**, **"Hearings"**, **"Documents"** tabs | Advocate session | Each tab displays a clean roadmap placeholder explaining the upcoming module (FE-5, FE-6, etc.). |
| **9** | Modify Status to `Stayed` and click update | Advocate session | `ConfirmDialog` opens with warning. Clicking "Confirm Transition" updates status chip to `Stayed` and logs an audit item. |
| **10** | Logout and login as client | `ali.client@demo.legalhub.local`<br>`Client@12345` | Client dashboard loads. |
| **11** | Click **"My Case Files"** in sidebar | Client session | Navigates to `/cases`. Displays linked cases list with NO "Open New Case File" button. |
| **12** | Open case detail `/cases/:id` | Client session | Case loads in read-only mode. Status transition card is absent; client notice card is displayed. |
