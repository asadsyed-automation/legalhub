# LegalHub Frontend Engineering Guide: FE-10 (Email OTP Verification, Account Suspension UX & Password Reset)

> **Final Year Project (FYP) — Emerson University Multan**  
> **Student Developers:** Syed Asad, Muhammad Aqeel, Mubashir Mehmood  
> **Module:** Frontend Phase 4 — Authentication Resilience & Account Recovery (FE-10: Email OTP Verification, Resend Throttling, Suspended Account UX, and Password Recovery)  
> **Target Scope:** "Check your email" screen (`/verify-email`), 60s countdown timer, 6-digit OTP code input, `403 EMAIL_NOT_VERIFIED` and `ACCOUNT_SUSPENDED` handling on Login, Enumeration-safe Forgot Password (`/forgot-password`), and Cryptographic Password Reset (`/reset-password`).

---

## 1. Architectural Philosophy & Pakistani Metaphor

### NADRA e-Sahulat Token & Bar Council Suspension Notice (*نادرا بائیو میٹرک تصدیق اور معطلی نوٹس*)
* **The e-Sahulat Token Verification:** When an applicant visits a NADRA office or applies for an online biometric verification in Multan, NADRA never hands over the finalized identity certificate immediately upon filling out the form. The system sends an out-of-band 6-digit passcode to the applicant's registered contact channel. The screen displays: *"Aap ke registered email/number par 6-hindsi code rawana kar diya gaya hai. Baraye meherbani 60 second sabar kijiye."*
* **Decoupling Registration from Immediate Session:** In older architectures, the registration endpoint returned a JWT session immediately. If a fraudulent user registered someone else's email address by mistake or malice, the false account occupied that identity without verification. In **FE-10**, registration completes without expecting a session token, immediately forwarding the applicant to the dedicated verification screen (`/verify-email`).
* **Suspended Advocate Notice (Bar Council Disciplinary Action):** If an advocate's chamber credentials are suspended by the Bar Council Tribunal or platform administrator due to ethics complaints, the login screen must not display a misleading message like *"Wrong password"*. Doing so wastes user time and creates confusion. Instead, **FE-10** inspects `details[0].message === 'ACCOUNT_SUSPENDED'` and clearly renders the exact administrative suspension reason and support contact instructions.
* **Enumeration Defense in Account Recovery:** If an adversary enters an advocate's email address on the *"Forgot Password"* page, displaying *"No account exists with this email"* would give the attacker valuable intelligence. In **FE-10**, the user interface always renders an identical confirmation message: *"If that email address is in our system, we have sent a 6-digit verification code to it."*

---

## 2. Complete Trace: From Registration Click to Email Verification and Database Session

**User Action:** A new client `kashif.client@demo.legalhub.local` registers for an account, verifies his 6-digit code, and establishes an active session:

```
[ Litigant UI: Register.jsx ]
       │
       │ 1. Fills name, email, password, role ('client')
       │ 2. Clicks "Create Account"
       ▼
[ Frontend API: authApi.register(payload) ]
       │
       │ 3. Issues POST /api/v1/auth/register
       ▼
[ Express Backend & Database (Supabase) ]
       │
       │ 4. bcrypt.hash(password, 12) -> INSERT INTO users (name, email, password_hash, role, ...)
       │ 5. Generates 6-digit OTP (crypto.randomInt) -> SHA-256 hash -> INSERT INTO email_otps
       │ 6. Dispatches code via Mailer (Resend API or Development Console Outbox)
       │ 7. Returns HTTP 201 Created: { user: { id, email, role }, emailVerificationRequired: true }
       ▼
[ React Router Navigation ]
       │
       │ 8. Register.jsx receives 201 and navigates to:
       │    /verify-email?email=kashif.client%40demo.legalhub.local
       ▼
[ VerifyEmail.jsx Component ]
       │
       │ 9. Initializes 60s countdown effect (useRef + setTimeout)
       │ 10. User reads 6-digit code ("492810") from email and inputs into code field
       │ 11. Clicks "Verify & Continue" -> handleVerify()
       ▼
[ Frontend API: authApi.verifyEmail({ email, code: "492810" }) ]
       │
       │ 12. Issues POST /api/v1/auth/verify-email
       ▼
[ Backend Service: auth.service.js -> verifyEmail() ]
       │
       │ 13. Computes SHA-256 hash of input code with salt
       │ 14. Compares with stored hash using crypto.timingSafeEqual()
       │ 15. If match: marks email_otps.consumedAt = NOW(), updates users.email_verified_at = NOW()
       │ 16. Returns HTTP 200 OK: { token: "eyJhbG...", user: { id, name, email, role, emailVerifiedAt } }
       ▼
[ Frontend Session Activation ]
       │
       │ 17. VerifyEmail.jsx calls AuthContext.setSessionFromToken(token, user)
       │ 18. LocalStorage saves JWT under "legalhub_token"
       │ 19. Navigates to /dashboard with authenticated access!
```

