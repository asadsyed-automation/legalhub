# LegalHub Frontend Engineering Guide: FE-12 (AI Pleading Assistant & Case Diary Summarizer)

> **Final Year Project (FYP) — Emerson University Multan**  
> **Student Developers:** Syed Asad, Muhammad Aqeel, Mubashir Mehmood  
> **Module:** Frontend Phase 4 — Connected Case Management & Chamber Intelligence (FE-12: AI Pleading & Case Entry Assistant)  
> **Target Scope:** Lawyer Case Diary (`CaseEntriesTab.jsx`), Non-blocking AI Summary Box, Extractive Legal NLP Summarization, Entity Recognition, Graceful Fallback for Unconfigured/Offline Microservices, and Advocate-Client Privilege Shielding.

---

## 1. Architectural Philosophy & Pakistani Metaphor

### The Chamber Junior (*منشی یا جونیئر وکیل کی بریفنگ*)
* **The Morning Hearing Briefing (*پچھلی پیشی کی کارروائی کا خلاصہ*):** In a traditional Pakistani advocate's chamber near the District Courts or High Court benches (e.g., Multan, Lahore, Rawalpindi), when a senior advocate sits down to draft a new procedural entry in the chamber diary (*Roznamcha*), the junior associate (*Munshi* or junior advocate) quickly flips through the case file. The junior briefs the senior on what occurred on the previous hearing date:  
  *"Sir, on 25th October, the learned Sessions Court heard our bail arguments under Section 497 CrPC and summoned the Investigating Officer along with the police record (*Zimniat*)."*
* **The Choice to Adopt or Dismiss (*درج نوٹ کرنا یا نظر انداز کرنا*):** The senior advocate has full editorial control:
  1. **Adopt into draft (**"Use as note"**):** The lawyer adopts the briefing into the draft entry as their foundational starting point.
  2. **Dismiss (**"Ignore"**):** If today's hearing concerns a separate interim injunction under Order 39 CPC, the advocate waves the summary aside and drafts freely.
* **Non-Blocking Due Diligence (*وقت کا ضیاع نہ ہونا*):** If the junior associate is busy in another courtroom, the senior advocate **never halts or waits**—they immediately begin penning their diary entry by hand. In **FE-12**, the modal and all form fields render immediately ($0\text{ms}$ delay); the AI request runs asynchronously in the background. If the microservice is unavailable or warming up, the system clearly notifies the lawyer without disabling input fields or disrupting manual entry.
* **Strict Legal Ethics & Client Shielding (*مقدمات کی رازداری اور رول 135*):** Clients viewing their case timeline never see internal AI drafting tools or chamber notes. Under Pakistani professional conduct rules, confidential attorney work product is shielded from premature disclosure.

---

## 2. Complete Trace: From Lawyer Click to AI Microservice & Database Entry

**User Action:** Advocate `lawyer@demo.legalhub.local` opens a case file with existing hearings and clicks "Add Diary Entry":

