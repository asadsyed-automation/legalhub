# LegalHub Frontend Engineering Guide: FE-7 (Case Fee Agreements, Installments & Chamber Ledger)

> **Final Year Project (FYP) — Emerson University Multan**  
> **Student Developers:** Syed Asad, Muhammad Aqeel, Mubashir Mehmood  
> **Module:** Frontend Phase 3 — Connected Case Journey (FE-7: Fee Agreements & Payment Ledger)  
> **Target Scope:** Retainer Fee Structure Editor, Real-Time Balance Cards (Agreed, Paid, Due), Multi-Rail Installment Recording (Cash, Bank, JazzCash, Easypaisa, Cheque), Chronological Receipts Ledger Table, and Client Read-Only Financial Protection

---

## 1. Architectural Philosophy & Pakistani Court Metaphor

### The Legal Retainer (*Wakalaat-nama & Mehnataana*) and Chamber Installment Book (*Khaata*)
* **The Power of Attorney & Retainer Agreement (*Wakalaat-nama & Mehnataana*):** In Pakistani jurisprudence and chamber practice, an advocate's engagement begins with the execution of a *Wakalaat-nama*. Along with this document, the advocate and client negotiate the professional fee (*Mehnataana*). Under standard practice, legal fees take three distinct forms:
  1. **Fixed Lump-Sum (*Mukaata / Yak-Musht*):** A single agreed retainer covering the case from institution to final decree.
  2. **Per Court Appearance (*Fee-Peshi*):** A dynamic arrangement where a fixed sum is payable on each courtroom appearance or substantive hearing.
  3. **Stage-Wise (*Marhala-Waar*):** Retainer tied to key civil/criminal milestones (e.g., institution/filing, framing of issues, recording of evidence, and final arguments).
* **The Chamber Installment Book (*Khaata / Roznamcha Hisab*):** Litigants in Pakistan rarely settle legal fees in a single advance payment. Instead, they make partial installments over the months or years a suit remains pending. These payments arrive through varied channels: cash handed to the chamber clerk (*Munshi*), bank transfers, or modern mobile money services like **JazzCash** and **Easypaisa**.
* **The Immutable Audit Rule:** To prevent fee disputes (*Takraar*) between lawyer and client, all fee structures and installment receipts must be transparent, verifiable, and mathematically coherent. In LegalHub, **FE-7** provides real-time mathematical aggregation:
  $$\text{Chamber Balance Due} = \text{Agreed Fee} - \sum_{i=1}^{n} \text{Payment Installments}$$
  Clients are granted instant read-only visibility into the ledger, ensuring complete transparency without permitting client tampering with chamber financial records.

---

## 2. Complete Trace: From User Click to Database & Screen Update

**User Action:** Advocate records an installment payment from a client who sent PKR 25,000 via JazzCash:
* **Amount:** `25000`
* **Method:** `jazzcash`
* **Date:** `2026-10-28`
* **Reference:** `TID # 981240182`
* **Note:** `Advance installment received towards suit institution expenses.`

```
[ Advocate UI: CaseFeesTab.jsx ]
       |
       | 1. Clicks "Record Client Payment" button
       | 2. In-page modal opens with prefilled date (today)
       | 3. Advocate enters amount (25000), selects "JazzCash", enters TID and remarks
       | 4. Submits form -> handleSavePayment()
       v
[ Frontend API: caseApi.recordPayment(caseId, payload) ]
       |
       | 5. Constructs payload: { amountPkr: 25000, method: 'jazzcash', reference: '...', paidOn: '...', note: '...' }
       | 6. Axios issues POST /api/v1/cases/:id/payments with Bearer JWT
       v
[ Backend Route: case.routes.js ]
       |
       | 7. verifyToken -> requireApprovedLawyer -> validate(createFeePaymentSchema)
       |    Zod schema validates amount (>= 1, integer), method enum, and max string lengths
       v
[ Controller Layer: fee.controller.js ]
       |
       | 8. feeController.recordFeePayment(req, res, next)
       v
[ Service Layer: fee.service.js ]
       |
       | 9. Verifies case exists and case.lawyerId === req.user.id (Ownership guard)
       | 10. Creates record in FeePayment model
       v
[ PostgreSQL Database (Supabase) ]
       |
       | 11. INSERT INTO fee_payments (case_id, amount_pkr, method, reference, paid_on, note)
       |     VALUES (...) RETURNING *;
       v
[ Backend Response ]
       |
       | 12. Returns 201 Created: { message: 'Payment recorded successfully', payment: { ... } }
       v
[ Frontend Callback & Re-fetch: CaseFeesTab.jsx ]
       |
       | 13. Modal closes; displays green success banner
       | 14. fetchFees() triggers GET /api/v1/cases/:id/fees
       | 15. Backend dynamically calculates:
       |     agreed = agreement.agreedAmountPkr (e.g., 100,000)
       |     paid = sum(payments) (e.g., 25,000 + 25,000 = 50,000)
       |     balance = agreed - paid (50,000)
       v
[ Dynamic Re-render: CaseFeesTab.jsx ]
       |
       | 16. Total Paid card updates to PKR 50,000
       | 17. Chamber Balance Due card updates to PKR 50,000 (amber Outstanding pill)
       | 18. New payment row appears at the top of the Payments Ledger table with red JazzCash badge
```

