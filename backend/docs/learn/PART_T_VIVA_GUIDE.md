# LegalHub Pakistan — Final FYP Viva Voce Defense Master Guide

> **Institution:** Emerson University Multan (Department of Computer Science)  
> **Degree Program:** Bachelor of Science in Computer Science (BS CS) — Final Year Project (FYP)  
> **Student Authors:**  
> - **Syed Asad** (Backend Lead & AI Integration)  
> - **Muhammad Aqeel** (Frontend Architect & UI/UX)  
> - **Mubashir Mehmood** (Database Design & API Testing)  
> **Academic Supervisor:** Department of Computer Science, Emerson University Multan  

---

## 1. 2-Minute Project Pitch (English & Urdu)

### English Pitch
> *"Respected Examiners, Welcome to LegalHub Pakistan. LegalHub is a specialized digital legal services marketplace and practice management ecosystem tailored strictly to the procedural and statutory realities of the Pakistani legal system. Under Rule 135 of the Legal Practitioners and Bar Councils Rules 1976, Pakistani advocates are strictly prohibited from commercial solicitation or bidding. Unlike Western platforms that prioritize paid sponsored ads, LegalHub implements an unbiased, admin-reviewed directory, private consultation bookings with automated fee escrow, and a confidential connected case management journey. Furthermore, our platform incorporates an asynchronous Python FastAPI microservice that extracts Pakistani legal citations (PPC, CrPC, CPC) and performs bilingual (English and Nastaliq Urdu) document summarization and search. Tested under 100 concurrent connections achieving up to 1,942 requests per second with zero server crashes, LegalHub bridges the access-to-justice gap across Pakistan while preserving 100% statutory compliance."*

### Urdu Pitch (اردو تعارف)
> *"محترم ممتحنین کرام، لیگل ہب پاکستان میں خوش آمدید۔ لیگل ہب پاکستان کے قانونی نظام اور پاکستان بار کونسل کے ضوابط (خاص طور پر رول 135) کے عین مطابق تیار کردہ ایک ڈیجیٹل پلیٹ فارم ہے۔ ہمارے ملک میں وکلاء کے لیے تجارتی اشتہار بازی منع ہے، چنانچہ ہم نے کسی بھی قسم کی پیڈ رینکنگ یا بولی لگانے کے بجائے میرٹ پر مبنی، ایڈمن ریویوڈ پروفائلز، آن لائن مشاورت، اور مکمل پرائیویٹ کیس مینجمنٹ سسٹم تیار کیا ہے۔ اس کے ساتھ ساتھ ہم نے اردو اور انگریزی دونوں زبانوں میں عدالتی احکامات، ایف آئی آر اور قانونی دفعات کے تجزیے کے لیے مصنوعی ذہانت (AI) کا مائیکرو سروس سسٹم جوڑا ہے۔ ہمارے اس پروجیکٹ کا مقصد پاکستان کے عام شہریوں اور قانونی ماہرین کے درمیان فاصلوں کو کم کرنا اور انصاف کی فراہمی کو آسان بنانا ہے۔"*

---

## 2. Complete Architecture Overview

```
                                  +------------------------------------+
                                  |         React 18 Frontend          |
                                  |    Vite + TailwindCSS + Axios      |
                                  |      (Port 3000 / Port 5173)       |
                                  +-----------------+------------------+
                                                    |
                                         HTTP / REST (JWT Bearer)
                                                    v
                                  +------------------------------------+
                                  |        Node.js Express Backend     |
                                  |     Layered: Route->Ctrl->Service  |
                                  |             (Port 4000)            |
                                  +--------+------------------+--------+
                                           |                  |
                       Internal Native Fetch                  | Sequelize ORM
                        (AbortSignal 8000ms)                  | Connection Pool (15)
                                           v                  v
    +----------------------------------------+   +-------------------------------+
    |         Python FastAPI Service         |   |    PostgreSQL Remote Cluster  |
    |      Pakistani Legal NLP & Search      |   |          (Supabase)           |
    |               (Port 8000)              |   |     23 Domain Tables + OTP    |
    +----------------------------------------+   +-------------------------------+
```

---

## 3. Database Schema Master Table Catalog (24 Tables)

