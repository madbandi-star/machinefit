# Test handoff: Remove duplicate admin buttons above logout

## Summary
Removed **?? ????** / **??? ????** buttons between Share App and Logout on My Page. The **?????** section still has the links.

## Git
- Branch: `main`
- Commit: 797b47aa

## Changed files
- `frontend/src/pages/my-page/MyPage.tsx`

## Test focus
1. Admin My Page bottom actions: Share ? (no admin buttons) ? Logout.
2. ????? section still opens ops / dashboard.

## Fast checks
```bash
rg -n "ADMIN_OPS|adminDashboard|opsMonitoring" frontend/src/pages/my-page/MyPage.tsx
npm run test:smoke:changed
```

## as-is ? to-be
| as-is | to-be |
|-------|--------|
| Share / Ops / Admin / Logout | Share / Logout (admin only via ?????) |
