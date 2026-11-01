# Part Q: Admin User Management & Suspension Guide

> **Target Audience:** BS CS Final Year Students (Syed Asad, Muhammad Aqeel, Mubashir Mehmood)  
> **Course:** Final Year Project (FYP) — Emerson University Multan  
> **Topic:** User Directory Administration, Soft Suspension, Real-Time Stateless JWT Revocation, and Self-Lockout Guards

---

## 1. Concept in Plain English & Relatable Pakistani Analogy

### The Concept: Soft Suspension vs Hard Deletion
In software architecture, inexperienced developers often implement account bans by running `DELETE FROM users WHERE id = :id`. In an enterprise legal marketplace, **hard-deleting a user breaks the entire relational integrity of the database**:
- If an advocate or client is deleted, what happens to their historical court cases, signed engagement agreements, audit trails, and consultation bookings? Foreign key constraints fail, or cascade deletions erase legal records.
- Instead, professional systems use **Soft Suspension**:
  - Setting `isActive = false`
  - Storing a formal `suspensionReason` and `suspendedAt` timestamp
  - Preserving all past invoices, diary entries, and audit logs intact

---

### The Relatable Pakistani Analogy: Bar Council Disciplinary Suspension (*Muattali aur Bahaali*)
Imagine the **Punjab Bar Council** or the **Multan District Bar Association**:

1. **The Roll of Advocates:** The Bar Council office maintains a master register (Roll of Advocates). The administrative staff can filter advocates by city, enrollment level (Advocate Lower Courts vs Advocate High Court), or search an advocate by name or Bar Council enrolment number.
2. **Disciplinary Complaint & Suspension Notice (*Muattali*):** If a citizen or judicial officer files a complaint against an advocate for professional misconduct, the Disciplinary Committee reviews the evidence. If substantiated, they issue a formal written order:
   > *"The practicing licence of Advocate X is suspended pending formal inquiry. Reason: Failure to account for client funds."*
3. **The Court Gate & Bar Room Barred Immediately:** The advocate is not erased from the Bar register; their name remains on record, but their license status is stamped **Suspended**. The reader of the court, the Bar room gatekeeper, and the filing clerk immediately refuse to accept their power of attorney (*Vakalatnama*). Even if the advocate is holding a laminated membership card with an expiry date next year, the moment the gatekeeper checks the computer list, entry is denied.
4. **Self-Suspension Guard:** The Bar Council Secretary or Chairman cannot inadvertently issue a suspension order against themselves.
5. **Restoration (*Bahaali*):** Once the advocate satisfies the inquiry, pays any pending statutory dues, or wins an appeal, the Council issues an order of *Bahaali* (Reinstatement), restoring full active privileges.

---

## 2. End-to-End Technical Request Trace

Here is the exact journey of an Admin suspending a user and the security enforcement across our Express layered architecture:

```
[Admin Browser / Postman]
       |
       | 1. PATCH /api/v1/admin/users/:id/status { status: "suspended", reason: "Multiple fake bookings" }
       v
[Express Router: admin.routes.js]
  -> Authentication & Role Guard: verifyToken + requireRole('admin')
  -> Body Validation: validate(updateUserStatusSchema)
       |
       v
[Controller: admin.controller.js -> updateUserStatus()]
       |
       v
[Service: admin.service.js -> updateUserStatus(targetUserId, { status, reason }, adminUserId)]
  -> User.findByPk(targetUserId)
  -> [Self-Suspension Guard]: If targetUserId === adminUserId -> throw 400 "Administrators cannot suspend their own account"
  -> Updates user:
     - isActive: false
     - suspensionReason: "Multiple fake bookings"
     - suspendedAt: new Date()
  -> Returns 200 OK: { user, message: "User status successfully updated to suspended" }

========================================================================================

[Suspended User Attempting Login]
       |
       | 2. POST /api/v1/auth/login { email: "suspended@example.pk", password: "Password123!" }
       v
[Express Router: auth.routes.js -> loginController -> authService.login()]
  -> Validates password hash with bcrypt.compare()
  -> [Suspension Guard]: If user.isActive === false:
        Throw 403 Forbidden:
        {
          error: "Account is suspended: Multiple fake bookings. Please contact LegalHub support.",
          details: [{ field: "account", message: "ACCOUNT_SUSPENDED" }]
        }

========================================================================================

[Suspended User Holding Pre-Existing Valid JWT Attempting Protected Call]
       |
       | 3. GET /api/v1/auth/me (Authorization: Bearer <unexpired_jwt>)
       v
[Middleware: verifyToken.js]
  -> jwt.verify(token, secret) passes signature check
  -> [Real-Time Active Status Check]:
     const user = await User.findByPk(decoded.id, { attributes: ['id', 'isActive', 'suspensionReason'] });
  -> Detected: user.isActive === false
  -> Immediately short-circuits request with HTTP 403 Forbidden:
     {
       error: "Account is suspended: Multiple fake bookings. Access revoked.",
       details: [{ field: "account", message: "ACCOUNT_SUSPENDED" }]
     }
```

---

## 3. Hands-on Student Exercises

