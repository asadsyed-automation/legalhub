# LegalHub Frontend Engineering Guide: FE-8 (Client Portal & 4-Way Unified Chronological Timeline)

> **Final Year Project (FYP) — Emerson University Multan**  
> **Student Developers:** Syed Asad, Muhammad Aqeel, Mubashir Mehmood  
> **Module:** Frontend Phase 3 — Connected Case Journey (FE-8: 4-Way Unified Case Timeline)  
> **Target Scope:** 4-Way Event Stream Merging (Diary Entries, Court Hearings, Document Vault, Procedural Status Shifts), Vertical Connecting Spine, Role-Based Privilege Shield (Section 126 QSO 1984), and Mobile Streamlined Litigant Experience

---

## 1. Architectural Philosophy & Pakistani Court Metaphor

### The Court Reader's Master File (*Dasti Misal / Nazam-e-Mooqadama*)
* **The Fragmented Court Journey:** In Pakistani civil and criminal litigation (such as suits for declaration, specific performance, or bail applications), legal milestones occur across fragmented judicial channels. An advocate submits a petition (*Arzi Daawa*), the judge pronounces an interim order (*Hukam-e-Imtinaai*), the courtroom clerk (*Ahlmad*) fixes the next hearing date, and the chamber clerk uploads a certified copy of the revenue mutation.
* **The Chamber Master Dossier (*Dasti Misal*):** To reconstruct the true narrative arc of a case, an advocate or judge does not search five separate notebooks; they inspect the *Dasti Misal* (the master case file maintained chronologically). Every notice served, order passed, and evidence admitted is filed in strict sequence of occurrence.
* **The Plain-Language Litigant Window:** Ordinary Pakistani litigants are often excluded from this process due to complex procedural legalese. Litigants frequently call their advocate in distress asking: *"Wazeer Sahab, meri peshi pe kya hua?"* (What happened in court today?). 
* **The Unified 4-Way Chronological Timeline (FE-8):** Synthesizes four distinct database tables into a single vertical chronological narrative:
  1. **Diary Entries (`entry`):** Pleading filings, chamber conferences, and research memos.
  2. **Court Hearings (`hearing`):** Bench orders, judge remarks, and next hearing dates (*Tareekh Peshi*).
  3. **Document Vault (`document`):** Certified orders (*Naqal*), affidavits, and registered deeds.
  4. **Procedural Shifts (`status_change`):** Formal court stage transitions (e.g., from `Preliminary Hearings` to `Evidence`).
* **The Statutory Privilege Barrier (Section 126, QSO 1984):** While advocates require complete visibility into private strategy notes and confidential memos, litigants must never be exposed to internal chamber deliberations. The backend timeline service enforces role-based query projections at the database level—stripping private notes and non-shared entries before bytes are transmitted to the client.

---

## 2. Complete Trace: From User Click to Database & Screen Update

**User Action:** Advocate opens the **Timeline** tab of a contested partition suit:
* **Case ID:** Active case file UUID
* **Active Filter:** `All Events` (or switched to `Hearings`)

