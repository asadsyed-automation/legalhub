# LegalHub API Specification & Contract (v1)

> **Source of Truth for Frontend Engineers**  
> **Base URL:** `http://localhost:4000/api/v1` (Development) / `https://api.legalhub.pk/api/v1` (Production)

---

## 1. Global Standards & Conventions

### 1.1 Headers
* **Request Content-Type:** `application/json` (for all POST, PUT, PATCH requests)
* **Authentication Header:** `Authorization: Bearer <JWT_TOKEN>` (for all protected routes)

### 1.2 Unified Error Response Format
All 4xx and 5xx errors strictly adhere to this standardized JSON shape:
```json
{
  "error": "Human-readable error explanation message",
  "details": [
    {
      "field": "fieldName",
      "message": "Specific validation failure explanation"
    }
  ]
}
```
*Note: `details` is always an array of field errors for 400 validation failures, and empty `[]` or omitted for generic errors.*

### 1.3 Standard HTTP Status Codes
| Code | Meaning | When It Is Used |
| :--- | :--- | :--- |
| **200 OK** | Success | Standard successful GET, PUT, PATCH responses |
| **201 Created** | Created | Resource successfully created (POST `/register`, POST `/lawyer/application`) |
| **400 Bad Request** | Validation Failure | Zod schema validation errors, missing fields, or invalid inputs |
| **401 Unauthorized** | Unauthenticated | Missing, invalid, or expired JWT token; or incorrect login credentials |
| **403 Forbidden** | Unauthorized Role | Authenticated user lacks permission (e.g., Client accessing Lawyer route) |
| **404 Not Found** | Resource Missing | Route or database entity does not exist |
| **409 Conflict** | State Conflict | Duplicate email, duplicate license enrollment, or invalid lifecycle state transition |
| **500 Internal Error**| Server Fault | Unhandled exception (details masked in production) |

### 1.4 Response Payload Structure & Client Transport Unwrapping
* **Backend Standard:** Express controllers return top-level JSON objects representing resources directly (e.g. `{ token, user }` on auth routes, `{ lawyer }` on profile routes, and `{ items, total, page, limit }` on list routes).
* **Frontend Axios Interceptor:** The HTTP client (`frontend/src/api/client.js`) automatically unwraps `response.data` in its response interceptor:
  ```javascript
  apiClient.interceptors.response.use(
    (response) => response.data,
    (error) => Promise.reject(error)
  );
  ```
* **Frontend Developer Note:** When calling API methods (such as `authApi.login(...)` or `authApi.register(...)`), the returned promise resolves **directly** to the payload object `{ token, user }`. Frontend code must access `response.user` directly rather than expecting a double-nested `response.data.user`.

---

## 2. Authentication Endpoints (`/api/v1/auth`)

### 2.1 Register New User
* **Method & Path:** `POST /auth/register`
* **Access:** Public (Rate limited)
* **Request Body:**
```json
{
  "name": "Ahmed Khan",
  "email": "ahmed.lawyer@example.pk",
  "password": "Password123!",
  "role": "lawyer"
}
```
* **Validation Rules:**
  * `name`: String, 2 to 100 characters.
  * `email`: String, valid email, automatically converted to lowercase.
  * `password`: String, minimum 8 characters.
  * `role`: Enum, strictly `"client"`, `"lawyer"`, or `"law_firm"`. *(Attempting `"admin"` returns 400).*
* **Success Response (201 Created):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "e6a21359-25bc-4f70-b992-6f29df5a0241",
    "name": "Ahmed Khan",
    "email": "ahmed.lawyer@example.pk",
    "role": "lawyer",
    "failedLoginAttempts": 0,
    "lockedUntil": null,
    "createdAt": "2026-10-18T08:00:00.000Z",
    "updatedAt": "2026-10-18T08:00:00.000Z"
  }
}
```
* **Common Errors:**
  * `400 Bad Request`: Validation failure (weak password, invalid email, illegal role).
  * `409 Conflict`: `{"error": "Email is already registered"}`.

---

### 2.2 Login User
* **Method & Path:** `POST /auth/login`
* **Access:** Public (Rate limited)
* **Request Body:**
```json
{
  "email": "ahmed.lawyer@example.pk",
  "password": "Password123!"
}
```
* **Success Response (200 OK):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "e6a21359-25bc-4f70-b992-6f29df5a0241",
    "name": "Ahmed Khan",
    "email": "ahmed.lawyer@example.pk",
    "role": "lawyer",
    "failedLoginAttempts": 0,
    "lockedUntil": null,
    "createdAt": "2026-10-18T08:00:00.000Z",
    "updatedAt": "2026-10-18T08:00:00.000Z"
  }
}
```
* **Common Errors:**
  * `401 Unauthorized`: `{"error": "Invalid email or password"}` (same for wrong email or wrong password).
  * `401 Unauthorized`: `{"error": "Account is temporarily locked due to too many failed login attempts. Please try again in 15 minute(s)."}`.

---

### 2.3 Get Current User Profile
* **Method & Path:** `GET /auth/me`
* **Access:** Private (`Authorization: Bearer <token>`)
* **Success Response (200 OK):**
```json
{
  "user": {
    "id": "e6a21359-25bc-4f70-b992-6f29df5a0241",
    "name": "Ahmed Khan",
    "email": "ahmed.lawyer@example.pk",
    "role": "lawyer",
    "failedLoginAttempts": 0,
    "lockedUntil": null,
    "createdAt": "2026-10-18T08:00:00.000Z",
    "updatedAt": "2026-10-18T08:00:00.000Z"
  }
}
```

---

## 3. Lawyer Portal Endpoints (`/api/v1/lawyer`)

### 3.1 Submit Lawyer Application
* **Method & Path:** `POST /lawyer/application`
* **Access:** Private (`role: lawyer`)
* **Request Body:**
```json
{
  "barCouncil": "Punjab Bar Council",
  "enrolmentNo": "PBC-19842",
  "courtLevel": "Advocate High Court",
  "city": "Lahore",
  "practiceAreas": ["Corporate", "Civil", "Tax"],
  "experienceYears": 10,
  "chamberAddress": "Chamber 402, High Court Bar Association, Lahore",
  "bio": "Specialized appellate advocate dealing in corporate litigation and tax disputes."
}
```
* **Validation Rules:**
  * `barCouncil`: One of the 5 approved provincial Bar Councils.
  * `courtLevel`: One of `"Advocate Lower Courts"`, `"Advocate High Court"`, `"Advocate Supreme Court"`.
  * `city`: One of the 15 approved Pakistani cities.
  * `practiceAreas`: Array of 1 to 5 items from approved list.
  * `experienceYears`: Integer between 0 and 60.
  * `chamberAddress`: String, min 5 chars.
* **Success Response (201 Created):** Returns `{ "application": { ... } }` with `status: "pending"`.
* **Common Errors:**
  * `400 Bad Request`: Validation failure.
  * `403 Forbidden`: User is a `client`.
  * `409 Conflict`: `{"error": "You have already submitted a lawyer application"}`.
  * `409 Conflict`: `{"error": "An application with this Bar Council enrolment number already exists"}`.

---

### 3.2 View My Application
* **Method & Path:** `GET /lawyer/application`
* **Access:** Private (`role: lawyer`)
* **Success Response (200 OK):** Returns `{ "application": { ... } }`.
* **Common Errors:** `404 Not Found` if lawyer has not applied yet.

---

### 3.3 Re-Submit Corrected Application
* **Method & Path:** `PUT /lawyer/application`
* **Access:** Private (`role: lawyer`)
* **Lifecycle Rule:** Only callable when `status === "rejected"`. Automatically resets `status` to `"pending"` and clears `rejectionReason`.
* **Request Body:** Identical schema to submission payload.
* **Success Response (200 OK):** Returns `{ "application": { "status": "pending", "rejectionReason": null, ... } }`.
* **Common Errors:**
  * `409 Conflict`: If current application status is `pending` or `approved`.

---

### 3.4 Get Professional Profile
* **Method & Path:** `GET /lawyer/profile`
* **Access:** Private (`role: lawyer`, `status: approved`)
* **Status Guard:** Requires application status to be `approved`. If pending or rejected, returns `403 Forbidden`.
* **Success Response (200 OK):**
```json
{
  "profile": {
    "userId": "e6a21359-25bc-4f70-b992-6f29df5a0241",
    "headline": "Senior High Court Advocate",
    "about": "Over 15 years representing clients across Multan appellate courts.",
    "languages": ["Urdu", "English", "Saraiki"],
    "slotMinutes": 45,
    "isPublic": true
  }
}
```

---

### 3.5 Upsert Professional Profile
* **Method & Path:** `PUT /lawyer/profile`
* **Access:** Private (`role: lawyer`, `status: approved`)
* **Request Body:**
```json
{
  "headline": "Appellate Advocate & Corporate Advisor",
  "about": "Detailed professional biography up to 2000 characters...",
  "languages": ["Urdu", "English", "Punjabi"],
  "slotMinutes": 30,
  "isPublic": true
}
```
* **Validation Rules:**
  * `headline`: String, max 120 chars (optional).
  * `about`: String, max 2000 chars (optional).
  * `languages`: Array of strings chosen from `['Urdu', 'English', 'Punjabi', 'Sindhi', 'Pashto', 'Saraiki']`, min 1.
  * `slotMinutes`: Integer from `[15, 30, 45, 60]`, default 30.
  * `isPublic`: Boolean, default true.
* **Success Response (200 OK):** Returns updated `{ "profile": { ... } }`.

---

### 3.6 Get Consultation Services
* **Method & Path:** `GET /lawyer/services`
* **Access:** Private (`role: lawyer`, `status: approved`)
* **Success Response (200 OK):**
```json
{
  "services": [
    {
      "id": "7df381bb-6e21-4f11-9a70-8b01dc8a0912",
      "mode": "in_chamber",
      "durationMinutes": 45,
      "feePkr": 5000,
      "isActive": true
    },
    {
      "id": "8ef492cc-7f32-4e22-8b81-9c12ed9b1023",
      "mode": "video",
      "durationMinutes": 30,
      "feePkr": 3500,
      "isActive": true
    }
  ]
}
```

---

### 3.7 Replace Consultation Services (Atomic Full Set)
* **Method & Path:** `PUT /lawyer/services`
* **Access:** Private (`role: lawyer`, `status: approved`)
* **Request Body:**
```json
{
  "services": [
    {
      "mode": "in_chamber",
      "durationMinutes": 45,
      "feePkr": 5000,
      "isActive": true
    },
    {
      "mode": "video",
      "durationMinutes": 30,
      "feePkr": 3500,
      "isActive": true
    },
    {
      "mode": "phone",
      "durationMinutes": 15,
      "feePkr": 1500,
      "isActive": true
    }
  ]
}
```
* **Validation Rules:**
  * `services`: Array of max 4 services.
  * `mode`: Enum strictly `['chat', 'phone', 'video', 'in_chamber']`. No duplicate modes allowed.
  * `durationMinutes`: Enum `[15, 30, 45, 60]`.
  * `feePkr`: Integer from `0` to `200000`.
* **Success Response (200 OK):** Returns `{ "services": [...] }`.

---

### 3.8 Get Weekly Availability Rules
* **Method & Path:** `GET /lawyer/availability`
* **Access:** Private (`role: lawyer`, status must be `approved`)
* **Success Response (200 OK):**
```json
[
  {
    "id": "1a2b3c4d-5e6f-7a8b-9c0d-1e2f3a4b5c6d",
    "weekday": 1,
    "startTime": "09:00",
    "endTime": "13:00"
  },
  {
    "id": "2b3c4d5e-6f7a-8b9c-0d1e-2f3a4b5c6d7e",
    "weekday": 1,
    "startTime": "17:00",
    "endTime": "20:00"
  }
]
```

---

### 3.9 Set Weekly Availability Rules
* **Method & Path:** `PUT /lawyer/availability`
* **Access:** Private (`role: lawyer`, status must be `approved`)
* **Behavior:** Idempotently replaces all weekly rules inside a single database transaction.
* **Request Body:**
```json
{
  "rules": [
    { "weekday": 1, "startTime": "09:00", "endTime": "13:00" },
    { "weekday": 1, "startTime": "17:00", "endTime": "20:00" },
    { "weekday": 3, "startTime": "15:00", "endTime": "19:00" }
  ]
}
```
* **Validation Rules:**
  * `weekday`: Integer 1 to 7 (1 = Monday, 7 = Sunday).
  * `startTime` / `endTime`: String in 24-hr `HH:MM` format.
  * `endTime > startTime`.
  * No overlapping windows on the same weekday.
  * Maximum 3 windows per weekday.
* **Success Response (200 OK):** Returns array of sorted saved rules.

---

### 3.10 Manage Blocked Dates
* **List Blocked Dates:** `GET /lawyer/blocked-dates` (Returns chronological list of blocked dates)
* **Add Blocked Date:** `POST /lawyer/blocked-dates`
  * **Request Body:**
  ```json
  {
    "date": "2026-11-05",
    "reason": "District Bar Association strike"
  }
  ```
  * **Validation:** Valid `YYYY-MM-DD` date, cannot be in the past.
  * **Success Response (201 Created):** `{ "id": "...", "date": "2026-11-05", "reason": "...", "createdAt": "..." }`
  * **Conflict (409 Conflict):** `{"error": "This date is already blocked in your schedule"}`
* **Remove Blocked Date:** `DELETE /lawyer/blocked-dates/:id`
  * **Success Response (200 OK):** `{ "message": "Blocked date removed successfully" }`

---

## 4. Admin Portal Endpoints (`/api/v1/admin`)

### 4.1 List Applications
* **Method & Path:** `GET /admin/applications?status=pending`
* **Access:** Private (`role: admin`)
* **Query Parameters:** `status` (Optional: `"pending"`, `"approved"`, `"rejected"`)
* **Success Response (200 OK):**
```json
{
  "applications": [
    {
      "id": "c1f727b4-3a52-4a09-90bc-089c176e3381",
      "userId": "e6a21359-25bc-4f70-b992-6f29df5a0241",
      "barCouncil": "Punjab Bar Council",
      "enrolmentNo": "PBC-19842",
      "courtLevel": "Advocate High Court",
      "city": "Lahore",
      "practiceAreas": ["Corporate", "Civil"],
      "experienceYears": 10,
      "chamberAddress": "Chamber 402, High Court Bar Association, Lahore",
      "bio": "Specialized appellate advocate.",
      "status": "pending",
      "rejectionReason": null,
      "reviewedBy": null,
      "reviewedAt": null,
      "createdAt": "2026-10-18T08:00:00.000Z",
      "user": {
        "id": "e6a21359-25bc-4f70-b992-6f29df5a0241",
        "name": "Ahmed Khan",
        "email": "ahmed.lawyer@example.pk"
      }
    }
  ]
}
```