---

## 3. Student Hands-On Exercises

### Exercise 1: Fee Structure Terms & Retention Contract
**Objective:** Document a professional retainer agreement for an active brief.
1. Log in as advocate `sikandar.adv@demo.legalhub.local` and open an active case (`/cases/:id`).
2. Navigate to the **"Fees & Ledger"** tab.
3. In the Fee Agreement panel, click **"Edit Agreement Terms"** (or **"Set Fee Agreement"**).
4. Configure terms:
   - **Fee Structure Type:** `Stage-Wise Retainer`
   - **Agreed Total Fee (PKR):** `200000`
   - **Terms & Retainer Schedule:** `50% upon suit filing and stay order; 25% upon evidence; 25% upon final judgment.`
5. Click **"Save Fee Agreement"**.
6. **Expected Observation:** The Top Summary cards immediately reflect **Total Agreed Fee: PKR 200,000** and **Chamber Balance Due: PKR 200,000** with an amber **Outstanding Balance** pill.

### Exercise 2: Multi-Rail Installment Recording & Balance Settlement
**Objective:** Simulate multiple client payments across different Pakistani banking/fintech channels and verify auto-settlement.
1. As advocate, click **"Record Client Payment"**:
   - **Amount:** `100000`
   - **Method:** `Bank Transfer`
   - **Reference / TID:** `HBL-FT-9402198`
   - **Remarks:** `Initial advance via online interbank transfer.`
   - Click **"Record Payment"**.
2. Notice the Chamber Balance Due drops to `PKR 100,000`. The payment appears in the ledger with a purple `Bank Transfer` badge.
3. Record a second payment:
   - **Amount:** `100000`
   - **Method:** `Easypaisa`
   - **Reference / TID:** `EP-TRX-441029`
   - **Remarks:** `Final installment received.`
   - Click **"Record Payment"**.
4. **Expected Observation:** Total Paid reaches `PKR 200,000`. The Chamber Balance Due card shifts to deep green with an **Account Fully Settled** badge.

### Exercise 3: Litigant Read-Only Protection & Privilege Barrier
**Objective:** Confirm that clients cannot tamper with chamber fee records or create unauthorized receipts.
1. Sign out and sign in as client `ali.client@demo.legalhub.local`.
2. Open the linked case file (`/cases/:id`) and switch to the **"Fees & Ledger"** tab.
3. **Expected Observation:**
   - The Top Summary cards (Agreed, Paid, Balance) are visible.
   - The Fee Agreement terms and schedule notes are visible in read-only mode.
   - The "Edit Agreement Terms" and "Record Client Payment" buttons are **completely absent**.
   - The client can review their transaction history and reference numbers, verifying their financial position transparently.

---

## 4. Final Year Project Viva Voce Defense Q&As

### Q1: Why are fee agreements and payment records restricted to the assigned lawyer, rather than allowing clients to self-report payments?
**Answer:**  
In legal practice and accounting ethics, a receipt is a legal acknowledgment of funds received issued by the payee (the advocate), not the payer (the litigant). Allowing clients to self-report or unilaterally declare a payment would lead to accounting discrepancies, fraudulent claims of settlement, and unauthorized ledger entries. The client portal is intentionally read-only for ledger entries, while consultation bookings handle direct upfront digital payments.

