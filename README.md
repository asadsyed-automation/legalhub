# LegalHub - Legal Marketplace for Pakistan 🇵🇰

A modern, secure, and production-grade backend API core for **LegalHub**, a digital legal services marketplace connecting citizens and corporate clients with verified Pakistani advocates across all provincial Bar Councils and Court Levels.

---

## 🚀 Technology Stack
* **Runtime:** Node.js 20+ (LTS)
* **Framework:** Express.js
* **Database & ORM:** PostgreSQL (via Supabase) with Sequelize ORM & Sequelize CLI migrations
* **Validation:** Zod (strict schema validation on all inputs)
* **Security & Auth:** JWT (JSON Web Tokens), Bcryptjs (12 salt rounds), Helmet, CORS, Express-Rate-Limit
* **Testing:** Jest + Supertest (comprehensive integration test suite)

---

## 🏛️ Architecture & Clean Layering
```text
Route  -->  Controller (HTTP Only)  -->  Service (Business Rules)  -->  Model (Sequelize/PostgreSQL)
```
* **No business logic in routes or controllers.**
* **Fail-Fast Configuration:** `src/config/env.js` validates all environment variables at startup and halts boot if any are missing or invalid.
* **Defense in Depth:**
  * Password hashes are permanently stripped via `User.prototype.toJSON()`.
  * Dummy bcrypt comparison on invalid emails to prevent timing attacks.
  * 5 consecutive failed logins trigger a 15-minute account lockout.
  * Admin accounts can never be created via public APIs (seed script only).

---

## 📁 Repository Structure
```text
legalhub/
├── .gitignore
├── README.md
└── backend/
    ├── package.json
    ├── .env.example
    ├── .sequelizerc
    ├── migrations/          # Version-controlled database migrations
    ├── scripts/             # Admin seeding & CLI tools
    ├── docs/
    │   └── learn/           # Step-by-step learning guides & viva preparation
    ├── src/
    │   ├── config/          # Startup env validation & DB connections
    │   ├── constants/       # Bar Councils, Court Levels, Cities, Practice Areas, Roles
    │   ├── middleware/      # verifyToken, requireRole, validate, errorHandler, notFound
    │   ├── models/          # Sequelize models (User, etc.)
    │   ├── modules/
    │   │   └── auth/        # Routes, Controller, Service, Zod Schemas
    │   ├── utils/           # AppError, asyncHandler
    │   ├── app.js           # Express app builder (no listening)
    │   └── server.js        # Server listener with graceful shutdown
    └── tests/               # Health, Auth, and Role integration tests
```

---

## 🧪 Testing
Part A test suite verified with **20 / 20 tests passing**:
```bash
cd backend
npm test
```

---

## 👨‍💻 Author
**Asad Syed** - Final Year Project (BS Computer Science)
