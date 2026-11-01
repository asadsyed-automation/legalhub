# Part P: Email OTP Verification & Secure Password Reset Guide

> **Target Audience:** BS CS Final Year Students (Syed Asad, Muhammad Aqeel, Mubashir Mehmood)  
> **Course:** Final Year Project (FYP) — Emerson University Multan  
> **Topic:** Cryptographic One-Time Passwords (OTPs), Timing Attack Defenses, Account Recovery, and Email Provider Sandboxes

---

## 1. Concept in Plain English & Relatable Pakistani Analogy

### The Concept: Why Not Just Send a Password Reset Link with an ID?
When a user forgets their password, systems in the early 2000s used to email a plain link like `reset-password?userId=123`. Any attacker who knew a victim's user ID could navigate to that link and take over their account. 

Even if you make a random token, if you store the plain token in your database, an insider threat, a leaked SQL dump, or a SQL injection immediately exposes every user's reset credentials.

To make account recovery secure, we use **Cryptographic Time-Based Single-Use OTPs**:
1. A 6-digit random code is generated using a cryptographically secure pseudorandom number generator (`crypto.randomInt`).
2. Only the **SHA-256 hash** of that code is stored in the database.
3. The plain code is dispatched to the user's verified communication channel (Email).
4. The code has a strict validity window (10 minutes), a strictly limited number of attempts (max 5 before turning into a "dead code"), and can only be used once (`consumedAt`).
5. A cooldown period (60 seconds) prevents attackers or frantic users from spamming the email service.

---

### The Relatable Pakistani Analogy: Bank Internet Banking OTP (*Tokan / Muddat-e-Meyaar*)
Imagine you walk into a **Meezan Bank** or **Habib Bank Limited (HBL)** branch in Multan, or you are setting up Meezan Mobile Banking on your phone:

1. **The Request:** When you tap *"Forgot MPIN / Password"*, the bank doesn't show your password on the screen or ask security questions like *"What is your favorite color?"* (which anyone who knows you could guess).
2. **The SMS/Email Token:** The bank's automated server sends a 6-digit OTP to your registered SIM/Email with the notice: *"Valid for 10 minutes. Do not share with anyone, including bank staff."*
3. **The Counter Clerk Doesn't Know the Code:** The bank manager sitting at the desk cannot look into their terminal and tell you what your 6-digit OTP is. Why? Because the bank's core banking database only stores the mathematical hash!
4. **Three/Five Wrong Tries & Card Blocked (*Dead Code Rule*):** If a pickpocket steals your phone and starts guessing random 6-digit combinations (`111111`, `123456`, `987654`), after 5 wrong attempts the ATM or app blocks the OTP completely. Even if on the 6th attempt they guess the right number, the system rejects it because that code is now marked **Dead / Inactive**.
5. **Cooldown (*Sabar Kijiye*):** If you tap *"Resend Code"* 10 times in 5 seconds, the app displays: *"Please wait 60 seconds before requesting another SMS"*. This stops your telecom bill from exploding and protects the bank's SMS gateway from getting blacklisted.

---

## 2. End-to-End Technical Request Trace

Here is the exact journey of a user resetting their password across our Express layered architecture:

```
[Browser / Postman]
       |
       | 1. POST /api/v1/auth/forgot-password { email: "asad@example.pk" }
       v
[Express Router: auth.routes.js]
  -> Rate Limiter: otpRateLimiter (Max 10 per 15 min per IP)
  -> Body Validation: validate(forgotPasswordSchema) (Zod email check)
       |
       v
[Controller: auth.controller.js -> forgotPassword()]
       |
       v
[Service: auth.service.js -> forgotPassword()]
  -> User.findOne({ where: { email } })
  -> [Enumeration Guard]: If user NOT found:
        Return generic 200 OK: "If that email address is in our system, we have sent a 6-digit verification code to it."
  -> [If User Found]:
        |
        v
   [OTP Service: otp.service.js -> generateOtp(user.id, 'reset_password')]
     a. Checks most recent OTP for user. If (now - createdAt < 60s) -> throws 429 Too Many Requests (Cooldown).
     b. Invalidates any existing unconsumed OTPs for this purpose.
     c. Generates plain code: crypto.randomInt(100000, 1000000).toString() (e.g. "492810").
     d. Hashes plain code: crypto.createHash('sha256').update(plainCode + secret).digest('hex').
     e. Inserts into PostgreSQL `email_otps`:
        - userId: UUID
        - purpose: 'reset_password'
        - codeHash: '9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08'
        - attempts: 0
        - maxAttempts: 5
        - expiresAt: now + 10 minutes
        - consumedAt: null
        |
        v
   [Mailer Utility: mailer.js -> sendEmail()]
     -> Sends email via Resend API (or console fallback if in local development / unverified domain sandbox).
     -> Returns 200 OK with identical safe message.

========================================================================================

[Browser / Postman]
       |
       | 2. POST /api/v1/auth/reset-password { email, code: "492810", newPassword: "SecurePass123!" }
       v
[Express Router: auth.routes.js]
  -> Rate Limiter: otpRateLimiter
  -> Body Validation: validate(resetPasswordSchema) (code must be /^\d{6}$/, password min 8)
       |
       v
[Controller: auth.controller.js -> resetPassword()]
       |
       v
[Service: auth.service.js -> resetPassword()]
  -> User.findOne({ where: { email } })
  -> If user NOT found -> throw 400 "Invalid or expired verification code"
  -> [Verify & Consume OTP]:
        |
        v
   [OTP Service: otp.service.js -> verifyAndConsumeOtp(user.id, 'reset_password', code)]
     a. Finds latest OTP where consumedAt IS NULL.
     b. Expiry Check: If (now > otp.expiresAt) -> throws 400 "Verification code has expired."
     c. Max Attempts Check: If (otp.attempts >= 5) -> throws 429 "Too many failed attempts. Code invalidated."
     d. Constant-Time Hash Comparison:
        - Computed hash: crypto.createHash('sha256').update(code + secret).digest('hex')
        - Uses crypto.timingSafeEqual() to prevent microsecond side-channel timing leaks.
     e. If Hash MATCHES:
        - Sets otp.consumedAt = new Date() -> saves to DB.
        - Returns true.
     f. If Hash MISMATCHES:
        - Increments otp.attempts += 1 -> saves to DB.
        - If attempts reach 5, marks as dead.
        - Throws 400 "Invalid or expired verification code (Attempts remaining: X)".
        |
        v
  -> [Password Update]:
     a. Hashes newPassword using bcrypt.hash(newPassword, 10).
     b. Resets user.failedLoginAttempts = 0.
     c. Clears user.lockedUntil = null.
     d. Saves updated user to PostgreSQL.
  -> Returns 200 OK: "Password has been successfully reset. You may now log in with your new password."
```

---

## 3. Hands-on Student Exercises

### Exercise 1: Fake-Clock Expiry Testing Without `setTimeout`
**Problem:** In an automated test suite, an OTP expires after 10 minutes. If your test uses `setTimeout(..., 10 * 60 * 1000)`, your test suite will take 10 minutes to run and crash CI pipelines. How do we test that expired codes are rejected instantly?  
**Solution (Database Fast-Forward):**
```javascript
// 1. Generate normal OTP
await authService.forgotPassword(testEmail);

// 2. Fetch the stored OTP from database
const storedOtp = await EmailOtp.findOne({
  where: { userId: user.id, purpose: 'reset_password' }
});

// 3. Fast-forward its expiry timestamp into the past (e.g. 11 minutes ago)
await storedOtp.update({
  expiresAt: new Date(Date.now() - 11 * 60 * 1000)
});

// 4. Attempt reset with the correct plain code -> Expected 400 Expired!
const res = await request(app)
  .post('/api/v1/auth/reset-password')
  .send({ email: testEmail, code: plainCode, newPassword: 'NewPassword123!' });

expect(res.status).toBe(400);
expect(res.body.error).toMatch(/expired/i);
```

---

### Exercise 2: Testing the 5-Attempt "Dead Code" Rule
**Problem:** Prove that an attacker cannot brute-force a 6-digit code by submitting 1,000,000 requests. Verify that after 5 wrong attempts, the code is dead forever even if the attacker subsequently guesses the real code.  
**Solution:**
```javascript
// Submit 5 wrong guesses
for (let i = 1; i <= 5; i++) {
  const badRes = await request(app)
    .post('/api/v1/auth/reset-password')
    .send({ email: testEmail, code: '000000', newPassword: 'AnyPassword123!' });
  expect(badRes.status).toBe(i < 5 ? 400 : 429);
}

// 6th attempt with the GENUINE correct code
const genuineRes = await request(app)
  .post('/api/v1/auth/reset-password')
  .send({ email: testEmail, code: realCode, newPassword: 'AnyPassword123!' });

// Must still be rejected because code is locked!
expect(genuineRes.status).toBe(429);
expect(genuineRes.body.error).toContain('invalidated');
```

---