### Q2: How does the system handle balance calculation across concurrent transactions?
**Answer:**  
The balance is not stored as a static, mutable column in the database, which could drift out of sync due to race conditions. Instead, `GET /api/v1/cases/:id/fees` dynamically sums all confirmed payment records from `fee_payments` (`sum = payments.reduce(...)`) and computes $\text{balance} = \text{agreedAmountPkr} - \text{paid}$. This guarantees mathematical consistency on every single read.

### Q3: Why does LegalHub support explicit Pakistani payment rails (JazzCash, Easypaisa) instead of generic "Online / Card"?
**Answer:**  
In Pakistan's legal sector, the vast majority of retail litigation clients are unbanked or underbanked individuals from rural and suburban jurisdictions who rely heavily on mobile branchless banking (JazzCash and Easypaisa). Providing dedicated enumerations and distinct visual badges for these services mirrors real Pakistani chamber operations and allows instant cross-referencing against SMS transaction IDs (TIDs).

### Q4: Why are fee records strictly barred from platform administrators (HTTP 403 Forbidden)?
**Answer:**  
Under Section 126 of the **Qanun-e-Shahadat Order 1984** and professional legal conduct rules, financial retainers and terms of engagement between an advocate and client are confidential business and privileged communication. Platform administrators have no judicial or chamber standing; thus, the backend explicitly throws a 403 Forbidden error if an administrative user attempts to query `GET /cases/:id/fees` or modify retainer agreements.

### Q5: How does the UI maintain readability and layout stability on low-end 375px mobile screens?
**Answer:**  
Using CSS Grid and Flexbox with `tokens.css`, the 3-column metric cards automatically wrap into a single vertical stack on viewports below 768px. Input fields feature explicit touch targets (minimum 44px height), currency prefixes are anchored with `pointer-events: none`, and the ledger table utilizes an overflow wrapper (`overflow-x: auto`) to ensure zero horizontal viewport breaking.

---

## 5. Numbered Manual Test Script

| Step | Action | User Session | Expected Result |
| :---: | :--- | :--- | :--- |
| **1** | Log in as advocate | `sikandar.adv@demo.legalhub.local`<br>`Advocate@12345` | Redirects to `/dashboard`. Navigate to `/cases` and open an active case file. |
| **2** | Switch to **"Fees & Ledger"** tab | Advocate | Fees tab renders. Three summary cards appear: **Total Agreed Fee**, **Total Paid to Date**, and **Chamber Balance Due**. |
| **3** | Click **"Set Fee Agreement"** or **"Edit Agreement Terms"** | Advocate | Form reveals Type dropdown, Agreed Amount PKR input, and Notes textarea. |
| **4** | Configure Agreement Terms | Advocate | Select Type: `Fixed Lump-Sum (Total Case)`, Amount: `150000`, Notes: `Full retainer covering pleadings and hearings.` Click **"Save Fee Agreement"**. |
| **5** | Verify Agreement Update | Advocate | Success banner displays. Top card updates to `PKR 150,000`. Balance card shows `PKR 150,000` with amber **Outstanding Balance** pill. |
| **6** | Click **"Record Client Payment"** | Advocate | In-page modal opens. Prefills today's date. |
| **7** | Submit Payment Installment | Advocate | Enter Amount: `50000`, Channel: `JazzCash`, TID: `JC-892104`, Remarks: `Advance received at chamber.` Click **"Record Payment"**. |
| **8** | Verify Ledger & Metric Recalculation | Advocate | Modal closes; green alert confirms payment. Total Paid updates to `PKR 50,000`, Balance drops to `PKR 100,000`. Ledger table displays row with red JazzCash badge and TID. |
| **9** | Record Settling Payment | Advocate | Record second installment: Amount `100000`, Channel `Bank Transfer`. Balance drops to `PKR 0`. Balance card turns green with **Account Fully Settled** pill. |
| **10** | Sign out and log in as client | `ali.client@demo.legalhub.local`<br>`Client@12345` | Client dashboard loads. Navigate to `/cases/:id`. |
| **11** | Inspect Fees as Client | Client | Click **"Fees & Ledger"** tab. Agreed PKR, Paid PKR, and Balance Due cards match chamber numbers. The agreement notes and payment rows are visible. "Edit Agreement" and "Record Payment" buttons are hidden. |
| **12** | Mobile Viewport Check (375px) | Either | In Chrome DevTools 375px emulation, metric cards stack smoothly, table scrolls horizontally inside its panel, and modal scales without clipping. |
