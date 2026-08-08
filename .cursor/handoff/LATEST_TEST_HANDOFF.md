# Test handoff: Friendly plan date picker

## Summary
Replaced `window.prompt("날짜 YYYY-MM-DD")` for workout card move/copy (and missed-plan change date) with a modal date picker: locale-friendly preview, Today/Tomorrow chips, native `type="date"` input.

## Git
- Branch: `main`
- Commit: (after push)

## Changed
- `frontend/src/components/records/PlanDatePickerDialog/*` (new)
- `frontend/src/components/records/HistoryListPanel/HistoryListPanel.tsx`
- `frontend/src/components/home/HomePlannedWorkoutCard/HomePlannedWorkoutCard.tsx`
- `frontend/src/i18n/locales/{ko,en,ja,zh}/machines.json`

## Test focus
1. Records → workout card menu → 날짜 변경 / 다른 날짜로 복사 → modal (not browser prompt)
2. Today/Tomorrow chips + calendar pick work; confirm moves/copies
3. Home missed-plan banner → 날짜 변경 uses same modal

## Fast checks
```bash
rg -n "PlanDatePickerDialog|window.prompt\\(" frontend/src/components/records frontend/src/components/home/HomePlannedWorkoutCard
rg -n "planDateMoveTitle|planDateToday" frontend/src/i18n/locales/ko/machines.json
```

## as-is → to-be
| as-is | to-be |
|-------|--------|
| Ugly `prompt` YYYY-MM-DD | Modal with calendar + quick picks |