---

### 4.2 Approve Application
* **Method & Path:** `PATCH /admin/applications/:id/approve`
* **Access:** Private (`role: admin`)
* **Rule:** Only pending applications can be approved.
* **Success Response (200 OK):** Returns `{ "application": { "status": "approved", "reviewedBy": "...", "reviewedAt": "..." } }`.
* **Common Errors:** `409 Conflict` if application is already approved or rejected.

---

### 4.3 Reject Application
* **Method & Path:** `PATCH /admin/applications/:id/reject`
* **Access:** Private (`role: admin`)
* **Request Body:**
```json
{
  "rejectionReason": "Bar Council card expired. Please upload valid current enrollment license."
}
```
* **Validation Rule:** `rejectionReason` must be at least 10 characters.
* **Success Response (200 OK):** Returns `{ "application": { "status": "rejected", "rejectionReason": "...", "reviewedBy": "...", "reviewedAt": "..." } }`.

---

## 5. Public Directory Endpoints (`/api/v1/lawyers`)

### 5.1 Search Approved Lawyers
* **Method & Path:** `GET /lawyers`
* **Access:** Public (No authentication required)
* **Visibility Guard:** Only advocates whose application is `approved` AND whose profile `isPublic !== false` are listed.
* **Query Parameters:**
  * `city`: String (e.g. `Lahore`, `Multan`)
  * `practiceArea`: String (e.g. `Corporate`, `Family`)
  * `language`: Enum from `['Urdu', 'English', 'Punjabi', 'Sindhi', 'Pashto', 'Saraiki']`
  * `mode`: Enum from `['chat', 'phone', 'video', 'in_chamber']`
  * `minFee`: Number (minimum starting consultation fee in PKR)
  * `maxFee`: Number (maximum starting consultation fee in PKR)
  * `courtLevel`: Enum from `['Advocate Lower Courts', 'Advocate High Court', 'Advocate Supreme Court']`
  * `sort`: Enum `['experience', 'fee_asc', 'fee_desc', 'newest']` (Default: `'experience'`)
  * `page`: Integer (Default: 1)
  * `limit`: Integer (Default: 20, Max: 50)
* **Privacy Shielding Guarantee:** Returns **strictly** public fields. Never exposes `email`, `enrolmentNo`, or `chamberAddress`.
* **Success Response (200 OK):**
```json
{
  "items": [
    {
      "id": "c1f727b4-3a52-4a09-90bc-089c176e3381",
      "name": "Ahmed Khan",
      "city": "Lahore",
      "practiceAreas": ["Corporate", "Civil"],
      "experienceYears": 10,
      "barCouncil": "Punjab Bar Council",
      "courtLevel": "Advocate High Court",
      "bio": "Specialized appellate advocate.",
      "headline": "Senior Corporate & Appellate Counsel",
      "languages": ["Urdu", "English", "Punjabi"],
      "modes": ["in_chamber", "video"],
      "feeFrom": 3500
    }
  ],
  "total": 1,
  "page": 1,
  "limit": 20
}
```

---

### 5.2 Get Public Lawyer Profile
* **Method & Path:** `GET /lawyers/:id`
* **Access:** Public
* **Lookup Identifier:** Accepts either Application UUID or User UUID.
* **Visibility Guard:** Returns `404 Not Found` if the advocate does not exist, status is not `approved`, or profile `isPublic === false`.
* **Success Response (200 OK):**
```json
{
  "lawyer": {
    "id": "c1f727b4-3a52-4a09-90bc-089c176e3381",
    "name": "Ahmed Khan",
    "city": "Lahore",
    "practiceAreas": ["Corporate", "Civil"],
    "experienceYears": 10,
    "barCouncil": "Punjab Bar Council",
    "courtLevel": "Advocate High Court",
    "bio": "Specialized appellate advocate.",
    "headline": "Senior Corporate & Appellate Counsel",
    "about": "Over 10 years representing leading commercial organizations and handling civil disputes.",
    "languages": ["Urdu", "English", "Punjabi"],
    "slotMinutes": 30,
    "modes": ["in_chamber", "video"],
    "feeFrom": 3500,
    "services": [
      {
        "id": "7df381bb-6e21-4f11-9a70-8b01dc8a0912",
        "mode": "in_chamber",
        "durationMinutes": 45,
        "feePkr": 5000
      },
      {
        "id": "8ef492cc-7f32-4e22-8b81-9c12ed9b1023",
        "mode": "video",
        "durationMinutes": 30,
        "feePkr": 3500
      }
    ]
  }
}
```
* **Common Errors:** `404 Not Found` if the lawyer does not exist, status is not `approved`, or profile is private.

---

### 5.3 Query Real-Time Available Slots
* **Method & Path:** `GET /lawyers/:id/slots?from=YYYY-MM-DD&to=YYYY-MM-DD`
* **Access:** Public (No authentication required)
* **Lookup Identifier:** `id` is the `LawyerApplication` UUID.
* **Visibility Guard:** Returns `404 Not Found` if the advocate is unapproved or has set `isPublic: false`.
* **Query Parameters:**
  * `from`: String `YYYY-MM-DD` (Required, must be today or future in Pakistan time).
  * `to`: String `YYYY-MM-DD` (Required, must be $\ge$ `from`).
  * Maximum date range: `(to - from) <= 14 days`.
* **Slot Generation Rules:**
  * Slices lawyer's weekly availability windows by their configured `slotMinutes` (default: 30 mins).
  * Discards entire days that are listed in `blocked_dates`.
  * Enforces `MIN_LEAD_MINUTES = 120` (2 hours): if today, slots starting within 2 hours of current time are omitted.
  * Discards intervals that overlap with confirmed bookings.
* **Success Response (200 OK):**
```json
{
  "lawyerId": "c1f727b4-3a52-4a09-90bc-089c176e3381",
  "slotMinutes": 30,
  "timezone": "Asia/Karachi",
  "from": "2026-10-25",
  "to": "2026-10-27",
  "totalAvailableSlots": 12,
  "slots": [
    {
      "date": "2026-10-25",
      "startUtc": "2026-10-25T12:00:00.000Z",
      "endUtc": "2026-10-25T12:30:00.000Z",
      "startLocal": "17:00",
      "endLocal": "17:30"
    },
    {
      "date": "2026-10-25",
      "startUtc": "2026-10-25T12:30:00.000Z",
      "endUtc": "2026-10-25T13:00:00.000Z",
      "startLocal": "17:30",
      "endLocal": "18:00"
    }
  ]
}
```
* **Common Errors:**
  * `400 Bad Request`: `from` in the past, `to < from`, range > 14 days, or invalid date format.
  * `404 Not Found`: Advocate unapproved, non-existent, or profile private.

---

## 6. Consultation Bookings & Appointments (`/api/v1/bookings` & `/api/v1/lawyer/appointments`)

### 6.1 Create Booking Request
* **Method & Path:** `POST /bookings`
* **Access:** Private (`role: client`)
* **Request Body:**
```json
{
  "lawyerId": "c1f727b4-3a52-4a09-90bc-089c176e3381",
  "mode": "video",
  "startUtc": "2026-10-25T12:00:00.000Z",
  "clientNotes": "Seeking legal advisory regarding real estate inheritance partition."
}
```
* **Validation Rules:**
  * `lawyerId`: Valid UUID of an approved, public advocate.
  * `mode`: Enum strictly from `['chat', 'phone', 'video', 'in_chamber']`.
  * `startUtc`: ISO UTC timestamp, must be at least 120 minutes (2 hours) in the future.
  * `clientNotes`: String, max 1000 characters.
* **Success Response (201 Created):**
```json
{
  "booking": {
    "id": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
    "clientId": "d5f488f2-8c10-413d-82d2-8b438d821234",
    "lawyerId": "c1f727b4-3a52-4a09-90bc-089c176e3381",
    "mode": "video",
    "date": "2026-10-25",
    "startUtc": "2026-10-25T12:00:00.000Z",
    "endUtc": "2026-10-25T12:30:00.000Z",
    "durationMinutes": 30,
    "feePkr": 3500,
    "status": "pending",
    "clientNotes": "Seeking legal advisory regarding real estate inheritance partition.",
    "createdAt": "2026-10-20T10:00:00.000Z"
  }
}
```
* **Common Errors:**
  * `400 Bad Request`: Less than 2 hours in advance, or lawyer does not offer requested consultation mode.
  * `404 Not Found`: Advocate not found, unapproved, or private.
  * `409 Conflict`: `{"error": "This time slot is already booked or reserved by another client"}`.

---

### 6.2 List Client Appointments
* **Method & Path:** `GET /bookings/my-appointments?status=pending&page=1&limit=20`
* **Access:** Private (`role: client`)
* **Success Response (200 OK):**
```json
{
  "items": [
    {
      "id": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
      "lawyer": {
        "id": "c1f727b4-3a52-4a09-90bc-089c176e3381",
        "name": "Ahmed Khan",
        "city": "Lahore",
        "courtLevel": "Advocate High Court"
      },
      "mode": "video",
      "date": "2026-10-25",
      "startUtc": "2026-10-25T12:00:00.000Z",
      "endUtc": "2026-10-25T12:30:00.000Z",
      "durationMinutes": 30,
      "feePkr": 3500,
      "status": "pending",
      "clientNotes": "Seeking legal advisory...",
      "lawyerNotes": null,
      "cancellationReason": null,
      "createdAt": "2026-10-20T10:00:00.000Z"
    }
  ],
  "total": 1,
  "page": 1,
  "limit": 20
}
```

---

### 6.3 Get Appointment Details
* **Method & Path:** `GET /bookings/:id`
* **Access:** Private (Client who booked, assigned Advocate, or Admin)
* **Success Response (200 OK):** Returns `{ "booking": { "id": "...", ... } }`.
* **Common Errors:** `403 Forbidden` if user is unrelated to the appointment.

---

### 6.4 Cancel Appointment
* **Method & Path:** `PATCH /bookings/:id/cancel`
* **Access:** Private (Client or Advocate assigned to the appointment)
* **Request Body:**
```json
{
  "reason": "Family emergency; rescheduling consultation."
}
```
* **Validation:** `reason` must be at least 5 characters. Appointment must be `pending` or `confirmed` and cannot be in the past.
* **Success Response (200 OK):** Returns `{ "id": "...", "status": "cancelled", "cancellationReason": "..." }`.

---

### 6.5 List Advocate Appointments
* **Method & Path:** `GET /lawyer/appointments?status=pending&page=1&limit=20`
* **Access:** Private (`role: lawyer`, status `approved`)
* **Success Response (200 OK):** Returns `{ "items": [ { "id": "...", "client": { "id": "...", "name": "...", "email": "..." }, ... } ], "total": 1, "page": 1, "limit": 20 }`.

---

### 6.6 Confirm Appointment
* **Method & Path:** `PATCH /lawyer/appointments/:id/confirm`
* **Access:** Private (`role: lawyer`, status `approved`)
* **Request Body:** Optional `{ "lawyerNotes": "Preparation notes" }`.
* **State Transition:** Only `pending` appointments can be confirmed.
* **Success Response (200 OK):** Returns `{ "id": "...", "status": "confirmed", "lawyerNotes": "..." }`.

---

### 6.7 Reject Appointment
* **Method & Path:** `PATCH /lawyer/appointments/:id/reject`
* **Access:** Private (`role: lawyer`, status `approved`)
* **Request Body:**
```json
{
  "status": "rejected",
  "reason": "Advocate has urgent High Court hearing scheduled at this hour."
}
```
* **Validation:** `reason` is required with at least 5 characters.
* **Slot Behavior:** Once rejected, the slot is immediately released and available for other clients to book.
* **Success Response (200 OK):** Returns `{ "id": "...", "status": "rejected", "cancellationReason": "..." }`.

---

### 6.8 Complete Appointment
* **Method & Path:** `PATCH /lawyer/appointments/:id/complete`
* **Access:** Private (`role: lawyer`, status `approved`)
* **Request Body:** Optional `{ "lawyerNotes": "Meeting concluded; legal notice draft prepared." }`.
* **State Transition:** Only `confirmed` appointments can be marked completed.
* **Success Response (200 OK):** Returns `{ "id": "...", "status": "completed", "lawyerNotes": "..." }`.

---

## 7. Pre-Booking Enquiries & Lead Pipeline

