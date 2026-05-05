# Atlas Secure Dashboard Presentation Guide

Local-only notes for your presentation. This combines the outline and proof index into one file.

## Quick Links

- Public app: https://atlas-secure-dashboard.vercel.app
- Backend API: https://atlas-secure-dashboard-api.onrender.com
- Protected route without token: https://atlas-secure-dashboard-api.onrender.com/api/atlas/status
- Backend health check: https://atlas-secure-dashboard-api.onrender.com/api/health

Demo login:

```txt
Email: demo@student.local
Password: Password123!
```

## Short Summary To Memorize

Atlas Secure Dashboard is a full-stack authentication demo. The React frontend logs in through FastAPI. FastAPI checks the user in PostgreSQL, verifies the bcrypt password hash, and returns a JWT. The frontend stores that token and sends it as a bearer token when calling protected routes. Without the JWT, the protected route returns `401 Unauthorized`. The deployed version runs on Vercel, Render, and Neon, and Docker Compose runs the same stack locally.

Proof links:

- Frontend login request: [frontend/src/api.js:3](frontend/src/api.js#L3)
- Backend login route: [backend/app/routes/auth_routes.py:12](backend/app/routes/auth_routes.py#L12)
- JWT creation: [backend/app/security.py:37](backend/app/security.py#L37)
- Protected route auth check: [backend/app/routes/atlas_routes.py:14](backend/app/routes/atlas_routes.py#L14)
- `401 Unauthorized` behavior: [backend/app/security.py:53](backend/app/security.py#L53)

## Demo Flow

1. Open the public app.

```txt
https://atlas-secure-dashboard.vercel.app
```

2. Log in with the demo account.
3. Show the dashboard and the `GET /api/atlas/status verified` proof.
4. Click `DB: connected` to open Neon.
5. Show the `users` table and point out the hashed password.
6. Open the protected route directly without a token and show `401 Unauthorized`.
7. Use a suggested prompt to show the protected chat route also works.
8. Refresh `atlas_messages` in Neon and sort by `id DESC` or `created_at DESC` to show the newest saved chat rows.

Presentation tip:

- Render free services can take a moment to wake up on the first request.
- If the first backend request feels slow, wait a few seconds and retry.

## Frontend

What it is:

- React + Vite + CSS.
- Hosted publicly on Vercel.
- Responsible for the login screen, dashboard, chat UI, status bubbles, and mobile layout.

What it does:

- Sends email/password to the backend login endpoint.
- Stores the JWT after login.
- Sends the JWT with protected API requests.
- Shows the authenticated dashboard only after login succeeds.
- Lets the `DB: connected` bubble open the Neon database dashboard.

What to say:

> The frontend is not trusted by itself. It only gets protected data after it sends the JWT token that the backend created during login.

Proof links:

- Main React app: [frontend/src/App.jsx:196](frontend/src/App.jsx#L196)
- API helpers: [frontend/src/api.js:1](frontend/src/api.js#L1)
- Login request: [frontend/src/api.js:3](frontend/src/api.js#L3)
- Token saved in local storage: [frontend/src/App.jsx:487](frontend/src/App.jsx#L487)
- Protected status request starts after login: [frontend/src/App.jsx:260](frontend/src/App.jsx#L260)
- JWT sent in request header: [frontend/src/api.js:25](frontend/src/api.js#L25)
- DB bubble link target: [frontend/src/App.jsx:193](frontend/src/App.jsx#L193)
- DB bubble clickable element: [frontend/src/App.jsx:632](frontend/src/App.jsx#L632)
- Suggested prompts: [frontend/src/App.jsx:188](frontend/src/App.jsx#L188)

## Backend

What it is:

- FastAPI app hosted on Render.
- Uses SQLAlchemy for database access.
- Uses bcrypt for password hashing.
- Uses PyJWT for token creation and validation.

What it does:

- Starts the API server.
- Connects to PostgreSQL.
- Creates database tables on startup.
- Seeds the demo account.
- Verifies login credentials.
- Creates JWT access tokens.
- Blocks protected routes unless a valid bearer token is sent.

What to say:

> FastAPI is the security gate. The frontend can ask for protected data, but the backend decides whether the JWT is valid.

Proof links:

- FastAPI app setup: [backend/app/main.py:14](backend/app/main.py#L14)
- CORS config for frontend/backend communication: [backend/app/main.py:21](backend/app/main.py#L21)
- Startup initializes database and seed data: [backend/app/main.py:33](backend/app/main.py#L33)
- Health route: [backend/app/main.py:42](backend/app/main.py#L42)
- Auth route file: [backend/app/routes/auth_routes.py:1](backend/app/routes/auth_routes.py#L1)
- Atlas route file: [backend/app/routes/atlas_routes.py:1](backend/app/routes/atlas_routes.py#L1)

## Database

What it is:

- PostgreSQL hosted on Neon.
- Local development can also run PostgreSQL through Docker Compose.

What it stores:

- Demo user account.
- Hashed password, not the plain password.
- Atlas demo message data.
- Protected chat messages sent through the dashboard.

What to show:

1. Click `DB: connected`.
2. Open Neon Tables.
3. Show the `users` table.
4. Point out that the password is a bcrypt hash.
5. Send a chat message from the dashboard.
6. Refresh `atlas_messages`.
7. Sort by `id DESC` or `created_at DESC`.
8. Show the newest `User (...)` and `Atlas: ...` rows.

What to say:

> The database proves this is not just a hardcoded login screen. The backend checks the user from PostgreSQL, stores the password as a hash, and saves protected chat messages after login.

Proof links:

- Database URL config: [backend/app/database.py:11](backend/app/database.py#L11)
- SQLAlchemy engine: [backend/app/database.py:16](backend/app/database.py#L16)
- DB sessions: [backend/app/database.py:17](backend/app/database.py#L17)
- Table creation: [backend/app/database.py:44](backend/app/database.py#L44)
- DB health check function: [backend/app/database.py:49](backend/app/database.py#L49)
- `users` table model: [backend/app/models.py:6](backend/app/models.py#L6)
- `atlas_messages` table model: [backend/app/models.py:15](backend/app/models.py#L15)
- Demo user seed function: [backend/app/seed.py:12](backend/app/seed.py#L12)
- Password hashing during seed: [backend/app/seed.py:18](backend/app/seed.py#L18)
- Chat messages saved to the DB: [backend/app/routes/atlas_routes.py:50](backend/app/routes/atlas_routes.py#L50)

## Login And JWT Flow

Step-by-step:

1. User enters the demo email and password.
2. React sends credentials to `POST /api/auth/login`.
3. FastAPI looks up the user in PostgreSQL.
4. FastAPI checks the submitted password against the bcrypt hash.
5. If valid, FastAPI creates a JWT.
6. React stores the JWT.
7. React sends the JWT in the `Authorization` header for protected requests.

Header format:

```txt
Authorization: Bearer <token>
```

What to say:

> The password is only used to get the token. After login, protected requests use the JWT.

Proof links:

- Frontend login function: [frontend/src/api.js:3](frontend/src/api.js#L3)
- Backend login route: [backend/app/routes/auth_routes.py:12](backend/app/routes/auth_routes.py#L12)
- User lookup: [backend/app/routes/auth_routes.py:14](backend/app/routes/auth_routes.py#L14)
- Password verification before login: [backend/app/routes/auth_routes.py:16](backend/app/routes/auth_routes.py#L16)
- JWT returned after successful login: [backend/app/routes/auth_routes.py:22](backend/app/routes/auth_routes.py#L22)
- bcrypt password hashing: [backend/app/security.py:24](backend/app/security.py#L24)
- bcrypt password check: [backend/app/security.py:30](backend/app/security.py#L30)
- JWT payload and expiration: [backend/app/security.py:37](backend/app/security.py#L37)
- Token stored by frontend: [frontend/src/App.jsx:487](frontend/src/App.jsx#L487)

## Protected Route

Required route:

```txt
GET /api/atlas/status
```

Expected behavior:

- Without JWT: `401 Unauthorized`.
- With valid JWT: returns Atlas status, database status, `protected_route: "verified"`, and the authenticated user.

What the dashboard shows:

```txt
GET /api/atlas/status verified
```

Important note:

The visible dashboard text is a simple label, but it only appears after the frontend successfully calls the protected backend route. The real proof is the network request and backend response.

What to say:

> This is the main proof for the assignment. The same route rejects unauthenticated users and works after login.

Proof links:

- Frontend calls protected route after login: [frontend/src/App.jsx:260](frontend/src/App.jsx#L260)
- Frontend protected request helper: [frontend/src/api.js:21](frontend/src/api.js#L21)
- JWT sent as bearer token: [frontend/src/api.js:25](frontend/src/api.js#L25)
- Backend protected route definition: [backend/app/routes/atlas_routes.py:12](backend/app/routes/atlas_routes.py#L12)
- Protected route requires `get_current_user`: [backend/app/routes/atlas_routes.py:14](backend/app/routes/atlas_routes.py#L14)
- JWT validation function: [backend/app/security.py:47](backend/app/security.py#L47)
- Missing token returns 401: [backend/app/security.py:53](backend/app/security.py#L53)
- Route returns database status: [backend/app/routes/atlas_routes.py:23](backend/app/routes/atlas_routes.py#L23)
- Route returns `verified`: [backend/app/routes/atlas_routes.py:24](backend/app/routes/atlas_routes.py#L24)
- Route returns logged-in user: [backend/app/routes/atlas_routes.py:25](backend/app/routes/atlas_routes.py#L25)

Live proof:

1. Open without token:

```txt
https://atlas-secure-dashboard-api.onrender.com/api/atlas/status
```

2. It should return:

```json
{"detail":"Not authenticated"}
```

3. Log in through the app.
4. Open DevTools -> Network.
5. Click `/api/atlas/status`.
6. Show the request header has `Authorization: Bearer ...`.
7. Show the response includes:

```json
{
  "database": "connected",
  "protected_route": "verified",
  "authenticated_as": "demo@student.local"
}
```

## Protected Chat Route

Route:

```txt
POST /api/atlas/chat
```

What it does:

- Requires the same JWT authentication.
- Returns school-safe demo replies.
- Saves the user message and Atlas reply into `atlas_messages`.
- Helps make the dashboard feel like Atlas without exposing any private Atlas system.

What to say:

> The chat is intentionally simple. Its purpose is to show another protected backend request, not to expose any private Atlas system.

Presentation demo:

1. Click `Show me the protected route status`.
2. Show the Atlas reply in the chat.
3. Click `DB: connected`.
4. Refresh `atlas_messages`.
5. Show the newest user message and Atlas reply rows.

Proof links:

- Frontend chat request: [frontend/src/api.js:49](frontend/src/api.js#L49)
- JWT sent with chat request: [frontend/src/api.js:54](frontend/src/api.js#L54)
- Backend chat route: [backend/app/routes/atlas_routes.py:29](backend/app/routes/atlas_routes.py#L29)
- Chat route requires `get_current_user`: [backend/app/routes/atlas_routes.py:32](backend/app/routes/atlas_routes.py#L32)
- Chat stores messages in PostgreSQL: [backend/app/routes/atlas_routes.py:50](backend/app/routes/atlas_routes.py#L50)
- Chat response says route verified: [backend/app/routes/atlas_routes.py:57](backend/app/routes/atlas_routes.py#L57)

## Docker Compose

What it is:

- Local development setup for all required parts.
- Runs PostgreSQL, FastAPI, and React/Vite together.

Command:

```bash
docker compose up --build
```

Local URLs:

```txt
Frontend: http://localhost:5173
Backend:  http://localhost:8000
```

What to say:

> Docker Compose lets the project run locally with the same three core parts: frontend, backend, and database.

Proof links:

- Full Docker stack starts here: [docker-compose.yml:1](docker-compose.yml#L1)
- PostgreSQL service: [docker-compose.yml:2](docker-compose.yml#L2)
- PostgreSQL health check: [docker-compose.yml:14](docker-compose.yml#L14)
- FastAPI backend service: [docker-compose.yml:20](docker-compose.yml#L20)
- Backend environment variables: [docker-compose.yml:25](docker-compose.yml#L25)
- Backend waits for healthy DB: [docker-compose.yml:34](docker-compose.yml#L34)
- React frontend service: [docker-compose.yml:38](docker-compose.yml#L38)
- Frontend uses `VITE_API_URL`: [docker-compose.yml:44](docker-compose.yml#L44)

## Public Deployment

Deployment layout:

- Frontend: Vercel
- Backend: Render
- Database: Neon PostgreSQL

Why each service is used:

- Vercel hosts the React/Vite frontend.
- Render hosts the FastAPI backend.
- Neon hosts the PostgreSQL database.

Important environment variables:

- `VITE_API_URL`: tells the frontend where the backend is.
- `DATABASE_URL`: tells the backend where PostgreSQL is.
- `JWT_SECRET`: signs and verifies JWT tokens.
- `FRONTEND_ORIGIN`: allows the deployed frontend through CORS.

What to say:

> The deployed version uses the same architecture as local Docker, but each part is hosted publicly.

Proof links:

- Public URLs in README: [README.md:5](README.md#L5)
- Render backend config: [render.yaml:1](render.yaml#L1)
- Render `DATABASE_URL` env var: [render.yaml:9](render.yaml#L9)
- Render `JWT_SECRET` env var: [render.yaml:11](render.yaml#L11)
- Vercel frontend config: [frontend/vercel.json:1](frontend/vercel.json#L1)
- Frontend deployment env var in README: [README.md:89](README.md#L89)

## Requirement Checklist

- React frontend: `frontend/`
- FastAPI backend: `backend/`
- PostgreSQL database: Neon, with Docker Postgres for local development
- JWT login: [backend/app/security.py:37](backend/app/security.py#L37)
- Demo account: `demo@student.local`
- Protected GET endpoint: [backend/app/routes/atlas_routes.py:12](backend/app/routes/atlas_routes.py#L12)
- 401 without authentication: [backend/app/security.py:53](backend/app/security.py#L53)
- Docker Compose: [docker-compose.yml:1](docker-compose.yml#L1)
- Public deployment: Vercel, Render, Neon

## Professor Question Short Answers

### How do I know the status is not hardcoded?

The text on the page is a simple label, but it only appears after the frontend successfully calls the protected backend route. The proof is in DevTools Network: `/api/atlas/status` returns `protected_route: "verified"` only when the request includes the JWT. Opening the same route directly without a token returns `401 Unauthorized`.

### Where is JWT used?

JWT is created in [backend/app/security.py:37](backend/app/security.py#L37), returned by the login route in [backend/app/routes/auth_routes.py:22](backend/app/routes/auth_routes.py#L22), saved by the frontend in [frontend/src/App.jsx:487](frontend/src/App.jsx#L487), and sent back in the `Authorization` header in [frontend/src/api.js:25](frontend/src/api.js#L25).

### Where is the database used?

The database connection is configured in [backend/app/database.py:11](backend/app/database.py#L11), tables are defined in [backend/app/models.py:6](backend/app/models.py#L6), demo data is seeded in [backend/app/seed.py:12](backend/app/seed.py#L12), and the protected status route checks database connectivity in [backend/app/routes/atlas_routes.py:23](backend/app/routes/atlas_routes.py#L23).

### What is deployed where?

- React frontend: Vercel
- FastAPI backend: Render
- PostgreSQL database: Neon

Deployment URLs are listed in [README.md:5](README.md#L5).

### Is this connected to the real Atlas?

No. This is a school-safe demo inspired by Atlas. It intentionally does not connect to private Atlas data, tools, files, home server paths, Open WebUI data, or shell execution. It proves the full-stack architecture without exposing private systems.

### Why do chat messages appear in `atlas_messages`?

The protected chat route saves each user message and Atlas reply after JWT authentication succeeds. The save happens in [backend/app/routes/atlas_routes.py:50](backend/app/routes/atlas_routes.py#L50).
