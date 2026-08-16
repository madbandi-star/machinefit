# Test handoff — Community bottom banner on Brand favorites

## Summary
Brand favorites page now shows the same `COMMUNITY_BOTTOM` CMS banner as free board / community lists.

## Git
- Branch: `main`
- Commit: `01f06021`

## Changed files
- `frontend/src/pages/brand-favorites/BrandFavoritesPage.tsx`
- `frontend/src/components/community/CommunityBottomBanner.tsx`
- `frontend/src/i18n/locales/{ko,en,ja,zh}/admin.json` (placement label)

## Test focus
1. Open Brand favorites → scroll to bottom → same community CMS banner as free board (when enabled).

## Fast checks
```bash
rg -n "CommunityBottomBanner" frontend/src/pages/brand-favorites/BrandFavoritesPage.tsx
```

## as-is → to-be
| as-is | to-be |
| --- | --- |
| No banner on brand favorites | COMMUNITY_BOTTOM at page bottom |

## Deploy
Frontend Pages only.
