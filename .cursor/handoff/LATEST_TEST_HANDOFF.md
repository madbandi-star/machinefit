# Latest test handoff - Kakao authorize() login fix

**Branch:** `main` | **Commit:** `db2765b`

## Change

Kakao login now uses `Kakao.Auth.authorize()` (redirect) + backend code-to-token exchange. Removed email scope (Biz-only).

## Manual Kakao console (required)

1. App ? Platform key ? JavaScript key ? JavaScript SDK domain:
   - `https://madbandi-star.github.io`
   - `http://localhost:5173`
2. Same JavaScript key ? Redirect URI:
   - `https://madbandi-star.github.io/machinefit/login`
   - `http://localhost:5173/login`
   - (account link) `https://madbandi-star.github.io/machinefit/my-page`
   - `http://localhost:5173/my-page`

## Fast checks

```bash
npm run test:smoke:changed
```
