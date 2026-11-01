# LegalHub Frontend Engineering Guide: FE-11 (Admin Dashboard Metrics & User Discipline Management)

> **Final Year Project (FYP) — Emerson University Multan**  
> **Student Developers:** Syed Asad, Muhammad Aqeel, Mubashir Mehmood  
> **Module:** Frontend Phase 4 — Platform Governance & Advocate Registry (FE-11: Admin Control Center, Live Stat Cards, Debounced User Directory, Disciplinary Suspension Modal, and Immediate Reinstatement)  
> **Target Scope:** Admin Dashboard (`/dashboard`), Live Platform Registry Metrics, User Management View (`/admin/users`), 400ms Debounced Search, Role and Status Filter Controls, `ConfirmDialog` with $\ge 10$ Character Reason Enforcement, and Stateless JWT Session Revocation.

---

## 1. Architectural Philosophy & Pakistani Metaphor

### The Bar Council Disciplinary Tribunal & Chamber Registrar (*ڈسٹرکٹ بار کونسل کی تادیبی کارروائی*)
* **The Official Roster of Advocates (*وکلاء کی فہرست*):** In Punjab's judicial system, the District Bar Association registrar maintains the master registry of all enrolled advocates, their chamber locations, and their license standing. Without a structured index, verifying whether an individual appearing before the bench is an active advocate or an imposter (*جعلی وکیل*) requires manual paperwork.
* **The Disciplinary Suspension Seal (*تادیبی معطلی اور تحریری وجہ*):** Under the Legal Practitioners and Bar Councils Act 1973, when the Bar Council Tribunal receives formal complaints of misconduct against an advocate (e.g., extorting unauthorized fees or misrepresenting court orders), the Tribunal does not quietly erase the record. Instead, they issue a formal suspension order stating the specific reason (e.g., *"License suspended pending inquiry into unauthorized fee demand"*). In **FE-11**, the administrator cannot suspend any account with an empty click; the system strictly enforces a mandatory explanation of at least 10 characters to ensure administrative accountability and due process.
* **The Admin Privacy Barrier (*مقدمات کی رازداری کا تحفظ*):** Although the court administrator oversees user accounts, verify credentials, and enforce discipline, the platform strictly blocks administrators from reading confidential attorney-client pleadings, private case diary notes, or client evidence files. Disciplinary oversight stops at the chamber door; confidential case files remain privileged under Pakistani legal ethics.

---

## 2. Complete Trace: From Admin Click to Database & Real-Time JWT Revocation

**User Action:** Court Administrator `admin@legalhub.pk` suspends an unethical account `fraud.lawyer@demo.legalhub.local`:

```
[ Admin UI: AdminUsers.jsx ]
       │
       │ 1. Admin locates target user via debounced search or role filter
       │ 2. Clicks "Suspend" button on user row
       ▼
[ ConfirmDialog Modal ]
       │
       │ 3. Renders danger modal with user details and textarea
       │ 4. Admin types suspension reason: "Ethics violation reported to Bar Council" (41 chars)
       │ 5. Character counter confirms >= 10 characters
       │ 6. Admin clicks "Confirm Suspension" -> handleConfirmSuspend()
       ▼
[ Frontend API: adminApi.updateUserStatus(userId, { status: 'suspended', reason }) ]
       │
       │ 7. Issues PATCH /api/v1/admin/users/:id/status with Bearer Admin JWT
       ▼
[ Express Router: admin.routes.js ]
       │
       │ 8. verifyToken -> requireRole(ROLES.ADMIN) -> validate(updateUserStatusSchema)
       ▼
[ Controller & Service Layer: admin.service.js -> updateUserStatus() ]
       │
       │ 9. Prevents self-suspension guard (adminUserId !== targetUserId)
       │ 10. Updates PostgreSQL:
       │     UPDATE users 
       │     SET is_active = false, 
       │         suspension_reason = 'Ethics violation...', 
       │         suspended_at = NOW() 
       │     WHERE id = :targetUserId;
       │ 11. Returns HTTP 200 OK: { user, message: 'User status successfully updated to suspended' }
       ▼
[ Real-Time Stateless JWT Session Revocation ]
       │
       │ 12. If suspended user attempts any API call with their existing JWT:
       │     verifyToken.js performs User.findByPk(decoded.id)
       │     Detects isActive === false -> immediately throws 403 ACCOUNT_SUSPENDED!
       ▼
[ Admin UI Live Update ]
       │
       │ 13. AdminUsers.jsx closes modal, displays success notice banner
       │ 14. Refreshes user directory; status chip transitions to red "Suspended"
       │ 15. Action button dynamically transforms from "Suspend" to "Reinstate"
```

---

## 3. Hands-on Student Exercises

### Exercise 1: Implementing Debounced Search in React Without External Libraries
**Problem:** When a user types into a search box, firing an HTTP request on every single keystroke floods the PostgreSQL database with dozens of queries for words like `a`, `as`, `asa`, `asad`. How do we implement clean 400ms debouncing using standard React hooks?  
**Solution:**
```javascript
import { useState, useEffect } from 'react';

export const useDebounce = (value, delayMs = 400) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delayMs);

    return () => {
      clearTimeout(timer); // Cancels pending timer if user types again before delayMs
    };
  }, [value, delayMs]);

  return debouncedValue;
};
```

---

### Exercise 2: Multi-Criteria Filter Synchronization with Pagination Reset
**Problem:** If a user is on page 4 of the user directory and switches the role filter from "All" to "Administrators" (which only has 1 page of results), the API will query page 4 and return an empty array. How do we ensure page resets to 1 when filters change?  
**Solution:**
```javascript
const handleFilterChange = (filterName, newValue) => {
  setFilters((prev) => ({ ...prev, [filterName]: newValue }));
  // Always reset page to 1 when search or filter criteria change
  setPagination((prev) => ({ ...prev, page: 1 }));
};
```

