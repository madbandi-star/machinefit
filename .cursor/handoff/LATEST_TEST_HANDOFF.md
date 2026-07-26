# Latest test handoff — favorites 500 (Express 5)

**Branch:** `main`  
**Scope:** backend (Render redeploy required)

## Root cause

Express 5 makes `req.query` **read-only**. `validateQuery` did `req.query = result.data`, which throws:

`TypeError: Cannot set property query of #<IncomingMessage> which has only a getter`

→ **500** on `GET /favorites` (home 즐겨찾기 row). History worked because it does not use `validateQuery`.

## Fix

- Store parsed query on `res.locals.validatedQuery`
- Controllers use `getValidatedQuery(res)` (favorites + workout-log list/insights)

## Test focus

1. **Render backend redeploy** first
2. Signup or login → home
3. Network: `GET /api/v1/favorites?gymId=...&memberId=...` → **200** `{"success":true,"data":[]}`
4. Console: no red 500 spam

## Fast checks

```bash
npm run build --workspace=backend
```

## Deploy

- **Backend: Render Manual Deploy (required)**
- Frontend: no change in this commit
