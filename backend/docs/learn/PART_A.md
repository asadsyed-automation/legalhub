# LegalHub Backend Core - Learning Guide: Part A (Foundation & Auth)

Welcome to Part A of the LegalHub backend learning guide. This document is designed for you to master the architecture, explain every design decision to your supervisor, and teach it to your teammate.

---

## 1. High-Level Explanation & Pakistani Real-Life Analogy

### Real-Life Analogy: The Legal Chamber Complex
Imagine a modern multi-story **Legal Chamber Complex** located outside the High Court in Lahore or Sindh:

1. **The Outer Security Gate (`Helmet`, `CORS`, Rate Limiting):**
   - The security guard ensures visitors enter through designated entry gates (**CORS** ensures only requests from our authorized frontend domains are accepted).
   - The guard ensures nobody vandalizes the walls (**`Helmet`** sets secure HTTP headers to prevent XSS, clickjacking, and sniffing).
   - If someone repeatedly buzzes the intercom 50 times in 2 minutes, the guard pauses them at the gate (**Rate Limiting** stops credential stuffing and brute-force attacks).
2. **The Reception & Identity Counter (`Register`, `Login`, `Bcrypt`, `JWT`):**
   - When a citizen (Client) or advocate (Lawyer) arrives for the first time, they present their details.
   - We **never** write plain passwords into our master ledger. We feed the password through a cryptographic shredder (**`Bcrypt`** with 12 salt rounds) and store only the irreversible hash.
   - If someone guesses a password incorrectly 5 times in a row, the guard locks their file for 15 minutes (**Account Lockout**).
   - Upon successful identification, the receptionist issues a stamped, tamper-evident digital plastic badge (**JWT Token**). Inside the badge is their user ID and role.
   - Every time the visitor navigates the building, the checkpoint guard at each door (**`verifyToken`** middleware) verifies the badge's digital signature without querying the master archive.
3. **Restricted Floors (`requireRole`):**
   - If the badge says `client`, the client cannot access the "Advocate-Only Chamber" or the "Chief Registrar's Admin Room" (**`requireRole`** returns `403 Forbidden`).
4. **Architectural Separation of Concerns:**
   - **Route:** The corridor signboard directing visitors to the right room.
   - **Controller:** The front-desk clerk who takes the incoming paperwork (`req`), verifies it has the right stamps, delegates the work, and hands back the result (`res`).
   - **Service:** The legal administrative officer who enforces all business rules (*"Are they locked out?", "Is this email already registered?", "Is someone trying to illegally claim an Admin role?"*).
   - **Model:** The master physical archive room (**PostgreSQL** managed by **Sequelize ORM**).

---

## 2. Technical Terms Defined

| Term | Definition |
| :--- | :--- |
| **Node.js** | A high-performance V8 JavaScript runtime that executes JavaScript code outside a web browser on the server. |
| **Express** | A lightweight web application framework for Node.js providing robust routing, middleware pipelines, and HTTP utilities. |
| **PostgreSQL** | An enterprise-grade, open-source object-relational database management system (RDBMS) ensuring ACID compliance. |
| **Sequelize (ORM)** | Object-Relational Mapper that maps PostgreSQL tables to JavaScript models and methods (`User.create()`, `User.findOne()`). |
| **Migration** | Version-controlled schema change script enabling reproducible database creation and rollbacks across team environments. |
| **Zod** | A TypeScript/JavaScript schema validation library that parses and sanitizes request payloads, catching invalid formats before logic runs. |
| **Bcrypt (`bcryptjs`)** | An adaptive cryptographic key derivation and one-way hashing function designed with configurable work factors (salt rounds) to resist brute-force attacks. |
| **JWT (JSON Web Token)** | An open standard (RFC 7519) representing claims securely between two parties as a digitally signed JSON object. |
| **Middleware** | A chain of functions in Express with access to `req`, `res`, and `next` that process or intercept requests before reaching controllers. |
| **Helmet** | Security middleware that secures Express apps by setting various HTTP response headers (HSTS, Content-Security-Policy, etc.). |
| **CORS** | Cross-Origin Resource Sharing; browser security standard restricting cross-domain API access to whitelisted frontend origins. |
| **Rate Limiter** | Middleware controlling the incoming request rate per client IP to protect against Denial of Service (DoS) and brute-force attacks. |

