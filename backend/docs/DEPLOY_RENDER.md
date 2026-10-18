# Production Deployment Blueprint: Render (PaaS)

This guide provides step-by-step instructions for deploying the LegalHub backend to **Render** (https://render.com) connected to your GitHub repository and Supabase PostgreSQL database.

> **Note:** Deployment is completely optional and simulated here; do not deploy unless required.

---

## 1. Prerequisites
1. **GitHub Repository:** Your repository at `https://github.com/asadsyed-automation/legalhub` pushed with Part A, B, and C.
2. **Supabase Database:** Active PostgreSQL instance with `users` and `lawyer_applications` tables.

---

## 2. Step-by-Step Render Setup

### Step 1: Create a New Web Service
1. Log in to [Render Dashboard](https://dashboard.render.com).
2. Click **New +** $\rightarrow$ **Web Service**.
3. Select **Build and deploy from a Git repository**.
4. Connect your GitHub account and select your `legalhub` repository.

### Step 2: Configure Service Parameters
Fill in the following fields in the Render Web Service configuration screen:

| Field | Configuration Value | Explanation |
| :--- | :--- | :--- |
| **Name** | `legalhub-backend` | Service identifier |
| **Region** | `Singapore (Southeast Asia)` | Matches your Supabase region for minimal database latency |
| **Branch** | `main` | Production branch |
| **Root Directory** | `backend` | Tells Render our Node application lives in `/backend` |
| **Runtime** | `Node` | Node.js execution environment |
| **Build Command** | `npm install` | Installs production dependencies |
| **Pre-Deploy Command** | `npm run migrate` | Automatically runs Sequelize migrations on every deploy |
| **Start Command** | `npm run start` | Executes `node src/server.js` |
| **Instance Type** | `Free` (or Starter) | 512 MB RAM, 0.1 CPU |

---

### Step 3: Configure Environment Variables
In the Render dashboard, navigate to the **Environment** tab and add the following keys:

| Variable | Recommended Production Value | Description |
| :--- | :--- | :--- |
| `NODE_ENV` | `production` | Enables production security and masks stack traces |
| `PORT` | `10000` | Port automatically assigned by Render |
| `DATABASE_URL` | `postgresql://postgres.wqxghexulcflplkapwal:PASSWORD@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres` | Your Supabase connection string |
| `DB_SSL` | `true` | Required for Supabase cloud connections |
| `JWT_SECRET` | *(64-character random cryptographic string)* | Cryptographic secret for signing tokens |
| `JWT_EXPIRES_IN` | `2h` | Session validity window |
| `FRONTEND_URLS` | `https://legalhub.pk,https://legalhub.vercel.app` | Allowed frontend domains for CORS |
| `ADMIN_EMAIL` | `admin@legalhub.pk` | Initial administrator email |
| `ADMIN_PASSWORD` | *(Strong 16+ char password)* | Initial administrator password |

---

## 3. Post-Deployment Verification

1. **Verify Logs:**
   Navigate to the **Logs** tab in Render. You should observe:
   ```text
   ==> Running 'npm run migrate'
   Loaded configuration file "src/config/database.js".
   Using environment "production".
   No migrations were executed, database schema was already up to date.

   ==> Starting service with 'npm run start'
   ✅ PostgreSQL database connection established successfully.
   🚀 LegalHub Backend running on port 10000 [NODE_ENV=production]
   🔗 Health check available at http://localhost:10000/api/v1/health
   ```
2. **Execute Health Check:**
   Open your browser or curl:
   ```bash
   curl https://legalhub-backend.onrender.com/api/v1/health
   ```
   Expected response:
   ```json
   {
     "status": "ok",
     "timestamp": "2026-10-18T10:00:00.000Z"
   }
   ```
3. **One-Time Admin Seeding:**
   In the Render dashboard, open the **Shell** tab and run:
   ```bash
   npm run seed:admin
   ```
   This safely seeds the initial administrator without logging passwords.
