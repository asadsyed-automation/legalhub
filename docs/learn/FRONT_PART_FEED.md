# LegalHub Pakistan — Learning Module: Community Legal Q&A Feed & Institutional Pages

> **Academic Attribution:** Emerson University Multan — Final Year Project (FYP)  
> **Developers:** BS Computer Science (Final Year) — Syed Asad, Muhammad Aqeel, Mubashir Mehmood  
> **Module File:** `docs/learn/FRONT_PART_FEED.md`

---

## 1. Simple English Explanation & Pakistani Real-Life Analogy

### Real-Life Analogy: The District Katchery Free Legal Aid Camp (وکلاء کیمپ برائے رہنمائی سائلین)
Imagine entering the bustling courtyard of the **District & Sessions Courts in Multan (کچہری ملتان)**. 

Outside the courtrooms, near the Bar Association Library, there is a dedicated **Pro Bono Legal Guidance Desk**. A citizen who has traveled from a village in Shujabad or Lodhran approaches the desk. They have an urgent problem: their grandfather passed away, and they don't know the first step to get an inheritance mutation (انتقالِ وراثت) recorded without getting exploited by agents.

At the desk, licensed advocates (وکلاء) are seated. They do not advertise with glowing billboards or claim to be the "best lawyer in Asia" (which is strictly prohibited under **Rule 135 of the Legal Practitioners and Bar Councils Rules 1976**). Instead, they listen to the citizen's factual grievance and write down a preliminary statutory opinion:
> *"Under Section 42 of the Land Revenue Act 1967, you do not need to pay any private agent. Go to the Arazi Record Center (PLRA) with your family tree (Shajra Nasab) and death certificate to initiate the succession mutation."*

Along with this preliminary advice, the advocate hands the citizen their official chamber visiting card indicating their Bar Council enrollment, high court standing, and chamber location. If the citizen is impressed by the lawyer's professional knowledge, clarity, and competence, they walk over to the lawyer's chamber and officially engage them for full representation.

### How LegalHub Replicates This in Software:
1. **The Citizen's Query (`POST /feed`):** A client posts an enquiry with practice area and city. To preserve dignity and privacy, their name is masked (e.g. `Muhammad A. (Citizen)`).
2. **The Public Notice Board (`GET /feed`):** Anyone across Pakistan can browse previous questions, learn their rights, and see how the law applies.
3. **The Verified Opinion (`POST /feed/:id/answers`):** Only **Admin-Reviewed** advocates can post opinions.
4. **The Verified Chamber Card (Direct Hire CTA):** Beside each advocate's response, an authentic chamber card displays their Court level, Bar Council, and two clear buttons:
   - **"Consult Advocate"** $\rightarrow$ Immediately opens the booking scheduler (`/book/:lawyerId`).
   - **"View Profile"** $\rightarrow$ Opens their detailed chamber profile (`/lawyers/:lawyerId`).
5. **Resolution (`PATCH /feed/:id/close`):** Once satisfied, the citizen closes the enquiry.

---

## 2. Technical Definitions & Architecture

1. **Preliminary Legal Guidance (Pro Bono Advisory):**  
   Informational guidance that explains statutory procedures without creating a formal advocate-client retainer or fiduciary contract.
2. **Rule 135 Compliance (Canons of Professional Conduct):**  
   Prohibits touting, commercial advertising, and paid priority placement. Advocates gain visibility purely through substantive knowledge and verified peer standing.
3. **Client Privacy Masking:**  
   Algorithmic transformation of a user's full name (e.g. `Muhammad Aqeel` $\rightarrow$ `Muhammad A. (Citizen)`) ensuring citizens can discuss sensitive family, property, or civil disputes publicly without fear of social exposure or retaliation.
4. **Denormalized Counter (`answersCount`):**  
   An integer counter on `community_questions` atomically incremented on new answers to avoid expensive table joins during high-traffic feed queries.

---

## 3. End-to-End Execution Trace