---

## 3. Hands-on Student Exercises

### Exercise 1: Implementing a Robust 60-Second Cooldown Timer in React
**Problem:** If you implement a countdown timer using a simple `setInterval` without cleaning up when the component unmounts or re-renders, the timer runs multiple times faster (tick leakage) and memory leaks occur. How do we build a leak-free countdown?  
**Solution:**
```javascript
import { useState, useEffect, useRef } from 'react';

export const useResendCountdown = (initialSeconds = 60) => {
  const [countdown, setCountdown] = useState(initialSeconds);
  const timerRef = useRef(null);

  useEffect(() => {
    if (countdown > 0) {
      timerRef.current = setTimeout(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [countdown]);

  const resetCountdown = (seconds = initialSeconds) => {
    setCountdown(seconds);
  };

  return { countdown, resetCountdown };
};
```

---

### Exercise 2: Gracefully Catching and Distinguishing Backend 403 Sub-Codes
**Problem:** In Axios, a `403 Forbidden` status can represent multiple distinct business states (e.g., `EMAIL_NOT_VERIFIED` vs. `ACCOUNT_SUSPENDED` vs. unauthorized route). How does the frontend reliably extract and render the correct UI branch without guessing?  
**Solution:**
```javascript
try {
  await login(credentials);
  navigate('/dashboard');
} catch (error) {
  // Backend returns standardized details array: [{ field: 'account', message: 'EMAIL_NOT_VERIFIED' }]
  const subCode = error.details?.[0]?.message;

  if (error.status === 403 && subCode === 'EMAIL_NOT_VERIFIED') {
    setIsUnverified(true);
    setErrorMessage('Please verify your email address before logging in.');
  } else if (error.status === 403 && subCode === 'ACCOUNT_SUSPENDED') {
    setIsSuspended(true);
    setErrorMessage(error.message); // Contains administrator's reason and support instructions
  } else {
    setErrorMessage(error.message || 'Authentication failed');
  }
}
```

---

### Exercise 3: User Enumeration Defense in the React View Layer
**Problem:** Even if the backend returns a generic `200 OK` on `/forgot-password`, if the frontend shows a green checkmark for some emails and a red warning for others, the application leaks user registration status. How do we keep the frontend strictly enumeration-proof?  
**Solution:**
```javascript
const handleForgotPassword = async (e) => {
  e.preventDefault();
  setLoading(true);
  try {
    const res = await authApi.forgotPassword({ email: email.trim().toLowerCase() });
    // Regardless of whether the user exists in database, ALWAYS transition to the same confirmation UI
    setFeedbackMessage(res.message);
    setSubmitted(true);
  } catch (error) {
    // Only genuine network/gateway outages display an error banner
    setErrorMessage(error.message || 'Network request failed');
  } finally {
    setLoading(false);
  }
};
```

---

## 4. FYP Viva Voce Defense Questions & Model Answers

### Q1: Why does LegalHub no longer expect an authenticated session token directly from the `/register` endpoint?
> **Answer:** "Sir, issuing an immediate JWT session on registration bypasses email ownership verification. A user could enter an erroneous or arbitrary email address and access platform features, but when court hearing reminders or invoice notices are dispatched, they would fail. In FE-10, registration creates the record in an unverified state, immediately routing the user to the `/verify-email` screen to confirm possession of that communication channel before granting an active token."

---

