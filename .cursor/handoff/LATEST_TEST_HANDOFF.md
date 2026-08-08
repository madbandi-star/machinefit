# Test handoff: Detail page uses 셋팅값 저장하기 (no 조정값 저장)

## Summary
세부기록 페이지의 별도 「조정값 저장」 버튼을 제거하고, 기록카드와 같이 「셋팅값 조정 필요」→「셋팅값 저장하기」로 바뀌어 저장하도록 맞췄습니다.

## Git
- Branch: `main`
- Commit: pending

## Test focus
1. Records → card → detail
2. No separate 「조정값 저장」 in the feedback header
3. Tap 「셋팅값 조정 필요」 → button becomes 「셋팅값 저장하기」 (pulses) → tap saves adjustments

## Fast checks
```bash
rg -n "onSavePreferences|badButtonSaveMode|handleSettingsSave" frontend/src/pages/recommendation-result/RecommendationResultPage.tsx
```

## as-is → to-be
| as-is | to-be |
|-------|--------|
| Separate 조정값 저장 on detail | Same bad→save button flow as record cards |
