# Learn Words

Quizlet'ga o'xshash so'z yodlash platformasi. So'z to'plamlari, 5 ta o'yin rejimi (flashcards, test, match, spelling, gravity), interaktiv hikoyalar va Spaced Repetition System (SM-2) asosida takrorlash.

Texnik topshiriq: [tz.md](tz.md)

## Texnologiyalar

- **Frontend:** React 18 + TypeScript, Vite, TailwindCSS, React Router, TanStack Query, Zustand, Axios, React Hook Form + Zod, react-i18next
- **Backend:** Python 3.11, FastAPI, SQLAlchemy 2.0 (async), Alembic, Pydantic v2, JWT, bcrypt
- **Database:** PostgreSQL 15, Redis 7
- **Infra:** Docker Compose

## Tezkor ishga tushirish

```bash
cp .env.example .env
docker compose up --build
```

Servislar:

- Frontend: http://localhost:5173
- Backend API: http://localhost:8000
- API docs (Swagger): http://localhost:8000/docs
- Postgres: localhost:5432
- Redis: localhost:6379

Birinchi ishga tushirishda backend `alembic upgrade head` ni avtomatik chaqiradi va barcha jadvallarni yaratadi.

## Smoke test

```bash
# Health check
curl http://localhost:8000/health

# Ro'yxatdan o'tish
curl -X POST http://localhost:8000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Password123!","username":"testuser"}'

# Tizimga kirish
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Password123!"}'
```

Frontendda http://localhost:5173 ga o'ting → register → login → dashboard.

## Struktura

```
.
├── backend/          # FastAPI app
│   ├── app/
│   │   ├── api/v1/   # API endpointlar
│   │   ├── core/     # config, security, deps
│   │   ├── db/       # session, base
│   │   ├── models/   # SQLAlchemy modellar
│   │   ├── schemas/  # Pydantic sxemalar
│   │   └── services/ # biznes logika (auth, srs, games, ...)
│   ├── alembic/      # migratsiyalar
│   └── tests/
└── frontend/         # React app
    └── src/
        ├── api/      # axios client va endpoint funksiyalari
        ├── components/
        ├── features/ # auth, decks, games, stories, progress, admin
        ├── i18n/     # uz, ru, en locale fayllar
        ├── router/
        └── store/    # Zustand
```

## Backend testlari

```bash
docker compose exec backend pytest
```

## Migratsiyalar

```bash
# Yangi migratsiya yaratish
docker compose exec backend alembic revision --autogenerate -m "description"

# Qo'llash
docker compose exec backend alembic upgrade head

# Bekor qilish
docker compose exec backend alembic downgrade -1
```

## Lokal development (Docker'siz)

Postgres va Redis ni lokal o'rnatib quyidagicha:

```bash
# Backend
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -e .
alembic upgrade head
uvicorn app.main:app --reload

# Frontend (boshqa terminalda)
cd frontend
npm install
npm run dev
```
