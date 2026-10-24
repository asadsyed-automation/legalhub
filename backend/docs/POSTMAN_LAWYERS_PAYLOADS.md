# LegalHub Pakistan — REST API Postman & Thunder Client Payloads

This guide provides ready-to-use HTTP requests and JSON payloads for creating, verifying, configuring, and querying advocates on LegalHub via REST clients (Postman, VS Code Thunder Client, Bruno, Insomnia, or cURL).

Base URL: `http://localhost:4000/api/v1`

---

## 1. Register a New Advocate User

* **Method:** `POST`
* **URL:** `{{baseUrl}}/auth/register`
* **Headers:** `Content-Type: application/json`

### Request Body:
```json
{
  "name": "Adv. Mian Shahbaz Ali",
  "email": "shahbaz.ali@law.pk",
  "password": "SecurePassword123!",
  "role": "lawyer"
}
```

### Expected Response (`201 Created`):
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "e2a1b920-9bf4-4422-990a-115f5a2a5144",
      "name": "Adv. Mian Shahbaz Ali",
      "email": "shahbaz.ali@law.pk",
      "role": "lawyer"
    },
    "tokens": {
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    }
  }
}
```

> **Note:** Copy the `accessToken` into your environment variables as `{{lawyerToken}}`.

---

## 2. Submit Bar Council Licensing Application

* **Method:** `POST`
* **URL:** `{{baseUrl}}/lawyer/application`
* **Headers:**
  * `Content-Type: application/json`
  * `Authorization: Bearer {{lawyerToken}}`

### Request Body:
```json
{
  "barCouncil": "Punjab Bar Council",
  "enrolmentNo": "LHR-8899-PBC",
  "courtLevel": "Advocate High Court",
  "city": "Lahore",
  "practiceAreas": ["Criminal", "Constitutional", "Civil"],
  "experienceYears": 9,
  "chamberAddress": "Chamber 21, High Court Bar Association, Lahore",
  "bio": "Nine years of trial advocacy before Lahore High Court benches and subordinate trial courts specializing in criminal defense, pre-arrest bail, and commercial injunctions."
}
```

### Expected Response (`201 Created`):
```json
{
  "success": true,
  "data": {
    "application": {
      "id": "848bb019-3cc4-469a-a827-0cfc34aa9f74",
      "userId": "e2a1b920-9bf4-4422-990a-115f5a2a5144",
      "barCouncil": "Punjab Bar Council",
      "enrolmentNo": "LHR-8899-PBC",
      "courtLevel": "Advocate High Court",
      "city": "Lahore",
      "practiceAreas": ["Criminal", "Constitutional", "Civil"],
      "experienceYears": 9,
      "status": "pending"
    }
  }
}
```

---

## 3. Review & Approve Advocate Application (Court Administrator)

* **Method:** `PUT`
* **URL:** `{{baseUrl}}/admin/applications/{{applicationId}}/review`
* **Headers:**
  * `Content-Type: application/json`
  * `Authorization: Bearer {{adminToken}}`

### Request Body:
```json
{
  "status": "approved"
}
```

### Expected Response (`200 OK`):
```json
{
  "success": true,
  "data": {
    "application": {
      "id": "848bb019-3cc4-469a-a827-0cfc34aa9f74",
      "status": "approved"
    }
  }
}
```

---

## 4. Update Chamber Profile & Biography

* **Method:** `PUT`
* **URL:** `{{baseUrl}}/lawyer/profile`
* **Headers:**
  * `Content-Type: application/json`
  * `Authorization: Bearer {{lawyerToken}}`

### Request Body:
```json
{
  "headline": "Advocate High Court | Trial Defense & Constitutional Counsel",
  "about": "Comprehensive trial defense with a focus on criminal bail appeals, FIR quashment petitions, and subordinate court civil injunctions in Lahore.",
  "languages": ["Urdu", "Punjabi", "English"],
  "slotMinutes": 30
}
```

### Expected Response (`200 OK`):
```json
{
  "success": true,
  "data": {
    "profile": {
      "headline": "Advocate High Court | Trial Defense & Constitutional Counsel",
      "languages": ["Urdu", "Punjabi", "English"],
      "slotMinutes": 30
    }
  }
}
```

---

## 5. Add Consultation Offerings & Fees

* **Method:** `POST`
* **URL:** `{{baseUrl}}/lawyer/services`
* **Headers:**
  * `Content-Type: application/json`
  * `Authorization: Bearer {{lawyerToken}}`

### Example A: In-Chamber Meeting
```json
{
  "mode": "in_chamber",
  "durationMinutes": 30,
  "feePkr": 2500
}
```

### Example B: Secure Video Consultation
```json
{
  "mode": "video",
  "durationMinutes": 30,
  "feePkr": 2000
}
```

### Example C: Phone Consultation
```json
{
  "mode": "phone",
  "durationMinutes": 15,
  "feePkr": 1200
}
```

---

## 6. Configure Weekly Availability Hours

* **Method:** `POST`
* **URL:** `{{baseUrl}}/lawyer/availability/rules`
* **Headers:**
  * `Content-Type: application/json`
  * `Authorization: Bearer {{lawyerToken}}`

> **Weekday Reference:** `1` = Monday, `2` = Tuesday, `3` = Wednesday, `4` = Thursday, `5` = Friday, `6` = Saturday, `7` = Sunday.

### Example A: Monday Morning (09:00 - 13:00)
```json
{
  "weekday": 1,
  "startTime": "09:00",
  "endTime": "13:00"
}
```

### Example B: Monday Afternoon (15:00 - 18:00)
```json
{
  "weekday": 1,
  "startTime": "15:00",
  "endTime": "18:00"
}
```

---

## 7. Query Public Advocate Directory (No Auth Required)

### All Advocates (Paginated):
* **Method:** `GET`
* **URL:** `{{baseUrl}}/lawyers?page=1&limit=9&sort=experience`

### Filter by City and Practice Area:
* **Method:** `GET`
* **URL:** `{{baseUrl}}/lawyers?city=Lahore&practiceArea=Family&sort=fee_asc`

### Filter by Court Standing:
* **Method:** `GET`
* **URL:** `{{baseUrl}}/lawyers?courtLevel=Advocate%20High%20Court`

---

## 8. View Chamber Profile Details & Available Slots

### Advocate Profile:
* **Method:** `GET`
* **URL:** `{{baseUrl}}/lawyers/{{applicationId}}`

### 14-Day Calendar Consultation Slots:
* **Method:** `GET`
* **URL:** `{{baseUrl}}/lawyers/{{applicationId}}/slots?from=2026-10-23&to=2026-11-06`
