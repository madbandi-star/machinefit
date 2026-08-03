# Latest test handoff - Google OAuth env wiring

**Branch:** `main` | **Commit:** `c161b1d`

## Change

- Pages workflow builds with `VITE_GOOGLE_CLIENT_ID`
- `render.yaml` / deploy docs list `GOOGLE_CLIENT_ID`
- Local `frontend/.env` + `backend/.env` updated (gitignored)
- Prod DB: applied `091_auth_providers.sql`

## Still required (manual)

1. **Render** ??machinefit-api ??Environment ??add  
   `GOOGLE_CLIENT_ID=600013402579-oc4q1psgohjpk3ab3enc10ohb110clmg.apps.googleusercontent.com`  
   then Manual Deploy / restart
2. **Google Cloud** OAuth client ??Authorized JavaScript origins:  
   `https://madbandi-star.github.io` and `http://localhost:5173` (or your Vite port)

## Fast checks

```bash
npm run test:smoke:changed
```

## as-is -> to-be

- **as-is:** Google login not configured / DB table missing
- **to-be:** Frontend wired; DB ready; Render env must match for API verify
