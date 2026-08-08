# Test handoff: Hug title underline/chevron to name width

## Summary
기록 카드 기구 이름 밑줄과 ›가 이름 길이에 맞게 붙도록 수정했습니다.

## Git
- Branch: `main`
- Commit: `98e9adc7`

## Test focus
1. 짧은 이름: 밑줄·›가 이름 바로 옆에 붙음
2. 긴 이름: max-width 안에서 줄임/2줄 유지

## Fast checks
```bash
rg -n "width: fit-content|flex: 0 1 auto" frontend/src/styles/history-premium.css frontend/src/styles/records.css
```

## as-is → to-be
| as-is | to-be |
|-------|--------|
| 밑줄·›가 오른쪽까지 늘어남 | 이름 길이에 맞게 붙음 |
