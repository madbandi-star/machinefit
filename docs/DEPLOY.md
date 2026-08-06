# Deploy checklist

## Frontend (GitHub Pages)

1. Push to `main` (paths under `frontend/`, `shared/`, or root lockfiles).
2. Workflow: `.github/workflows/frontend-deploy.yml`
3. Marketing / custom domain: `https://machine-fit.com` (Cloudflare → GitHub Pages; `frontend/public/CNAME`)
4. Legacy Pages URL (unsupported after root base): `https://madbandi-star.github.io/machinefit`

## Backend (Render)

1. **Build Command** (exact): `npm run build:render`  
   Do not prefix with another `npm ci` / `npm install`.
2. **Start Command**: `npm run start --workspace=backend`
3. **Node**: `NODE_VERSION=20` (or `.node-version`)
4. Env: `DATABASE_URL`, `JWT_SECRET`, `JWT_REFRESH_SECRET`, `CORS_ORIGIN`, `API_BASE_PATH=/api/v1`, optional `GOOGLE_CLIENT_ID` (omit `PORT` — use Render's)
5. Push to `main` (backend/shared/database) or Manual Deploy after Clear build cache if needed.

### Google / social login

1. Google Cloud OAuth **Web** client — Authorized JavaScript origins:
   - `http://localhost:5173` (local)
   - `https://machine-fit.com`
   - `https://madbandi-star.github.io` (Pages fallback)
2. Frontend Pages build needs `VITE_GOOGLE_CLIENT_ID` / `VITE_KAKAO_JS_KEY` (see `frontend-deploy.yml`).
3. Render env needs matching `GOOGLE_CLIENT_ID` and `KAKAO_REST_API_KEY`.
   Also set `CORS_ORIGIN=https://machine-fit.com,https://madbandi-star.github.io` and
   `FRONTEND_BASE_URL=https://machine-fit.com`.
4. Kakao Developers:
   - 카카오 로그인 ON
   - **앱 → 플랫폼 키 → JavaScript 키 → JavaScript SDK 도메인**: `https://machine-fit.com`, `https://madbandi-star.github.io`, `http://localhost:5173`
   - **Redirect URI** (로그인용, 슬래시까지 정확히):
     - `https://machine-fit.com/`
     - `https://madbandi-star.github.io/machinefit/` (legacy; optional until cutover)
     - `http://localhost:5173/`
     - (계정 연동) `https://machine-fit.com/settings/linked-logins`
     - `https://madbandi-star.github.io/machinefit/settings/linked-logins` (legacy)
     - `http://localhost:5173/settings/linked-logins`
   - 동의항목: 닉네임 (이메일은 Biz 앱 필요할 수 있음)
5. Apply DB migration `091_auth_providers.sql` if not already applied.

### Custom domain root (no `/machinefit` prefix)

App is served at `https://machine-fit.com/` (Vite `base: /`). Optional Cloudflare Redirect Rule:

- If URI Path starts with `/machinefit` → 301 to path with `/machinefit` removed
  (e.g. `/machinefit/settings` → `/settings`)

After cutover also run migration `105_rewrite_catalog_asset_base_path.sql` so DB image URLs use `/assets/...`.

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
