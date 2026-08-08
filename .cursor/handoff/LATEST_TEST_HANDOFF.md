# Test handoff: Fortune AVOID contrast

## Summary
TODAY'S AVOID 카드의 흐린 앰버 배경을 제거하고, 일반 surface + 왼쪽 액센트 + 명확한 텍스트 색으로 가독성을 개선했습니다.

## Git
- Branch: `main`
- Commit: `dc5f8227`

## Test focus
1. `/fortune/today` TODAY'S AVOID 본문·설명이 배경 대비로 잘 읽힘

## Fast checks
```bash
rg -n "fortune-avoid" frontend/src/styles/fortune.css
```
