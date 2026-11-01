# Part R: AI Document Summarization & Bilingual Legal Search Guide

> **Target Audience:** BS CS Final Year Students (Syed Asad, Muhammad Aqeel, Mubashir Mehmood)  
> **Course:** Final Year Project (FYP) — Emerson University Multan  
> **Topic:** Microservice Architecture (Node.js Express + Python FastAPI), Built-in Node 20 Fetch, CPU-Friendly Legal NLP, and Bilingual Legal Search

---

## 1. Concept in Plain English & Relatable Pakistani Analogy

### The Concept: Why a Dedicated Microservice for AI?
Node.js Express is phenomenal for I/O-bound tasks: handling HTTP requests, managing PostgreSQL transactions, streaming files, and enforcing JWT authentication. However, text processing, natural language tokenization, regex entity extraction, and vector/TF-IDF similarity searches are **CPU-bound operations**. 

If you execute intensive text extraction or transformer models directly inside the Node.js single-threaded event loop, all other users experience high latency and blocked requests.

By decoupling the AI pipeline into a lightweight **Python FastAPI microservice** (`/ai-service`) running on port 8000:
1. Express remains fast, non-blocking, and dedicated to business logic and security.
2. FastAPI processes legal text, extracts Pakistani legal entities (courts, statutes, parties), and calculates bilingual search rankings in Python.
3. Express communicates with FastAPI via **Node 20's built-in `fetch`** with an `AbortController` timeout (8000ms).
4. If the AI microservice is offline or warming up, Express activates a **graceful heuristic fallback**—the client receives a clean deterministic summary and keyword search without ever seeing a 500 server crash!

---

### The Relatable Pakistani Analogy: *Chamber Ka Tajurbakaar Munshi / Junior Advocate*
Imagine a busy senior advocate’s chamber at the **Lahore High Court** or **District Courts Multan**:

1. **The Bulky Case File (*Misl / File Ka Pulinda*):** A client arrives with a 50-page legal file containing Urdu police *roznamcha* entries, bail dismissals, and cross-examination copies.
2. **The Senior Advocate’s Dilemma:** The senior advocate has 6 cases listed before 3 different court benches starting at 9:00 AM. They do not have time to read 50 pages of repetitive legal formalisms.
3. **The Junior Associate’s Briefing (*Khulasa-e-Kissa / Case Brief*):** The Junior Advocate (*Munshi / Associate*) reads the file, identifies the key points:
   - Court: *Lahore High Court, Multan Bench*
   - Statutes: *Section 497 CrPC, Section 302/34 PPC*
   - FIR: *FIR No. 402/24 PS Cantt*
   - Result: *Post-arrest bail granted on ground of further inquiry.*
   The junior places a concise 1-page summary on the Senior's desk.
4. **Bilingual Search in the Chamber Library:** When the senior asks, *"Find our previous bail orders where Section 34 vicarious liability was discussed"*, the associate can locate the file whether the record label was written in English or Nastaliq Urdu (*ضمانت بعد از گرفتاری*).
5. **Our Microservice:** The `/ai-service` acts as this digital chamber associate—extracting sections, summarizing lengthy orders, and searching across both languages.

---

## 2. End-to-End Technical Request Trace

Here is the journey of an advocate summarizing a case document across the two services:

```
[Browser / Client App]
       |
       | 1. POST /api/v1/cases/:id/documents/:documentId/summarize { text?: "...", maxLength: 200 }
       v
[Express Router: case.routes.js -> documentController.summarizeDocument()]
  -> verifyToken (Authenticates user, checks user.isActive)
  -> document.service.js:
     ├── Checks Case ownership (lawyer owns case OR client is linked)
     ├── Checks Document existence within case
     ├── [Confidentiality Guard]: If user is client AND doc.visibility !== 'shared' -> 403 Forbidden!
     └── Resolves text content to summarize
          |
          v
[Backend AI Service: ai.service.js -> summarizeDocument()]
  -> Initiates Node 20 built-in fetch:
     POST http://127.0.0.1:8000/api/v1/ai/summarize
     Headers: { "Content-Type": "application/json" }
     Body: { text, language: "auto", max_length: 200 }
     Signal: AbortSignal.timeout(8000ms)
          |
          v
[FastAPI Microservice: main.py -> /api/v1/ai/summarize]
  -> Pydantic validates input text (min 10 chars)
  -> detect_language(): Inspects Urdu Unicode characters ([\u0600-\u06FF])
  -> extract_entities():
     ├── Statutes: Regex matches "Section 497 CrPC", "302 PPC", "Order 39 CPC", "دفعہ 302"
     ├── Courts: Regex matches "Lahore High Court", "Sessions Court", "سپریم کورٹ"
     └── Parties: "Petitioner", "Respondent", "سائل", "مدعی"
  -> generate_extractive_summary():
     ├── Splits sentences using English (. ! ?) and Urdu (۔) boundaries
     ├── Scores sentences based on position and Pakistani legal keywords
     └── Assembles chronologically ordered executive summary
  -> Returns 200 OK:
     {
       "summary": "...",
       "key_clauses": [...],
       "entities": { "courts": [...], "statutes": [...], ... },
       "language": "en",
       "word_count": 58,
       "reading_time_minutes": 0.29
     }
          |
          v
[Express Service receives response]
  -> Wraps result with documentId and originalName
  -> Responds to client with HTTP 200 OK
```

---

## 3. Hands-on Student Exercises

