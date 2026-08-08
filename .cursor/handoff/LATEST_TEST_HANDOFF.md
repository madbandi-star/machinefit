# Test handoff: Merge energy-section explain guides

## Summary
Under ??? ??, two ?? ??? ??????? blocks (yinYang + wuxing) are merged into one `explain.energy` guide. UI/i18n only.

## Git
- Branch: `main`
- Commit: pending

## Test focus
1. ??? ???? ? ??? ??
2. ?? ??? ??????? appears **once**
3. Copy covers ?? + ?? without duplicate headings

## Fast checks
```bash
node scripts/i18n-audit.mjs --sync
rg -n "FortuneExplainBlock prefix" frontend/src/components/fortune/reading/FortuneEnergySection.tsx
```

## As-is ? To-be
- **As-is**: Two identical-titled explain blocks
- **To-be**: One merged energy explain block