### 7.1 Submit Pre-Booking Enquiry
* **Method & Path:** `POST /enquiries`
* **Access:** Private (`role: client`)
* **Request Body:**
```json
{
  "lawyerId": "b18bcf51-df56-424a-9ef8-e79435b5adbc",
  "practiceArea": "Corporate",
  "subject": "Contract dispute guidance",
  "message": "Our firm has a vendor that failed to deliver deliverables on time. Need assistance assessing legal notices."
}
```
* **Validation Rules:**
  * `lawyerId`: Valid UUID of an approved, public advocate (`LawyerApplication.id` or lawyer's `User.id`).
  * `practiceArea`: Must be one of the platform's allowed practice areas.
  * `subject`: 5 to 120 characters.
  * `message`: 10 to 2000 characters.
* **Anti-Spam Throttling:** Enforces maximum 3 active/unanswered (`submitted`) enquiries per client-lawyer pair. Exceeding returns `429 Too Many Requests`.
* **Success Response (201 Created):**
```json
{
  "id": "e7b1a234-871c-4389-a2c7-0129bc891112",
  "clientId": "c1f727b4-3a52-4a09-90bc-089c176e3381",
  "lawyerId": "b18bcf51-df56-424a-9ef8-e79435b5adbc",
  "practiceArea": "Corporate",
  "subject": "Contract dispute guidance",
  "message": "Our firm has a vendor that failed to deliver deliverables on time. Need assistance assessing legal notices.",
  "status": "submitted",
  "lawyerReply": null,
  "repliedAt": null,
  "convertedBookingId": null,
  "createdAt": "2026-10-23T10:00:00.000Z"
}
```
* **Common Errors:**
  * `400 Bad Request`: Validation failure or self-enquiry attempt.
  * `404 Not Found`: Advocate not found, unapproved, or `isPublic: false`.
  * `429 Too Many Requests`: Active pending enquiry limit reached.

---

### 7.2 List Client Enquiries
* **Method & Path:** `GET /enquiries/my-enquiries?status=submitted&page=1&limit=20`
* **Access:** Private (`role: client`)
* **Query Parameters:**
  * `status`: Optional filter (`submitted`, `answered`, `closed`).
  * `page`: Integer (default 1).
  * `limit`: Integer (default 20, max 50).
* **Success Response (200 OK):**
```json
{
  "enquiries": [
    {
      "id": "e7b1a234-871c-4389-a2c7-0129bc891112",
      "clientId": "c1f727b4-3a52-4a09-90bc-089c176e3381",
      "lawyerId": "b18bcf51-df56-424a-9ef8-e79435b5adbc",
      "lawyerName": "Advocate Tariq Multan",
      "city": "Multan",
      "courtLevel": "Advocate High Court",
      "practiceArea": "Corporate",
      "subject": "Contract dispute guidance",
      "message": "Our firm has a vendor that failed to deliver deliverables on time.",
      "status": "submitted",
      "lawyerReply": null,
      "repliedAt": null,
      "convertedBookingId": null,
      "createdAt": "2026-10-23T10:00:00.000Z",
      "updatedAt": "2026-10-23T10:00:00.000Z"
    }
  ],
  "total": 1,
  "page": 1,
  "limit": 20
}
```

---

### 7.3 Get Single Enquiry Details
* **Method & Path:** `GET /enquiries/:id`
* **Access:** Private (Client who submitted, assigned Advocate, or Admin)
* **Success Response (200 OK):**
```json
{
  "id": "e7b1a234-871c-4389-a2c7-0129bc891112",
  "clientId": "c1f727b4-3a52-4a09-90bc-089c176e3381",
  "clientName": "Client Asif",
  "clientEmail": "asif@example.pk",
  "lawyerId": "b18bcf51-df56-424a-9ef8-e79435b5adbc",
  "lawyerName": "Advocate Tariq Multan",
  "city": "Multan",
  "courtLevel": "Advocate High Court",
  "practiceArea": "Corporate",
  "subject": "Contract dispute guidance",
  "message": "Our firm has a vendor...",
  "status": "answered",
  "lawyerReply": "Please schedule a 30-minute consultation so we can examine the contract clauses.",
  "repliedAt": "2026-10-23T11:00:00.000Z",
  "convertedBooking": null,
  "createdAt": "2026-10-23T10:00:00.000Z",
  "updatedAt": "2026-10-23T11:00:00.000Z"
}
```
* **Common Errors:** `403 Forbidden` if user is unrelated to this enquiry.

---

### 7.4 Close Enquiry
* **Method & Path:** `PATCH /enquiries/:id/close`
* **Access:** Private (Client, assigned Advocate, or Admin)
* **Success Response (200 OK):**
```json
{
  "message": "Enquiry closed successfully",
  "id": "e7b1a234-871c-4389-a2c7-0129bc891112",
  "status": "closed"
}
```
* **Common Errors:** `400 Bad Request` if enquiry is already closed.

---

### 7.5 List Advocate Received Enquiries
* **Method & Path:** `GET /lawyer/enquiries?status=submitted&page=1&limit=20`
* **Access:** Private (`role: lawyer`, status `approved`)
* **Query Parameters:** `status` (optional), `page`, `limit`.
* **Success Response (200 OK):**
```json
{
  "enquiries": [
    {
      "id": "e7b1a234-871c-4389-a2c7-0129bc891112",
      "clientId": "c1f727b4-3a52-4a09-90bc-089c176e3381",
      "clientName": "Client Asif",
      "clientEmail": "asif@example.pk",
      "practiceArea": "Corporate",
      "subject": "Contract dispute guidance",
      "message": "Our firm has a vendor that failed to deliver...",
      "status": "submitted",
      "lawyerReply": null,
      "repliedAt": null,
      "convertedBookingId": null,
      "createdAt": "2026-10-23T10:00:00.000Z",
      "updatedAt": "2026-10-23T10:00:00.000Z"
    }
  ],
  "total": 1,
  "page": 1,
  "limit": 20
}
```

---

### 7.6 Advocate Reply to Enquiry
* **Method & Path:** `PATCH /lawyer/enquiries/:id/reply`
* **Access:** Private (`role: lawyer`, status `approved`)
* **Request Body:**
```json
{
  "reply": "I have reviewed your inquiry. Please schedule an in-chamber consultation so we can verify the revenue records and title documents."
}
```
* **Validation:** `reply` must be between 10 and 2000 characters.
* **Success Response (200 OK):**
```json
{
  "id": "e7b1a234-871c-4389-a2c7-0129bc891112",
  "clientId": "c1f727b4-3a52-4a09-90bc-089c176e3381",
  "lawyerId": "e6a21359-25bc-4f70-b992-6f29df5a0241",
  "practiceArea": "Corporate",
  "subject": "Contract dispute guidance",
  "message": "Our firm has a vendor...",
  "status": "answered",
  "lawyerReply": "I have reviewed your inquiry. Please schedule an in-chamber consultation so we can verify the revenue records and title documents.",
  "repliedAt": "2026-10-23T11:00:00.000Z",
  "convertedBookingId": null,
  "updatedAt": "2026-10-23T11:00:00.000Z"
}
```
* **Common Errors:**
  * `400 Bad Request`: Cannot reply to a closed enquiry.
  * `403 Forbidden`: Attempting to reply to an enquiry belonging to another advocate.

---

## 8. Rule-Based Matching Engine

### 8.1 Classify Legal Problem Description
* **Method & Path:** `POST /match/classify`
* **Access:** Public (No authentication required)
* **Request Body:**
```json
{
  "text": "My husband has issued a talaq notice and I need to file for khula and seek child custody for my daughter."
}
```
* **Validation Rules:** `text` is required, between 10 and 1000 characters.
* **Success Response (200 OK):**
```json
{
  "practiceArea": "Family",
  "confidence": "high",
  "matchedKeywords": ["talaq", "khula", "custody"],
  "alternatives": [],
  "followUpQuestions": [
    {
      "key": "city",
      "question": "In which city or district is your legal matter located?",
      "type": "select"
    },
    {
      "key": "urgency",
      "question": "How quickly do you need a consultation with an advocate?",
      "options": ["today", "this_week", "flexible"],
      "type": "select"
    },
    {
      "key": "documents",
      "question": "Do you have relevant official documents, notices, or contracts ready?",
      "options": ["yes", "partial", "no"],
      "type": "select"
    },
    {
      "key": "categoryDetail",
      "question": "Has a family suit for khula, custody, or maintenance already been filed in Family Court?",
      "type": "text"
    }
  ]
}
```
* **Confidence Logic:**
  * `high`: Top practice area has $\ge 2$ keyword hits and leads the runner-up area by $\ge 1$.
  * `low`: Top area has 1 keyword hit, or there is a numerical tie.
  * `none`: 0 keyword hits detected (`practiceArea` is `null`).

---

### 8.2 Multi-Factor Match Search
* **Method & Path:** `POST /match/search`
* **Access:** Public (No authentication required)
* **Request Body:**
```json
{
  "practiceArea": "Corporate",
  "city": "Multan",
  "urgency": "this_week",
  "maxFeePkr": 5000,
  "mode": "video",
  "language": "Saraiki",
  "page": 1,
  "limit": 10
}
```
* **Validation Rules:**
  * `practiceArea`: Required, must be one of the standard practice areas.
  * `city`: Optional valid Pakistani city.
  * `urgency`: Optional (`today`, `this_week`, `flexible`).
  * `maxFeePkr`: Optional integer (0 to 200,000).
  * `mode`: Optional (`video`, `in_chamber`, `phone`, `chat`).
  * `language`: Optional regional language.
* **Scoring Matrix (Max 100 Points):**
  * City: **30 points**
  * Urgency & Available Slot: **25 points** (within 24h for `today`, within 7d for `this_week`, 10 pts within 14d for `flexible`)
  * Mode: **15 points**
  * Budget: **10 points**
  * Language: **10 points**
  * Experience: **10 points** ($\min(\text{years}, 15) / 15 \times 10$)
* **Regulatory Compliance (Rule 135):** Rating stars and paid promotions are strictly excluded from the match score. `reasons[]` consists of factual sentences without commercial superlatives.
* **Success Response (200 OK):**
```json
{
  "items": [
    {
      "id": "c1f727b4-3a52-4a09-90bc-089c176e3381",
      "name": "Advocate Multan Corporate",
      "role": "lawyer",
      "courtLevel": "Advocate High Court",
      "city": "Multan",
      "practiceAreas": ["Corporate", "Civil"],
      "experienceYears": 15,
      "headline": "Corporate & Commercial Counsel",
      "languages": ["Urdu", "Saraiki"],
      "modes": ["video"],
      "feeFrom": 3000,
      "score": 100,
      "reasons": [
        "Practises Corporate law",
        "Based in Multan",
        "Consults in Saraiki",
        "Offers video consultations",
        "Consultation fee within your 5,000 PKR budget",
        "15 years of professional legal experience",
        "Consultation slot available this week"
      ],
      "nextSlot": "2026-10-26T12:00:00.000Z"
    }
  ],
  "total": 1,
  "page": 1,
  "limit": 10
}
```

---

## 9. Booking Lifecycle, Simulated Payments & Audit Trails (`/api/v1/bookings`)

### 9.1 Create Consultation Appointment
* **Method & Path:** `POST /bookings`
* **Access:** Private (`role: client`)
* **Request Body:**
```json
{
  "lawyerId": "c1f727b4-3a52-4a09-90bc-089c176e3381",
  "mode": "video",
  "startsAt": "2030-05-10T12:00:00.000Z",
  "issueSummary": "Client seeking legal counsel on property partition deed in Multan.",
  "enquiryId": null
}
```
* **Validation Rules:**
  * `lawyerId`: Required UUID of approved advocate application.
  * `mode`: Required (`video`, `in_chamber`, `phone`, `chat`).
  * `startsAt`: Required ISO UTC timestamp, must be at least 120 minutes in advance.
  * `issueSummary`: String (10 to 1,000 characters).
* **Guards & Concurrency:**
  * Client cannot have more than 3 active open bookings (`requested`, `accepted`, `paid`, `confirmed`).
  * Partial Unique Index on `(lawyerId, startsAt)` physically guarantees slot exclusivity at the PostgreSQL level (prevents double-booking race conditions).
  * Request expiry defaults to `now + 24 hours`.
* **Success Response (201 Created):**
```json
{
  "booking": {
    "id": "b83f3604-d538-4b72-b5b6-7eb5d0f1917d",
    "clientId": "e6a21359-25bc-4f70-b992-6f29df5a0241",
    "lawyerId": "c1f727b4-3a52-4a09-90bc-089c176e3381",
    "mode": "video",
    "date": "2030-05-10",
    "startsAt": "2030-05-10T12:00:00.000Z",
    "endsAt": "2030-05-10T12:30:00.000Z",
    "durationMinutes": 30,
    "feePkr": 4000,
    "status": "requested",
    "issueSummary": "Client seeking legal counsel on property partition deed in Multan.",
    "expiresAt": "2030-05-09T12:00:00.000Z",
    "createdAt": "2030-05-08T12:00:00.000Z"
  }
}
```

---

### 9.2 Advocate Accepts Booking
* **Method & Path:** `PATCH /bookings/:id/accept`
* **Access:** Private (`role: lawyer`, `role: law_firm` — must own the booking)
* **Rule:** Allowed only from `requested` status. Sets `expiresAt = now + 12 hours` for client payment.
* **Success Response (200 OK):**
```json
{
  "id": "b83f3604-d538-4b72-b5b6-7eb5d0f1917d",
  "status": "accepted",
  "expiresAt": "2030-05-09T00:00:00.000Z",
  "lawyerNotes": "Briefing accepted; please provide property records.",
  "updatedAt": "2030-05-08T12:05:00.000Z"
}
```

---

### 9.3 Advocate Declines Booking
* **Method & Path:** `PATCH /bookings/:id/decline`
* **Access:** Private (`role: lawyer`, `role: law_firm`)
* **Request Body:**
```json
{
  "reason": "Advocate is engaged in Supreme Court hearing on this date."
}
```
* **Validation Rule:** `reason` must be at least 10 characters.
* **Success Response (200 OK):**
```json
{
  "id": "b83f3604-d538-4b72-b5b6-7eb5d0f1917d",
  "status": "declined",
  "declineReason": "Advocate is engaged in Supreme Court hearing on this date.",
  "updatedAt": "2030-05-08T12:06:00.000Z"
}
```

---

### 9.4 Client Simulated Sandbox Payment
* **Method & Path:** `POST /bookings/:id/pay`
* **Access:** Private (`role: client` — must own the booking)
* **Rule:** Allowed only from `accepted` status before 12h expiry.
* **Request Body:**
```json
{
  "method": "sandbox"
}
```
* **Success Response (200 OK):**
```json
{
  "success": true,
  "sandbox": true,
  "booking": {
    "id": "b83f3604-d538-4b72-b5b6-7eb5d0f1917d",
    "status": "paid",
    "feePkr": 4000
  },
  "payment": {
    "id": "f5e927cb-c052-4a0b-9df9-14a58eb4ff21",
    "amountPkr": 4000,
    "method": "sandbox",
    "status": "succeeded",
    "reference": "SBX-1730000000000-A1B2C3",
    "createdAt": "2030-05-08T12:10:00.000Z"
  }
}
```

---

### 9.5 Advocate Confirms Appointment
* **Method & Path:** `PATCH /bookings/:id/confirm`
* **Access:** Private (`role: lawyer`, `role: law_firm`)
* **Rule:** Allowed only from `paid` status.
* **Request Body:**
```json
{
  "sessionInfo": "https://meet.jit.si/legalhub-multan-civil-case-98",
  "lawyerNotes": "Please join 5 minutes early with title deed copies."
}
```
* **Validation Rule:** `sessionInfo` is required (min 5 characters) for `video` and `in_chamber` consultation modes.
* **Success Response (200 OK):**
```json
{
  "id": "b83f3604-d538-4b72-b5b6-7eb5d0f1917d",
  "status": "confirmed",
  "sessionInfo": "https://meet.jit.si/legalhub-multan-civil-case-98",
  "lawyerNotes": "Please join 5 minutes early with title deed copies.",
  "updatedAt": "2030-05-08T12:15:00.000Z"
}
```

---

### 9.6 Advocate Completes Appointment
* **Method & Path:** `PATCH /bookings/:id/complete`
* **Access:** Private (`role: lawyer`, `role: law_firm`)
* **Rule:** Allowed only from `confirmed` status after `startsAt` has elapsed.
* **Success Response (200 OK):**
```json
{
  "id": "b83f3604-d538-4b72-b5b6-7eb5d0f1917d",
  "status": "completed",
  "lawyerNotes": "Consultation concluded; legal notice issued.",
  "updatedAt": "2030-05-10T12:35:00.000Z"
}
```

---

### 9.7 Client or Advocate Cancels Appointment
* **Method & Path:** `PATCH /bookings/:id/cancel`
* **Access:** Private (`role: client` or `role: lawyer` involved in booking)
* **Request Body:**
```json
{
  "reason": "Sudden domestic emergency prevents attendance."
}
```
* **Validation Rule:** `reason` must be at least 5 characters.
* **Refund Guarantee:** If booking was paid, associated `Payment` record status automatically transitions to `refunded`.
* **Success Response (200 OK):**
```json
{
  "id": "b83f3604-d538-4b72-b5b6-7eb5d0f1917d",
  "status": "cancelled",
  "cancelReason": "Sudden domestic emergency prevents attendance.",
  "updatedAt": "2030-05-09T08:00:00.000Z"
}
```

---

### 9.8 Admin Issues Consultation Refund
* **Method & Path:** `PATCH /admin/bookings/:id/refund`
* **Access:** Private (`role: admin`)
* **Rule:** Allowed only from `paid`, `confirmed`, or `completed` status.
* **Request Body:**
```json
{
  "reason": "Technical connectivity failure during video consultation."
}
```
* **Validation Rule:** `reason` must be at least 10 characters.
* **Success Response (200 OK):**
```json
{
  "id": "b83f3604-d538-4b72-b5b6-7eb5d0f1917d",
  "status": "refunded",
  "refundReason": "Technical connectivity failure during video consultation.",
  "paymentStatus": "refunded",
  "updatedAt": "2030-05-10T13:00:00.000Z"
}
```

---

### 9.9 Get Appointment Details (With Credential Masking & Audit Events)
* **Method & Path:** `GET /bookings/:id`
* **Access:** Private (`role: client`, `role: lawyer` involved in booking, or `role: admin`)
* **Confidentiality Guard:** `sessionInfo` is masked as `null` for clients until the booking reaches `confirmed` status.
* **Success Response (200 OK):**
```json
{
  "booking": {
    "id": "b83f3604-d538-4b72-b5b6-7eb5d0f1917d",
    "clientId": "e6a21359-25bc-4f70-b992-6f29df5a0241",
    "clientName": "Zahid Multan",
    "lawyerId": "c1f727b4-3a52-4a09-90bc-089c176e3381",
    "lawyerName": "Advocate Tariq Khan",
    "mode": "video",
    "date": "2030-05-10",
    "startsAt": "2030-05-10T12:00:00.000Z",
    "endsAt": "2030-05-10T12:30:00.000Z",
    "durationMinutes": 30,
    "feePkr": 4000,
    "status": "confirmed",
    "issueSummary": "Client seeking legal counsel on property partition deed in Multan.",
    "sessionInfo": "https://meet.jit.si/legalhub-multan-civil-case-98",
    "payment": {
      "id": "f5e927cb-c052-4a0b-9df9-14a58eb4ff21",
      "amountPkr": 4000,
      "method": "sandbox",
      "status": "succeeded",
      "reference": "SBX-1730000000000-A1B2C3",
      "createdAt": "2030-05-08T12:10:00.000Z"
    },
    "events": [
      {
        "id": "e1",
        "fromStatus": null,
        "toStatus": "requested",
        "note": "Consultation appointment requested by client",
        "actor": { "id": "e6a21359-25bc-4f70-b992-6f29df5a0241", "name": "Zahid Multan", "role": "client" },
        "createdAt": "2030-05-08T12:00:00.000Z"
      },
      {
        "id": "e2",
        "fromStatus": "requested",
        "toStatus": "accepted",
        "note": "Advocate accepted booking request",
        "actor": { "id": "l1", "name": "Advocate Tariq Khan", "role": "lawyer" },
        "createdAt": "2030-05-08T12:05:00.000Z"
      },
      {
        "id": "e3",
        "fromStatus": "accepted",
        "toStatus": "paid",
        "note": "Simulated sandbox payment succeeded (Ref: SBX-...)",
        "actor": { "id": "e6a21359-25bc-4f70-b992-6f29df5a0241", "name": "Zahid Multan", "role": "client" },
        "createdAt": "2030-05-08T12:10:00.000Z"
      },
      {
        "id": "e4",
        "fromStatus": "paid",
        "toStatus": "confirmed",
        "note": "Advocate confirmed appointment",
        "actor": { "id": "l1", "name": "Advocate Tariq Khan", "role": "lawyer" },
        "createdAt": "2030-05-08T12:15:00.000Z"
      }
    ],
    "createdAt": "2030-05-08T12:00:00.000Z",
    "updatedAt": "2030-05-08T12:15:00.000Z"
  }
}
```

---

## 10. Consultation Notes (`/api/v1/bookings/:id/notes`)

Protected advocate work products (*Basta* notes) containing case observations, tactical advice, and action items.

### 10.1 Retrieve Consultation Notes
* **Method & Path:** `GET /bookings/:id/notes`
* **Access:** Private (`role: lawyer` or `role: law_firm` who is assigned to this booking)
* **Pre-condition:** Booking must be in `confirmed` or `completed` status. Returns `400 Bad Request` if unconfirmed.
* **Privacy Guard:** Clients receive `403 Forbidden` (`"Forbidden: Only the assigned legal practitioner can view or record consultation notes"`).
* **Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Consultation notes retrieved successfully",
  "data": {
    "id": "8f2a1b3c-4d5e-6f7a-8b9c-0d1e2f3a4b5c",
    "bookingId": "b83f3604-d538-4b72-b5b6-7eb5d0f1917d",
    "lawyerId": "c1f727b4-3a52-4a09-90bc-089c176e3381",
    "summary": "Client presented registry deeds for Multan Cantt land. Boundary wall dispute.",
    "actionItems": [
      "Obtain certified copy of Aks-Shajra from Patwari",
      "File suit for permanent injunction in Civil Court"
    ],
    "privateNotes": "Check limitation period under Limitation Act 1908 before drafting.",
    "createdAt": "2030-05-10T12:35:00.000Z",
    "updatedAt": "2030-05-10T12:35:00.000Z"
  }
}
```
*(If no note has been recorded yet, `data` is `null`).*

---

### 10.2 Upsert Consultation Notes
* **Method & Path:** `PUT /bookings/:id/notes`
* **Access:** Private (`role: lawyer` or `role: law_firm` assigned to this booking)
* **Pre-condition:** Booking must be `confirmed` or `completed`.
* **Request Body:**
```json
{
  "summary": "Client presented registry deeds for Multan Cantt land. Boundary wall dispute.",
  "actionItems": [
    "Obtain certified copy of Aks-Shajra from Patwari",
    "File suit for permanent injunction in Civil Court"
  ],
  "privateNotes": "Check limitation period under Limitation Act 1908 before drafting."
}
```
* **Validation Rules:**
  * `summary`: String, max 2000 chars, optional.
  * `actionItems`: Array of strings (each max 300 chars, max 20 items), optional.
  * `privateNotes`: String, max 5000 chars, optional.
* **Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Consultation notes saved successfully",
  "data": {
    "id": "8f2a1b3c-4d5e-6f7a-8b9c-0d1e2f3a4b5c",
    "bookingId": "b83f3604-d538-4b72-b5b6-7eb5d0f1917d",
    "lawyerId": "c1f727b4-3a52-4a09-90bc-089c176e3381",
    "summary": "Client presented registry deeds for Multan Cantt land. Boundary wall dispute.",
    "actionItems": [
      "Obtain certified copy of Aks-Shajra from Patwari",
      "File suit for permanent injunction in Civil Court"
    ],
    "privateNotes": "Check limitation period under Limitation Act 1908 before drafting.",
    "createdAt": "2030-05-10T12:35:00.000Z",
    "updatedAt": "2030-05-10T12:35:00.000Z"
  }
}
```