### Q2: What is the purpose of the 60-second countdown on the "Resend Code" button?
> **Answer:** "Sir, the 60-second cooldown serves two vital functions: first, it prevents email server rate-limit exhaustion and protects our transactional email reputation (Resend) from being flagged as a spam vector; second, it stops impulsive users from repeatedly clicking the button and creating multiple concurrent codes, ensuring they allow sufficient time for network delivery."

---

### Q3: How does the login screen handle an account that has been suspended by an administrator?
> **Answer:** "Sir, when a suspended user submits valid credentials, the backend responds with HTTP 403 Forbidden and attaches an explicit error envelope containing `details: [{ field: 'account', message: 'ACCOUNT_SUSPENDED' }]` along with the administrative suspension reason. The frontend detects this code and presents a clear, dignified notice explaining the suspension reason and support contact steps, rather than confusing the user with an 'Invalid email or password' message."

---

### Q4: Why does the `/forgot-password` screen always show a success confirmation message even if the email does not exist?
> **Answer:** "Sir, this prevents **User Enumeration Attacks**. If our platform returned an error such as 'Email not found', malicious actors could submit a script with hundreds of citizen or lawyer email addresses to discover exactly who has an account on LegalHub. Returning an identical generic message maintains cryptographic privacy and confidentiality."

---

### Q5: How does the frontend ensure password security rules on the `/reset-password` screen?
> **Answer:** "Sir, before submitting the payload to the backend, the component validates that the new password meets the minimum 8-character complexity threshold and checks that the confirmation password matches identically. In addition, the screen clearly displays the system's security rules (minimum 8 characters, maximum 5 wrong attempts before code invalidation) so the user has immediate visual feedback without relying solely on backend round-trips."

---

## 5. Numbered Manual Test Script (Using `@demo.legalhub.local` Accounts)

### Test Step 1: Registration Redirection to Email Verification
* **Action:** Navigate to `http://localhost:3000/register`.
* **Inputs:** Full Name: `Tariq Client`, Email: `tariq.new@demo.legalhub.local`, Password: `Password123!`, Role: `Client`.
* **Expected Result:** Form submits successfully; browser immediately redirects to `/verify-email?email=tariq.new%40demo.legalhub.local`.

---

### Test Step 2: Verification Screen 60-Second Countdown & Input Constraints
* **Action:** Inspect the `/verify-email` screen.
* **Expected Result:**
  1. The "Resend Code" button is initially disabled and displays a real-time countdown (`Resend code in 59s`, `58s`...).
  2. The 6-digit code input only accepts numeric characters and caps at 6 digits.
  3. The "Verify & Continue" button remains disabled until exactly 6 digits are typed.

---

### Test Step 3: Entering Valid OTP Code & Direct Login
* **Action:** In local development, check the backend server terminal log for the dispatched code:
  `[MAILER:CONSOLE] Code: 123456`. Type the 6 digits and click "Verify & Continue".
* **Expected Result:** Verification succeeds; the user is immediately authenticated and navigated to `/dashboard`.

---

### Test Step 4: Login Guard for Suspended Accounts
* **Action:** Log out and attempt to sign in with an account marked suspended (`isActive: false`).
* **Expected Result:**
  1. Login rejects with HTTP 403.
  2. The UI renders an `alert alert-danger` with the heading **"Account Suspended:"** and displays the administrative suspension reason clearly.

---

### Test Step 5: Forgot Password Enumeration Protection
* **Action:** Navigate to `http://localhost:3000/forgot-password`.
* **Inputs:** Enter a non-existent email address: `nobody.exists.here@demo.legalhub.local`.
* **Expected Result:** System displays the standard generic message: *"If that email address is in our system, we have sent a 6-digit verification code to it."* No "Email not found" error is ever displayed.

---

### Test Step 6: Reset Password Happy Path
* **Action:** Click "Enter Code & Reset Password" to navigate to `/reset-password`.
* **Inputs:** Enter email, the 6-digit code, new password `BrandNewPassword123!`, and confirm password.
* **Expected Result:** Form submits to `/api/v1/auth/reset-password`; displays success banner *"Password has been reset successfully. Please log in with your new password."* with a direct "Sign In with New Password" button.