| # | Table Name | Purpose & Invariants | Key Relational Foreign Keys |
| :--- | :--- | :--- | :--- |
| 1 | `users` | Master accounts (`client`, `lawyer`, `law_firm`, `admin`). Contains `failedLoginAttempts`, `lockedUntil`, `isActive`, `emailVerifiedAt`. | Primary Key (`id`) |
| 2 | `lawyer_applications` | Formal enrollment verification. States: `pending`, `approved`, `rejected`. | `userId` $\rightarrow$ `users.id` |
| 3 | `lawyer_profiles` | Public listing settings, bio, headline, languages, `isPublic`. | `userId` $\rightarrow$ `users.id` |
| 4 | `lawyer_services` | Consultation modes (`chat`, `video`, `in_chamber`), duration, fee in PKR. | `lawyerId` $\rightarrow$ `users.id` |
| 5 | `lawyer_availabilities` | Weekly consultation schedules by day of week (`0` to `6`). | `lawyerId` $\rightarrow$ `users.id` |
| 6 | `bookings` | Consultation appointments with state machine (`pending` $\rightarrow$ `confirmed` $\rightarrow$ `completed` / `cancelled`). | `clientId`, `lawyerId`, `serviceId` |
| 7 | `enquiries` | Pre-consultation client questions and lawyer replies. | `clientId`, `lawyerId` |
| 8 | `matching_questionnaires` | Automated legal intake questionnaire submissions. | `clientId` $\rightarrow$ `users.id` |
| 9 | `engagements` | Formal representation retainers and terms of engagement. | `caseId`, `lawyerId`, `clientId` |
| 10 | `cases` | Master litigation file (`caseOrFirNumber`, `court`, `stage`, `status`). | `lawyerId`, `clientId`, `bookingId` |
| 11 | `case_parties` | Litigants (`plaintiff`, `defendant`, `petitioner`, `accused`). | `caseId` $\rightarrow$ `cases.id` |
| 12 | `case_status_events` | Immutable chronological audit trail of case stage transitions. | `caseId` $\rightarrow$ `cases.id` |
| 13 | `case_entries` | Running court diary proceedings (`petition`, `order`, `note`). | `caseId` $\rightarrow$ `cases.id` |
| 14 | `hearings` | Scheduled court appearances, causelist calendar dates, and chamber prep notes. | `caseId` $\rightarrow$ `cases.id` |
| 15 | `documents` | Digital evidence vault with Cloudinary storage IDs and role-aware visibility. | `caseId`, `uploadedBy` |
| 16 | `fee_agreements` | Agreed case fee structure (`fixed`, `per_appearance`, `stage_wise`). | `caseId` $\rightarrow$ `cases.id` |
| 17 | `fee_payments` | Immutable transaction ledger for fee payments (`cash`, `bank`, `jazzcash`). | `caseId`, `recordedBy` |
| 18 | `messages` | Direct consultation & case chat messages. | `caseId`, `senderId`, `receiverId` |
| 19 | `notifications` | System alerts (hearing reminders, booking requests, status changes). | `userId` $\rightarrow$ `users.id` |
| 20 | `email_otps` | Cryptographic SHA-256 hashed one-time passwords for password reset and verification. | `userId` $\rightarrow$ `users.id` |
| 21 | `audit_logs` | Administrative supervision audit trail. | `adminId` $\rightarrow$ `users.id` |
| 22 | `reviews` | Client ratings & feedback (displayed neutrally without ranking). | `bookingId`, `clientId`, `lawyerId` |
| 23 | `law_firm_members` | Association between law firms and member associate advocates. | `firmId`, `lawyerId` |
| 24 | `SequelizeMeta` | Migration version tracking table. | N/A |

---

## 4. Top 10 Viva Voce Questions & Definitive Model Answers

### Q1: What specific Pakistani law or Bar Council regulation governed your system design?
> **Model Answer:**  
> "Sir, our entire marketplace design is strictly bound by **Rule 135 of the Legal Practitioners and Bar Councils Rules 1976**. In Pakistan, legal practitioners are officers of the court and are strictly forbidden from commercial solicitation, advertising, or bidding. Unlike consumer platforms like Upwork or Fiverr, LegalHub does not have 'Top Rated', 'Featured', 'Best Lawyer', or paid priority sorting. Advocate listings are strictly informational and directory-based, sorted neutrally by verified experience or alphabetical order, and advocate credentials are titled **'Admin-Reviewed'** rather than claiming any official endorsement from statutory Bar Councils."

---

### Q2: Why did you decouple AI Summarization into a Python FastAPI microservice instead of doing it in Node.js?
> **Model Answer:**  
> "Sir, Node.js uses a single-threaded asynchronous event loop designed for non-blocking I/O operations (such as querying PostgreSQL or streaming HTTP responses). Natural language processing—such as regular expression parsing over 50-page legal documents, Urdu tokenization, and sentence relevance scoring—is **CPU-bound**. Running intensive CPU tasks inside Node.js blocks the event loop, causing latency spikes and dropped connections for all connected clients. By placing the AI pipeline in a Python FastAPI microservice on port 8000, we preserve Node's non-blocking speed while leveraging Python's rich data science ecosystem."

---

