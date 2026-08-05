# Test handoff: Subscription plan card 3-row layout

## Summary
???? ?? 6?? `profile-card__pair`? ?? **3? ?2?**?? ??.

## Git
- Branch: `main`
- Commit: aa39f57e

## Changed files
- `frontend/src/components/my-page/SubscriptionPlanCard/SubscriptionPlanCard.tsx`

## Test focus
1. Admin My Page ? ????.
2. Rows: ?? ??|??, ??|?? ??, ??|??.

## Fast checks
```bash
rg -n "profile-card__pair" frontend/src/components/my-page/SubscriptionPlanCard/SubscriptionPlanCard.tsx
npm run test:smoke:changed
```

## as-is ? to-be
| as-is | to-be |
|-------|--------|
| 6 full-width rows | 3 paired rows |
