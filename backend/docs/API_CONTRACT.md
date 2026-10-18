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
  * `role`: Enum, strictly `"client"` or `"lawyer"`. *(Attempting `"admin"` returns 400).*
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
* **Query Parameters:**
  * `city`: String (e.g. `Lahore`, `Karachi`)
  * `practiceArea`: String (e.g. `Corporate`, `Criminal`)
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
      "bio": "Specialized appellate advocate."
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
    "bio": "Specialized appellate advocate."
  }
}
```
* **Common Errors:** `404 Not Found` if the lawyer does not exist or status is not `approved`.
