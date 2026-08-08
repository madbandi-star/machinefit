# Test handoff: Merge pillars/ganzhi explain into one

## Summary
Under ??·??, two ?? ??? ??????? blocks (pillars + ganzhi) are merged into one guide. Four-pillar + stem/branch meaning without duplication. UI/i18n only.

## Git
- Branch: `main`
- Commit: `161c0613` (feature) / tip after handoff fix

## Test focus
1. ?? ??? ?? ? ??·??
2. ?? ??? ??????? accordion appears **only once**
3. Expanded copy covers four pillars + ??/?? (???·??) in one flow

## Fast checks
```bash
node scripts/i18n-audit.mjs --sync
rg -n "FortuneExplainBlock prefix" frontend/src/components/fortune/FortuneTraditionalDetail.tsx
```

## As-is ? To-be
- **As-is**: Same-titled explain blocks ×2
- **To-be**: One merged explain block