---

## 11. Formal Legal Engagements (`/api/v1/engagements`)

Represents continuing case representation (Vakalatnama) converted from a consultation or directly established.

### 11.1 Create Engagement
* **Method & Path:** `POST /engagements`
* **Access:** Private (`role: client`, `role: lawyer`, or `role: law_firm`)
* **Request Body (Client initiating):**
```json
{
  "lawyerId": "c1f727b4-3a52-4a09-90bc-089c176e3381",
  "bookingId": "b83f3604-d538-4b72-b5b6-7eb5d0f1917d",
  "title": "Civil Revision in Multan High Court Bench",
  "practiceArea": "Civil",
  "notes": "Converted from consultation. Vakalatnama signed."
}
```
* **Validation Rules:**
  * `title`: String, 3 to 120 characters.
  * `practiceArea`: Must match one of the predefined `PRACTICE_AREAS`.
  * `bookingId`: Optional valid UUID.
  * `notes`: Optional string, max 5000 characters.
* **Success Response (201 Created):**
```json
{
  "success": true,
  "message": "Engagement created successfully",
  "data": {
    "id": "e8a1d2c3-1122-3344-5566-778899aabbcc",
    "clientId": "e6a21359-25bc-4f70-b992-6f29df5a0241",
    "lawyerId": "c1f727b4-3a52-4a09-90bc-089c176e3381",
    "bookingId": "b83f3604-d538-4b72-b5b6-7eb5d0f1917d",
    "title": "Civil Revision in Multan High Court Bench",
    "practiceArea": "Civil",
    "status": "active",
    "startedAt": "2030-05-10T13:00:00.000Z",
    "closedAt": null,
    "notes": "Converted from consultation. Vakalatnama signed.",
    "createdAt": "2030-05-10T13:00:00.000Z",
    "updatedAt": "2030-05-10T13:00:00.000Z"
  }
}
```

---

### 11.2 List Engagements
* **Method & Path:** `GET /engagements?status=active&page=1&limit=10`
* **Access:** Private (Authenticated participant sees only their own engagements)
* **Query Parameters:**
  * `status`: Optional enum `['active', 'closed']`.
  * `page`: Integer $\ge 1$ (default: 1).
  * `limit`: Integer 1-50 (default: 10).
* **Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Engagements retrieved successfully",
  "data": [
    {
      "id": "e8a1d2c3-1122-3344-5566-778899aabbcc",
      "clientId": "e6a21359-25bc-4f70-b992-6f29df5a0241",
      "lawyerId": "c1f727b4-3a52-4a09-90bc-089c176e3381",
      "title": "Civil Revision in Multan High Court Bench",
      "practiceArea": "Civil",
      "status": "active",
      "startedAt": "2030-05-10T13:00:00.000Z",
      "closedAt": null,
      "client": {
        "id": "e6a21359-25bc-4f70-b992-6f29df5a0241",
        "fullName": "Zahid Multan",
        "email": "zahid@example.com"
      },
      "lawyer": {
        "id": "c1f727b4-3a52-4a09-90bc-089c176e3381",
        "fullName": "Advocate Tariq Khan",
        "email": "tariq@example.com",
        "role": "lawyer"
      }
    }
  ],
  "pagination": {
    "total": 1,
    "page": 1,
    "limit": 10,
    "totalPages": 1
  }
}
```

---

### 11.3 Get Engagement By ID
* **Method & Path:** `GET /engagements/:id`
* **Access:** Private (Participant or Admin only)
* **Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Engagement retrieved successfully",
  "data": {
    "id": "e8a1d2c3-1122-3344-5566-778899aabbcc",
    "title": "Civil Revision in Multan High Court Bench",
    "practiceArea": "Civil",
    "status": "active",
    "startedAt": "2030-05-10T13:00:00.000Z",
    "closedAt": null,
    "notes": "Converted from consultation. Vakalatnama signed.",
    "client": { "id": "e6a21359-25bc-4f70-b992-6f29df5a0241", "fullName": "Zahid Multan" },
    "lawyer": { "id": "c1f727b4-3a52-4a09-90bc-089c176e3381", "fullName": "Advocate Tariq Khan", "role": "lawyer" },
    "booking": { "id": "b83f3604-d538-4b72-b5b6-7eb5d0f1917d", "status": "completed", "totalFeePkr": 3500 }
  }
}
```

---

