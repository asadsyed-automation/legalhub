# LegalHub Frontend Engineering Guide: FE-5 (Case Diary Entries, Court Hearings & Cause List Calendar)

> **Final Year Project (FYP) — Emerson University Multan**  
> **Student Developers:** Syed Asad, Muhammad Aqeel, Mubashir Mehmood  
> **Module:** Frontend Phase 3 — Connected Case Journey (FE-5: Diary Entries & Court Hearing Calendar)  
> **Target Scope:** Dual-Track Diary Entries (*Roznamcha*), Court Hearing Schedule (*Peshian*), Mobile Quick-Outcome Form, Pure React 7-Day Month Grid & Cross-Case Cause List

---

## 1. Architectural Philosophy & Pakistani Court Metaphor

### The Chamber Diary (*Roznamcha*) & Corridor Quick-Outcomes (*Peshi*)
* **The Chamber Diary (*Roznamcha-e-Wukala*):** When an advocate files a stay application or receives an interlocutory order from court, they document it in the case diary. Some entries (like an application under Order 39 of the Civil Procedure Code or a certified court order) should be shared with the client. Other entries (witness credibility weaknesses, private strategy) must stay strictly private. Our **dual-track visibility toggle (`private` vs `shared`)** ensures that only shared entries appear on the client portal.
* **The Corridor Quick-Outcome Recorder:** In Pakistani district and high courts, an advocate juggles multiple hearings in different courtrooms every morning. As soon as the judge pronounces the order and fixes the next date (*Tareekh Peshi*), the advocate or their junior needs to record the outcome within 10 seconds from their mobile phone. The **Quick Outcome Form** presents only three critical fields (`outcome`, `nextDate`, `adjournmentReason`), optimized for 375px mobile touchscreens.
* **The Morning Cause List (*Fehrist-e-Peshian*):** Lawyers and litigants inspect the cause list each morning to see which matters are fixed for hearing. Our **Court Calendar Page (`/calendar`)** provides a pure React monthly visual grid with hearing indicator dots and a chronological cause list view, filtered by judicial forum, without heavy third-party calendar packages.

---

## 2. Complete Trace: From User Click to Database & Screen Update

**User Action:** Advocate records a quick bench outcome for a hearing from outside the courtroom:
* **Outcome:** *"Arguments heard in part. Adjourned for cross-examination of Plaintiff witness."*
* **Next Date:** `2026-11-20`
* **Reason:** *"Non-availability of court time / State request"*

```
[ Advocate UI: CaseHearingsTab.jsx ]
       |
       | 1. Clicks "Record Quick Outcome" button on hearing card
       v
[ Modal State: setIsQuickOutcomeModalOpen(true) ]
       |
       | 2. Mobile-optimized compact modal opens with prefilled fields
       |    Advocate types outcome and next date, then clicks "Save Outcome"
       v
[ Frontend API: caseApi.recordQuickOutcome(hearingId, payload) ]
       |
       | 3. Axios issues PATCH /api/v1/hearings/:id/outcome with Bearer JWT
       |    Payload: { outcome: "...", nextDate: "2026-11-20", adjournmentReason: "..." }
       v
[ Backend Route: hearing.routes.js ]
       |
       | 4. verifyToken -> requireApprovedLawyer -> validate(quickOutcomeHearingSchema)
       |    Zod schema validates outcome max 300, nextDate YYYY-MM-DD
       v
[ Controller Layer: hearing.controller.js ]
       |
       | 5. hearingController.quickOutcomeHearing(req, res, next)
       v
[ Service Layer: hearing.service.js ]
       |
       | 6. Finds Hearing by PK including parent Case
       |    Ownership Guard: verifies hearing.case.lawyerId === req.user.id
       |    Updates hearing record: outcome, nextDate, adjournmentReason
       |    Commits change to PostgreSQL
       v
[ PostgreSQL Database (Supabase) ]
       |
       | 7. Persists UPDATE hearings SET outcome = ..., nextDate = ... WHERE id = ...
       v
[ Backend Response ]
       |
       | 8. Returns 200 OK: { success: true, message: 'Hearing outcome recorded successfully', data: { ...hearing } }
       v
[ Frontend Axios Interceptor: client.js ]
       |
       | 9. Unwraps response.data directly
       v
[ React State Update & Callback: CaseHearingsTab.jsx ]
       |
       | 10. fetchHearings() updates local hearing card with green outcome banner
       | 11. onHearingUpdated() triggers CaseDetail parent fetchCase()
       v
[ Dynamic Re-render: CaseDetail.jsx ]
       |
       | 12. Case header banner dynamically recalculates earliest future hearing
       | 13. Top banner reflects the updated date, outcome, and adjournment status
```

