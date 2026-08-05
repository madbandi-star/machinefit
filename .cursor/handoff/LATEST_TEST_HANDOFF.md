# Test handoff: Hide My Page subscription for non-admins

## Summary
My Page **구독·플랜** (`SubscriptionPlanCard`) is shown only when `isAdmin` (admin role or higher).

## Git
- Branch: `main`
- Commit: pending

## Changed files
- `frontend/src/pages/my-page/MyPage.tsx`

## Test focus
1. Login as member/owner/trainer → My Page → no 구독·플랜 section.
2. Login as admin → My Page → 구독·플랜 still visible.

## Fast checks
```bash
rg -n "SubscriptionPlanCard|isAdmin" frontend/src/pages/my-page/MyPage.tsx
npm run test:smoke:changed
```

## as-is → to-be
| as-is | to-be |
|-------|--------|
| All users see 구독·플랜 | Only admin sees 구독·플랜 |