---

## 3. File-by-File Summary

| File | What It Does |
| :--- | :--- |
| `src/config/env.js` | Loads `.env`, validates that all required environment variables are set and meet security constraints (e.g. `JWT_SECRET` ≥ 32 chars), and halts process startup with a clear error if any are missing. |
| `src/config/db.js` | Initializes the Sequelize ORM connection pool with PostgreSQL using `DATABASE_URL` and configurable SSL options. |
| `src/config/database.js` | Exports database connection configurations specifically for `sequelize-cli` across development, test, and production environments. |
| `src/constants/roles.js` | Defines immutable constants for system roles (`client`, `lawyer`, `admin`) and restricts public registration to `client` and `lawyer`. |
| `src/constants/index.js` | Centralizes system-wide constants, including approved Bar Councils, Court Levels, Pakistani cities, and Practice Areas. |
| `src/utils/AppError.js` | Extends the native `Error` class to encapsulate HTTP status codes, operational error flags, and structured field-level error details. |
| `src/utils/asyncHandler.js` | High-order function that wraps asynchronous Express handlers to automatically catch rejected promises and forward them to error middleware without repetitive `try/catch` blocks. |
| `src/middleware/validate.js` | Executes Zod validation against `req.body`, `req.query`, or `req.params`, transforming validation errors into the standardized `{ error, details }` structure with HTTP 400. |
| `src/middleware/verifyToken.js` | Extracts the Bearer token from the `Authorization` header, verifies its digital signature via JWT secret, and attaches decoded user claims to `req.user`. |
| `src/middleware/requireRole.js` | Authorization guard ensuring that `req.user.role` matches the permitted roles for a given endpoint, rejecting unauthorized callers with HTTP 403. |
| `src/middleware/notFound.js` | Catch-all middleware that intercepts requests for unregistered routes and forwards a standardized 404 `AppError`. |
| `src/middleware/errorHandler.js` | Global error handling middleware formatting all thrown errors into `{ "error": "...", "details": [...] }` and mapping Sequelize and JWT exceptions to clean HTTP status codes. |
| `src/models/user.model.js` | Defines the Sequelize `User` model with UUID primary keys, unique lowercase email constraints, bcrypt password hashes, and a custom `toJSON()` method that guarantees passwords are never leaked. |
| `src/models/index.js` | Central hub for initializing Sequelize models and managing database relationships. |
| `src/modules/auth/auth.schemas.js` | Contains Zod validation schemas enforcing strict registration rules (min 8 char password, valid email, role restricted to client/lawyer) and login rules. |
| `src/modules/auth/auth.service.js` | Houses core business logic: timing-attack-safe login checks, 5-attempt account lockout for 15 minutes, password hashing, JWT generation, and profile retrieval. |
| `src/modules/auth/auth.controller.js` | Handles HTTP transport concerns: extracts parameters from `req`, invokes `authService`, and responds with correct HTTP status codes (200, 201). |
| `src/modules/auth/auth.routes.js` | Declares authentication endpoints (`/register`, `/login`, `/me`), applying rate limiting, schema validation, and token authentication middleware. |
| `src/app.js` | Assembles Express application with Helmet, CORS, body parsers, health check route, auth router, 404 handler, and global error middleware. |
| `src/server.js` | Entry point of the server: verifies PostgreSQL database connectivity with `sequelize.authenticate()` and starts listening on the designated PORT. |
| `scripts/seedAdmin.js` | Secure CLI script that reads `ADMIN_EMAIL` and `ADMIN_PASSWORD` from environment variables, hashes the credentials, and creates the initial system administrator. |
| `migrations/20261017000001-create-users.js` | Sequelize CLI migration creating the `users` table with UUIDs, unique indexed emails, role enums, and lockout tracking columns. |
| `tests/setup.js` | Configures the Jest test environment, synchronizes test database tables, and automatically purges test records ending with `@test.legalhub.local`. |
| `tests/health.test.js` | Verifies `GET /api/v1/health` and ensures unhandled routes return standardized 404 errors. |
| `tests/auth.test.js` | Exhaustive integration tests covering registration, duplicate emails (409), weak passwords (400), admin role rejection (400), login success, wrong credentials (401), account lockout, and token verification. |
| `tests/role.test.js` | Tests role-based access control guards (`requireRole`) ensuring clients cannot access lawyer or admin endpoints (403 Forbidden). |