### Exercise 3: Testing the 60-Second Cooldown (Resend Throttling)
**Problem:** Ensure that a user cannot flood the email server by repeatedly clicking *"Forgot Password"*.  
**Solution:**
```javascript
// 1st request -> 200 OK
const firstReq = await request(app)
  .post('/api/v1/auth/forgot-password')
  .send({ email: testEmail });
expect(firstReq.status).toBe(200);

// Immediate 2nd request (within seconds) -> 429 Too Many Requests
const secondReq = await request(app)
  .post('/api/v1/auth/forgot-password')
  .send({ email: testEmail });
expect(secondReq.status).toBe(429);
expect(secondReq.body.error).toContain('wait 60 seconds');
```

---

## 4. FYP Viva Voce Defense Questions & Model Answers

### Q1: Why do you store the SHA-256 hash of an OTP instead of storing the 6-digit code in plain text in PostgreSQL?
> **Answer:** "Sir, storing plain-text OTPs in the database violates the principle of least privilege and cryptographic defense-in-depth. If an attacker gains read access to the database via SQL injection, backup exposure, or database logs, having plain text codes would allow them to hijack any active account recovery flow within its 10-minute validity window. By storing only the SHA-256 hash, even a fully leaked database dump gives an attacker zero ability to reverse-engineer the original 6-digit code in transit."

---

### Q2: Why does your `/forgot-password` endpoint return HTTP 200 OK even when the email does not exist in your database?
> **Answer:** "Sir, this prevents **User Enumeration Attacks**. If our API returned `404 Not Found: Email does not exist`, an adversary could automate a dictionary attack with a list of Pakistani citizen email addresses to map out exactly which advocates or clients have registered accounts on LegalHub. Returning an identical generic message (`'If that email address is in our system, we have sent a code...'`) ensures that outside observers learn nothing about the contents of our database."

---

### Q3: Why is `crypto.timingSafeEqual` used instead of standard string equality (`===`) when verifying the OTP hash?
> **Answer:** "Sir, standard JavaScript string comparison (`a === b`) short-circuits on the very first mismatched character. An attacker with a high-resolution network timer can measure nanosecond-level differences in HTTP response times to deduce character by character whether their guessed hash matches the stored hash. `crypto.timingSafeEqual()` executes in constant time regardless of where mismatches occur, completely eliminating side-channel timing attacks."

---

### Q4: How does your mailer service handle the free-tier Resend sandbox limitation without crashing in development?
> **Answer:** "Sir, in free-tier sandbox mode without an approved custom domain, email APIs like Resend restrict outgoing test messages to the account owner's single verified email address (`403 Forbidden` on other recipients). Our `mailer.js` utility catches this specific API code or network errors gracefully, logs the full message to the secure development console (`[MAILER:CONSOLE]`), and allows the user flow to proceed uninterrupted. Furthermore, in our automated Jest test suite, the mailer switches to an in-memory `testOutbox` so tests execute 100% offline without network latency or external rate limits."

---

### Q5: If an account was previously locked for 15 minutes due to 5 failed password attempts, what happens when the user successfully resets their password via OTP?
> **Answer:** "Sir, in `auth.service.js -> resetPassword()`, upon successful OTP verification and password update, we explicitly set `failedLoginAttempts = 0` and `lockedUntil = null`. Since the user has proven ownership of their registered email address via out-of-band cryptographic proof, their lockout penalty is immediately lifted, allowing them to log in without waiting for the 15-minute lockout timer to expire."

---

## 5. Thunder Client / Postman Test Collection & Curl Commands

### 1. Request Password Reset OTP
```bash
curl -X POST http://localhost:4000/api/v1/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email": "eum.syed.asad.14@gmail.com"}'
```
**Response (200 OK):**
```json
{
  "message": "If that email address is in our system, we have sent a 6-digit verification code to it."
}
```

---

### 2. Submit Reset Code & New Password
```bash
curl -X POST http://localhost:4000/api/v1/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{
    "email": "eum.syed.asad.14@gmail.com",
    "code": "858705",
    "newPassword": "NewStrongPassword2026!"
  }'
```
**Response (200 OK):**
```json
{
  "message": "Password has been successfully reset. You may now log in with your new password."
}
```

---

### 3. Verify Email Registration Code
```bash
curl -X POST http://localhost:4000/api/v1/auth/verify-email \
  -H "Content-Type: application/json" \
  -d '{
    "email": "eum.syed.asad.14@gmail.com",
    "code": "858705"
  }'
```
**Response (200 OK):**
```json
{
  "message": "Email verified successfully",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "e6a21359-25bc-4f70-b992-6f29df5a0241",
    "name": "Syed Asad",
    "email": "eum.syed.asad.14@gmail.com",
    "role": "client",
    "emailVerifiedAt": "2026-10-29T06:50:00.000Z"
  }
}
```
