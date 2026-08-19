# Test handoff — Soft-launch allowlist

## Summary
Only `핏러너1205`, `제이진파크`, `사레레`, `짐메이트0587` may use the app. Other logged-in accounts go to `/under-construction`; APIs return 403 `SERVICE_ACCESS_RESTRICTED`.

## Test focus
1. Non-allowlisted login → construction page + cannot use features
2. Allowlisted login → normal Home
3. Logout from construction → login again
4. Disable gate locally: `ACTIVE_SERVICE_ACCESS=0` / `VITE_ACTIVE_SERVICE_ACCESS=0`

## As-is → To-be
- as-is: all accounts usable
- to-be: invite-only soft launch

**Branch:** `main`  
**Commit:** pending
