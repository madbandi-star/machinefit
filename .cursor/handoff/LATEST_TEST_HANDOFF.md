# Test handoff: Collapsible home fortune card

## Summary
Homepage ??? ???? section can be collapsed/expanded from the card header. Last state is saved in localStorage. UI only.

## Git
- Branch: `main`
- Commit: pending

## Test focus
1. Home ? fortune card header shows ??/???
2. Collapse hides body; ready state shows keyword peek
3. Expand restores metrics + ??? ?? CTA
4. Reload keeps last open/closed state

## Fast checks
```bash
cd frontend && npx tsc -p tsconfig.json --noEmit
rg -n "home-fortune-card__toggle|machinefit.homeFortuneExpanded" frontend/src
```

## As-is ? To-be
- **As-is**: Fortune card always fully open
- **To-be**: Toggleable open/closed with persisted preference
