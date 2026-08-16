# Test handoff — Admin ads UI glanceable redesign

## Summary
Ad placements & policy admin page is denser: status pills, primary power toggles, scrollable placement list + side policy panel. Long guide collapsed behind `<details>`.

## Git
- Branch: `main`
- Commit: `04e930e9`

## Changed files
- `frontend/src/pages/admin/ads/AdminAdsPage.tsx`
- `frontend/src/styles/admin-ads.css`
- `frontend/src/i18n/locales/{ko,en,ja,zh}/admin.json`

## Test focus
1. Admin → Ad policy: status pills reflect ADS_ENABLED / INLINE_CMS and CMS slot count.
2. Click a placement row → policy audience chips + interval edit for that placement.
3. Row on/off switch works without losing selection.
4. “More switches” shows secondary flags.

## Fast checks (no Pages wait)
```bash
rg -n "admin-ads__split|admin-ads__status-pill|flagsTitleShort" frontend/src/pages/admin/ads frontend/src/styles/admin-ads.css frontend/src/i18n/locales/ko/admin.json
```

## Production checks
- Deploy Frontend (Pages) success → hard refresh admin ads page.

## as-is → to-be
| as-is | to-be |
| --- | --- |
| Long stacked guide + verbose cards | Status strip + compact toggles + list/policy split |

## Deploy
Frontend Pages only (no backend / migration).