---

## 3. Student Hands-On Exercises

### Exercise 1: Dual-Track Diary Entry & Client Visibility Isolation
**Objective:** Observe the strict confidentiality boundary of private chamber diary entries.
1. Log in as advocate `sikandar.adv@demo.legalhub.local` and navigate to a case file (`/cases/:id`).
2. Click the **"Entries (Diary)"** tab.
3. Click **"Add Diary Entry"**:
   - **Date:** Today's date
   - **Type:** `Pleading / Petition`
   - **Title:** `Order 39 Rule 1 & 2 Injunction Application`
   - **Content:** `Filed application for temporary injunction restraining alienation of suit property.`
   - **Visibility:** `Shared with Client`
   - Click **"Record Entry"**.
4. Add a second entry:
   - **Type:** `Chamber Note / Strategy`
   - **Title:** `Defendant Witness Cross-Examination Strategy`
   - **Content:** `Probe defendant on revenue mutations from 2018. Discrepancy in thumb impression.`
   - **Visibility:** `Private (Chamber Only)`
   - Click **"Record Entry"**.
5. Observe that both entries appear on the advocate's screen with respective pills.
6. Log out and log in as client `ali.client@demo.legalhub.local`. Open the same case file and navigate to the **"Entries (Diary)"** tab.
7. **Expected Observation:** The client sees ONLY the shared Injunction Application. The private cross-examination strategy note is completely absent from the DOM and network response.

### Exercise 2: Quick Outcome Mobile Simulation (375px)
**Objective:** Simulate courtroom corridor operation on a phone screen.
1. In Chrome / browser DevTools, toggle Device Toolbar and select **iPhone SE (375px width)**.
2. Under the case file's **"Hearings"** tab, locate an active hearing.
3. Tap **"Record Quick Outcome"**.
4. Observe that the modal scales neatly to 375px with touch-friendly fields.
5. Enter outcome: `Arguments concluded. Order reserved.` and Next Date: `2026-11-25`.
6. Tap **"Save Outcome"**.
7. Observe that the green **Bench Outcome** banner immediately renders, and the top case banner updates without horizontal page scrolling or layout breakdown.

### Exercise 3: Cross-Case Cause List & Court Forum Filtering
**Objective:** Verify that the standalone Court Calendar aggregates hearings across all cases.
1. In the sidebar, click **"Court Cause List & Calendar"** (`/calendar`).
2. Observe the pure-React 7-day month grid with dots indicating days that have hearings.
3. Click on a day with an indicator dot.
4. Verify that the bottom cause list drawer filters to show hearings scheduled for that specific date.
5. Switch the view mode to **"Cause List"**. Verify that hearings across different case files are shown chronologically.
6. Select **"Lahore High Court"** from the Court Forum dropdown. Verify that district court matters are filtered out.

---

## 4. Final Year Project Viva Voce Defense Q&As

### Q1: Why did you implement the month calendar using plain React instead of an external library like FullCalendar or React-Big-Calendar?
**Answer:**  
In our Final Year Project, minimizing bundle size and external dependencies is an explicit architectural priority. Libraries like FullCalendar or React-Big-Calendar add substantial JavaScript overhead (often >150 kB gzipped) and introduce opinionated CSS that conflicts with our vanilla design token system (`tokens.css`). A pure React 7-day CSS Grid requires under 150 lines of clear declarative code, executes fast, works smoothly on low-end mobile devices (375px), and demonstrates mastery of core date arithmetic (`new Date(y, m + 1, 0).getDate()`).

### Q2: Why is the hearing strategy note strictly stripped from the client API payload rather than just hidden in CSS?
**Answer:**  
Hiding confidential data with CSS (`display: none`) or conditional frontend rendering alone is a severe security vulnerability; any litigant could inspect the browser network tab or Redux/React state and view the lawyer's private notes. In accordance with Section 126 of the **Qanun-e-Shahadat Order 1984** (privilege between advocate and client), the backend Sequelize projection explicitly omits the `note` attribute whenever `req.user.role === 'client'`, ensuring confidential notes are never transmitted over the network.

