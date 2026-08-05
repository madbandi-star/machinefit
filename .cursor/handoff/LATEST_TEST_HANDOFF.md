# Test handoff: Hide My Page subscription for non-admins

## Summary
My Page **甑弲路?岆灉** (`SubscriptionPlanCard`) is shown only when `isAdmin` (admin role or higher).

## Git
- Branch: `main`
- Commit: 03c28531

## Changed files
- `frontend/src/pages/my-page/MyPage.tsx`

## Test focus
1. Login as member/owner/trainer ??My Page ??no 甑弲路?岆灉 section.
2. Login as admin ??My Page ??甑弲路?岆灉 still visible.

## Fast checks
```bash
rg -n "SubscriptionPlanCard|isAdmin" frontend/src/pages/my-page/MyPage.tsx
npm run test:smoke:changed
```

## as-is ??to-be
| as-is | to-be |
|-------|--------|
| All users see 甑弲路?岆灉 | Only admin sees 甑弲路?岆灉 |