### Q3: What happens if the Python AI microservice crashes or is down? Does the backend fail?
> **Model Answer:**  
> "Sir, LegalHub implements a resilient **Circuit Breaker and Heuristic Fallback** in `backend/src/services/ai.service.js`. Express initiates requests to FastAPI using Node 20's built-in `fetch` with an `AbortController` timeout of 8,000 milliseconds. If the AI service times out or throws a connection refused error, our service catches the exception and immediately invokes `heuristicSummarize()` and `heuristicSearch()`. The user receives a clean, deterministic legal summary and keyword search with `source: 'heuristic_fallback'` without ever experiencing an HTTP 500 error."

---

### Q4: How do you prevent User Enumeration attacks on your password reset endpoint?
> **Model Answer:**  
> "Sir, in `auth.service.js -> forgotPassword()`, when a user submits an email address, our system returns the exact same HTTP 200 OK message: `'If that email address is in our system, we have sent a 6-digit verification code to it.'` regardless of whether the email exists in PostgreSQL. If we returned `404 Not Found: User does not exist`, a malicious actor could script a dictionary attack to discover which Pakistani citizens or advocates are registered on LegalHub."

---

### Q5: Why do you store the SHA-256 hash of an OTP instead of storing the plain 6-digit code in the database?
> **Model Answer:**  
> "Sir, storing plain-text OTPs violates cryptographic defense-in-depth. If an attacker gains read access to the database via SQL injection or backup leakage, having plain-text OTPs would allow them to hijack any active account recovery within its 10-minute validity window. By storing only the SHA-256 hash (`crypto.createHash('sha256').update(code + secret).digest('hex')`), even a complete database leak gives an attacker zero ability to reverse-engineer the 6-digit code in transit."

---

### Q6: How do you mitigate timing attacks during login and OTP validation?
> **Model Answer:**  
> "Sir, we apply two cryptographic defenses:
> 1. In `auth.service.js -> login()`, if an email does not exist, we still execute a dummy `bcrypt.compare()` against a static hash to consume identical CPU cycles (~80ms), preventing high-resolution network timers from identifying whether an email exists.
> 2. In `otp.service.js -> verifyAndConsumeOtp()`, we compare OTP hashes using `crypto.timingSafeEqual()` rather than standard JavaScript `===`. Standard string equality short-circuits on the first mismatched byte, allowing timing side-channel attacks; `timingSafeEqual` always runs in constant time."

---

### Q7: Explain the 'Dead Code Rule' implemented in your OTP system.
> **Model Answer:**  
> "Sir, a 6-digit numeric OTP has only 1,000,000 possible permutations (`000000` to `999999`). An automated bot could attempt to brute-force the code within its 10-minute window. To prevent this, our database schema tracks `attempts`. If a user enters 5 incorrect codes, the OTP record is permanently invalidated (`attempts >= 5`). Even if on the 6th attempt the correct code is supplied, the system rejects it with HTTP `429 Too Many Requests: Code invalidated`, forcing the user to request a fresh OTP."

---

### Q8: How did your system achieve 1,942 requests per second during load testing?
> **Model Answer:**  
> "Sir, in Part S, we executed `autocannon` benchmarks simulating 100 concurrent connections for 10 seconds. On the lightweight health route, Node.js's V8 engine processed 21,367 requests with an average throughput of 1,942 req/sec and a p95 latency of only 212 milliseconds. Under an aggressive flood of 12,414 requests on `/api/v1/auth/me`, our `express-rate-limit` middleware correctly throttled 12,314 abusive requests with HTTP `429 Too Many Requests`, proving that our security layer prevents server crashes and connection pool exhaustion under DDoS conditions."

---

### Q9: What is the difference between 'Private' and 'Shared' case documents in your vault?
> **Model Answer:**  
> "Sir, in Pakistani litigation, an advocate's chamber notes, cross-examination strategy drafts, and witness preparation outlines constitute protected **Attorney Work Product**. In `document.service.js`, documents are tagged with `visibility: 'private'` or `'shared'`. When a linked client queries the case file or attempts to download/summarize documents, our controller strictly queries `visibility = 'shared'`. If a client attempts to access a private advocate document directly by UUID, the system returns HTTP `403 Forbidden: Clients cannot access private advocate work product`."

---

### Q10: How does your database ensure zero secret leakage and safe JSON serialization?
> **Model Answer:**  
> "Sir, in `src/models/user.model.js`, the `User` class overrides Sequelize's default `toJSON()` method:
> ```javascript
> toJSON() {
>   const values = { ...this.get() };
>   delete values.passwordHash;
>   return values;
> }
> ```
> Whenever any controller returns a user object or an array of users, `passwordHash` is automatically stripped at the ORM serialization layer. Furthermore, all database credentials, JWT secrets, and API keys are strictly loaded via environment variables validated at startup in `src/config/env.js`."
