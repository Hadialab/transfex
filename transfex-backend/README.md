# transfex-backend

Phase 0 (project setup) + Phase 1 (auth) of the Transfex backend.

Stack: Node.js + Express + TypeScript, PostgreSQL via raw `pg` (parameterized
queries, no ORM), `node-pg-migrate` for migrations, JWT access tokens +
rotating refresh tokens, `argon2id` password hashing, `zod` validation.

This has been run end-to-end against a real PostgreSQL instance — every
endpoint below was exercised with curl, not just compiled.

## Setup

```bash
npm install
cp .env.example .env
```

Edit `.env`:
- `DATABASE_URL` — point at your Postgres instance
- `FRONTEND_ORIGIN` — must exactly match your Vite dev URL (e.g.
  `http://localhost:5173`); required for the refresh cookie to work
- `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` — two **different** random
  secrets. Generate each with:
  ```bash
  node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
  ```

Create the database, then run the migration:

```bash
createdb transfex          # or: psql -c "CREATE DATABASE transfex;"
npm run migrate:up
```

Start the dev server:

```bash
npm run dev
```

## Scripts

| Command              | Does what                              |
|-----------------------|-----------------------------------------|
| `npm run dev`         | Run with hot reload (tsx)               |
| `npm run build`       | Type-check + compile to `dist/`         |
| `npm start`           | Run the compiled build                  |
| `npm run migrate:up`  | Apply pending migrations                |
| `npm run migrate:down`| Roll back the last migration            |
| `npm run migrate:create -- <name>` | Scaffold a new migration   |

## How auth works

- **Access token**: short-lived JWT (default 15m), returned in the JSON
  response body. The frontend keeps it in memory (a Zustand store, not
  `localStorage`) and sends it as `Authorization: Bearer <token>`.
- **Refresh token**: a random 96-char hex string, set as an `httpOnly`,
  `SameSite=Strict` cookie scoped to `/api/auth`. Only its SHA-256 hash is
  stored in the database — a stolen DB dump doesn't hand out working
  sessions.
- **Rotation + reuse detection**: every `/refresh` call revokes the token it
  was given and issues a new one. If a revoked token is ever presented again
  (the only way that happens is if it leaked and both the attacker and the
  real user tried to use it), the server revokes **every** session for that
  account, not just the one being replayed.
- **Role**: the first account ever created becomes `admin`; everyone after
  is `staff`. There's no invite/promotion flow yet — do it directly in the
  database (`UPDATE users SET role = 'admin' WHERE email = '...'`) until
  Phase 2+ adds user management.
- **Timing-safe login**: a login attempt against a nonexistent email still
  runs a real `argon2.verify` (against a fixed decoy hash) before failing,
  so "no such user" and "wrong password" take the same amount of time and
  can't be told apart by an attacker probing for registered emails.

## API

All routes are prefixed `/api`.

### `GET /health`
No auth. Liveness check.

### `POST /auth/register`
```json
{ "name": "Hadi", "email": "hadi@example.com", "password": "Sup3rSecret" }
```
Password must be 8+ chars with an uppercase, lowercase, and digit.
→ `201` `{ user, accessToken }` + sets the refresh cookie.
→ `409` if the email is already registered.
→ `400` with per-field messages if validation fails.

### `POST /auth/login`
```json
{ "email": "hadi@example.com", "password": "Sup3rSecret" }
```
→ `200` `{ user, accessToken }` + sets the refresh cookie.
→ `401` `{ error: { message: "Email or password is incorrect." } }` for
  either a wrong password or an unknown email — deliberately identical.

### `POST /auth/refresh`
No body — reads the refresh cookie. → `200` `{ accessToken }` + rotates the
cookie. → `401` if the cookie is missing, expired, or already used.

### `POST /auth/logout`
No body — revokes the refresh cookie's token. → `204`.

### `GET /auth/me`
Requires `Authorization: Bearer <accessToken>`. → `200` `{ user }`.
→ `401` if the header is missing or the token is invalid/expired.

## Wiring up the frontend

`authStore.ts` currently keeps users in `localStorage` with a client-side
SHA-256 hash — fine for a demo, not a security boundary. To point it at
this backend:

1. `register`/`login` become `fetch('/api/auth/...', { credentials: 'include', ... })`
   calls; store the returned `accessToken` in memory (Zustand state, not
   persisted) instead of hashing anything client-side.
2. On app load, call `POST /api/auth/refresh` once to silently pick up a
   session from the cookie (handles page refresh).
3. Attach `Authorization: Bearer <accessToken>` to every other authenticated
   request.
4. On a `401` from any request, try `/auth/refresh` once; if that also
   fails, log out and redirect to `/login`.
5. `credentials: 'include'` is required on every call for the cookie to be
   sent — and the Vite dev proxy (or CORS config here) must match
   `FRONTEND_ORIGIN` exactly.

## What's deliberately not here yet

Customers, shipments, notifications, public tracking, the AI assistant
backend, and analytics are Phases 2–7. `src/app.ts` has commented-out mount
points showing where each new router attaches.
