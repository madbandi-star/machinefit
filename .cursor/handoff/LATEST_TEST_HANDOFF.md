# Test handoff — MACHINE/WORKOUT banner visibility

## Summary
Sticky Recommend CTA covered machine banners — CTA is static now. Records WORKOUT_BOTTOM sits under the toolbar (not under a long history list). Admins preview CMS like free users.

## Git
- Branch: `main`
- Commit: pending

## Ops
- Render backend redeploy (ad-policy audience).
- Optional: still apply migration `143` if not yet.

## Test focus
1. Machine detail → scroll to recommend → banner above button.
2. Records → banner under toolbar.
3. Home / My unchanged.

## Fast checks
```bash
rg -n "WORKOUT_BOTTOM|MACHINE_BOTTOM|recommend-cta" frontend/src/pages/machine-detail frontend/src/components/records/HistoryListPanel frontend/src/styles/machines.css
```
