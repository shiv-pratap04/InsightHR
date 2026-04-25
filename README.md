# InsightHR

**InsightHR** is an **Intelligent Employee Management & Decision Support System** — a full-stack demo for a final-year CSE project: **explainable** performance scoring, **smart task allocation**, **attrition risk**, **anomaly detection**, and **promotion recommendations**, with **Google OAuth**, **JWT (HTTP-only cookie)**, and **role-based access** (admin / manager / employee).

## Architecture

- **`/client`** — React (Vite), Tailwind CSS, ShadCN-style UI, React Router, React Hook Form + Zod, Recharts, Axios, Zustand.
- **`/server`** — Node.js, Express, MongoDB (Mongoose), Passport Google OAuth 2.0, JWT in HTTP-only cookies, bcrypt, Helmet/CORS/Morgan.
- **Analytics** — Implemented in **`server/src/services`** (rule-based / statistical, ML-compatible structure). No separate Python service required for the demo.

## Prerequisites

- Node.js 18+
- MongoDB running locally (or a cloud URI)

## Quick start

### 1. MongoDB

Ensure MongoDB is available, e.g.:

```bash
mongod --dbpath <your-data-path>
```

### 2. Server

```bash
cd server
cp .env.example .env
# Edit .env — set MONGODB_URI and JWT_SECRET (required).
# For Google login, set GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_CALLBACK_URL.

npm install
npm run seed
npm run dev
```

API default: `http://localhost:5000`  
Health check: `GET http://localhost:5000/api/health`

### 3. Client

```bash
cd client
cp .env.example .env
# VITE_API_URL=http://localhost:5000

npm install
npm run dev
```

App: `http://localhost:5173`

### 4. Google OAuth (optional)

1. Create OAuth 2.0 credentials in [Google Cloud Console](https://console.cloud.google.com/).
2. Authorized redirect URI: `http://localhost:5000/api/auth/google/callback` (must match `GOOGLE_CALLBACK_URL`).
3. Put Client ID/Secret in `server/.env`.
4. Use **Login with Google** on the login page.

If Google env vars are missing, the API returns **503** with a clear message (safe fallback).

## Seed data (after `npm run seed`)

Rough volume: **22 employees**, **25 tasks** (mix of pending / assigned / in-progress / completed), **6 performance records per employee** (Aug 2025–Jan 2026), **14 alerts**, departments include Engineering, Product, Design, HR, Data, Finance, Customer Success.

### Seed accounts

| Role     | Email | Password | Notes |
|----------|-------|----------|--------|
| Admin    | `admin@ems.demo` | `Admin12345` | Full access |
| Manager  | `manager@ems.demo` | `Manager12345` | Team operations |
| Employee | `employee1@ems.demo` … `employee8@ems.demo` | `Employee12345` | Each linked to a real employee profile (see seed order in `server/src/seed/seed.js`) |

`employee1` → **Ananya Iyer**, `employee2` → **Vikram Singh**, `employee3` → **Neha Kapoor**, `employee4` → **Arjun Mehta**, `employee5` → **Kavya Nair**, `employee6` → **Siddharth Rao**, `employee7` → **Meera Joshi**, `employee8` → **Rohan Desai**.

## API overview

- **Auth:** `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/google`, `GET /api/auth/google/callback`, `POST /api/auth/logout`, `GET /api/auth/me`
- **CRUD:** employees, tasks (with `POST /api/tasks/:id/assign`, `GET /api/tasks/recommend/:taskId`)
- **Performance:** `POST /api/performance/calculate`, `GET /api/performance/:employeeId`, `GET /api/performance/trends/:employeeId`
- **Analytics:** `POST /api/ml/attrition`, `POST /api/ml/anomaly`, `POST /api/ml/promotion`, `POST /api/ml/task-match`
- **Alerts:** `GET /api/alerts`, `PUT /api/alerts/:id/read`
- **Settings:** `GET /api/settings/weights`, `PUT /api/settings/weights` (admin only for PUT)

Every analytics/scoring response is designed to include **human-readable explanation** fields where applicable.

## Presentation notes

- Emphasize **explainability** (breakdown objects, reasons arrays, method labels such as “rule-based / z-score”).
- Show **task allocation** top-3 with per-candidate explanations and **manual review** flag.
- Show **admin dashboard** charts fed by seed **PerformanceRecord** data.

## License

Educational / demonstration use.