```
[ User UI: CaseDetail.jsx -> CaseTimelineTab.jsx ]
       |
       | 1. User switches to "Timeline" tab
       | 2. CaseTimelineTab mounts -> fetchTimeline()
       v
[ Frontend API: caseApi.getTimeline(caseId, { page: 1, limit: 25 }) ]
       |
       | 3. Axios issues GET /api/v1/cases/:id/timeline?page=1&limit=25 with Bearer JWT
       v
[ Backend Route: case.routes.js ]
       |
       | 4. verifyToken -> validate(timelineQuerySchema, 'query')
       v
[ Controller Layer: timeline.controller.js ]
       |
       | 5. timelineController.getCaseTimeline(req, res, next)
       v
[ Service Layer: timeline.service.js ]
       |
       | 6. Finds Case record by PK (Verifies advocate ownership or client linkage)
       | 7. Determines Role: isClient = (req.user.role === 'client')
       |    sharedFilter = isClient ? { visibility: 'shared' } : {}
       |
       | 8. Executes 4 Parallel Database Queries (Promise.all):
       |    - CaseEntry.findAll({ where: { caseId, ...sharedFilter } })
       |    - Hearing.findAll({ where: { caseId, ...sharedFilter } })
       |    - Document.findAll({ where: { caseId, ...sharedFilter } })
       |    - CaseStatusEvent.findAll({ where: { caseId } })  [Always shared]
       |
       | 9. Normalizes 4 streams into uniform objects:
       |    { kind, date, title, summary, visibility, refId, ...metadata }
       |    * CRITICAL: If isClient is true, strictly omits hearing.note!
       |
       | 10. Merges all streams into single array
       | 11. Sorts chronologically: newest date first (b.date - a.date)
       | 12. Paginates slice (offset, limit) and computes totalPages
       v
[ PostgreSQL Database (Supabase) ]
       |
       | 13. Returns queried records across all 4 tables
       v
[ Backend Response ]
       |
       | 14. Returns 200 OK: { items: [...], total: 18, page: 1, limit: 25, totalPages: 1 }
       v
[ Frontend State Update: CaseTimelineTab.jsx ]
       |
       | 15. setItems(data.items), setTotalCount(data.total)
       v
[ Dynamic Re-render: CaseTimelineTab.jsx ]
       |
       | 16. Vertical spine (.timeline-stream::before) renders with node markers:
       |     - Amber Calendar nodes for Court Hearings (with Bench Outcome pills)
       |     - Blue Document nodes for Diary Entries (with Shared/Private pills)
       |     - Green Vault nodes for Document Uploads (with file format)
       |     - Purple Court nodes for Status & Stage Transitions
```

---

## 3. Student Hands-On Exercises

### Exercise 1: 4-Way Stream Synthesis Verification
**Objective:** Verify that disparate events appear in strict chronological order on the master timeline.
1. Log in as advocate `sikandar.adv@demo.legalhub.local` and open an active case (`/cases/:id`).
2. Add a new Diary Entry in the **"Entries"** tab (e.g., *"Interviewed revenue patwari regarding khasra numbers"*).
3. Record a Quick Outcome in the **"Hearings"** tab (e.g., *"Adjourned for framing of issues"*).
4. Upload a document in the **"Documents"** tab (e.g., `Certified_Khasra_Girdawari.pdf`).
5. Transition case stage in the **"Overview"** tab (e.g., change stage to `Issues`).
6. Click the **"Timeline"** tab.
7. **Expected Observation:** All four distinct events appear along the vertical connecting spine in exact chronological order, each marked with its distinctive node icon and color-coded kind badge.

### Exercise 2: Privilege Shield & Plain-Language Client Isolation
**Objective:** Confirm that confidential attorney notes are barred from the litigant's timeline.
1. As advocate, schedule a court hearing with:
   - **Explanation for Client:** *"Court will decide our stay application today."*
   - **Private Strategy Note:** *"Judge is skeptical of our delay in filing. Be prepared with 2021 SCMR precedent on limitation."*
2. Check the **Timeline** tab as advocate: notice the item summary contains both the explanation and the private strategy note marked with a red `Private (Chamber)` pill.
3. Sign out and sign in as client `ali.client@demo.legalhub.local`.
4. Open the linked case file (`/cases/:id`) and switch to the **"Timeline"** tab.
5. **Expected Observation:** The hearing event displays the title and client explanation. The private limitation strategy note is completely absent from the card, the DOM, and the network JSON payload.

### Exercise 3: Category Filtering & Zero State Verification
**Objective:** Verify fast category isolation across case events.
1. In the **Timeline** tab, click the **"Court Hearings"** filter pill.
2. Verify that only hearing cards remain visible along the spine, with the count indicator showing the exact number of hearings.
3. Click the **"Case Documents"** filter pill. Verify only upload events are displayed.
4. Click **"All Events"** to restore the complete master journey.

---

## 4. Final Year Project Viva Voce Defense Q&As

