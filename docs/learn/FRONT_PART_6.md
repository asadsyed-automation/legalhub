# LegalHub Frontend Engineering Guide: FE-6 (Case Documents, Magic-Bytes & Private Asset Storage)

> **Final Year Project (FYP) — Emerson University Multan**  
> **Student Developers:** Syed Asad, Muhammad Aqeel, Mubashir Mehmood  
> **Module:** Frontend Phase 3 — Connected Case Journey (FE-6: Case Documents & Private Asset Storage)  
> **Target Scope:** Private Case Asset Vault, Magic-Byte File Validation, Secure In-Memory Blob Streaming, Type Tagging & Filter Bar, Client Visibility Controls, In-Browser PDF/Image Modal & Direct Word Download

---

## 1. Architectural Philosophy & Pakistani Court Metaphor

### The Court Evidence Locker (*Malkaana*) & Certified Copies (*Naqal*)
* **The Judicial Evidence Vault (*Malkaana*):** In Pakistani trial courts (Session Courts and District Courts), vital physical records—such as registered sale deeds (*Bayanama*), revenue mutation counterfoils (*Parcha Inteqaal*), and forensic expert reports—are deposited into the *Malkaana* (evidence locker) under lock and seal. The public is never permitted to walk in or view these records; access requires verified judicial standing.
* **The Danger of Public Cloud URLs in Legal Tech:** Many commercial web applications save user uploads directly to public Amazon S3 buckets or static web folders and expose raw URLs (e.g., `https://bucket.s3.amazonaws.com/cases/stay_order.pdf`). If a litigant or adversarial party guesses or intercepts this URL, privileged legal records leak immediately. In LegalHub, **zero public URLs exist**. All case assets are stored outside the public document root with non-guessable storage identifiers.
* **The Magic-Byte Gatekeeper:** Attackers frequently attempt to bypass server filters by renaming malicious scripts to `.pdf` or `.png`. In LegalHub, the backend inspects the raw leading binary bytes (magic bytes) of the uploaded stream. If an uploaded `.pdf` does not commence with the hexadecimal signature `25 50 44 46` (`%PDF-`), it is rejected immediately before touching persistent storage.
* **Authenticated Binary Streaming Proxy (`/documents/:id/file`):** To view or download a document, the client frontend issues an authenticated `GET` request with its Bearer JWT. The Express service checks database access permissions (lawyer ownership, or linked client for shared files) and streams the raw bytes as an HTTP binary stream. The frontend catches these bytes as an in-memory `Blob`, displays them via an object URL (`URL.createObjectURL`), and revokes the URL upon modal dismissal to guarantee complete memory hygiene.

---

## 2. Complete Trace: From User Click to Database & Screen Update

**User Action:** Advocate uploads a certified interim injunction order (`Interim_Stay_Order.pdf`, 1.4 MB) to an active case file:
* **Document Type:** `Order / Decree`
* **Visibility:** `Shared with Client`
* **Tags:** `Order 39`, `Stay Order`, `Revenue Record`

```
[ Advocate UI: CaseDocumentsTab.jsx ]
       |
       | 1. Drops or selects "Interim_Stay_Order.pdf" (1.4 MB)
       |    Client validates extension (.pdf) and size (< 10 MB) upfront
       | 2. Enters tags, selects "Order / Decree" and "Shared with Client"
       | 3. Clicks "Upload Document" button
       v
[ Frontend API: caseApi.uploadDocument(caseId, formData) ]
       |
       | 4. Constructs multipart/form-data with file, docType, visibility, and tags JSON
       | 5. Axios issues POST /api/v1/cases/:id/documents with Bearer JWT
       v
[ Backend Route & Multer Middleware: document.routes.js ]
       |
       | 6. verifyToken -> requireApprovedLawyer -> upload.single('file')
       |    Multer buffers binary data in server memory (up to 10 MB limit)
       v
[ Magic-Byte Validator: validateMagicBytes() ]
       |
       | 7. Reads leading 4 bytes of file.buffer: 0x25 0x50 0x44 0x46 ("%PDF-")
       |    Confirms genuine PDF format (rejects spoofed executables)
       v
[ Service Layer: document.service.js ]
       |
       | 8. Verifies case exists and case.lawyerId === req.user.id
       | 9. Saves binary buffer to disk under private folder: uploads/cases/:id/:uuid.pdf
       | 10. Creates database record in "documents" table
       v
[ PostgreSQL Database (Supabase) ]
       |
       | 11. INSERT INTO documents (case_id, original_name, storage_path, file_size,
       |                           mime_type, doc_type, visibility, tags)
       |     VALUES (...) RETURNING *;
       v
[ Backend Response ]
       |
       | 12. Returns 201 Created: { success: true, message: 'Document uploaded successfully', data: { ...document } }
       v
[ Frontend State Update: CaseDocumentsTab.jsx ]
       |
       | 13. Form resets; fetchDocuments() refreshes list
       | 14. Document appears at top of grid with "Order / Decree" chip, tag pills, and "Shared" badge
       v
[ User Action: Preview Document ]
       |
       | 15. Advocate clicks "Preview" button on document card
       | 16. Frontend calls caseApi.fetchDocumentBlob(docId) -> GET /api/v1/documents/:id/file
       | 17. Backend streams binary file with Content-Type: application/pdf; Content-Disposition: inline
       | 18. Axios receives Blob; window.URL.createObjectURL(blob) creates blob:http://... URI
       | 19. In-page modal renders <iframe src={blobUrl} title="Interim_Stay_Order.pdf" />
       v
[ Modal Dismissal: Memory Cleanup ]
       |
       | 20. Advocate clicks "Close" or outside backdrop
       | 21. window.URL.revokeObjectURL(previewBlobUrl) frees browser memory
```

