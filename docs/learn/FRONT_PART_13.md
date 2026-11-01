# LegalHub Frontend Engineering Guide: FE-13 (Brand Configuration & Institutional Public Pages)

> **Final Year Project (FYP) — Emerson University Multan**  
> **Student Developers:** Syed Asad, Muhammad Aqeel, Mubashir Mehmood  
> **Module:** Frontend Phase 4 — Institutional Presentation & Public Transparency (FE-13: Brand Configuration, Honest Homepage, Practice-Area/City Picker, 3-Step Workflow, Terms of Service, Privacy Policy, Regulatory Disclaimer, Refund Policy, and Academic Contact)  
> **Target Scope:** Centralized `brand.js`, Direct Route Filtering from Homepage, Legal Ethics Compliance (Rule 135), Sandbox Disclosures, and 100% Navigation Integrity.

---

## 1. Architectural Philosophy & Pakistani Metaphor

### The District Bar Association Public Charter (*ڈسٹرکٹ بار ایسوسی ایشن کا سرکاری بورڈ*)
* **The Sober Regulatory Board (*کچہری کا نوٹس بورڈ*):** In Pakistan's judicial ecosystem (such as at the Multan District Courts or Lahore High Court), the Bar Association maintains a formal public notice board outside the Bar Library. That notice board never displays commercial advertisements, exaggerated promotional superlatives (*"Multan's #1 Criminal Lawyer"*), or fabricated client reviews. Under Rule 135 of the Legal Practitioners and Bar Councils Rules 1976, commercial solicitation is an act of professional misconduct. Instead, the board displays a sober directory of enrolled advocates, their stations, and the formal terms under which chamber consultations are held.
* **The Honest Technical Foundation (*حقائق پر مبنی معلومات*):** In **FE-13**, LegalHub mirrors this institutional dignity:
  1. **Zero Hyperbole:** The platform rejects all fake statistics (no *"10,000+ satisfied clients"*) and synthetic testimonials.
  2. **Admin-Reviewed Standing:** Practitioner credentials are labeled as *"Admin-Reviewed"* or *"Credentials Reviewed"* based on submitted enrolment documents—never claiming a statutory endorsement from any Bar Council.
  3. **Simulated Sandbox Disclosures:** All payments operate in an academic demonstration sandbox without real financial deductions or real fiat transfers.
  4. **Dynamic Environment Configuration:** Brand names and contact emails are managed in `src/config/brand.js` and derive dynamically from `VITE_CONTACT_EMAIL`, automatically hiding email links if unconfigured.

---

## 2. Complete Trace: From Homepage Search Click to Filtered Directory

**User Action:** A citizen lands on the homepage, selects **"Family"** law and **"Multan"**, and clicks **"Search Advocates"**:

```
[ Homepage Hero Form: Home.jsx ]
       │
       │ 1. User selects "Family Law" from #hero-practice-area dropdown
       │ 2. User selects "Multan" from #hero-city dropdown
       │ 3. User clicks "Search Advocates" button
       │ 4. handleSearchSubmit(e) executes:
       │    const params = new URLSearchParams();
       │    params.set('practiceArea', 'Family');
       │    params.set('city', 'Multan');
       │    navigate('/lawyers?' + params.toString());
       ▼
[ React Router: App.jsx ]
       │
       │ 5. Intercepts route transition to /lawyers?practiceArea=Family&city=Multan
       │ 6. Mounts LawyersList.jsx component
       ▼
[ Public Directory View: LawyersList.jsx ]
       │
       │ 7. useSearchParams() hook reads:
       │    practiceArea = "Family"
       │    city = "Multan"
       │ 8. Automatically pre-populates the directory filter dropdowns
       │ 9. Triggers directoryApi.getLawyers({ practiceArea: 'Family', city: 'Multan', page: 1, limit: 12 })
       ▼
[ Backend API: GET /api/v1/lawyers ]
       │
       │ 10. Express backend queries PostgreSQL:
       │     SELECT * FROM users u
       │     JOIN lawyer_applications a ON u.id = a.user_id
       │     WHERE a.status = 'approved'
       │       AND a.city ILIKE '%Multan%'
       │       AND 'Family' = ANY(a.practice_areas);
       │ 11. Returns HTTP 200 OK:
       │     { success: true, data: { items: [...], total, totalPages } }
       ▼
[ UI Render: LawyersList.jsx ]
       │
       │ 12. Displays verified cards of enrolled advocates practicing Family Law in Multan
       │ 13. Displays "Admin-Reviewed Advocate" status badge on each result
       │ 14. Citizen can view consultation rates and click "Book Consultation"
```

