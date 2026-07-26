# Latest test handoff — post-signup home API errors

**Branch:** `main`  
**Scope:** frontend only

## Change

Fix console/network error spam on first home load after signup/login.

**Root cause:** Persisted `machinefit-active-gym` (gym + member IDs) from a prior session was used before `/users/me/gyms` confirmed ownership → 403 on members/history/favorites.

**Fix:**
- `syncGymScopeAfterAuth` on login/register (seed `user.activeGymId`, clear member + query cache)
- `clearGymScope` on logout / token clear / account delete
- `useActiveGym`: do not use persisted gym ID until server gym list loads
- `useActiveMember`: remove optimistic `memberScopeReady` while members are loading

## Test focus

1. Browser with old session data → register new account → home loads cleanly (no 403 burst)
2. Login as different user → same
3. Recent / favorites sections show empty prompts (not broken UI)

## Fast checks

```bash
npm run test:smoke:changed
```

## Deploy

- Frontend: GitHub Pages (push to `main`)
- Backend: not needed
