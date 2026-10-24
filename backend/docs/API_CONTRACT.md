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


