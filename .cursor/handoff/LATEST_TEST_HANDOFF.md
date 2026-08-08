# Test handoff: Fix vertical stack of settings tiles

## Summary
기록카드 설정 타일이 세로로 한 줄씩 쌓이던 문제를 수정했습니다. 그리드를 `<a>`로 감싸지 않고 타일별 링크로 바꾸었고, 3열 그리드를 강제하며 중량 full-span을 제거했습니다.

## Git
- Branch: `main`
- Commit: pending

## Test focus
1. Records card: 추천중량 / 추천횟수 / 가동범위 in **one horizontal row** (3 columns)
2. Tap a tile still opens detail (when not adjusting)
3. Adjust mode still editable without stacking all tiles full-width

## Fast checks
```bash
rg -n "tileHref|history-mini-setting-wrap--link|grid-template-columns: repeat\\(3" frontend/src/components/recommendation/RecommendationSettingsPanel frontend/src/styles/history-premium.css
```

## as-is → to-be
| as-is | to-be |
|-------|--------|
| Tiles stacked vertically full-width | 3-column row inside card |