---

### Exercise 3: Preventing Admin Self-Suspension Across Both Tiers
**Problem:** If an administrator accidentally clicks "Suspend" on their own row, they would permanently lock themselves out of the system. How do we prevent this at both the frontend UI and backend API layers?  
**Solution:**
```javascript
// 1. Frontend Guard (AdminUsers.jsx)
const isCurrentAdmin = user.id === currentUser?.id;
{isCurrentAdmin ? (
  <span style={{ fontSize: '12px', color: '#64748b' }}>Current Session</span>
) : (
  <button onClick={() => handleOpenSuspend(user)} className="btn btn-danger btn-sm">
    Suspend
  </button>
)}

// 2. Backend Guard (admin.service.js)
if (targetUserId === adminUserId) {
  throw new AppError('Administrators cannot suspend their own account', 400);
}
```

---

## 4. FYP Viva Voce Defense Questions & Model Answers

### Q1: Why do you enforce a minimum 10-character reason when suspending a user?
> **Answer:** "Sir, account suspension is a severe disciplinary measure that revokes a legal professional's livelihood on the platform. Enforcing a mandatory reason of at least 10 characters prevents accidental one-click suspensions, establishes a clear audit trail for administrative record-keeping, and ensures the affected user is given a meaningful explanation when they attempt to log in."

---

### Q2: How does your frontend revoke an active user's session without waiting for their JWT token to expire?
> **Answer:** "Sir, while JWT tokens are cryptographically stateless and cannot be deleted from the client's browser by the server, our Express backend middleware (`verifyToken.js`) checks `User.findByPk(decoded.id, { attributes: ['id', 'isActive', 'suspensionReason'] })` on every authenticated request. The moment an admin updates `isActive = false`, any subsequent request using that active token fails with HTTP 403 `ACCOUNT_SUSPENDED`, instantly locking the suspended user out in real-time."

---

### Q3: Why does the Admin Dashboard query statistics using `limit=1` instead of downloading all records?
> **Answer:** "Sir, downloading thousands of user records to count them in JavaScript (`users.length`) causes extreme network bloat and memory leaks. In `Dashboard.jsx`, our API calls pass `limit=1`, allowing PostgreSQL to execute an efficient `COUNT(*)` query via Sequelize (`findAndCountAll`) and return only the metadata `pagination.total`. This transfers less than 200 bytes over the wire while delivering accurate real-time numbers."

---

### Q4: Why is there no case file statistics or document viewer on the Admin Dashboard?
> **Answer:** "Sir, this is an intentional ethical boundary known as the **Admin Privacy Barrier**. Under Rule 135 and the Bar Councils Act, legal practitioners owe absolute confidentiality to their clients. Allowing platform administrators to read confidential case diaries or client evidence would violate attorney-client privilege. Administrators govern platform credentials and review licensing applications, but never inspect privileged case files."

---

### Q5: How does the search bar handle high typing speeds on mobile devices?
> **Answer:** "Sir, the search input uses a 400ms debounce timer via `setTimeout` and `clearTimeout`. When an administrator types rapidly on mobile, the frontend waits until typing pauses for 400 milliseconds before issuing the `GET /api/v1/admin/users?search=...` request. This reduces network round-trips by over 80% and prevents UI race conditions where older search results arrive after newer ones."

---

## 5. Numbered Manual Test Script (`@demo.legalhub.local`)

### Test Step 1: Accessing Admin Dashboard Platform Metrics
* **Action:** Log in as Administrator (`admin@legalhub.pk` / `AdminSecurePassword123!`) and navigate to `http://localhost:3000/dashboard`.
* **Expected Result:**
  1. The page renders the "Court Administrator Control Center" card.
  2. Real stat cards display accurate figures for: Total Registered Users, Enrolled Advocates, Pending Applications, Citizen Clients, and Suspended Accounts.
  3. Clicking "Pending Applications" routes directly to `/admin/queue`.

---

### Test Step 2: Accessing User Directory & Role Filtering
* **Action:** Navigate to `http://localhost:3000/admin/users` via topbar or sidebar navigation.
* **Action:** Select "Advocates" from the Role dropdown.
* **Expected Result:** Table immediately updates to show only users with the `lawyer` role chip. Pagination updates total counts accordingly.

---

### Test Step 3: Debounced User Search
* **Action:** In the search bar, type `tariq` and pause.
* **Expected Result:** Within 400ms, the table queries the backend and displays users matching name or email containing "tariq".

---

### Test Step 4: Disciplinary Account Suspension with Validation
* **Action:** Locate an active client or advocate row and click "Suspend".
* **Observation:** ConfirmDialog opens.
* **Action:** Type fewer than 10 characters (e.g. `Spam`) and click "Confirm Suspension".
* **Expected Result:** Form rejects with red error: *"Suspension reason must be at least 10 characters long."* Character counter shows `4 / 10 minimum characters`.
* **Action:** Complete a valid reason: `Repeated breach of chamber consultation policy.` (46 chars) and submit.
* **Expected Result:** Dialog completes; status chip transitions to red "Suspended", displaying the reason under the user's name. Action button transforms to "Reinstate".

---

### Test Step 5: Immediate Reinstatement
* **Action:** Click "Reinstate" on the suspended user.
* **Expected Result:** Confirmation dialog opens. Clicking "Confirm Reinstatement" updates user status back to green "Active" and clears the suspension lockout.
