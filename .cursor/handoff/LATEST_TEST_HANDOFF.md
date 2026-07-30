# Latest test handoff ? FW hero follows target muscle

**Branch:** `main` · **Commit:** pending (filled after push)

## Change

On free-weight machine detail (`/machines/FW_*`), tapping a **?? ??** chip now writes `?muscle=` and refetches the machine so the top hero uses that muscle?s cover image (admin per-muscle covers).

Also: `SafeImage` resets error state when `src` changes; detail query keeps previous data while switching muscle (no full-page skeleton flash).

## Test focus

- Open ????? ? ?? (or any `FW_*`) detail
- Select ? / ?? / ?? ? hero photo should change to that muscle?s cover
- Clear selection ? default cover

## Fast checks

```bash
npm run test:smoke:changed
```

## Deploy

- Frontend only (existing `GET /machines/:code?muscle=` + cover variants)

## as-is ? to-be

- **as-is:** Muscle chips did not change the hero photo
- **to-be:** Muscle chips update URL + hero cover per selected muscle