### Q3: What is the purpose of the dedicated `PATCH /api/v1/hearings/:id/outcome` endpoint when a general `PATCH /hearings/:id` already exists?
**Answer:**  
In active litigation practice, an advocate standing in court corridors needs to record an adjournment or bench order in seconds between case calls. The general hearing update endpoint accepts up to 10 fields and requires full hearing scheduling context. The `PATCH /hearings/:id/outcome` endpoint is an optimized, targeted mutation accepting only outcome, next date, and reason, drastically reducing payload size, minimizing form validation overhead, and optimizing the mobile user journey.

### Q4: How does the system prevent date-time discrepancies caused by client-side timezones?
**Answer:**  
All hearing schedules are transmitted and stored in the database as UTC ISO-8601 strings (`scheduledAt.toISOString()`). When displayed in the frontend, the UI formats them using JavaScript's `Intl.DateTimeFormat` with the local Pakistani locale (`en-PK`) and timezone (`Asia/Karachi` / UTC+5), ensuring advocates and clients across different devices see the exact official courtroom time.

### Q5: How does the calendar query optimize performance when handling hundreds of chamber cases?
**Answer:**  
The calendar endpoint (`GET /api/v1/hearings`) does not dump the entire database history. It enforces mandatory boundary parameters (`from` and `to` ISO timestamps covering the visible month plus lookahead padding) and leverages database composite indexing on `(caseId, scheduledAt)`. This keeps memory consumption constant and ensures lightning-fast queries even for senior advocates managing hundreds of briefs.

---

## 5. Numbered Manual Test Script

| Step | Action | User Session | Expected Result |
| :---: | :--- | :--- | :--- |
| **1** | Open `/login` | `sikandar.adv@demo.legalhub.local`<br>`Advocate@12345` | Authenticates; redirected to `/dashboard`. Sidebar displays **"Case Files & Diary"** and **"Court Cause List & Calendar"**. |
| **2** | Navigate to `/cases` and open an active case | Advocate | Case detail page loads on **Overview** tab. |
| **3** | Click **"Entries (Diary)"** tab | Advocate | Diary list loads. Displays filter bar (`All Entry Types`, `All Visibility`) and **"Add Diary Entry"** button. |
| **4** | Click **"Add Diary Entry"** and submit form | Advocate | Modal opens. Enter Title: `Replication to Written Statement`, Type: `Pleading / Petition`, Visibility: `Shared with Client`. Submits `POST /cases/:id/entries`. New entry card renders with blue badge. |
| **5** | Click **"Hearings"** tab | Advocate | Hearings tab loads. Displays schedule list and **"Schedule Court Hearing"** button. |
| **6** | Click **"Schedule Court Hearing"** | Advocate | Modal opens. Select tomorrow's date at 09:30 AM, Stage: `Evidence`, Explanation: *"Plaintiff will produce revenue record witnesses."* Submits `POST /cases/:id/hearings`. |
| **7** | Click **"Record Quick Outcome"** on hearing card | Advocate | Compact modal opens. Enter Outcome: *"Arguments heard in part"*, Next Date: `2026-11-20`. Submits `PATCH /hearings/:id/outcome`. |
| **8** | Verify Dynamic Banner Update | Advocate | Case header banner immediately updates its **Next Hearing** alert pill to reflect the newly recorded hearing date. |
| **9** | Click **"Court Cause List & Calendar"** in sidebar | Advocate | Navigates to `/calendar`. Month grid displays hearing dot on tomorrow's date. |
| **10** | Click on tomorrow's date cell | Advocate | Cell highlights; bottom drawer displays the scheduled hearing with link to open the case file. |
| **11** | Switch to **"Cause List"** view mode | Advocate | Displays chronological list cards across all cases with court forum and time. |
| **12** | Sign out and log in as client | `ali.client@demo.legalhub.local`<br>`Client@12345` | Client dashboard loads. Sidebar displays **"Court Hearing Calendar"**. |
| **13** | Open linked case `/cases/:id` | Client | Case file loads. In **Entries** tab, only shared entries are shown. In **Hearings** tab, the hearing is visible with explanation, but the lawyer's private strategy note is completely hidden. |
| **14** | Mobile Viewport Check (375px) | Either | Month grid scales down, day cells compress gracefully, and quick outcome modal fits seamlessly without horizontal scrolling. |
