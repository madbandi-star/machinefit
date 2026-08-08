# Test handoff: Helchang Fortune dashboard UI

## Summary
`/fortune/today`를 텍스트 리포트에서 콘텐츠형 피트니스 대시보드로 전면 UI 개편했습니다. API·DB·운세/점수/분석 로직은 변경하지 않았습니다.

## Git
- Branch: `main`
- Commit: `PENDING`

## Test focus
1. HERO: 날짜·키워드 이모지·운동운 별 애니메이션
2. 헬창지수 radial + PR/회복 gauge — API 수치와 동일
3. 장비 비중 SVG donut + legend / 빈·희소 데이터 문구
4. 추천 카드 그리드, Avoid, 운동 전·후, 한마디, 하단 disclaimer
5. `prefers-reduced-motion: reduce` 시에도 정보 표시

## Fast checks
```bash
cd frontend && npx tsc -p tsconfig.json --noEmit
rg -n "FortuneDashboard|fortune-gauge|fortune-donut" frontend/src/pages/fortune/FortuneDetailPage.tsx frontend/src/components/fortune/
```

## as-is → to-be
| as-is | to-be |
|-------|--------|
| 문서형 텍스트 나열 | HERO + gauges + donut + card dashboard |
| 운세/데이터 구분 약함 | FORTUNE / DATA / INSIGHT / RECOMMEND 섹션 분리 |
