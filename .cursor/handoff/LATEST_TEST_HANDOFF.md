# Test handoff ? Fortune share card

## Summary
Homepage 「오늘의 헬창운세」 and `/fortune/today` now have **공유 카드 만들기**, same Web Share / PNG download flow as 운동성향 (Lifter DNA), with fortune keyword, stars, scores, and one-liner.

## Git
- Branch: `main`
- Commit: `3257d94e`

## Changed files
- `frontend/src/utils/fortuneShareCard.ts`
- `frontend/src/utils/shareFortuneCard.ts`
- `frontend/src/components/home/HomeFortuneCard/HomeFortuneCard.tsx`
- `frontend/src/components/fortune/FortuneDashboard.tsx`
- `frontend/src/pages/fortune/FortuneDetailPage.tsx`
- `frontend/src/styles/fortune.css`, `fortune-reading.css`
- `frontend/src/i18n/locales/{ko,en,ja,zh}/fortune.json`

## Test focus
1. Home: expand fortune → tap 공유 카드 만들기 → share sheet or download PNG
2. My Page → 오늘의 헬창운세 → same button under hero
3. Card shows keyword, theme, stars, helchang/PR/recovery scores, one-liner

## Fast checks
```powershell
Test-Path frontend/src/utils/fortuneShareCard.ts
rg -n "shareFortuneCard" frontend/src/components/home/HomeFortuneCard/HomeFortuneCard.tsx frontend/src/components/fortune/FortuneDashboard.tsx
```

## As-is → To-be
- **As-is:** No fortune share card
- **To-be:** DNA-equivalent share card with today's fortune content
