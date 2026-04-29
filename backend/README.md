# NEET Learning Backend (FastAPI)

## Tech
- FastAPI + Swagger
- PostgreSQL
- SQLAlchemy (async) + asyncpg
- Alembic migrations
- JWT auth (access + refresh)
- bcrypt hashing (passlib)
- Local file uploads (PDF/video)

## Run (local)
1. Create a virtualenv and install deps:
   - `pip install -r requirements.txt`
2. Create `.env` from `.env.example` and set your Postgres creds.
3. From the repo root, run:
   - `cd backend`
   - `.\dev.ps1`

API docs: `http://localhost:8001/docs`

## Demo data + demo login
- The API auto-seeds demo courses/quizzes on startup (`AUTO_SEED_DEMO_DATA=true` by default).
- Demo accounts:
  - Student: `student@demo.com` / `student123`
  - Admin: `admin@demo.com` / `admin123`

## Seed demo data (optional)
After migrations:
- `python -m app.seed`
