# Test handoff — Fortune share per-keyword themes

## Summary
헬창운세 공유 카드가 키워드별로 다른 배경·포인트 컬러를 씁니다. 첨부 시안 순서(PR → … → BACK) + SUPER SET.

## Git
- Branch: `main`
- Commit: `f69be506`

## Changed files
- `frontend/src/utils/fortuneShareThemes.ts`
- `frontend/src/utils/fortuneShareCard.ts`
- `frontend/public/assets/share/fortune/*.png` (12)

## Test focus
1. 키워드별 BG/액센트 다름 (PR 보라, DUMBBELL 시안, DROP SET 빨강, LEG 네온그린 등)
2. SUPER SET DAY는 기존 노란 번개 톤 유지
3. PNG 1080×1350 (4:5)

## Fast checks
```powershell
rg -n "getFortuneShareTheme|FORTUNE_SHARE_THEMES" frontend/src/utils/fortuneShareCard.ts frontend/src/utils/fortuneShareThemes.ts
(Get-ChildItem frontend/public/assets/share/fortune/*.png).Count  # expect 12
```

## As-is → To-be
- **As-is:** 모든 키워드가 동일 SUPER SET 배경/골드 톤
- **To-be:** 키워드별 시안 매칭 배경 + 팔레트

## Production (optional after Pages)
`/fortune/today` 또는 홈 운세 공유로 몇 개 키워드 카드 비교
