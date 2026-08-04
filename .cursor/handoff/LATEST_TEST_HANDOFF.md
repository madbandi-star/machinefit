# Test handoff: Move My Page admin tools below owner section

## Summary
On My Page, **?????** (?? ???? / ??? ????) now appears **below ??? ??**.

## Git
- Branch: `main`
- Commit: pending

## Changed files
- `frontend/src/pages/my-page/MyPage.tsx`

## Test focus
1. Login as admin.
2. Open My Page.
3. Order: ? ? ??? ?? ? ????? ? bottom actions.

## Fast checks
```bash
rg -n "adminTools|ownerOnly" frontend/src/pages/my-page/MyPage.tsx
npm run test:smoke:changed
```

## as-is ? to-be
| as-is | to-be |
|-------|--------|
| ????? near top | ????? under ??? ?? |