```
[ Advocate UI: CaseEntriesTab.jsx ]
       │
       │ 1. Advocate clicks "Add Diary Entry" button
       │ 2. handleOpenCreateModal() executes:
       │    - Form fields (entryDate, type, title, body) initialize instantly (0ms blocking)
       │    - Modal opens immediately with editable inputs
       │    - Checks condition: isLawyer && entries.length > 0
       ▼
[ Background NLP Initiation: aiApi.summarizePreviousEntries() ]
       │
       │ 3. Asynchronously extracts text from recent hearing/order entries
       │ 4. Formats legal text payload: min 10 chars
       │ 5. Issues HTTP POST to FastAPI AI microservice:
       │    POST http://localhost:8000/api/v1/ai/summarize
       │    { text: "Learned counsel argued Section 497 CrPC...", language: "auto", max_length: 200 }
       │ 6. While awaiting response, UI displays non-blocking loading state:
       │    "AI is analyzing previous entries..." (ai-summary-pulse)
       ▼
[ Python FastAPI Microservice: ai-service/main.py ]
       │
       │ 7. CORS middleware validates origin (http://localhost:3000)
       │ 8. detect_language() determines language (English / Urdu)
       │ 9. extract_entities() identifies Pakistani legal entities:
       │    - Statutes: Section 497 CrPC, Section 302 PPC
       │    - Courts: Sessions Court Multan
       │    - Parties: Petitioner
       │ 10. generate_extractive_summary() scores sentences based on legal keyword density & position
       │ 11. Returns HTTP 200 OK:
       │     { summary, key_clauses, entities, word_count, reading_time_minutes }
       ▼
[ Frontend UI Resolution: CaseEntriesTab.jsx ]
       │
       │ 12. aiApi resolves -> setAiSummary(result.summary); setAiAvailable(true); setAiLoading(false);
       │ 13. AI Box displays above form inputs:
       │     - Title: "Last Hearing Summary (AI Generated)"
       │     - Badge: "AI generated, please verify"
       │     - Extractive summary text
       │     - Action buttons: "Use as note" & "Ignore"
       ▼
[ Advocate Decision & Submission ]
       │
       │ 14. Advocate clicks "Use as note":
       │     setFormBody(aiSummary); setAiDismissed(true);
       │ 15. Form body textarea populates with the summary text for review and editing
       │ 16. Advocate adds chamber notes and clicks "Record Entry"
       │ 17. POST /api/v1/cases/:id/entries saves the new diary entry into PostgreSQL
```

---

## 3. Practical Student Exercises

### Exercise 1: Bilingual Urdu Judicial Order Extraction
* **Objective:** Test how the AI assistant handles Urdu court orders (*عدالتی حکم نامہ*).
* **Implementation:** Create a test case entry with Urdu text:
  ```
  معزز عدالت نے درخواست ضمانت قبل از گرفتاری زیر دفعہ 498 ضابطہ فوجداری پر دلائل سنے۔ عدالت نے تفتیشی افسر کو اصل ریکارڈ اور ضمنیات سمیت طلب کرتے ہوئے آئندہ سماعت 2 نومبر مقرر کی۔
  ```
* **Task:** Verify that `aiApi` correctly communicates with the NLP engine, detects `language: "ur"`, extracts entities like `دفعہ 498 ضابطہ فوجداری`, and formats the Urdu summary with proper right-to-left punctuation (`۔`).

### Exercise 2: Simulated AI Service Outage & Graceful Degradation
* **Objective:** Verify that the frontend never crashes when the AI microservice is stopped.
* **Task:** Stop the Python microservice on port 8000 and click "Add Diary Entry" on a case with existing entries.
* **Observation:** Confirm that:
  1. The entry modal opens immediately without hanging.
  2. The loading indicator displays for a brief moment until the request catches the network error.
  3. The card displays: *"AI summary is not available right now. Enter the entry manually."*
  4. Clicking "Dismiss" hides the notification, and the manual form remains $100\%$ operational.

### Exercise 3: Anti-Tampering & Editorial Verification
* **Objective:** Verify why AI output should never be saved directly into a judicial record without human review.
* **Task:** Observe that when "Use as note" is clicked, the text is inserted into the editable `formBody` textarea rather than automatically submitting the entry. The advocate must review, adjust, and explicitly click "Record Entry" to submit.

---

## 4. Viva Voce Examination Questions & Answers

### Q1: Why is the AI summarization implemented as a non-blocking asynchronous call rather than blocking the modal display?
**Answer:**  
In human-computer interaction for legal workflows, user agency and responsiveness are paramount. If the modal waited for the AI microservice response before rendering, any network latency (e.g. NLP model inference delay or a cold start) would cause an unresponsive UI. By decoupling the modal opening from the AI request, the advocate can begin typing immediately. The AI briefing appears as an optional assistance card above the form.

### Q2: What happens if an advocate opens the "Add Diary Entry" modal for a brand-new case that has no previous entries?
**Answer:**  
The component evaluates the guard condition:
```javascript
if (isLawyer && entries.length > 0)
```
If `entries.length === 0`, no AI API request is made, and no AI card or loading skeleton is displayed. It is logically impossible to summarize previous hearings if no previous hearings exist.

