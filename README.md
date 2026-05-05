# Atlas Secure Dashboard

Full-stack semester project using React, FastAPI, PostgreSQL, JWT login, and Docker Compose.

## Public URLs

Frontend:

```txt
https://atlas-secure-dashboard.vercel.app
```

Backend:

```txt
https://atlas-secure-dashboard-api.onrender.com
```

## Demo Login

```txt
Email: demo@student.local
Password: AtlasSecureDemo-2026-74!
```

## Run Locally

```bash
cp .env.example .env
docker compose up --build
```

Open the frontend:

```txt
http://localhost:5173
```

Backend health check:

```txt
http://localhost:8000/api/health
```

## Required API Routes

```txt
POST /api/auth/login
GET  /api/atlas/status
POST /api/atlas/chat
```

`GET /api/atlas/status` is protected. It returns `401 Unauthorized` without a valid JWT and returns a verified Atlas status after login.

## Deployment

Database:

- Create a Neon PostgreSQL database.
- Copy the Neon connection string into Render as `DATABASE_URL`.

Backend:

- Host on Render.
- Use `backend` as the root directory.
- Build command: `pip install -r requirements.txt`
- Start command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`

Backend environment variables:

```env
DATABASE_URL=your_neon_connection_string
JWT_SECRET=your_long_random_secret
DEMO_EMAIL=demo@student.local
DEMO_PASSWORD=AtlasSecureDemo-2026-74!
FRONTEND_ORIGIN=https://atlas-secure-dashboard.vercel.app
```

Frontend:

- Host on Vercel.
- Use `frontend` as the root directory.
- Build command: `npm run build`
- Output directory: `dist`

Frontend environment variable:

```env
VITE_API_URL=https://atlas-secure-dashboard-api.onrender.com
```

## Submission Checklist

- Confirm the demo account can log in.
- Confirm the dashboard shows `GET /api/atlas/status verified`.
- Confirm unauthenticated `GET /api/atlas/status` returns `401 Unauthorized`.
- Do not commit real `.env` files or real secrets.
