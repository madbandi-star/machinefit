# Deploy checklist

## Frontend (GitHub Pages)

1. Push to `main` (paths under `frontend/`, `shared/`, or root lockfiles).
2. Workflow: `.github/workflows/frontend-deploy.yml`
3. Confirm Pages URL: `https://madbandi-star.github.io/machinefit`

## Backend (Render)

1. **Build Command** (exact): `npm run build:render`  
   Do not prefix with another `npm ci` / `npm install`.
2. **Start Command**: `npm run start --workspace=backend`
3. **Node**: `NODE_VERSION=20` (or `.node-version`)
4. Env: `DATABASE_URL`, `JWT_SECRET`, `JWT_REFRESH_SECRET`, `CORS_ORIGIN`, `API_BASE_PATH=/api/v1` (omit `PORT` — use Render's)
5. Push to `main` (backend/shared/database) or Manual Deploy after Clear build cache if needed.

### Render Deploy Hook (GitHub Actions)

1. Render → `machinefit-api` → Settings → Deploy Hook → copy URL  
2. GitHub → Settings → Secrets → Actions → `RENDER_DEPLOY_HOOK_URL`  
3. Workflow `.github/workflows/backend-deploy.yml` POSTs the hook on relevant pushes.  
   If the secret is missing, the job **warns** and exits 0 (manual deploy still works).

## Database migrations (before or with backend deploy)

```bash
# Apply pending SQL under database/migrations/
npm run db:migrate

# Verify critical tables exist (machine_trades, friendships, …)
npm run db:verify
```

Checklist:

- [ ] `npm run db:migrate` against production `DATABASE_URL`
- [ ] `npm run db:verify` passes
- [ ] Render build succeeds
- [ ] `GET /api/v1/health` → 200, `database: connected`
- [ ] Smoke: login + one scoped API (`/workout-logs?gymId&memberId`)

## Local tip

Frontend is **outside** npm workspaces. After root `npm ci`, run `npm install` in `frontend/` for local UI work (or omit `SKIP_FRONTEND_INSTALL` / `NODE_ENV=production` so `postinstall` installs it).
