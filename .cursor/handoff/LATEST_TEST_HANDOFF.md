# Test handoff — Brand favorites

## Summary
Brand favorites (user↔brand) with My Page manager; search brand filter chips show only favorites. Machine search results are **not** limited by favorites.

## Git
- Branch: `main`
- Commit: 7abd7b4f

## Ops required
1. Apply `database/migrations/141_user_favorite_brands.sql` on Supabase.
2. Redeploy Render backend (new `/api/v1/brand-favorites`).

## Test focus
1. My Page → 브랜드 즐겨찾기 → ★ toggle + search.
2. `/machines` brand chips = favorites only (logged in).
3. 0 favorites → empty CTA; machine list still searchable.
4. Guest keeps full brand chips.
5. Logout clears cached favorites (QueryProvider removeQueries).

## Fast checks
```bash
rg -n "user_favorite_brands|FavoriteBrandButton|useBrandFavorites" frontend/src backend/server
npm run build -w @machinefit/shared
npx tsc --noEmit -p frontend/tsconfig.json
```

## as-is → to-be
- **as-is:** Brand filter showed all brands.
- **to-be:** Logged-in brand filter shows favorite brands only; results unrestricted.