### Exercise 1: Expanding Pakistani Legal Entity Patterns
**Problem:** In Pakistani criminal appeals, narcotics cases are registered under the *Control of Narcotic Substances Act (CNSA) 1997* (e.g. `Section 9-C CNSA` or `9-D CNSA`). How do you update the regex pattern to capture CNSA sections?  
**Solution (in `ai-service/main.py`):**
```python
# Update STATUTE_PATTERNS to include CNSA and ATA
re.compile(
    r'\b(?:Section|Sec\.?|u/s|under section)\s+(\d+[A-Z]?(?:-\w+)?)\s*(?:of\s+the\s+)?(PPC|CrPC|CPC|QSO|CNSA|ATA)?\b',
    re.IGNORECASE
)
```

---

### Exercise 2: Implementing Node 20 Native Fetch Timeout with `AbortController`
**Problem:** If the AI microservice hangs on a 500,000-word file, how do we prevent the Express server from keeping the HTTP socket open forever without installing `axios` or external packages?  
**Solution (Node 20 Built-in):**
```javascript
const controller = new AbortController();
const timeoutId = setTimeout(() => controller.abort(), 8000); // 8-second circuit breaker

try {
  const res = await fetch('http://localhost:8000/api/v1/ai/summarize', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    signal: controller.signal
  });
  clearTimeout(timeoutId);
  return await res.json();
} catch (err) {
  clearTimeout(timeoutId);
  // Gracefully fallback instead of failing with 500
  return heuristicSummarize(payload.text);
}
```

---

### Exercise 3: Heuristic Extractive Sentence Splitting for Urdu Text
**Problem:** In English, sentences terminate with a period (`.`). In Urdu, sentences terminate with the Urdu full-stop dash (`۔`). How do you split text into legal sentences across both scripts?  
**Solution:**
```javascript
// Regex lookbehind for period, exclamation, question mark, and Urdu full stop
const sentences = text
  .split(/[.!?۔\n]+/)
  .map((s) => s.trim())
  .filter((s) => s.length > 15);
```

---

## 4. FYP Viva Voce Defense Questions & Model Answers

### Q1: Why did you separate AI document summarization into a Python FastAPI microservice rather than running everything inside Node.js?
> **Answer:** "Sir, Node.js is single-threaded and excels at event-driven asynchronous I/O. However, text tokenization, regular expression parsing over large documents, and similarity calculations are CPU-intensive operations. Running heavy NLP tasks inside the Express event loop would block the main thread and degrade response times for all connected users. By offloading these tasks to a Python FastAPI microservice on port 8000, we maintain architectural separation of concerns, leverage Python's rich ecosystem for legal NLP, and ensure the Express backend remains responsive."

---

### Q2: How does your entity extraction recognize Pakistani legal citations specifically?
> **Answer:** "Sir, standard generic NLP models (trained on US or UK case law) fail to identify Pakistani legal structures such as 'Section 497 CrPC', 'Order 39 Rule 1 CPC', 'FIR No. 402/24 PS Cantt', or Urdu legal terminology like 'دفعہ 302 تعزیرات پاکستان'. Our `ai-service/main.py` incorporates dedicated Pakistani legal regex knowledge bases that specifically target the Pakistan Penal Code (PPC), Code of Criminal Procedure (CrPC), Code of Civil Procedure (CPC), and provincial High Courts."

---

### Q3: What happens if the Python AI microservice is stopped or unreachable? Does LegalHub crash?
> **Answer:** "Sir, absolutely not. In `backend/src/services/ai.service.js`, we implemented an 8-second circuit breaker using Node 20's `AbortController` and a deterministic heuristic fallback (`heuristicSummarize` and `heuristicSearch`). If the Python microservice is offline or times out, Express catches the error, logs a clean notice (`[AI_SERVICE_CONNECT_NOTICE]`), and returns a heuristic summary and keyword search with `source: 'heuristic_fallback'`, guaranteeing 100% platform availability without HTTP 500 errors."

---

### Q4: Why is a client forbidden from summarizing private documents in a case file?
> **Answer:** "Sir, in Pakistani legal practice and under the Legal Practitioners and Bar Councils Act, an advocate's internal cross-examination outlines, witness deposition drafts, and chamber notes represent protected 'attorney work product'. In `document.service.js -> summarizeCaseDocument()`, we enforce strict role-based visibility guards: clients are permitted to summarize only documents flagged as `visibility = 'shared'`, preventing unauthorized exposure of confidential chamber strategies."

---

### Q5: Why did you use Node 20's built-in `fetch` instead of installing Axios?
> **Answer:** "Sir, starting from Node.js version 18 and standardized in Node.js 20, the global WHATWG `fetch` API is natively integrated directly into the V8 runtime. Utilizing native `fetch` reduces external dependency bloat, eliminates security vulnerabilities from unmaintained HTTP client packages, and fulfills our strict project specification of zero unnecessary packages."

---

## 5. Thunder Client / Postman Test Collection & Curl Commands

### 1. Direct Python AI Service Health Check
```bash
curl -X GET http://localhost:8000/health
```

### 2. Express Backend Summarize Case Document
```bash
curl -X POST http://localhost:4000/api/v1/cases/<CASE_ID>/documents/<DOCUMENT_ID>/summarize \
  -H "Authorization: Bearer <LAWYER_JWT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "maxLength": 200,
    "language": "auto"
  }'
```

### 3. Express Backend Bilingual Search Case Documents
```bash
curl -X GET "http://localhost:4000/api/v1/cases/<CASE_ID>/search-documents?q=bail&topK=5" \
  -H "Authorization: Bearer <LAWYER_JWT_TOKEN>"
```
