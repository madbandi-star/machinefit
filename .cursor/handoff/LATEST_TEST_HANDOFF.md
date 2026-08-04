# Test handoff: Remove green Ops Monitoring CTA on My Page

## Summary
Removed the green **?? ????** primary button above **? ????**. Admin tools keep list links only.

## Git
- Branch: `main`
- Commit: a1f06cf4

## Changed files
- `frontend/src/pages/my-page/MyPage.tsx`

## Test focus
1. Admin My Page: no green Ops button above Share.
2. ????? list still links to ops / dashboard.

## Fast checks
```bash
rg -n "btn--primary|ADMIN_OPS" frontend/src/pages/my-page/MyPage.tsx
npm run test:smoke:changed
```

## as-is ? to-be
| as-is | to-be |
|-------|--------|
| Green Ops CTA above Share | List links only |