### 11.4 Update / Close Engagement
* **Method & Path:** `PATCH /engagements/:id`
* **Access:** Private (Participant or Admin)
* **Request Body:**
```json
{
  "status": "closed",
  "notes": "Matter successfully settled out of court. File closed."
}
```
* **Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Engagement updated successfully",
  "data": {
    "id": "e8a1d2c3-1122-3344-5566-778899aabbcc",
    "status": "closed",
    "closedAt": "2030-06-15T10:00:00.000Z",
    "notes": "Matter successfully settled out of court. File closed.",
    "updatedAt": "2030-06-15T10:00:00.000Z"
  }
}
```

---

## 12. Verified Reviews & Ratings (`/api/v1/bookings/:id/review` & `/api/v1/lawyers/:id/reviews`)

Verified-only review subsystem compliant with Pakistan Bar Council Rule 135.

### 12.1 Submit Verified Review
* **Method & Path:** `POST /bookings/:id/review`
* **Access:** Private (`role: client` who booked the consultation)
* **Pre-conditions:**
  1. Booking status must be `completed` (rejects with `400 Bad Request` if uncompleted).
  2. Single review per booking (duplicate submissions rejected with `409 Conflict`).
  3. Lawyers cannot review themselves (`403 Forbidden`).
* **Request Body:**
```json
{
  "rating": 5,
  "comment": "Very professional consultation. Advocate Hamza explained the land registry process clearly."
}
```
* **Validation Rules:**
  * `rating`: Integer strictly between 1 and 5.
  * `comment`: String, 10 to 1000 characters.
* **Success Response (201 Created):**
```json
{
  "success": true,
  "message": "Review submitted successfully",
  "data": {
    "id": "r1a2b3c4-9988-7766-5544-33221100aabb",
    "bookingId": "b83f3604-d538-4b72-b5b6-7eb5d0f1917d",
    "clientId": "e6a21359-25bc-4f70-b992-6f29df5a0241",
    "lawyerId": "c1f727b4-3a52-4a09-90bc-089c176e3381",
    "rating": 5,
    "comment": "Very professional consultation. Advocate Hamza explained the land registry process clearly.",
    "isPublic": true,
    "createdAt": "2030-05-10T14:00:00.000Z",
    "updatedAt": "2030-05-10T14:00:00.000Z"
  }
}
```

---

### 12.2 Get Public Practitioner Reviews & Aggregate Statistics
* **Method & Path:** `GET /lawyers/:id/reviews?page=1&limit=10`
* **Access:** Public (No authentication required)
* **Lookup Identifier:** `id` is the practitioner's User UUID.
* **Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Reviews retrieved successfully",
  "data": {
    "lawyer": {
      "id": "c1f727b4-3a52-4a09-90bc-089c176e3381",
      "fullName": "Advocate Hamza Lodhi",
      "role": "lawyer"
    },
    "statistics": {
      "avgRating": 4.8,
      "reviewCount": 15,
      "ratingBreakdown": {
        "1": 0,
        "2": 0,
        "3": 1,
        "4": 2,
        "5": 12
      }
    },
    "reviews": [
      {
        "id": "r1a2b3c4-9988-7766-5544-33221100aabb",
        "rating": 5,
        "comment": "Very professional consultation. Advocate Hamza explained the land registry process clearly.",
        "createdAt": "2030-05-10T14:00:00.000Z",
        "client": {
          "id": "e6a21359-25bc-4f70-b992-6f29df5a0241",
          "fullName": "Zahid Multan"
        }
      }
    ],
    "pagination": {
      "total": 15,
      "page": 1,
      "limit": 10,
      "totalPages": 2
    }
  }
}
```

---

### 12.3 Submit Chamber Response to Verified Review
* **Method & Path:** `POST /bookings/:id/review/reply`
* **Access:** Private (`role: lawyer` assigned to the booking)
* **Pre-conditions:**
  1. A verified review must exist for this `bookingId` (`404 Not Found` if missing).
  2. The authenticated user must be the advocate who conducted this consultation (`403 Forbidden` if another user).
  3. Advocate application status must be approved (`requireApprovedLawyer`).
* **Request Body:**
```json
{
  "reply": "Thank you for consulting my chamber. We will ensure the draft revision petition is completed promptly."
}
```
* **Validation Rules:**
  * `reply`: String, non-empty, trimmed (1 to 2000 characters).
* **Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Reply submitted successfully",
  "data": {
    "id": "r1a2b3c4-9988-7766-5544-33221100aabb",
    "bookingId": "b83f3604-d538-4b72-b5b6-7eb5d0f1917d",
    "clientId": "e6a21359-25bc-4f70-b992-6f29df5a0241",
    "lawyerId": "c1f727b4-3a52-4a09-90bc-089c176e3381",
    "rating": 5,
    "comment": "Very professional consultation. Advocate Hamza explained the land registry process clearly.",
    "lawyerReply": "Thank you for consulting my chamber. We will ensure the draft revision petition is completed promptly.",
    "repliedAt": "2030-05-11T09:30:00.000Z",
    "isPublic": true,
    "createdAt": "2030-05-10T14:00:00.000Z",
    "updatedAt": "2030-05-11T09:30:00.000Z"
  }
}
```

---

## 13. Consultation Notes API (`/api/v1/bookings/:id/notes`)

Privileged legal work product (*Basta*) system. Allows practicing advocates to maintain confidential proceedings notes, action checklists, and private legal strategy for confirmed and completed consultations.

### 13.1 Get Consultation Notes
* **Method & Path:** `GET /bookings/:id/notes`
* **Access:** Private (`role: lawyer` assigned to the booking)
* **Pre-conditions:**
  1. Booking must exist and belong to the authenticated lawyer (`403 Forbidden` if not owner).
  2. Booking status must be `confirmed` or `completed` (`400 Bad Request` if unconfirmed/pending/cancelled).
* **Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Consultation notes retrieved successfully",
  "data": {
    "id": "n1b2c3d4-5566-7788-9900-aabbccddeeff",
    "bookingId": "b83f3604-d538-4b72-b5b6-7eb5d0f1917d",
    "lawyerId": "c1f727b4-3a52-4a09-90bc-089c176e3381",
    "summary": "Litigant presented ancestral revenue record (Fard Malkiat) regarding disputed agricultural land in Mauza Suraj Miani.",
    "actionItems": [
      "Obtain certified copies of mutation registry from Revenue Halqa Patwari",
      "Draft injunction application under Order 39 Rules 1 & 2 CPC",
      "Verify status of civil suit pending in Senior Civil Judge Court"
    ],
    "privateNotes": "Client appears anxious about temporary injunction. Limitation expires next Thursday.",
    "createdAt": "2030-05-10T15:30:00.000Z",
    "updatedAt": "2030-05-10T16:00:00.000Z"
  }
}
```
*Note: If no notes have been recorded yet, `data` is `null` with a `200 OK` status.*

---

### 13.2 Save / Upsert Consultation Notes
* **Method & Path:** `PUT /bookings/:id/notes`
* **Access:** Private (`role: lawyer` assigned to the booking)
* **Pre-conditions:**
  1. Booking must belong to the authenticated advocate.
  2. Booking status must be `confirmed` or `completed`.
* **Request Body:**
```json
{
  "summary": "Litigant presented ancestral revenue record (Fard Malkiat) regarding disputed agricultural land in Mauza Suraj Miani.",
  "actionItems": [
    "Obtain certified copies of mutation registry from Revenue Halqa Patwari",
    "Draft injunction application under Order 39 Rules 1 & 2 CPC"
  ],
  "privateNotes": "Limitation period requires filing before Senior Civil Judge next week."
}
```
* **Validation Rules:**
  * `summary`: String, optional/nullable, max 2000 characters.
  * `actionItems`: Array of strings, optional, max 20 items, each string 1 to 300 characters.
  * `privateNotes`: String, optional/nullable, max 5000 characters.
* **Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Consultation notes saved successfully",
  "data": {
    "id": "n1b2c3d4-5566-7788-9900-aabbccddeeff",
    "bookingId": "b83f3604-d538-4b72-b5b6-7eb5d0f1917d",
    "lawyerId": "c1f727b4-3a52-4a09-90bc-089c176e3381",
    "summary": "Litigant presented ancestral revenue record (Fard Malkiat) regarding disputed agricultural land in Mauza Suraj Miani.",
    "actionItems": [
      "Obtain certified copies of mutation registry from Revenue Halqa Patwari",
      "Draft injunction application under Order 39 Rules 1 & 2 CPC"
    ],
    "privateNotes": "Limitation period requires filing before Senior Civil Judge next week.",
    "createdAt": "2030-05-10T15:30:00.000Z",
    "updatedAt": "2030-05-10T16:15:00.000Z"
  }
}
```

---

## 14. Case Management Endpoints (`/api/v1/cases`)

> **Phase 3 (Case Journey) — Part H**  
> Covers confidential advocate case files, parties, status/stage tracking, and client whitelist projection.

### 14.1 Create New Case
* **Method & Path:** `POST /cases`
* **Access:** Private (`role: lawyer` with approved advocate status)
* **Pre-conditions:**
  1. Authenticated user must be an approved advocate.
  2. If `bookingId` is provided:
     * Booking must exist and belong to the authenticated advocate.
     * Booking status must be strictly `completed`.
     * Booking must not already be linked to another case (one-to-one).
     * `clientId` is automatically set to the booking's `clientId`.
  3. If `bookingId` is not provided (chamber walk-in case), `clientId` is set to `null`.
* **Request Body:**
```json
{
  "title": "Chamber Walk-in Revenue Suit",
  "practiceArea": "Property",
  "court": "District Court, Multan",
  "caseOrFirNumber": "Suit No. 104/2026",
  "filingDate": "2026-10-15",
  "status": "Prospect",
  "stage": null,
  "bookingId": null,
  "parties": [
    {
      "name": "Haji Ghulam Rasool",
      "roleLabel": "Plaintiff"
    },
    {
      "name": "Muhammad Akhtar",
      "roleLabel": "Defendant"
    }
  ]
}
```
* **Validation Rules:**
  * `title`: String, 3 to 255 characters (Required).
  * `practiceArea`: String from `PRACTICE_AREAS` (Required).
  * `court`: String from `COURTS` list (Supreme Court, High Courts, District Courts) or custom string 3 to 255 characters (Required).
  * `caseOrFirNumber`: String, optional/nullable, max 100 characters.
  * `filingDate`: String (YYYY-MM-DD), optional/nullable.
  * `status`: Enum (`Prospect`, `Active`, `Stay`, `Disposed`, `Archived`), defaults to `Prospect`.
  * `stage`: Enum (`Pre-filing`, `Instituted`, `Notice Issued`, `Written Statement`, `Issues Framed`, `Evidence`, `Final Arguments`, `Judgment Reserved`, `Decreed / Allowed`, `Dismissed`, `Appeal / Revision`), optional/nullable.
  * `bookingId`: UUID, optional/nullable.
  * `parties`: Array of objects, optional, max 10 parties. Each party requires `name` (2 to 255 chars) and `roleLabel` (2 to 100 chars, e.g. Plaintiff, Defendant, Petitioner, Respondent).
* **Success Response (201 Created):**
```json
{
  "success": true,
  "message": "Case file created successfully",
  "data": {
    "id": "e93d5a2b-7c18-4b7b-83de-6fa8827f2940",
    "lawyerId": "c1f727b4-3a52-4a09-90bc-089c176e3381",
    "clientId": null,
    "bookingId": null,
    "title": "Chamber Walk-in Revenue Suit",
    "court": "District Court, Multan",
    "practiceArea": "Property",
    "status": "Prospect",
    "stage": null,
    "caseOrFirNumber": "Suit No. 104/2026",
    "filingDate": "2026-10-15",
    "parties": [
      {
        "id": "11111111-2222-3333-4444-555555555555",
        "name": "Haji Ghulam Rasool",
        "roleLabel": "Plaintiff"
      },
      {
        "id": "22222222-3333-4444-5555-666666666666",
        "name": "Muhammad Akhtar",
        "roleLabel": "Defendant"
      }
    ],
    "statusEvents": [
      {
        "id": "33333333-4444-5555-6666-777777777777",
        "fromStatus": null,
        "toStatus": "Prospect",
        "fromStage": null,
        "toStage": null,
        "changedBy": "c1f727b4-3a52-4a09-90bc-089c176e3381",
        "createdAt": "2026-10-24T12:00:00.000Z"
      }
    ],
    "client": null,
    "nextHearing": null,
    "createdAt": "2026-10-24T12:00:00.000Z",
    "updatedAt": "2026-10-24T12:00:00.000Z"
  }
}
```
* **Common Errors:**
  * `400 Bad Request`: Validation failure (missing required title/court/practiceArea, or parties > 10, or uncompleted booking).
  * `401 Unauthorized`: Missing or invalid bearer token.
  * `403 Forbidden`: Authenticated user is not an approved advocate (`client` or `admin` or unverified lawyer).
  * `404 Not Found`: Linked `bookingId` does not exist.
  * `409 Conflict`: `bookingId` is already linked to another case file.

---

### 14.2 List Cases
* **Method & Path:** `GET /cases`
* **Access:** Private (`role: lawyer` or `role: client`). Admins receive `403 Forbidden`.
* **Query Parameters:**
  * `status`: Optional string filter (`Prospect`, `Active`, etc.).
  * `practiceArea`: Optional string filter.
  * `court`: Optional string filter.
  * `page`: Integer $\ge 1$, defaults to `1`.
  * `limit`: Integer between 1 and 50, defaults to `10`.
* **Behavior by Role:**
  * **Lawyer:** Returns cases owned by the authenticated advocate (`lawyerId = req.user.id`). Contains full model including `lawyerId`, `clientId`, `bookingId`, `parties`, `statusEvents`, and linked `client` summary `{ id, name }`.
  * **Client:** Returns only cases where `clientId = req.user.id`. Each case is strictly whitelisted via `projectCaseForClient`.
  * **Admin:** Returns `403 Forbidden`.
* **Success Response (200 OK - Lawyer):**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "e93d5a2b-7c18-4b7b-83de-6fa8827f2940",
        "lawyerId": "c1f727b4-3a52-4a09-90bc-089c176e3381",
        "clientId": "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d",
        "bookingId": "b83f3604-d538-4b72-b5b6-7eb5d0f1917d",
        "title": "Chamber Walk-in Revenue Suit",
        "court": "District Court, Multan",
        "practiceArea": "Property",
        "status": "Active",
        "stage": "Notice Issued",
        "caseOrFirNumber": "Suit No. 104/2026",
        "filingDate": "2026-10-15",
        "parties": [
          { "id": "11111111-2222-3333-4444-555555555555", "name": "Haji Ghulam Rasool", "roleLabel": "Plaintiff" }
        ],
        "statusEvents": [
          { "id": "33333333-4444-5555-6666-777777777777", "fromStatus": "Prospect", "toStatus": "Active", "fromStage": null, "toStage": "Notice Issued", "changedBy": "c1f727b4-3a52-4a09-90bc-089c176e3381", "createdAt": "2026-10-24T12:30:00.000Z" }
        ],
        "client": { "id": "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d", "name": "Ali Raza Litigant" },
        "nextHearing": null,
        "createdAt": "2026-10-24T12:00:00.000Z",
        "updatedAt": "2026-10-24T12:30:00.000Z"
      }
    ],
    "cases": [ /* mirror of items */ ],
    "total": 1,
    "page": 1,
    "limit": 10,
    "totalPages": 1
  }
}
```
* **Success Response (200 OK - Client Whitelist Projection):**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "e93d5a2b-7c18-4b7b-83de-6fa8827f2940",
        "title": "Chamber Walk-in Revenue Suit",
        "court": "District Court, Multan",
        "practiceArea": "Property",
        "status": "Active",
        "stage": "Notice Issued",
        "caseOrFirNumber": "Suit No. 104/2026",
        "filingDate": "2026-10-15",
        "parties": [
          { "id": "11111111-2222-3333-4444-555555555555", "name": "Haji Ghulam Rasool", "roleLabel": "Plaintiff" }
        ],
        "nextHearing": null,
        "createdAt": "2026-10-24T12:00:00.000Z",
        "updatedAt": "2026-10-24T12:30:00.000Z"
      }
    ],
    "cases": [ /* mirror of items */ ],
    "total": 1,
    "page": 1,
    "limit": 10,
    "totalPages": 1
  }
}
```

---

### 14.3 Get Single Case by ID
* **Method & Path:** `GET /cases/:id`
* **Access:** Private (`role: lawyer` assigned to the case OR `role: client` linked to the case).
* **Access Rules:**
  * Owning lawyer receives full case details.
  * Linked client receives whitelisted projection (no `lawyerId`, no `clientId`, no `bookingId`, no `statusEvents`).
  * Other lawyer receives `403 Forbidden`.
  * Unlinked client receives `403 Forbidden`.
  * Admin receives `403 Forbidden`.
* **Success Response (200 OK):** Wrapped in `{ "success": true, "data": { ... } }`.
* **Common Errors:**
  * `401 Unauthorized`: Missing or invalid bearer token.
  * `403 Forbidden`: Authenticated user is not authorized to view this confidential case file.
  * `404 Not Found`: Case does not exist.

---

### 14.4 Update Case File
* **Method & Path:** `PATCH /cases/:id`
* **Access:** Private (`role: lawyer` assigned to the case)
* **Pre-conditions:**
  * Only the assigned advocate can update the case.
  * If `bookingId` is provided:
    * Allowed only if case currently has `clientId: null`.
    * If case is already linked to a client, returns `409 Conflict`.
    * Booking must belong to this advocate and be `completed`.
  * If `parties` array is provided, it performs an atomic **full replacement** of all existing parties.
  * If `status` or `stage` transitions, an immutable audit record is added to `case_status_events`.
* **Request Body:**
```json
{
  "title": "Chamber Walk-in Revenue Suit (Amended)",
  "status": "Active",
  "stage": "Notice Issued",
  "caseOrFirNumber": "Suit No. 104/2026",
  "filingDate": "2026-10-15",
  "bookingId": "b83f3604-d538-4b72-b5b6-7eb5d0f1917d",
  "parties": [
    { "name": "Haji Ghulam Rasool", "roleLabel": "Plaintiff" },
    { "name": "Muhammad Akhtar", "roleLabel": "Defendant No. 1" },
    { "name": "Mukhtar Ahmad", "roleLabel": "Defendant No. 2" }
  ]
}
```
* **Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Case file updated successfully",
  "data": {
    "id": "e93d5a2b-7c18-4b7b-83de-6fa8827f2940",
    "lawyerId": "c1f727b4-3a52-4a09-90bc-089c176e3381",
    "clientId": "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d",
    "bookingId": "b83f3604-d538-4b72-b5b6-7eb5d0f1917d",
    "title": "Chamber Walk-in Revenue Suit (Amended)",
    "court": "District Court, Multan",
    "practiceArea": "Property",
    "status": "Active",
    "stage": "Notice Issued",
    "caseOrFirNumber": "Suit No. 104/2026",
    "filingDate": "2026-10-15",
    "parties": [
      { "id": "uuid-1", "name": "Haji Ghulam Rasool", "roleLabel": "Plaintiff" },
      { "id": "uuid-2", "name": "Muhammad Akhtar", "roleLabel": "Defendant No. 1" },
      { "id": "uuid-3", "name": "Mukhtar Ahmad", "roleLabel": "Defendant No. 2" }
    ],
    "statusEvents": [
      { "id": "uuid-e1", "fromStatus": null, "toStatus": "Prospect", "fromStage": null, "toStage": null, "changedBy": "c1f727b4-3a52-4a09-90bc-089c176e3381", "createdAt": "2026-10-24T12:00:00.000Z" },
      { "id": "uuid-e2", "fromStatus": "Prospect", "toStatus": "Active", "fromStage": null, "toStage": "Notice Issued", "changedBy": "c1f727b4-3a52-4a09-90bc-089c176e3381", "createdAt": "2026-10-24T12:45:00.000Z" }
    ],
    "client": { "id": "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d", "name": "Ali Raza Litigant" },
    "nextHearing": null,
    "createdAt": "2026-10-24T12:00:00.000Z",
    "updatedAt": "2026-10-24T12:45:00.000Z"
  }
}
```
* **Common Errors:**
  * `400 Bad Request`: Validation failure (parties > 10, invalid status/stage, or uncompleted booking).
  * `403 Forbidden`: Authenticated user is not the owning advocate.
  * `404 Not Found`: Case not found.
  * `409 Conflict`: Re-linking attempted on a case already linked to a client, or booking is already linked to another case.