### Exercise 1: Protecting Against Administrative Self-Lockout
**Problem:** If an administrator accidentally clicks "Suspend" on their own profile while testing, they could permanently lock themselves out of the platform with no remaining admins to reinstate them.  
**Solution:**
```javascript
// In admin.service.js
if (user.id === adminUserId) {
  throw new AppError('Administrators cannot suspend their own account', 400);
}
```

---

### Exercise 2: Real-Time Stateless JWT Revocation Without Redis
**Problem:** In pure stateless JWT authentication, once a token is issued, it remains cryptographically valid until its expiration (e.g. 24 hours). If an admin suspends a malicious advocate at 2:00 PM, how do we prevent that advocate from making API calls using their existing token until 2:00 PM tomorrow?  
**Solution (Active State Lookup in Middleware):**
```javascript
// In verifyToken.js
const decoded = jwt.verify(token, config.jwtSecret);
req.user = decoded;

if (decoded && decoded.id) {
  const user = await User.findByPk(decoded.id, {
    attributes: ['id', 'isActive', 'suspensionReason']
  });

  if (user && user.isActive === false) {
    return next(
      new AppError(
        user.suspensionReason
          ? `Account is suspended: ${user.suspensionReason}. Access revoked.`
          : 'Account is suspended. Access revoked.',
        403,
        [{ field: 'account', message: 'ACCOUNT_SUSPENDED' }]
      )
    );
  }
}
```

---

### Exercise 3: Case-Insensitive Multi-Field Search on PostgreSQL
**Problem:** A user might search for `"ahmed"` or `"AHMED"` or `"ahmed@example.pk"`. How do we query across both `name` and `email` efficiently?  
**Solution (`Sequelize.Op.iLike`):**
```javascript
// In admin.service.js
if (search && search.trim()) {
  const term = `%${search.trim()}%`;
  where[Op.or] = [
    { name: { [Op.iLike]: term } },
    { email: { [Op.iLike]: term } }
  ];
}
```

---

## 4. FYP Viva Voce Defense Questions & Model Answers

### Q1: Why did you choose soft suspension (`isActive: false`) instead of hard deletion (`DELETE FROM users`)?
> **Answer:** "Sir, in a legal marketplace, advocates and clients participate in court cases, fee payments, legal opinions, and formal hearings. Hard-deleting a user record would either violate database foreign key constraints or trigger cascade deletions that erase critical evidence and financial audit histories. Soft suspension retains 100% of the historical audit trail and relational integrity while instantly revoking all interactive platform privileges."

---

### Q2: JWTs are stateless. If a user already possesses a valid JWT token, how does your backend prevent them from performing actions after an admin suspends their account?
> **Answer:** "Sir, while JWT signature verification is mathematical and stateless, our `verifyToken.js` middleware performs a lightweight index-assisted status check (`User.findByPk(decoded.id, { attributes: ['id', 'isActive', 'suspensionReason'] })`). If the user's `isActive` flag is `false`, the middleware immediately intercepts the request with HTTP `403 Forbidden` (`ACCOUNT_SUSPENDED`), providing real-time revocation without needing an external state store like Redis."

---

### Q3: Why is an admin prevented from suspending their own account?
> **Answer:** "Sir, this is a critical administrative safety invariant. If the sole administrator of the platform accidentally or maliciously suspends their own account, the system enters an unrecoverable administrative lockout where no active admin remains to manage users or reverse the suspension. Enforcing `user.id !== adminUserId` directly in `admin.service.js` prevents accidental platform lockout."

---

### Q4: How does your database schema optimize queries for listing active vs suspended users?
> **Answer:** "Sir, in our migration `20261029000002-add-user-status-and-suspension.js`, we created a composite B-Tree index on `(isActive, role)` named `users_is_active_role_idx`. When the admin dashboard filters by role (e.g. `role = 'lawyer'`) and status (e.g. `isActive = true`), PostgreSQL executes an index scan rather than a full sequential table scan, keeping response times well under 50 milliseconds."

---

### Q5: What happens when an administrator reinstates a suspended user?
> **Answer:** "Sir, calling `PATCH /api/v1/admin/users/:id/status` with `{ status: 'active' }` resets `isActive = true`, and sets `suspensionReason = null` and `suspendedAt = null`. As demonstrated in our automated integration tests, the user can immediately log in with their existing credentials and resume access to their cases and bookings without any data loss."

---

## 5. Thunder Client / Postman Test Collection & Curl Commands

### 1. Admin List Users with Pagination & Search
```bash
curl -X GET "http://localhost:4000/api/v1/admin/users?page=1&limit=10&role=lawyer&status=active&search=Khan" \
  -H "Authorization: Bearer <ADMIN_JWT_TOKEN>"
```

### 2. Admin Suspend User
```bash
curl -X PATCH "http://localhost:4000/api/v1/admin/users/<TARGET_USER_UUID>/status" \
  -H "Authorization: Bearer <ADMIN_JWT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "suspended",
    "reason": "Repeated non-appearance for confirmed consultations"
  }'
```

### 3. Admin Reinstate User
```bash
curl -X PATCH "http://localhost:4000/api/v1/admin/users/<TARGET_USER_UUID>/status" \
  -H "Authorization: Bearer <ADMIN_JWT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "active"
  }'
```
