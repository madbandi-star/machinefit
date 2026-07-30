# Latest test handoff - FW search card all muscles (All filter)

**Branch:** `main` | **Commit:** pending

## Change

UI-only on machine list cards: free-weight + muscle filter **All** shows all eight target muscles (back, chest, legs, shoulders, biceps, triceps, arms, core). Other cases unchanged. No API/query/navigation changes.

## Test focus

- `/machines` muscle = All, free-weight card: all muscle labels
- Muscle chip selected: single muscle as before
- Non-FW: as before

## Fast checks

```bash
npm run test:smoke:changed
```

## Deploy

- Frontend only

## as-is -> to-be

- **as-is:** FW under All showed one default muscle
- **to-be:** FW under All shows all eight muscle labels
