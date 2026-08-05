# Test handoff: Video overlay Next/Close row

## Summary
Video overlay transport: Next left, Close right on one row (equal columns). Mobile no longer stacks buttons.

## Git
- Branch: `main`
- Commit: pending

## Changed files
- `frontend/src/components/motivation/MotivationMediaControls/MotivationMediaControls.css`

## Test focus
1. Open video overlay with 2+ videos
2. Confirm Next is left, Close is right, same row (desktop + narrow width)

## Fast checks
```bash
rg -n "mf-video-overlay__transport" frontend/src/components/motivation/MotivationMediaControls/MotivationMediaControls.css
```

## as-is → to-be
| as-is | to-be |
|-------|--------|
| Mobile stacked Next above Close | Always one row: Next left, Close right |