---

## 15. Case Entries & Court Hearings Endpoints

> **Phase 3 (Case Journey) — Part I**  
> Covers case diary entries (*Roznamcha*), court hearing schedules (*Peshian*), quick outcome recording, and strict client privacy censorship.

### 15.1 Create Case Diary Entry
* **Method & Path:** `POST /cases/:id/entries`
* **Access:** Private (`role: lawyer` assigned to the case)
* **Request Body:**
```json
{
  "entryDate": "2026-10-27",
  "entryType": "note",
  "title": "Chamber Confidential Strategy",
  "body": "Cross-examination must verify mutation registry 104/1994.",
  "visibility": "private"
}
```
* **Validation Rules:**
  * `entryDate`: String (YYYY-MM-DD), Required.
  * `entryType`: Enum (`petition`, `order`, `note`), Required.
  * `title`: String, 2 to 150 characters, Required.
  * `body`: String, 1 to 5000 characters, Required.
  * `visibility`: Enum (`private`, `shared`), defaults to `private`.
* **Success Response (201 Created):**
```json
{
  "success": true,
  "message": "Case diary entry created successfully",
  "data": {
    "id": "e1111111-2222-3333-4444-555555555555",
    "caseId": "e93d5a2b-7c18-4b7b-83de-6fa8827f2940",
    "entryDate": "2026-10-27",
    "entryType": "note",
    "title": "Chamber Confidential Strategy",
    "body": "Cross-examination must verify mutation registry 104/1994.",
    "visibility": "private",
    "createdAt": "2026-10-27T08:00:00.000Z",
    "updatedAt": "2026-10-27T08:00:00.000Z"
  }
}
```

---

### 15.2 List Case Diary Entries
* **Method & Path:** `GET /cases/:id/entries`
* **Access:** Private (`role: lawyer` assigned to the case OR `role: client` linked to the case)
* **Access Rules:**
  * **Lawyer:** Sees all entries (`private` and `shared`).
  * **Client:** Sees only `shared` entries projected through whitelist. Private entries are strictly omitted.
  * **Admin / Other Lawyer:** `403 Forbidden`.
* **Query Parameters:**
  * `entryType`: Optional filter (`petition`, `order`, `note`).
  * `visibility`: Optional filter for lawyer (`private`, `shared`).
  * `page`: Integer $\ge 1$, defaults to `1`.
  * `limit`: Integer 1 to 50, defaults to `10`.
* **Success Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "e1111111-2222-3333-4444-555555555555",
        "caseId": "e93d5a2b-7c18-4b7b-83de-6fa8827f2940",
        "entryDate": "2026-10-27",
        "entryType": "order",
        "title": "Interim Status Quo Granted",
        "body": "Learned Civil Judge Multan was pleased to issue temporary injunction.",
        "visibility": "shared",
        "createdAt": "2026-10-27T08:00:00.000Z",
        "updatedAt": "2026-10-27T08:00:00.000Z"
      }
    ],
    "entries": [ /* mirror of items */ ],
    "total": 1,
    "page": 1,
    "limit": 10,
    "totalPages": 1
  }
}
```

---

### 15.3 Update Case Diary Entry
* **Method & Path:** `PATCH /cases/:id/entries/:entryId`
* **Access:** Private (`role: lawyer` assigned to the case)
* **Request Body:** Partial update fields (`entryDate`, `entryType`, `title`, `body`, `visibility`).
* **Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Case diary entry updated successfully",
  "data": {
    "id": "e1111111-2222-3333-4444-555555555555",
    "caseId": "e93d5a2b-7c18-4b7b-83de-6fa8827f2940",
    "entryDate": "2026-10-27",
    "entryType": "note",
    "title": "Chamber Strategy (Amended)",
    "body": "Updated witness questions.",
    "visibility": "private",
    "createdAt": "2026-10-27T08:00:00.000Z",
    "updatedAt": "2026-10-27T08:30:00.000Z"
  }
}
```

---

### 15.4 Schedule Court Hearing
* **Method & Path:** `POST /cases/:id/hearings`
* **Access:** Private (`role: lawyer` assigned to the case)
* **Request Body:**
```json
{
  "scheduledAt": "2026-11-15T09:30:00.000Z",
  "bench": "Court Room No. 4",
  "stage": "Issues",
  "outcome": null,
  "nextDate": null,
  "adjournmentReason": null,
  "note": "Bring original registered sale deed.",
  "clientExplanation": "Court will frame legal issues based on pleadings of both sides.",
  "visibility": "shared"
}
```
* **Validation Rules:**
  * `scheduledAt`: Valid ISO date-time string, Required.
  * `court`: String 2 to 255 chars, Optional (defaults to case's court).
  * `bench`: String up to 120 chars, Optional.
  * `stage`: Enum from `CASE_STAGES`, Optional.
  * `note`: String up to 2000 chars, Optional (strictly lawyer-only).
  * `clientExplanation`: String up to 1000 chars, Optional (litigant explanation).
  * `visibility`: Enum (`private`, `shared`), defaults to `shared`.
* **Success Response (201 Created):**
```json
{
  "success": true,
  "message": "Court hearing scheduled successfully",
  "data": {
    "id": "h1111111-2222-3333-4444-555555555555",
    "caseId": "e93d5a2b-7c18-4b7b-83de-6fa8827f2940",
    "scheduledAt": "2026-11-15T09:30:00.000Z",
    "court": "District Court, Multan",
    "bench": "Court Room No. 4",
    "stage": "Issues",
    "outcome": null,
    "nextDate": null,
    "adjournmentReason": null,
    "note": "Bring original registered sale deed.",
    "clientExplanation": "Court will frame legal issues based on pleadings of both sides.",
    "visibility": "shared",
    "createdAt": "2026-10-27T09:00:00.000Z",
    "updatedAt": "2026-10-27T09:00:00.000Z"
  }
}
```

---

### 15.5 List Case Hearings
* **Method & Path:** `GET /cases/:id/hearings`
* **Access:** Private (`role: lawyer` assigned to the case OR `role: client` linked to the case)
* **Access Rules:**
  * **Lawyer:** Sees all hearings with full `note`.
  * **Client:** Sees only `shared` hearings. Field `note` is **strictly stripped/omitted** via whitelist projection.
  * **Admin / Other Lawyer:** `403 Forbidden`.
* **Success Response (200 OK - Client Projection):**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "h1111111-2222-3333-4444-555555555555",
        "caseId": "e93d5a2b-7c18-4b7b-83de-6fa8827f2940",
        "scheduledAt": "2026-11-15T09:30:00.000Z",
        "court": "District Court, Multan",
        "bench": "Court Room No. 4",
        "stage": "Issues",
        "outcome": null,
        "nextDate": null,
        "adjournmentReason": null,
        "clientExplanation": "Court will frame legal issues based on pleadings of both sides.",
        "visibility": "shared",
        "createdAt": "2026-10-27T09:00:00.000Z",
        "updatedAt": "2026-10-27T09:00:00.000Z"
      }
    ],
    "hearings": [ /* mirror of items */ ],
    "total": 1,
    "page": 1,
    "limit": 20,
    "totalPages": 1
  }
}
```

---

### 15.6 Update Hearing Details
* **Method & Path:** `PATCH /cases/:id/hearings/:hearingId`
* **Access:** Private (`role: lawyer` assigned to the case)
* **Request Body:** Partial update fields (`scheduledAt`, `court`, `bench`, `stage`, `outcome`, `nextDate`, `adjournmentReason`, `note`, `clientExplanation`, `visibility`).
* **Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Court hearing updated successfully",
  "data": { /* updated hearing object */ }
}
```

---

### 15.7 Quick Outcome Recording
* **Method & Path:** `PATCH /hearings/:id/outcome`
* **Access:** Private (`role: lawyer` assigned to the case)
* **Request Body:**
```json
{
  "outcome": "Issues framed by Senior Civil Judge; fixed for Plaintiff Evidence.",
  "nextDate": "2026-11-28",
  "adjournmentReason": "Court time elapsed during cause list"
}
```
* **Validation Rules:**
  * `outcome`: String 1 to 300 chars, Required.
  * `nextDate`: String (YYYY-MM-DD), Optional/nullable.
  * `adjournmentReason`: String up to 300 chars, Optional/nullable.
* **Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Hearing outcome recorded successfully",
  "data": {
    "id": "h1111111-2222-3333-4444-555555555555",
    "caseId": "e93d5a2b-7c18-4b7b-83de-6fa8827f2940",
    "outcome": "Issues framed by Senior Civil Judge; fixed for Plaintiff Evidence.",
    "nextDate": "2026-11-28",
    "adjournmentReason": "Court time elapsed during cause list",
    "updatedAt": "2026-10-27T10:15:00.000Z"
  }
}
```

---

### 15.8 Cross-Case Cause List Query
* **Method & Path:** `GET /hearings`
* **Access:** Private (`role: lawyer` or `role: client`)
* **Access Rules:**
  * **Lawyer:** Sees hearings across all cases owned by their chamber.
  * **Client:** Sees only `shared` hearings for cases linked to them (with `note` strictly censored).
  * **Admin:** `403 Forbidden`.
* **Query Parameters:**
  * `from`: ISO date/time string filter (`scheduledAt >= from`).
  * `to`: ISO date/time string filter (`scheduledAt <= to`).
  * `court`: Case-insensitive partial text filter on court name.
  * `page`: Integer $\ge 1$, defaults to `1`.
  * `limit`: Integer 1 to 50, defaults to `20`.
* **Success Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "h1111111-2222-3333-4444-555555555555",
        "caseId": "e93d5a2b-7c18-4b7b-83de-6fa8827f2940",
        "scheduledAt": "2026-11-15T09:30:00.000Z",
        "court": "District Court, Multan",
        "bench": "Court Room No. 4",
        "stage": "Issues",
        "outcome": null,
        "nextDate": null,
        "adjournmentReason": null,
        "clientExplanation": "Court will frame legal issues based on pleadings.",
        "visibility": "shared",
        "case": {
          "id": "e93d5a2b-7c18-4b7b-83de-6fa8827f2940",
          "title": "Haji Ghulam Rasool Partition Suit",
          "court": "District Court, Multan",
          "status": "Active",
          "caseOrFirNumber": "Suit No. 204/2026"
        },
        "createdAt": "2026-10-27T09:00:00.000Z",
        "updatedAt": "2026-10-27T09:00:00.000Z"
      }
    ],
    "hearings": [ /* mirror of items */ ],
    "total": 1,
    "page": 1,
    "limit": 20,
    "totalPages": 1
  }
}
```

