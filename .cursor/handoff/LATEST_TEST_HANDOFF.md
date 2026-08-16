# Test handoff — Machine/Workout bottom banners

## Summary
Machine detail: move `MACHINE_BOTTOM` above sticky Recommend CTA (was covered). Plan muscle picker is non-sticky. Records: clearer bottom banner spacing.

## Git
- Branch: `main`
- Commit: d002f6d5

## Test focus
1. Machine detail → scroll to bottom → banner above recommend button.
2. Records → end of list → WORKOUT_BOTTOM visible.
3. Home / My page bottoms unchanged.

## Fast checks
```bash
rg -n "MACHINE_BOTTOM|records-page__banner|recommend-cta--static" frontend/src
```

## as-is → to-be
- **as-is:** Banner after sticky CTA → covered / hard to see.
- **to-be:** Banner above sticky CTA; records spacing improved.