### Q3: Why is the AI assistant completely hidden when an advocate edits an existing entry?
**Answer:**  
When an advocate clicks "Edit" on an existing entry (`editingEntry !== null`), they are modifying a specific historical record. Introducing a summary of other previous hearings into an edit dialog would cause cognitive confusion and risk accidental data overwrites. AI prefetching is strictly scoped to drafting *new* entries.

### Q4: How does the system protect confidential case records from leaking to unapproved third parties during AI processing?
**Answer:**  
1. **Chamber Isolation:** The frontend checks `isLawyer` before initiating or rendering the component. Clients never see or trigger the briefing assistant.
2. **Local Microservice Architecture:** The AI NLP service runs locally on the application infrastructure (`localhost:8000`) within the legal institution's technical perimeter. No case text or client credentials are ever transmitted to commercial third-party cloud APIs.
3. **Statute & Privilege Protection:** Privileged communications remain within the local chamber boundary.

### Q5: What is the purpose of the label "AI generated, please verify"?
**Answer:**  
Under professional ethics and judicial standards, an advocate is solely responsible for all pleadings, notices, and procedural records submitted to court. Large language models and NLP algorithms can omit key facts or misattribute dates. The prominent disclaimer reinforces that the summary is merely an automated draft aid, ensuring the human advocate verifies all details before committing the entry to the case history.

---

## 5. Numbered Manual Test Script

### Prerequisites
* Express backend running on `http://localhost:4000`
* FastAPI AI service running on `http://127.0.0.1:8000`
* Vite frontend running on `http://localhost:3000`

---

#### Test Step 1: Client Verification (Clients Never See AI Assistant)
* **URL:** `http://localhost:3000/login`
* **Credentials:** `client@demo.legalhub.local` / `DemoPassword123!`
* **Action:** Navigate to a shared case file and view the Diary Entries tab.
* **Expected Result:** 
  1. The client can view shared entries.
  2. The "Add Diary Entry" button is not visible.
  3. No AI analysis requests are sent over the network.

#### Test Step 2: New Entry on Case with Previous Hearings (AI Analysis Flow)
* **URL:** `http://localhost:3000/login`
* **Credentials:** `lawyer@demo.legalhub.local` / `DemoPassword123!`
* **Action:**
  1. Navigate to `/cases` and open an active case file that contains previous hearing entries.
  2. Click the **"Add Diary Entry"** button.
* **Observation:**
  1. The modal opens instantaneously; input fields for Date, Title, and Content are immediately editable.
  2. An AI box appears above the form fields displaying:  
     `"AI is analyzing previous entries..."` with a subtle pulse animation.
  3. Within 1–2 seconds, the box resolves into the summary view:
     * Header: **"Last Hearing Summary (AI Generated)"**
     * Verification Badge: *"AI generated, please verify"*
     * Action Buttons: **"Use as note"** and **"Ignore"**

#### Test Step 3: Adopting the AI Summary into the Draft
* **Action:** Click **"Use as note"**.
* **Expected Result:**
  1. The summary text is immediately copied into the "Content / Notes" textarea.
  2. The AI box closes smoothly.
  3. The character counter reflects the inserted characters (e.g., `184 / 5000 characters`).
  4. The advocate can edit, add chamber thoughts, and click **"Record Entry"** to save.

#### Test Step 4: Dismissing the AI Summary
* **Action:** Click "Add Diary Entry" again. When the summary appears, click **"Ignore"** (or the close `x` icon).
* **Expected Result:** The AI box is dismissed. The textarea remains clean without any text inserted.

#### Test Step 5: Handling Unconfigured or Offline AI Service
* **Action:** In a terminal, temporarily stop the FastAPI service on port 8000, then click "Add Diary Entry".
* **Expected Result:** 
  1. The modal opens immediately without freezing.
  2. The AI box gracefully displays:  
     `"AI summary is not available right now. Enter the entry manually."`
  3. Clicking "Dismiss" removes the notice. The form remains fully functional.