---

## 4. End-to-End Request Trace: `POST /api/v1/auth/login`

Here is what happens under the hood when a user submits their login credentials:

```text
[Client Request: POST /api/v1/auth/login]
        │
        ▼
1. Express Layer (`app.js`):
   - `helmet()` applies secure HTTP response headers.
   - `cors()` inspects the `Origin` header against allowed `FRONTEND_URLS`.
   - `express.json()` parses the JSON body into `req.body`.
        │
        ▼
2. Rate Limiting (`auth.routes.js`):
   - `authRateLimiter` checks the client's IP address. If requests exceed 50 within 15 minutes, immediately returns 429 Too Many Requests (skipped during automated tests).
        │
        ▼
3. Validation Middleware (`validate(loginSchema)`):
   - Zod checks `req.body` against `loginSchema` (valid email format, non-empty password).
   - If invalid, throws `AppError('Validation failed', 400, details)`.
   - If valid, sanitized data is passed forward via `next()`.
        │
        ▼
4. Controller (`auth.controller.js`):
   - `login` controller receives `req.body`.
   - Calls `authService.login(req.body)`.
        │
        ▼
5. Service Layer (`auth.service.js`):
   - Normalizes email to lowercase.
   - Queries `User.findOne({ where: { email } })`.
   - **Case A: User does NOT exist:** Runs a dummy `bcrypt.compare` to consume identical CPU cycles (preventing timing attacks), then throws `AppError('Invalid email or password', 401)`.
   - **Case B: User IS locked:** Checks `user.lockedUntil`. If current time < `lockedUntil`, calculates remaining minutes and throws 401.
   - **Case C: Password check:** Compares provided password against stored `passwordHash` using `bcrypt.compare`.
     - *Mismatch:* Increments `failedLoginAttempts`. If attempts reach 5, sets `lockedUntil` to `now + 15 minutes`. Throws `AppError('Invalid email or password', 401)`.
     - *Match:* Resets `failedLoginAttempts = 0` and `lockedUntil = null`. Generates signed JWT with payload `{ id, email, role }`.
        │
        ▼
6. Database Layer (PostgreSQL via Sequelize):
   - Executes parameterized SQL updates: `UPDATE users SET "failedLoginAttempts" = 0, "lockedUntil" = NULL WHERE id = ...;`
        │
        ▼
7. Response Delivery:
   - Controller receives `{ token, user }`.
   - Returns HTTP 200 OK:
     ```json
     {
       "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
       "user": {
         "id": "c1f727b4-3a52-4a09-90bc-089c176e3381",
         "name": "Ahmed Khan",
         "email": "ahmed@example.pk",
         "role": "client",
         "failedLoginAttempts": 0,
         "lockedUntil": null,
         "createdAt": "2026-10-18T05:00:00.000Z",
         "updatedAt": "2026-10-18T05:00:00.000Z"
       }
     }
     ```
   - Notice: `passwordHash` is completely omitted due to `User.prototype.toJSON`.

---

## 5. Three Hands-On Exercises (Do Yourself Without AI)

To truly own this code before speaking with your supervisor:

1. **Exercise 1 - Add a Password Complexity Requirement:**
   - In `src/modules/auth/auth.schemas.js`, modify `registerSchema.password` using Zod regex (`.regex(...)`) to require at least one uppercase letter, one lowercase letter, and one number.
   - Run tests and see if your new requirement breaks or strengthens the validation tests.
2. **Exercise 2 - Add a Custom Middleware Logger:**
   - In `src/middleware/`, create a simple middleware called `requestTimer.js` that records the start time of a request (`const start = Date.now()`) and logs `[HTTP] METHOD URL completed in X ms` when `res.on('finish', ...)` fires.
   - Mount it in `src/app.js` and test it with Postman or curl.
3. **Exercise 3 - Manual Account Lockout Verification:**
   - Use Postman, curl, or thunder-client to register a user.
   - Send 5 consecutive requests with a wrong password.
   - Inspect the database directly in pgAdmin or psql: observe `failedLoginAttempts` reach 5 and `lockedUntil` timestamp set to 15 minutes in the future.
   - Send a 6th request with the correct password to verify you are still blocked until the window expires.

---

## 6. Five Viva Questions & Model Answers

### Q1: Why do we separate code into Route -> Controller -> Service -> Model?
> **Model Answer:** This is the Separation of Concerns principle. Routes only define endpoints and URL paths. Controllers handle HTTP-specific logic (headers, status codes, query/body extraction). Services contain pure business logic (rules, password checks, validations) independent of HTTP. Models represent database tables. This makes our backend testable, modular, and maintainable.

### Q2: Why do we hash passwords with Bcrypt instead of SHA-256 or MD5?
> **Model Answer:** SHA-256 and MD5 are general-purpose, high-speed hash functions designed for speed. Attackers can compute billions of SHA-256 hashes per second using GPUs or ASIC hardware. Bcrypt is intentionally slow and adaptive; it uses a configurable "work factor" (salt rounds) and internal salt generation to make brute-force and rainbow table attacks computationally prohibitive.

### Q3: What is a timing attack on login, and how did we prevent it?
> **Model Answer:** If an API immediately returns `401` when an email does not exist (taking ~2ms), but performs an expensive `bcrypt.compare` when the email does exist (taking ~100ms), an attacker can measure response times to enumerate registered email addresses. We mitigated this by running a dummy bcrypt comparison even when a user is not found, ensuring both branches take similar execution time, and returning an identical error message (`"Invalid email or password"`).

### Q4: Why do we use migrations instead of `sequelize.sync({ force: true })` in production?
> **Model Answer:** `sequelize.sync({ force: true })` drops and recreates tables, destroying live production data. Even `sequelize.sync({ alter: true })` can fail unpredictably on complex schema changes or cause table locks. Migrations provide an auditable, version-controlled history of schema changes that can be tested, rolled forward (`up`), or rolled back (`down`) safely without data loss.

### Q5: What is the difference between 401 Unauthorized and 403 Forbidden?
> **Model Answer:** `401 Unauthorized` means authentication has failed or is missing: the server does not know who the client is (e.g., missing or invalid JWT). `403 Forbidden` means authentication succeeded, the server knows who you are, but you do not have permission or role clearance to access the requested resource (e.g., a Client trying to access an Admin route).

---

## 7. Common Pitfalls & Mistakes to Avoid

1. **Leaking `passwordHash` in API responses:**
   - *Mistake:* Returning `res.json(user)` where `user` is raw database row data.
   - *Fix:* Overriding `User.prototype.toJSON` or explicitly selecting attributes so sensitive hashes are never transmitted.
2. **Insecure JWT Secrets:**
   - *Mistake:* Using short strings like `"secret"` or committing keys to git.
   - *Fix:* Enforcing in `src/config/env.js` that `JWT_SECRET` is at least 32 random characters and loaded strictly from environment variables.
3. **Hardcoding URLs or Ports:**
   - *Mistake:* Hardcoding `localhost:3000` inside code.
   - *Fix:* Storing all frontend origins in `FRONTEND_URLS` and accessing them through centralized `config`.
4. **Different error messages for email vs. password:**
   - *Mistake:* Returning "User not found" when email is wrong, and "Incorrect password" when password is wrong.
   - *Fix:* Returning `"Invalid email or password"` for both cases to prevent user enumeration.
