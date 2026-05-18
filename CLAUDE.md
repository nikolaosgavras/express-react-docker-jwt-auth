# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Running the stack

Everything runs through Docker Compose. A `.env` file at the repo root is required:

```
JWT_KEY=<your-secret>
```

See `.env.example` for the template.

```bash
# Start all services (backend, frontend, db, phpmyadmin)
docker compose up --build

# Tear down (add -v to also drop the db_data volume)
docker compose down
```

Services when running:
- Frontend (Vite dev server): http://localhost:5173
- Backend (Express): http://localhost:3000
- phpMyAdmin: http://localhost:8080

## Backend development (outside Docker)

```bash
cd backend
npm install
npm run dev       # tsx watch — restarts on file changes
npm run build     # tsc — emits to dist/
npm start         # node dist/index.js
```

No test runner is configured.

## Frontend development (outside Docker)

```bash
cd frontend
npm install
npm run dev       # vite dev server
npm run build     # tsc -b && vite build
npm run lint      # eslint
```

## Architecture

### Docker Compose topology

Four services: `frontend`, `backend`, `db` (MySQL 9.7), `phpmyadmin`. The backend waits for db healthcheck before starting. Source directories are bind-mounted into the containers so edits are reflected without rebuilds.

### API proxy

Vite proxies all `/api` requests from the frontend to `http://backend:3000`. The frontend axios client (`frontend/src/api.ts`) uses `baseURL: "/api"` with `withCredentials: true`. This means the frontend never calls the backend directly — it always goes through the Vite proxy in dev.

### Authentication flow

JWT is issued on `POST /api/auth/login`, stored in an httpOnly cookie (`token`), and verified by the `authenticateToken` middleware (`backend/src/middleware/auth.ts`) on every protected route. The frontend's `AuthContext` (`frontend/src/context/AuthContext.tsx`) calls `GET /api/auth/me` on mount to restore session state. A 401 on any non-`/auth/me` request triggers a client-side redirect to `/login` via the axios interceptor in `frontend/src/api.ts`.

### Backend route structure

All routes are mounted under `/api` in `backend/src/index.ts`:
- `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me` — public/auth-gated
- `GET|POST|PUT|DELETE /api/users` and `/api/users/:id` — protected by `authenticateToken`
- `GET /api/db-test` — unprotected, exists to verify DB connectivity

### Database connection

A single mysql2 connection pool is exported from `backend/src/db.ts`. The host is hardcoded to `db` (the Docker Compose service name). Running the backend outside Docker requires overriding the connection config or pointing DNS at a local MySQL instance on port 3306.

### TypeScript config

Both backend and frontend use TypeScript with `strict: true`. The backend uses `"module": "nodenext"` / `"moduleResolution": "nodenext"`, which requires `.js` extensions on all local imports even though the source files are `.ts`. The backend runs via `tsx` (no compilation needed in dev); `tsc` is only used for production builds.