### Q1: Why did you implement a 4-way unified timeline instead of keeping entries, hearings, and documents in separate tabs only?
**Answer:**  
In active legal practice, cases span months or years, creating a severe cognitive fragmentation problem for both lawyers and litigants. Having to flip back and forth between entries, hearings, documents, and status history obscures the cause-and-effect relationship between events (e.g., an evidence document was uploaded *because* of a specific hearing order). The unified chronological timeline aggregates all milestones along a single vertical spine, providing an instant birds-eye view of the entire case journey.

### Q2: How does the backend prevent performance degradation when merging four separate database tables?
**Answer:**  
Instead of performing costly SQL `UNION` operations across disparate table schemas or querying in serial loops, `timeline.service.js` issues four lightweight queries in parallel using `Promise.all`. Each table query filters strictly by indexed foreign key (`caseId`). The normalization, merging, and sorting happen in server memory across bounded record sets, and the output is paginated (`limit: 25`).

### Q3: Why are case status transitions (`CaseStatusEvent`) always marked as `shared` in the timeline?
**Answer:**  
Procedural status and stage transitions (e.g., shifting from `Preliminary Hearings` to `Evidence` or `Final Arguments`) are public judicial proceedings recorded in the court's official order sheet (*Zimni*). A client has a fundamental right to know what procedural stage their litigation has reached. Hiding procedural stages would violate transparency and provide no privilege advantage.

### Q4: How is client privilege enforced under Section 126 of the Qanun-e-Shahadat Order 1984?
**Answer:**  
Section 126 of QSO 1984 bars advocates from disclosing private professional communications and work product. In our timeline architecture, when `req.user.role === 'client'`, the database query automatically applies `{ visibility: 'shared' }` to entries, hearings, and documents. Furthermore, the hearing normalizer explicitly suppresses the `note` attribute, ensuring that internal legal strategy is never exposed across the network.

### Q5: How does the vertical spine design adapt to mobile viewports (375px)?
**Answer:**  
On mobile screens, horizontal space is at a premium. The CSS reduces the left indent from 28px to 22px, compresses the node circle diameter from 28px to 22px, and allows badges and timestamps in `.timeline-item__header` to flex vertically (`flex-direction: column`). The vertical spine (`::before`) maintains uninterrupted continuity down the left margin, ensuring smooth touch scrolling without horizontal clipping.

---

## 5. Numbered Manual Test Script

| Step | Action | User Session | Expected Result |
| :---: | :--- | :--- | :--- |
| **1** | Log in as advocate | `sikandar.adv@demo.legalhub.local`<br>`Advocate@12345` | Redirects to `/dashboard`. Navigate to `/cases` and open an active case file. |
| **2** | Switch to **"Timeline"** tab | Advocate | Timeline tab renders. Filter pills appear at top (`All Events`, `Diary Entries`, `Court Hearings`, `Case Documents`, `Status Changes`). |
| **3** | Inspect Chronological Stream | Advocate | Vertical spine renders with color-coded nodes: Blue (Diary), Amber (Hearing), Green (Document), Purple (Status). Items are ordered newest first. |
| **4** | Inspect Event Badges | Advocate | Each item displays its kind badge, timestamp, title, summary, and visibility pill (`Private (Chamber)` or `Shared with Client`). |
| **5** | Filter by Event Kind | Advocate | Click **"Court Hearings"**. Stream instantly updates to display only court hearings with their bench outcomes. Count badge reflects number of hearings. |
| **6** | Filter by Documents | Advocate | Click **"Case Documents"**. Only document upload events appear with original filename and MIME type. |
| **7** | Reset Filter | Advocate | Click **"All Events"**. Complete master journey restores. |
| **8** | Sign out and log in as client | `ali.client@demo.legalhub.local`<br>`Client@12345` | Client dashboard loads. Navigate to linked case `/cases/:id`. |
| **9** | Inspect Timeline as Client | Client | Switch to **"Timeline"** tab. All shared hearings, documents, and status shifts are visible. Confidential chamber notes and private diary entries are **completely absent**. |
| **10** | Mobile Viewport Check (375px) | Either | In mobile view, spine aligns neatly to the left, cards compress gracefully, and pagination buttons remain fully accessible. |
