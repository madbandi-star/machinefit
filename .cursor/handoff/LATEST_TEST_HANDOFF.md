# Test handoff — Music mini prev/next

## Summary
Compact music mini player adds icon-only previous/next track buttons (SkipBack / SkipForward) around play/pause, matching existing mini button styling.

## Git
- Branch: `main`
- Commit: pending

## Test focus
1. Open music panel → minimize to mini PiP.
2. Confirm prev | play/pause | next | expand | close (no visible text on new controls).
3. Prev/next change track; disabled states match full-panel rules.
4. Tooltip/aria present; visual icons alone read as skip previous/next.

## Fast checks
```bash
rg -n "playPrevTrack|SkipForward|mf-music-mini__btn:disabled" frontend/src/components/motivation/MotivationMediaControls
```

## as-is → to-be
- **as-is:** Mini had play/pause only for transport.
- **to-be:** Mini has icon-only prev/next beside play/pause.