---

## 16. Phase 3 Part J: Case Documents & Private Asset Storage

Case documents represent evidence, petitions, court orders, affidavits, and power of attorney (Vakalatnama) files attached to a case file.
Files are validated for authentic magic bytes (PDF, JPEG, PNG, DOC, DOCX), limited to 10 MB, stored in authenticated private asset storage, and never exposed via public URLs.

---

### 16.1 Upload Case Document
* **Method & Path:** `POST /cases/:id/documents`
* **Access:** Private (`role: lawyer`, Approved Advocate who owns the case)
* **Content-Type:** `multipart/form-data`
* **Access Rules:**
  * Only the assigned advocate can upload documents to their own case.
  * Clients cannot upload documents directly (`403 Forbidden`).
  * Administrators cannot upload documents (`403 Forbidden`).
* **Form Data Fields:**
  * `file`: (Binary File, Required) Supported types: PDF, JPEG, PNG, DOC, DOCX. Max size: 10 MB (`10,485,760 bytes`).
  * `docType`: (String, Required) One of: `['Petition', 'Court Order', 'Evidence', 'Affidavit', 'Contract', 'FIR Copy', 'Identity Document', 'Other']`.
  * `visibility`: (String, Optional) One of `['private', 'shared']`. Defaults to `'private'`.
  * `tags`: (JSON String or Array, Optional) Max 5 tags, max 30 characters each. Example: `'["writ", "urgent"]'`.
* **Success Response (201 Created):**
```json
{
  "message": "Document uploaded successfully",
  "document": {
    "id": "d1a2b3c4-9988-7766-5544-33221100aabb",
    "caseId": "e93d5a2b-7c18-4b7b-83de-6fa8827f2940",
    "originalName": "writ_petition_draft.pdf",
    "mimeType": "application/pdf",
    "sizeBytes": 145820,
    "docType": "Petition",
    "tags": [
      "writ",
      "urgent"
    ],
    "visibility": "private",
    "createdAt": "2026-10-27T05:20:00.000Z",
    "updatedAt": "2026-10-27T05:20:00.000Z"
  }
}
```
* **Security & Whitelist Projection:**
  * `publicId` and `resourceType` are strictly omitted from the response to prevent exposing cloud storage references.
* **Error Responses:**
  * `400 Bad Request`: Missing file, file exceeds 10 MB, invalid magic bytes signature, or tags > 5.
  * `401 Unauthorized`: Missing or invalid JWT.
  * `403 Forbidden`: User is not an approved advocate or does not own the case file.
  * `404 Not Found`: Case does not exist.

---

### 16.2 List Case Documents
* **Method & Path:** `GET /cases/:id/documents`
* **Access:** Private (`role: lawyer` or `role: client`)
* **Access Rules:**
  * **Assigned Lawyer:** Sees all documents (both `private` and `shared`).
  * **Linked Client:** Sees **ONLY** documents where `visibility = 'shared'`. Private chamber documents are completely hidden.
  * **Another Lawyer:** `403 Forbidden`.
  * **Unlinked Client:** `403 Forbidden`.
  * **Administrator:** `403 Forbidden` (Privacy barrier).
* **Query Parameters:**
  * `docType`: Optional filter by document type.
  * `visibility`: Optional filter by visibility (for lawyers; clients are hard-forced to `shared`).
  * `tag`: Optional filter by tag name (case-insensitive).
* **Success Response (200 OK):**
```json
{
  "items": [
    {
      "id": "d1a2b3c4-9988-7766-5544-33221100aabb",
      "caseId": "e93d5a2b-7c18-4b7b-83de-6fa8827f2940",
      "originalName": "certified_court_order.pdf",
      "mimeType": "application/pdf",
      "sizeBytes": 204800,
      "docType": "Court Order",
      "tags": [
        "stay_order",
        "injunction"
      ],
      "visibility": "shared",
      "createdAt": "2026-10-27T05:20:00.000Z",
      "updatedAt": "2026-10-27T05:20:00.000Z"
    }
  ],
  "documents": [ /* mirror of items */ ],
  "total": 1
}
```

---

### 16.3 Update Document Metadata
* **Method & Path:** `PATCH /documents/:id`
* **Access:** Private (`role: lawyer`, Assigned Advocate who owns the case)
* **Access Rules:**
  * Only the assigned advocate can update document metadata.
  * Litigants and administrators receive `403 Forbidden`.
* **Request Body (JSON):**
```json
{
  "docType": "Evidence",
  "visibility": "shared",
  "tags": [
    "verified",
    "certified_copy"
  ]
}
```
* **Success Response (200 OK):**
```json
{
  "message": "Document updated successfully",
  "document": {
    "id": "d1a2b3c4-9988-7766-5544-33221100aabb",
    "caseId": "e93d5a2b-7c18-4b7b-83de-6fa8827f2940",
    "originalName": "certified_court_order.pdf",
    "mimeType": "application/pdf",
    "sizeBytes": 204800,
    "docType": "Evidence",
    "tags": [
      "verified",
      "certified_copy"
    ],
    "visibility": "shared",
    "createdAt": "2026-10-27T05:20:00.000Z",
    "updatedAt": "2026-10-27T05:22:00.000Z"
  }
}
```

---

### 16.4 Stream / Download Document File
* **Method & Path:** `GET /documents/:id/file`
* **Access:** Private (`role: lawyer` or `role: client`)
* **Access Rules:**
  * **Assigned Lawyer:** Can download any document in their case file.
  * **Linked Client:** Can download **ONLY** if `visibility = 'shared'`. Attempting to stream a `private` document returns `403 Forbidden` (`Access denied to private case document`).
  * **Another Lawyer:** `403 Forbidden`.
  * **Unlinked Client:** `403 Forbidden`.
  * **Administrator:** `403 Forbidden`.
* **Response Headers:**
  * `Content-Type`: MIME type of the document (e.g., `application/pdf`, `image/jpeg`).
  * `Content-Disposition`: `inline; filename="certified_court_order.pdf"`.
  * `Content-Length`: Size of binary payload in bytes.
* **Success Response (200 OK):**
  * Binary stream of the file content.

---

## 17. Phase 3 Part K: Case Fees & Payment Ledger

Case fees manage agreed legal representation terms (`fixed`, `per_appearance`, `stage_wise`) and track payments made by the client across various payment methods (`cash`, `bank`, `jazzcash`, `easypaisa`, `cheque`).
The ledger automatically computes total agreed, total paid, and the balance (displayed as-is even if negative). No corporate installment schedules, invoices, or deletion are permitted.

---

### 17.1 Upsert Fee Agreement
* **Method & Path:** `PUT /cases/:id/fee-agreement`
* **Access:** Private (`role: lawyer`, Approved Advocate who owns the case)
* **Access Rules:**
  * Only the assigned advocate can create or update the case fee agreement.
  * Clients receive `403 Forbidden`.
  * Administrators receive `403 Forbidden` (Privacy barrier).
* **Request Body (JSON):**
```json
{
  "type": "stage_wise",
  "agreedAmountPkr": 180000,
  "notes": "Rs. 60k pleadings, Rs. 60k evidence, Rs. 60k final arguments"
}
```
* **Field Specifications:**
  * `type`: (String, Required) One of: `['fixed', 'per_appearance', 'stage_wise']`.
  * `agreedAmountPkr`: (Integer, Required) Range `0` to `100,000,000` (up to 10 crore PKR).
  * `notes`: (String, Optional) Maximum 500 characters.
* **Success Response (200 OK):**
```json
{
  "message": "Fee agreement saved successfully",
  "feeAgreement": {
    "id": "f1111111-2222-3333-4444-555555555555",
    "caseId": "e93d5a2b-7c18-4b7b-83de-6fa8827f2940",
    "type": "stage_wise",
    "agreedAmountPkr": 180000,
    "notes": "Rs. 60k pleadings, Rs. 60k evidence, Rs. 60k final arguments",
    "createdAt": "2026-10-27T05:30:00.000Z",
    "updatedAt": "2026-10-27T05:30:00.000Z"
  }
}
```

---

### 17.2 Record Fee Payment
* **Method & Path:** `POST /cases/:id/payments`
* **Access:** Private (`role: lawyer`, Approved Advocate who owns the case)
* **Access Rules:**
  * Only the assigned advocate can record payments in their case ledger.
  * Clients and administrators receive `403 Forbidden`.
* **Request Body (JSON):**
```json
{
  "amountPkr": 60000,
  "method": "bank",
  "reference": "HBL-IBFT-99881122",
  "paidOn": "2026-10-27",
  "note": "Stage 1 payment received via bank transfer"
}
```
* **Field Specifications:**
  * `amountPkr`: (Integer, Required) Minimum `1`, Maximum `100,000,000`.
  * `method`: (String, Required) One of: `['cash', 'bank', 'jazzcash', 'easypaisa', 'cheque']`.
  * `reference`: (String, Optional) Transaction reference / Cheque number (max 60 characters).
  * `paidOn`: (Date String, Required) ISO format `YYYY-MM-DD`.
  * `note`: (String, Optional) Maximum 300 characters.
* **Success Response (201 Created):**
```json
{
  "message": "Payment recorded successfully",
  "payment": {
    "id": "p1111111-2222-3333-4444-555555555555",
    "caseId": "e93d5a2b-7c18-4b7b-83de-6fa8827f2940",
    "amountPkr": 60000,
    "method": "bank",
    "reference": "HBL-IBFT-99881122",
    "paidOn": "2026-10-27",
    "note": "Stage 1 payment received via bank transfer",
    "createdAt": "2026-10-27T05:35:00.000Z",
    "updatedAt": "2026-10-27T05:35:00.000Z"
  }
}
```

---

### 17.3 Get Case Fee Ledger
* **Method & Path:** `GET /cases/:id/fees`
* **Access:** Private (`role: lawyer` or `role: client`)
* **Access Rules:**
  * **Assigned Lawyer:** Can view the complete ledger.
  * **Linked Client:** Can view the complete ledger for their linked case.
  * **Another Lawyer:** `403 Forbidden`.
  * **Unlinked Client:** `403 Forbidden`.
  * **Administrator:** `403 Forbidden` (Financial Privacy barrier).
* **Success Response (200 OK):**
```json
{
  "agreed": 180000,
  "paid": 140000,
  "balance": 40000,
  "feeAgreement": {
    "id": "f1111111-2222-3333-4444-555555555555",
    "caseId": "e93d5a2b-7c18-4b7b-83de-6fa8827f2940",
    "type": "stage_wise",
    "agreedAmountPkr": 180000,
    "notes": "Rs. 60k pleadings, Rs. 60k evidence, Rs. 60k final arguments",
    "createdAt": "2026-10-27T05:30:00.000Z",
    "updatedAt": "2026-10-27T05:30:00.000Z"
  },
  "payments": [
    {
      "id": "p2222222-3333-4444-5555-666666666666",
      "caseId": "e93d5a2b-7c18-4b7b-83de-6fa8827f2940",
      "amountPkr": 80000,
      "method": "bank",
      "reference": "HBL-IBFT-99881122",
      "paidOn": "2026-10-26",
      "note": "Online transfer",
      "createdAt": "2026-10-26T12:00:00.000Z",
      "updatedAt": "2026-10-26T12:00:00.000Z"
    },
    {
      "id": "p1111111-2222-3333-4444-555555555555",
      "caseId": "e93d5a2b-7c18-4b7b-83de-6fa8827f2940",
      "amountPkr": 60000,
      "method": "cash",
      "reference": null,
      "paidOn": "2026-10-25",
      "note": "Chamber advance cash",
      "createdAt": "2026-10-25T10:00:00.000Z",
      "updatedAt": "2026-10-25T10:00:00.000Z"
    }
  ]
}
```
* **Dynamic Calculations:**
  * `agreed`: `agreedAmountPkr` from fee agreement (or `0` if no agreement has been set yet).
  * `paid`: Sum of all `amountPkr` across recorded `payments`.
  * `balance`: `agreed - paid` (shown as-is, even if negative when client overpays or gives an advance).

---

## 18. Phase 3 Part L: Case Timeline & Client View

### 18.1 Get Case Timeline
* **Method & Path:** `GET /cases/:id/timeline`
* **Access:** Private (`role: lawyer` assigned to the case OR `role: client` linked to the case).
* **Access Rules:**
  * **Assigned Lawyer:** Receives complete chronological timeline including private chamber diary entries, internal documents, and full hearing records (with chamber notes).
  * **Linked Client:** Receives sanitized chronological timeline containing **shared items only** (`visibility: 'shared'`). For hearing events, the client receives structured fields and `clientExplanation`, but the private chamber `note` is **strictly redacted/omitted**.
  * **Another Lawyer:** `403 Forbidden` (`"Forbidden: You are not the assigned advocate for this case"`).
  * **Unlinked Client:** `403 Forbidden` (`"Forbidden: You are not the linked client for this case"`).
  * **Administrator:** `403 Forbidden` (`"Forbidden: Administrators have no access to confidential case files"`).
* **Query Parameters:**
  * `page` (optional, integer >= 1, default `1`)
  * `limit` (optional, integer 1–100, default `20`)
  * `kind` (optional, enum: `entry`, `hearing`, `document`, `status_event`)
