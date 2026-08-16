# Test handoff ? Banner size guide + schedule UX

## Summary
Admin banner registration/edit now shows recommended creative sizes (PC **1200×160**, mobile **750×120**) and replaces `datetime-local` with date+time cards, always-on toggle, and presets.

## Git
- Branch: `main`
- Commit: _(after commit)_

## Test focus
1. `/admin/banners/new` ? size guide + inline px on upload labels.
2. Schedule ? **제한 없음** clears; **기간 설정** shows date/time cards; presets (지금 / 7일 / 30일).
3. Save still persists `startAt`/`endAt` correctly.

## Fast checks
```bash
rg -n "BANNER_RECOMMENDED_SIZES|BannerScheduleFields|admin-banner-schedule" shared frontend
```

## as-is → to-be
- **as-is:** No size guidance; awkward datetime-local.
- **to-be:** Clear recommended sizes + clearer schedule UX.
