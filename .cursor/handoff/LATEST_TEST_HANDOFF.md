# Test handoff: Line-break records nudge body copy (KO)

## Summary
세부 운동기록 카드 안내 문구를 「세트·템플릿을」 다음 줄바꿈으로 표시하도록 KO 문구와 `white-space: pre-line`을 적용했습니다.

## Git
- Branch: `main`
- Commit: `47580439`

## Test focus
1. 추천 직후 결과 카드 nudge body가 두 줄: 「…세트·템플릿을」 / 「관리할 수 있어요」

## Fast checks
```bash
rg -n "recordsNudgeBody|pre-line" frontend/src/i18n/locales/ko/machines.json frontend/src/styles/recommendation.css
```

## as-is → to-be
| as-is | to-be |
|-------|--------|
| 한 줄 | 「세트·템플릿을」 다음 줄에 「관리할 수 있어요」 |