* **Success Response (200 OK) — Lawyer View:**
```json
{
  "events": [
    {
      "kind": "hearing",
      "date": "2026-11-15T09:30:00.000Z",
      "title": "Hearing at District Court, Multan (Arguments)",
      "summary": "Arguments concluded; adjourned for order",
      "visibility": "shared",
      "refId": "h1111111-2222-3333-4444-555555555555",
      "court": "District Court, Multan",
      "stage": "Arguments",
      "outcome": "Arguments concluded",
      "clientExplanation": "Final arguments presented by counsel",
      "note": "Chamber note: Judge seemed convinced by High Court citations"
    },
    {
      "kind": "entry",
      "date": "2026-10-27T08:00:00.000Z",
      "title": "Internal Chamber Conference",
      "summary": "Met with revenue patwari to verify certified fard",
      "visibility": "private",
      "refId": "e1111111-2222-3333-4444-555555555555"
    },
    {
      "kind": "document",
      "date": "2026-10-26T14:00:00.000Z",
      "title": "Certified Plaint and Affidavit",
      "summary": "Pleading document (PDF, 245000 bytes)",
      "visibility": "shared",
      "refId": "d1111111-2222-3333-4444-555555555555",
      "docType": "pleading",
      "fileSize": 245000,
      "mimeType": "application/pdf"
    },
    {
      "kind": "status_event",
      "date": "2026-10-25T10:00:00.000Z",
      "title": "Status changed to Active (Notice Issued)",
      "summary": "Formal transition recorded in court record",
      "visibility": "shared",
      "refId": "s1111111-2222-3333-4444-555555555555",
      "status": "Active",
      "stage": "Notice Issued"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 4,
    "totalPages": 1
  }
}
```
* **Success Response (200 OK) — Linked Client View:**
```json
{
  "events": [
    {
      "kind": "hearing",
      "date": "2026-11-15T09:30:00.000Z",
      "title": "Hearing at District Court, Multan (Arguments)",
      "summary": "Final arguments presented by counsel",
      "visibility": "shared",
      "refId": "h1111111-2222-3333-4444-555555555555",
      "court": "District Court, Multan",
      "stage": "Arguments",
      "outcome": "Arguments concluded",
      "clientExplanation": "Final arguments presented by counsel"
    },
    {
      "kind": "document",
      "date": "2026-10-26T14:00:00.000Z",
      "title": "Certified Plaint and Affidavit",
      "summary": "Pleading document (PDF, 245000 bytes)",
      "visibility": "shared",
      "refId": "d1111111-2222-3333-4444-555555555555",
      "docType": "pleading",
      "fileSize": 245000,
      "mimeType": "application/pdf"
    },
    {
      "kind": "status_event",
      "date": "2026-10-25T10:00:00.000Z",
      "title": "Status changed to Active (Notice Issued)",
      "summary": "Formal transition recorded in court record",
      "visibility": "shared",
      "refId": "s1111111-2222-3333-4444-555555555555",
      "status": "Active",
      "stage": "Notice Issued"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 3,
    "totalPages": 1
  }
}
```
*(Note: In the client view, the private diary entry is completely excluded, and for hearings, the private `note` key is strictly redacted/omitted.)*

---

### 18.2 Client Projection for Single Case View
* **Method & Path:** `GET /cases/:id`
* **Access:** Private (`role: client` linked to the case).
* **Guaranteed Whitelisted Fields:**
```json
{
  "id": "e93d5a2b-7c18-4b7b-83de-6fa8827f2940",
  "title": "Chamber Walk-in Revenue Suit",
  "court": "District Court, Multan",
  "practiceArea": "Property",
  "status": "Active",
  "stage": "Notice Issued",
  "caseOrFirNumber": "Suit No. 104/2026",
  "filingDate": "2026-10-15",
  "parties": [
    { "id": "cp1111111-...", "name": "Haji Ghulam Rasool", "roleLabel": "Plaintiff" }
  ],
  "nextHearing": {
    "id": "h1111111-...",
    "hearingDate": "2026-11-15T09:30:00.000Z",
    "court": "District Court, Multan",
    "stage": "Arguments",
    "outcome": null,
    "clientExplanation": "Scheduled for arguments"
  },
  "sharedDocumentsCount": 2
}
```
* **Security & Privacy Guarantees:**
  * `lawyerId`, `clientId`, `bookingId`, and `statusEvents` are omitted from the client response.
  * In `nextHearing`, the private `note` field is strictly omitted.
  * `sharedDocumentsCount` counts **only** documents with `visibility: 'shared'`. Private chamber drafts are excluded from the count.

---

## 19. Phase 3 Part M: Notifications, Email Delivery & Reminders

### 19.1 List User Notifications
* **Method & Path:** `GET /notifications`
* **Access:** Private (Authenticated user: `role: lawyer`, `role: client`, `role: admin`, or `role: law_firm`).
* **Access Rules:**
  * Returns notifications belonging exclusively to the authenticated caller (`userId = req.user.id`).
  * Strict user isolation: No user can view or list another user's notifications.
* **Query Parameters:**
  * `page` (optional, integer >= 1, default `1`)
  * `limit` (optional, integer 1–100, default `20`)
  * `read` (optional, boolean: `true` for read-only, `false` for unread-only)
  * `type` (optional, string enum: `booking_created`, `booking_confirmed`, `booking_cancelled`, `case_assigned`, `case_status_changed`, `hearing_scheduled`, `hearing_reminder`, `document_uploaded`, `payment_received`, `system`)
* **Success Response (200 OK):**
```json
{
  "notifications": [
    {
      "id": "n1111111-2222-3333-4444-555555555555",
      "userId": "u1111111-2222-3333-4444-555555555555",
      "type": "hearing_reminder",
      "title": "Upcoming Hearing in 3 Days: Revenue Suit at District Court, Multan",
      "body": "Your case \"Revenue Suit\" has a scheduled hearing at District Court, Multan on 10/11/2026, 10:00:00 AM PKT.",
      "link": "/cases/e93d5a2b-7c18-4b7b-83de-6fa8827f2940",
      "readAt": null,
      "emailStatus": "sent",
      "metadata": {
        "hearingId": "h1111111-2222-3333-4444-555555555555",
        "caseId": "e93d5a2b-7c18-4b7b-83de-6fa8827f2940",
        "milestone": "3_days_prior",
        "recipientRole": "client"
      },
      "createdAt": "2026-11-07T04:05:00.000Z",
      "updatedAt": "2026-11-07T04:05:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 1,
    "totalPages": 1
  }
}
```

---

### 19.2 Get Unread Notification Count
* **Method & Path:** `GET /notifications/unread-count`
* **Access:** Private (Authenticated user).
* **Success Response (200 OK):**
```json
{
  "count": 4
}
```

---

### 19.3 Mark Single Notification as Read
* **Method & Path:** `PATCH /notifications/:id/read`
* **Access:** Private (Authenticated recipient of the notification).
* **Access Rules:**
  * If notification belongs to caller: updates `readAt` to current timestamp.
  * If notification does not belong to caller: `403 Forbidden` (`"Forbidden: You do not own this notification"`).
  * If notification is already read: idempotent (returns 200 OK without altering original `readAt`).
* **Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Notification marked as read",
  "data": {
    "id": "n1111111-2222-3333-4444-555555555555",
    "userId": "u1111111-2222-3333-4444-555555555555",
    "type": "hearing_reminder",
    "title": "Upcoming Hearing in 3 Days: Revenue Suit at District Court, Multan",
    "body": "...",
    "link": "/cases/e93d5a2b-7c18-4b7b-83de-6fa8827f2940",
    "readAt": "2026-11-07T05:30:00.000Z",
    "emailStatus": "sent",
    "metadata": { ... },
    "createdAt": "2026-11-07T04:05:00.000Z",
    "updatedAt": "2026-11-07T05:30:00.000Z"
  }
}
```

---

### 19.4 Mark All Notifications as Read
* **Method & Path:** `PATCH /notifications/read-all`
* **Access:** Private (Authenticated user).
* **Success Response (200 OK):**
```json
{
  "success": true,
  "message": "All notifications marked as read",
  "updatedCount": 4
}
```

---

### 19.5 Hearing Reminders & Pure Sweep Function
* **Module:** `src/modules/notification/reminder.service.js`
* **Function:** `runReminderSweep(now = new Date())`
* **Pakistan Standard Time Alert Milestones (PKT / UTC+5):**
  * `3_days_prior`: 3 days before scheduled date at 09:00 AM PKT (04:00 AM UTC).
  * `night_before`: 1 day before scheduled date at 08:00 PM (20:00) PKT (15:00 UTC).
  * `morning_of`: Day of hearing at 07:00 AM PKT (02:00 AM UTC).
* **Privacy Guarantees:**
  * Advocate always receives scheduled hearing reminders.
  * Client receives hearing reminder **ONLY** if the hearing has `visibility: 'shared'`. For private chamber hearings, client receives zero reminders.
  * Client notification body never leaks the advocate's confidential chamber `note`.
* **Idempotency Guarantee:**
  * Dispatches at most one notification per `(userId, hearingId, milestone)` combination.

---

## 20. Phase 3 Part N: Direct Messages (Booking & Case Contexts)

### 20.1 Send Booking Direct Message
* **Method & Path:** `POST /bookings/:id/messages`
* **Access:** Private (`role: client` or `role: lawyer` participating in the booking).
* **Access Rules:**
  * Caller must be the client or advocate on this specific consultation booking.
  * Counter-party automatically receives an in-app alert notification.
  * Another lawyer, unlinked client, or administrator receives `403 Forbidden`.
* **Request Body:**
```json
{
  "content": "Assalam-o-Alaikum Sir, I have arranged the certified copy of the registry for our meeting.",
  "attachments": [
    {
      "name": "registry_fard.pdf",
      "url": "https://storage/registry_fard.pdf",
      "mimeType": "application/pdf",
      "sizeBytes": 154000
    }
  ]
}
```
* **Success Response (201 Created):**
```json
{
  "success": true,
  "message": "Message sent successfully",
  "data": {
    "id": "m1111111-2222-3333-4444-555555555555",
    "senderId": "u1111111-2222-3333-4444-555555555555",
    "bookingId": "b1111111-2222-3333-4444-555555555555",
    "caseId": null,
    "content": "Assalam-o-Alaikum Sir, I have arranged the certified copy of the registry for our meeting.",
    "attachments": [
      {
        "name": "registry_fard.pdf",
        "url": "https://storage/registry_fard.pdf",
        "mimeType": "application/pdf",
        "sizeBytes": 154000
      }
    ],
    "readAt": null,
    "createdAt": "2026-10-27T06:40:00.000Z",
    "updatedAt": "2026-10-27T06:40:00.000Z"
  }
}
```

---

### 20.2 List Booking Direct Messages
* **Method & Path:** `GET /bookings/:id/messages`
* **Access:** Private (`role: client` or `role: lawyer` participating in the booking).
* **Query Parameters:**
  * `page` (optional, integer >= 1, default `1`)
  * `limit` (optional, integer 1–100, default `20`)
* **Behavior:**
  * Returns messages sorted in reverse chronological order (`createdAt DESC`).
  * Automatically updates `readAt = CURRENT_TIMESTAMP` for any incoming unread messages sent by the counter-party.
* **Success Response (200 OK):**
```json
{
  "messages": [
    {
      "id": "m2222222-3333-4444-5555-666666666666",
      "senderId": "u2222222-3333-4444-5555-666666666666",
      "bookingId": "b1111111-2222-3333-4444-555555555555",
      "caseId": null,
      "content": "Walaikum Assalam. Excellent. Please bring the original CNIC as well.",
      "attachments": null,
      "readAt": "2026-10-27T06:45:00.000Z",
      "createdAt": "2026-10-27T06:42:00.000Z",
      "updatedAt": "2026-10-27T06:45:00.000Z",
      "sender": {
        "id": "u2222222-3333-4444-5555-666666666666",
        "name": "Adv. Sardar Zulfiqar Ali",
        "role": "lawyer"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 1,
    "totalPages": 1
  }
}
```

---

### 20.3 Send Case Direct Message
* **Method & Path:** `POST /cases/:id/messages`
* **Access:** Private (`role: lawyer` assigned to the case OR `role: client` linked to the case).
* **Access Rules:**
  * If the case has no linked client (`clientId: null`), returns `400 Bad Request` (`"Cannot send client message: Case has no linked client"`).
  * Counter-party automatically receives an in-app alert notification.
  * Another lawyer, unlinked client, or administrator receives `403 Forbidden`.
* **Request Body:**
```json
{
  "content": "Notice has been served on the respondent. Court has fixed 18th November for written statement."
}
```
* **Success Response (201 Created):**
```json
{
  "success": true,
  "message": "Message sent successfully",
  "data": {
    "id": "m3333333-4444-5555-6666-777777777777",
    "senderId": "u2222222-3333-4444-5555-666666666666",
    "bookingId": null,
    "caseId": "e93d5a2b-7c18-4b7b-83de-6fa8827f2940",
    "content": "Notice has been served on the respondent. Court has fixed 18th November for written statement.",
    "attachments": null,
    "readAt": null,
    "createdAt": "2026-10-27T06:43:00.000Z",
    "updatedAt": "2026-10-27T06:43:00.000Z"
  }
}
```

---

### 20.4 List Case Direct Messages
* **Method & Path:** `GET /cases/:id/messages`
* **Access:** Private (`role: lawyer` assigned to the case OR `role: client` linked to the case).
* **Query Parameters:**
  * `page` (optional, integer >= 1, default `1`)
  * `limit` (optional, integer 1–100, default `20`)
* **Behavior:**
  * Returns messages sorted in reverse chronological order (`createdAt DESC`).
  * Automatically marks counter-party messages as read.
* **Success Response (200 OK):**
```json
{
  "messages": [
    {
      "id": "m3333333-4444-5555-6666-777777777777",
      "senderId": "u2222222-3333-4444-5555-666666666666",
      "bookingId": null,
      "caseId": "e93d5a2b-7c18-4b7b-83de-6fa8827f2940",
      "content": "Notice has been served on the respondent. Court has fixed 18th November for written statement.",
      "attachments": null,
      "readAt": "2026-10-27T06:44:00.000Z",
      "createdAt": "2026-10-27T06:43:00.000Z",
      "updatedAt": "2026-10-27T06:44:00.000Z",
      "sender": {
        "id": "u2222222-3333-4444-5555-666666666666",
        "name": "Adv. Sardar Zulfiqar Ali",
        "role": "lawyer"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 1,
    "totalPages": 1
  }
}
```