---

## 3. Student Hands-On Exercises

### Exercise 1: Magic Byte Spoofing Resistance
**Objective:** Observe the backend security filter rejecting a counterfeit file extension.
1. On your computer, open Notepad and write: `This is plain text pretending to be a court order.`
2. Save the file with a forged name and extension: `fake_stay_order.pdf`.
3. Log in as advocate `sikandar.adv@demo.legalhub.local` and open a case file (`/cases/:id`).
4. Click the **"Documents"** tab.
5. In the upload zone, select `fake_stay_order.pdf`, select type `Order / Decree`, and click **"Upload Document"**.
6. **Expected Observation:** The backend rejects the upload with an HTTP 400 Bad Request: *"Invalid file content: binary signature does not match declared type"*. The forged file is never written to disk, demonstrating the necessity of magic-byte validation over extension sniffing.

### Exercise 2: In-Memory Blob Streaming vs Direct Word Download
**Objective:** Understand how different MIME types are handled safely in the browser.
1. As advocate, upload a valid PDF document (`order.pdf`) and a valid Word document (`brief.docx`).
2. Click **"Preview"** on `order.pdf`.
3. **Expected Observation:** An in-page modal opens with an embedded `<iframe src="blob:http://...">` displaying the rendered PDF without leaving the case dashboard.
4. Close the modal, then click **"Preview"** or **"Download"** on `brief.docx`.
5. **Expected Observation:** Since web browsers cannot render `.docx` binaries natively without leaking data to third-party cloud viewers (which violates attorney-client privilege), the system automatically triggers a clean browser file download via a synthetic `<a download>` anchor.

### Exercise 3: Litigant Document Isolation & Permission Guard
**Objective:** Verify that private case documents are completely invisible to clients.
1. In `sikandar.adv@demo.legalhub.local`'s session, upload two documents:
   - `Plaint_Copy.pdf` with Visibility set to **"Shared with Client"**.
   - `Chamber_Strategy_Worksheet.pdf` with Visibility set to **"Private (Chamber Only)"**.
2. Notice both documents appear in the lawyer's list with respective visibility chips.
3. Sign out and sign in as client `ali.client@demo.legalhub.local`.
4. Open the shared case file (`/cases/:id`) and switch to the **"Documents"** tab.
5. **Expected Observation:** The client sees only `Plaint_Copy.pdf`. The private worksheet is completely missing.
6. Open your browser DevTools Console and execute:
   ```javascript
   fetch('/api/v1/documents/<PRIVATE_DOC_ID>/file', {
     headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
   }).then(r => console.log('HTTP Status:', r.status));
   ```
7. **Expected Observation:** Returns `HTTP 404` or `HTTP 403 Forbidden`, proving access control is enforced at the database query level, not just visually in the frontend.

---

## 4. Final Year Project Viva Voce Defense Q&As

### Q1: Why does LegalHub reject public S3/CDN URLs in favor of an authenticated streaming endpoint (`/documents/:id/file`)?
**Answer:**  
In legal practice, case documents (e.g., family court petitions, financial disclosures, certified court orders) represent privileged and sensitive attorney-client material governed by statutory confidentiality. If documents are stored in public S3 buckets with predictable or signed public URLs, any URL leak in browser history, proxy logs, or chat transcripts permanently compromises client confidentiality. Our authenticated streaming proxy verifies JWT credentials and database ownership *on every single byte request*, ensuring zero unauthorized exposure.

