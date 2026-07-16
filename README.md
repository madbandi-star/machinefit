# MachineFit

Global fitness platform that recommends optimal strength training machine settings based on user body measurements.

## Monorepo Structure

```
machinefit/
├── frontend/     React + Vite + PWA + TypeScript
├── backend/      Node.js + Express + JWT REST API
├── shared/       Types, constants, validators, utils
├── database/     PostgreSQL migrations & seeds
├── config/       Shared configuration
└── docs/         Architecture documentation
```

## Tech Stack

| Layer | Technologies |
|-------|-------------|
| Frontend | React, Vite, PWA, React Router, React Query, Zustand, Axios, i18next |
| Backend | Node.js, Express, JWT, PostgreSQL |
| Database | PostgreSQL via Supabase |
| Deploy | GitHub Pages (frontend), Render (backend) |

## Getting Started

### Prerequisites

- Node.js 20+
- npm 10+

### Install

```bash
npm install
```

### Environment

Copy `config/env/.env.example` values into:

- `backend/.env` — API server config
- `frontend/.env` — `VITE_API_BASE_URL`

## Database

| Command | Description |
|---------|-------------|
| `npm run db:migrate` | Run all SQL migrations |
| `npm run db:seed` | Seed reference + machine data |

See [docs/database/design.md](docs/database/design.md) for full schema design.

### Deployment (secrets not in Git)

Local `.env` files are gitignored. Use:

```powershell
# Windows — DB password 입력 후 backend/.env + JWT 자동 생성
.\scripts\setup-backend-env.ps1 -DbPassword "YOUR_SUPABASE_DB_PASSWORD"
```

Then set these in **GitHub → Settings → Secrets → Actions**:

| Secret | Value |
|--------|-------|
| `VITE_API_BASE_URL` | `https://YOUR-RENDER-APP.onrender.com/api/v1` |

Print copy-paste values from local `backend/.env`:

```powershell
.\scripts\print-deploy-env.ps1
```

#### Render (free Web Service — not Blueprint)

1. [render.com](https://render.com) → **New +** → **Web Service** (Blueprint is paid/card-required)
2. Connect repo `madbandi-star/machinefit`, branch `main`
3. Settings:

| Field | Value |
|-------|-------|
| Name | `machinefit-api` |
| Root Directory | *(leave empty — repo root, not `frontend`)* |
| Runtime | Node |
| Build Command | `npm ci --include=dev && npm run build:render` |
| Start Command | `npm run start --workspace=backend` |
| Instance Type | **Free** |
| Health Check Path | `/api/v1/health` |

4. **Environment** — paste from `print-deploy-env.ps1`:

- `DATABASE_URL`, `JWT_SECRET`, `JWT_REFRESH_SECRET`
- `CORS_ORIGIN` = `https://madbandi-star.github.io`
- `NODE_ENV` = `production`, `PORT` = `3001`, `API_BASE_PATH` = `/api/v1`

5. Deploy → copy URL → set GitHub secret `VITE_API_BASE_URL` = `https://YOUR-APP.onrender.com/api/v1`

See `config/env/deployment-secrets.example` and `render.yaml` (reference only).

### Development

```bash
# Frontend only (http://localhost:5173)
npm run dev

# Backend only (http://localhost:3001)
npm run dev:backend

# Both concurrently
npm run dev:all
```

### Build

```bash
npm run build
```

## API

Base URL: `http://localhost:3001/api/v1`

| Endpoint | Description |
|----------|-------------|
| `GET /health` | Health check |
| `GET /machines` | List machines |
| `GET /brands` | List brands |
| `POST /recommendations` | Generate recommendation |
| `POST /auth/register` | Register |
| `POST /auth/login` | Login |
| `GET /users/me` | Current user profile |
| `GET /favorites` | List favorites (auth) |
| `POST /favorites` | Add favorite (auth) |
| `GET /history` | Recent history (auth) |

## Deployment

- **Frontend**: GitHub Pages at `/machinefit/` base path
- **Backend**: Render via `backend/render.yaml`

## Roadmap

- [x] Phase 0: Monorepo foundation
- [x] Phase 1: Core machine experience (repositories + mock fallback)
- [x] Phase 2: Auth DB integration + favorites/history APIs
- [ ] Phase 3: Full favorites/history with Supabase
- [ ] Phase 4: Gym finder
- [ ] Phase 5: Community
- [ ] Phase 6: Gym owner dashboard
- [ ] Phase 7: Admin dashboard