```
Citizen (Browser)         Frontend (React)          Backend (Express)          Database (PostgreSQL)
       │                         │                          │                           │
       ├─ Submits Query ────────>│                          │                           │
       │                         ├─ POST /api/v1/feed ─────>│                           │
       │                         │                          ├─ Validates Zod Schema ────┤
       │                         │                          ├─ Inserts question ───────>│
       │                         │<── 201 Created ──────────┤                           │
       │                         │                          │                           │
Advocate (Chamber)               │                          │                           │
       ├─ Browses Feed ─────────>│                          │                           │
       │                         ├─ GET /api/v1/feed/:id ──>│                           │
       │                         │                          ├─ Masks client name ───────┤
       │                         │<── 200 OK + Question ────┤                           │
       ├─ Submits Opinion ──────>│                          │                           │
       │                         ├─ POST .../answers ──────>│                           │
       │                         │                          ├─ Verifies APPROVED status ┤
       │                         │                          ├─ Increments answersCount ─>│
       │                         │<── 201 Created ──────────┤                           │
       │                         │                          │                           │
Citizen (Browser)                │                          │                           │
       ├─ Reads Opinion ────────>│                          │                           │
       ├─ Clicks "Consult" ─────>│ Route: /book/:lawyerId   │                           │
       │                         ├─ Opens slot booking ─────┴───────────────────────────┤
```

---

## 4. Student Practice Exercises

1. **Exercise 1 (Backend Query Extension):**  
   Modify `backend/src/modules/feed/feed.service.js` to add an optional sort parameter `sort=most_discussed` that orders questions by `answersCount DESC`.
2. **Exercise 2 (Frontend Visual Indicator):**  
   In `frontend/src/pages/Feed.jsx`, add a visual tag `"Answered by High Court Advocate"` on question cards where at least one response comes from an advocate with `courtLevel === 'Advocate High Court'`.
3. **Exercise 3 (Client Notification):**  
   Using the existing Notification service, dispatch an in-app alert to the question's client owner whenever an advocate posts an answer on their query.

---

## 5. FYP Defense Viva Questions & Model Answers

### Q1: Why is client identity masked on the community feed, and how is it implemented?
**Model Answer:**  
*"In Pakistani society, legal disputes involving family khula, inheritance, or property boundaries carry social stigma. Under privacy design principles, we implement algorithmic masking on the backend service (`maskClientName`), truncating surnames (e.g. 'Muhammad A. (Citizen)'). The database maintains the foreign key relation to the user for auditability, but the public API never exposes full citizen identities."*

### Q2: How does the feed comply with Rule 135 of the Pakistan Bar Council Rules 1976?
**Model Answer:**  
*"Rule 135 prohibits commercial advertising, solicitation, and paid ranking. LegalHub allows advocates to contribute only factual, pro bono legal guidance. There is zero paid priority sorting, no 'Top Lawyer' badges, and answers are ordered strictly chronologically. Advocates demonstrate competence through quality of counsel, not commercial advertisement."*

### Q3: Why does `POST /feed/:id/answers` verify the lawyer's application status on the database rather than relying on the JWT role?
**Model Answer:**  
*"A user may register with `role: 'lawyer'`, but their credentials have not yet been vetted by an administrator. To ensure public citizens only receive guidance from genuine practitioners, the service queries `LawyerApplication` where `status === 'APPROVED'`. Any unverified or rejected lawyer receives a `403 Forbidden` error."*

### Q4: How is mobile responsiveness handled across both feed and institutional pages down to 375px?
**Model Answer:**  
*"We implemented a mobile-first responsive strategy with CSS media queries at 768px and 480px. On mobile, desktop horizontal toolbars flex-wrap into vertical stacks, search inputs expand to 100% width, navigation switches to an off-canvas drawer with touch backdrop, and the advocate chamber card stacks action buttons to ensure touch target accessibility ($\ge 44$px)."*

### Q5: What database indexing strategy was used for the community feed tables?
**Model Answer:**  
*"We added multi-column compound indexes on `(practiceArea, status, createdAt DESC)` and `(city, status, createdAt DESC)` on `community_questions`, as well as a foreign key index on `questionId` in `community_answers`. This prevents full table scans when filtering public queries across Pakistan's major jurisdictions."*

