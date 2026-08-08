# Test handoff: Polish Helchang Fortune detail UI

## Summary
오늘의 헬창운세 상세 페이지를 점수 → 해설 → 추천 → 실천 → 정리 흐름으로 묶고, 카드-in-카드 중첩을 줄였습니다. 히어로는 브랜드/키워드 위계를 강화했습니다. 운세 계산·API는 변경 없음.

## Git
- Branch: `main`
- Commit: `PENDING` (push 후 갱신)

## Test focus
1. `/fortune/today` 준비 상태에서 PageShell 제목 중복 없음 (히어로가 브랜드 담당)
2. 「오늘의 점수」는 열린 레이아웃, 나머지 섹션은 라벨 있는 bundle
3. PR/회복 게이지 링크 없음, 추천 타일 비인터랙티브 유지
4. 섹션 라벨: 오늘의 점수 / 해설 / 추천 / 실천 / 정리

## Fast checks
```bash
cd frontend && npx tsc -p tsconfig.json --noEmit
rg -n "fortune-bundle--open|sectionCommentary|fortune-hero__brand" frontend/src/components/fortune frontend/src/styles/fortune.css frontend/src/i18n/locales/ko/fortune.json
rg -n "to=\{ROUTES" frontend/src/components/fortune/FortuneDashboard.tsx || true
```

## Production checks (optional after Deploy Frontend success)
- Pages에서 `/fortune/today` 첫 화면·섹션 라벨 스캔

## as-is → to-be
- as-is: 이모지 라벨·중첩 패널·쉘 제목과 히어로 중복
- to-be: 5섹션 흐름, 납작한 prose, 브랜드/키워드 히어로, 열린 점수 영역
