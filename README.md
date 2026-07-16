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