---

## 3. Practical Student Exercises

### Exercise 1: Dynamic Contact Email Suppression
* **Objective:** Verify that the platform handles unconfigured contact emails securely.
* **Task:**
  1. Inspect `frontend/src/config/brand.js`:
     ```javascript
     export const CONTACT_EMAIL = import.meta.env.VITE_CONTACT_EMAIL || null;
     ```
  2. Navigate to `/contact` when `VITE_CONTACT_EMAIL` is not set in `.env`.
  3. Confirm that the page cleanly hides the email link without rendering `mailto:null` or `mailto:undefined`. The academic inquiry form remains fully available.

### Exercise 2: Declarative Route Verification Across the Footer
* **Objective:** Validate that the application adheres to $100\%$ navigation integrity with zero dead links.
* **Task:**
  1. Open the browser console and navigate to `/`.
  2. Click each link in the `<Footer />`:
     * Platform: `/`, `/lawyers`, `/register?role=lawyer`, `/login`
     * Institutional: `/terms`, `/privacy`, `/disclaimer`, `/refund-policy`, `/contact`
  3. Verify that every single route renders its dedicated component without triggering the `NotFound` fallback.

### Exercise 3: Regulatory Verification under Rule 135
* **Objective:** Test compliance with Bar Council anti-solicitation rules.
* **Task:**
  1. Verify that the homepage, public directory, and lawyer profiles contain **zero** instances of:
     * Promotional terms: *"Best"*, *"Top"*, *"Featured"*, or *"Premier"*.
     * Commercial priority rankings or paid sponsored sorting.
  2. Verify that the advocate credential badge displays *"Admin-Reviewed"* rather than claiming an official statutory Bar Council endorsement.

---

## 4. Viva Voce Examination Questions & Answers

### Q1: Why does LegalHub explicitly describe payments as "simulated sandbox transactions" across its legal documents?
**Answer:**  
In software engineering and academic project development, transparency and consumer protection are critical. Operating simulated checkout flows (mock EasyPaisa, JazzCash, and Cards) without a disclaimer would mislead external evaluators or users into believing that real banking debits and fiat settlements occur. Stating that transactions are sandbox simulations satisfies academic honesty while demonstrating complete full-stack transactional mechanics (invoicing, ledger accounting, and cancellation refunds).

### Q2: What is the significance of Rule 135 of the Legal Practitioners and Bar Councils Rules 1976 for this project?
**Answer:**  
Under Rule 135, Pakistani advocates are legally prohibited from advertising or soliciting clients. A commercial legal portal that promotes "Top Lawyers" or allows paid sponsored listings would violate statutory legal ethics and expose participating advocates to disciplinary proceedings. LegalHub operates as a strictly neutral directory where sorting is objective (practice area, station, availability) and all enrolled advocates receive equal, non-commercial listing treatment.

### Q3: Why is advocate verification described as "Admin-Reviewed" rather than "Bar Council Verified"?
**Answer:**  
LegalHub is an independent software application developed as a Final Year Project at Emerson University Multan. It does not possess statutory authority from the Pakistan Bar Council or any Provincial Bar Council to officially verify or license legal practitioners. Describing credentials as "Admin-Reviewed" accurately reflects the true operational process: platform staff examine uploaded enrolment cards and CNICs for platform admission sanity, without claiming an official statutory guarantee.

### Q4: How does the practice-area and city picker on the homepage improve citizen usability?
**Answer:**  
Citizens seeking legal assistance usually require a specialist in their immediate geographic jurisdiction (e.g., a Family lawyer in Multan or a Corporate lawyer in Lahore). The picker extracts URL search parameters (`?practiceArea=...&city=...`) and routes them directly to `LawyersList.jsx`, pre-populating filters and reducing search latency to a single click.

