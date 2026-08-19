# Test handoff — FW target muscle hero image

## Summary
Free-weight detail: changing 타겟 부위 left the hero on the previous cover until refresh. Cache no longer seeds muscle queries from base/list; hero prefers per-muscle cover URL.

## Test focus
1. Search → free-weight → detail → select target muscle → hero image changes **without** refresh
2. Switch muscle A → B → image follows each selection
3. Hard refresh with `?muscle=` still shows the correct cover

## Fast checks
- `frontend/src/utils/machineDetailCache.ts` contains exact-muscle-only cache note
- `MachineHero.tsx` uses `preferMuscleCover` when FW + selectedMuscle

## As-is → To-be
- as-is: hero stuck until F5 after muscle pick
- to-be: hero updates immediately on muscle change

**Branch:** `main`  
**Commit:** pending (update after push)
