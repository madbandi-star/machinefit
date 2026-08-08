# Test handoff: Clearer fit-feedback button affordance

## Summary
기록카드 「추천값 잘 맞음」「셋팅값 조정 필요」가 누를 수 있는 버튼으로 보이도록, 선택 안내 문구·탭 힌트·아이콘 뱃지·입체 버튼 스타일을 적용했습니다.

## Git
- Branch: `main`
- Commit: pending

## Test focus
1. Records → expanded card: prompt “아래 버튼을 눌러 선택하세요”
2. Both options look raised/tappable with “탭하여 선택” until chosen
3. Selected state still clear; save-attention pulse still works

## Fast checks
```bash
rg -n "choicePrompt|tapToChoose|btn--idle|btn-icon" frontend/src/components/recommendation/FitFeedbackPanel frontend/src/styles/recommendation.css frontend/src/i18n/locales/ko/machines.json
```

## as-is → to-be
| as-is | to-be |
|-------|--------|
| Flat labels, unclear if tappable | Prompt + chip buttons with tap hint |