### Q2: How does magic-byte inspection protect the application compared to simple file extension or MIME type checking?
**Answer:**  
File extensions (`.pdf`, `.png`) and the HTTP `Content-Type` header sent by browsers are client-controlled metadata that any malicious actor can trivially falsify using tools like cURL or Postman. Magic-byte inspection directly examines the first 4 to 8 bytes of the binary payload in server memory (e.g., `25 50 44 46` for PDF, `89 50 4E 47` for PNG, `50 4B 03 04` for DOCX). If the binary header does not match the allowed magic signature, the file is rejected before touching the storage directory.

### Q3: Why does the in-browser preview use `URL.createObjectURL(blob)` rather than embedding the API URL directly in `<iframe src="/api/v1/documents/:id/file">`?
**Answer:**  
HTML elements like `<iframe>` and `<img>` cannot attach custom HTTP authorization headers (such as `Authorization: Bearer <JWT>`) when issuing standard `GET` requests. If we put the API endpoint directly in `<iframe src="...">`, the backend would reject the request as unauthenticated. By fetching the binary stream via our authenticated `apiClient` instance and converting the resulting `Blob` into an ephemeral browser-internal URL (`blob:http://localhost:...`), we maintain strict JWT security while enabling seamless in-browser previews. Calling `URL.revokeObjectURL` on modal close frees memory immediately.

### Q4: Why are `.docx` files downloaded directly instead of rendered in an in-page preview modal?
**Answer:**  
Standard web browsers cannot render Microsoft Word OpenXML (`.docx`) binaries natively inside an `<iframe>`. The standard industry workaround (e.g., embedding Microsoft Office Online Viewer or Google Docs Viewer) requires sending the file's URL to third-party public cloud servers. Doing so with privileged legal court documents would constitute a serious breach of confidentiality and professional ethics. Therefore, LegalHub streams the file directly to the client's local device for secure offline viewing in desktop office software.

### Q5: How is client visibility enforced in the document query layer without risking privilege leakage?
**Answer:**  
When a user requests the document list or binary file, the backend extracts the role from `req.user`. If `req.user.role === 'client'`, the Sequelize query condition automatically appends `visibility: 'shared'` and verifies that `case.clientId === req.user.id`. Private documents are excluded from the query at the database level, meaning they are never fetched into server RAM or transmitted over the network.

---

## 5. Numbered Manual Test Script

| Step | Action | User Session | Expected Result |
| :---: | :--- | :--- | :--- |
| **1** | Log in as advocate | `sikandar.adv@demo.legalhub.local`<br>`Advocate@12345` | Redirects to `/dashboard`. Navigate to `/cases` and open an active case. |
| **2** | Switch to **"Documents"** tab | Advocate | Documents tab renders. Notice banner displays allowed types (`PDF, JPEG, PNG, DOC, DOCX`) and **10 MB limit**. Filter bar is present. |
| **3** | Select a valid PDF file (`order.pdf`, ~1 MB) | Advocate | File dropzone displays file name, size, and green checkmark. |
| **4** | Configure document metadata | Advocate | Select Type: `Order / Decree`, Visibility: `Shared with Client`, add tags `Order 39` and `Interim Stay`. Tags render as clickable removal pills. |
| **5** | Click **"Upload Document"** | Advocate | Uploading spinner appears; on completion, green success banner displays. Document card appears in grid with blue type chip, tags, and shared badge. |
| **6** | Click **"Preview"** on the PDF card | Advocate | In-page modal opens with loading spinner, then renders embedded PDF in an `<iframe src="blob:...">`. |
| **7** | Close Preview Modal | Advocate | Modal closes; browser releases blob URL from memory. |
| **8** | Toggle Document Visibility | Advocate | On the document card, click the visibility button to toggle between `Shared with Client` and `Private (Chamber Only)`. Updates immediately via `PATCH /documents/:id`. |
| **9** | Filter by Document Type | Advocate | In the filter bar, select `Order / Decree`. Only matching documents remain visible. |
| **10** | Filter by Tag | Advocate | Type `Order 39` into tag filter and press enter. Only documents containing this tag remain visible. |
| **11** | Sign out and log in as client | `ali.client@demo.legalhub.local`<br>`Client@12345` | Client dashboard loads. Navigate to the linked case file (`/cases/:id`). |
| **12** | Inspect Documents as Client | Client | Switch to **"Documents"** tab. The upload form is hidden (lawyer-only). The client sees only documents marked **Shared**. Private documents are completely absent. |
| **13** | Download Document as Client | Client | Click **"Download"** on the shared document card. File downloads to local device with original filename. |
| **14** | Mobile Viewport Check (375px) | Either | In mobile view, document cards stack cleanly, tags wrap neatly, and preview modal scales to screen dimensions without horizontal scrolling. |
