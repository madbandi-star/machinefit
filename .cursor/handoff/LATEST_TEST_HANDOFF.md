# Test handoff: Home fortune dismiss for today

## Summary
Home ??? ???? card adds ???? ????? under ??? ??. Hides the section for the rest of the local day (localStorage date). UI only.

## Git
- Branch: `main`
- Commit: pending

## Test focus
1. Ready card shows dismiss under detail CTA
2. Click ? section gone immediately
3. Same-day reload ? still hidden
4. Next day (or change stored date) ? shows again

## Fast checks
```bash
cd frontend && npx tsc -p tsconfig.json --noEmit
node scripts/i18n-audit.mjs --sync
rg -n "dismissToday|homeFortuneHiddenDate" frontend/src
```

## As-is ? To-be
- **As-is**: Fortune block always on home when available
- **To-be**: Can hide for today only