### Q5: How does the application maintain responsive layout on mobile screens down to 375px?
**Answer:**  
All legal and public pages leverage CSS variables from `tokens.css` with responsive media queries (`@media (max-width: 640px)` and `@media (max-width: 768px)`). Multi-column grids (such as the contact grid, hero search form, and footer links) automatically wrap into single-column layouts, ensuring readable typography, comfortable line lengths ($1.65$ line height), and full-width touch targets on small mobile viewports.

---

## 5. Numbered Manual Test Script

### Prerequisites
* Vite frontend running on `http://localhost:3000`
* Express backend running on `http://localhost:4000`

---

#### Test Step 1: Homepage Practice Area & City Picker
* **URL:** `http://localhost:3000/`
* **Action:**
  1. In the hero search form, select **"Criminal"** from the Practice Area dropdown.
  2. Select **"Multan"** from the City dropdown.
  3. Click **"Search Advocates"**.
* **Expected Result:**
  1. The browser navigates to `http://localhost:3000/lawyers?practiceArea=Criminal&city=Multan`.
  2. The directory page loads with the Criminal practice area and Multan city filters automatically active.

#### Test Step 2: Three-Step Guide & For Lawyers Call to Action
* **URL:** `http://localhost:3000/`
* **Observation:**
  1. The 3 steps render clearly: *"1. Find an Advocate"*, *"2. Request a Consultation"*, and *"3. Follow Your Case"*.
  2. The "For Legal Practitioners" section renders with an honest invitation: *"Are you an Advocate practicing in Pakistan?"*.
  3. Clicking **"Apply for Chamber Enrollment"** routes directly to `/register?role=lawyer`.
  4. The page contains zero fake statistics and zero synthetic testimonials.

#### Test Step 3: Terms of Service & Sandbox Notice
* **URL:** `http://localhost:3000/terms`
* **Expected Result:**
  1. The page renders with header *"Terms of Service"* and badge *"Academic FYP Edition"*.
  2. Displays *"Last updated: October 2026"*.
  3. Renders the prominent Sandbox Notice alert box explaining simulated transactions.
  4. Explains the scope of "Admin-Reviewed" advocate credentials and informational AI summaries.

#### Test Step 4: Privacy Policy & Confidentiality Shielding
* **URL:** `http://localhost:3000/privacy`
* **Expected Result:**
  1. Renders data collection transparency (authentication, advocate credentials, booking notes).
  2. Explains chamber strategy isolation and role-based access restrictions.
  3. Affirms zero commercial data selling.

#### Test Step 5: Regulatory Disclaimer & Bar Council Rule 135
* **URL:** `http://localhost:3000/disclaimer`
* **Expected Result:**
  1. Renders the warning alert citing Rule 135 of the Legal Practitioners and Bar Councils Rules 1976.
  2. Discloses that {APP_NAME} is not a law firm.
  3. Clarifies that AI document and pleading summaries are informational drafting aids requiring human review.

#### Test Step 6: Refund Policy & Simulated Financial Ledger
* **URL:** `http://localhost:3000/refund-policy`
* **Expected Result:**
  1. Outlines simulated sandbox payments, slot releases upon appointment cancellation, and administrative refund workflows.

#### Test Step 7: Academic Contact Page & Dynamic Email Check
* **URL:** `http://localhost:3000/contact`
* **Expected Result:**
  1. Displays project attribution for Emerson University Multan and student developers (Syed Asad, Muhammad Aqeel, Mubashir Mehmood).
  2. If `VITE_CONTACT_EMAIL` is not set, cleanly omits the email address.
  3. Submitting the academic message form displays confirmation: *"Thank you! Your message has been recorded."*

#### Test Step 8: Global Footer Link Integrity
* **URL:** `http://localhost:3000/`
* **Action:** Click every link in the footer.
* **Expected Result:** All 9 links navigate to their real active pages with 0 broken routes ($404\text{s}$).
