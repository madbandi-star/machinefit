# Latest test handoff - Kakao OAuth wiring

**Branch:** `main` | **Commit:** pending

## Change

- Pages workflow: `VITE_KAKAO_JS_KEY`
- Local `.env` (gitignored): JS + REST keys
- Docs / render.yaml note `KAKAO_REST_API_KEY` (value not committed)

## Manual

1. Render ? Environment ? `KAKAO_REST_API_KEY` = (REST key you provided) ? redeploy
2. Kakao Developers: login ON, Web domains, redirect URIs, consent nickname/email

## Fast checks

```bash
npm run test:smoke:changed
```
