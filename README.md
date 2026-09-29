# Teen Expense Tracker

A private, friendly money tracker for students and teenagers. Track expenses, understand spending patterns, set category budgets, and make progress toward savings goals.

## Features

- Account registration and login with bcrypt password hashing and signed JWT sessions.
- Personal profile with name, monthly allowance, and currency.
- Expense create, read, update, delete, search, category/payment/date filters, sorting, and pagination.
- Live dashboard with income, spending, remaining money, savings, daily average, category donut chart, spending trend, budgets, and recent transactions.
- Weekly and monthly budgets with actual spending and over-budget progress.
- Savings goals with target dates and progress.
- Data-based spending observations and an illustrative savings calculator.
- Responsive mobile and desktop layout with light/dark mode.
- Supabase PostgreSQL schema, request validation, ownership filters, rate limiting, Helmet, and centralized errors.

## Architecture

```text
React + Vite + Recharts
          ↓ JSON REST API
Node.js + Express + bcrypt + JWT
          ↓ service-role access, filtered by verified user ID
Supabase PostgreSQL
```

The frontend never connects directly to Supabase. The backend authenticates requests and derives data ownership from the verified JWT subject; a `user_id` from the browser is never trusted.

## Requirements

- Node.js 20 or newer and npm.
- A Supabase project.

## Supabase setup

1. Create a Supabase project and open its SQL Editor.
2. Run [`backend/supabase/schema.sql`](backend/supabase/schema.sql). It creates the tables, constraints, indexes, default categories, and RLS policies.
3. Copy the project URL and **service-role** key from Supabase project settings. Keep the service-role key only in the backend environment; never place it in a `VITE_` variable or commit it.

The API uses a custom bcrypt/JWT account table, not Supabase Auth. The server uses the service-role key and enforces ownership on every private query. Do not expose that key publicly.

## Environment

Create `backend/.env` from `backend/.env.example` and set:

```env
PORT=5000
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
JWT_SECRET=at-least-32-random-characters
JWT_EXPIRES_IN=7d
FRONTEND_URL=http://localhost:5173
```

Create `frontend/.env` from `frontend/.env.example` if the API is not at its local default:

```env
VITE_API_URL=http://localhost:5000/api
```

Never commit `.env` files. The API intentionally reports database-unavailable responses until Supabase is configured.

## Run locally

In terminal 1:

```bash
cd backend
npm install
npm run dev
```

In terminal 2:

```bash
cd frontend
npm install
npm run dev
```

Open the Vite URL (normally <http://localhost:5173>). Register an account to begin; there are no shared demo credentials or fake transactions.

## Tests and build

```bash
cd backend && npm test
cd frontend && npm run build
```

The current backend unit tests cover analytics aggregation and empty data. Full authentication, database ownership, CRUD, and browser end-to-end tests require a configured Supabase project and are not represented as verified here.

## API overview

Except registration, login, and health, endpoints require `Authorization: Bearer <token>`.

| Method | Endpoint | Purpose |
| --- | --- | --- |
| POST | `/api/auth/register` | Create an account |
| POST | `/api/auth/login` | Verify password and return JWT |
| GET | `/api/auth/me` | Current user profile |
| PATCH | `/api/profile` | Update name, allowance, currency |
| GET | `/api/categories` | List built-in categories |
| GET, POST | `/api/expenses` | Paginated/filterable list and create |
| GET, PUT, DELETE | `/api/expenses/:id` | Read, update, delete owned expense |
| GET, POST | `/api/budgets` | List and create budgets |
| PUT, DELETE | `/api/budgets/:id` | Update and delete owned budget |
| GET, POST | `/api/savings-goals` | List and create savings goals |
| PUT, DELETE | `/api/savings-goals/:id` | Update and delete owned goal |
| GET | `/api/analytics/dashboard?start=YYYY-MM-DD&end=YYYY-MM-DD` | Summary, category totals, trends, budgets, insights |
| GET | `/api/analytics/insights?start=YYYY-MM-DD&end=YYYY-MM-DD` | Period insights including comparison with previous period |

Transaction query parameters include `search`, `category`, `payment`, `start`, `end`, `sort`, `order`, `page`, and `limit` (maximum 50). Responses use `{ "success": true, "data": ... }` or `{ "success": false, "message": ... }`.

## Deployment

- Deploy the Vite frontend as a static app (Vercel/Netlify); set `VITE_API_URL` to the deployed API's `/api` URL and configure SPA fallback to `index.html`.
- Deploy the Express backend to a Node host; set the environment variables above, with `FRONTEND_URL` set to the deployed frontend origin.
- Keep Supabase credentials and `JWT_SECRET` in the backend host's secret manager. Apply schema migrations to the Supabase project before deployment and use HTTPS for both services.

## Scope notes

- The required backend project credentials are not part of this repository, so live persistence and the manual account-to-chart flow need to be tested in the configured Supabase project.
- Authentication JWTs are stored in browser local storage; for higher-risk deployments, migrate to secure, same-site HTTP-only cookies with CSRF protection.
- Built-in categories are seeded by the schema; custom category management, export, and a persistent per-user theme preference are outside this MVP.
- The calculator provides arithmetic suggestions only and is not financial advice.