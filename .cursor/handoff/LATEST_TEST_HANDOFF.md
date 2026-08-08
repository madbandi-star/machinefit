# Test handoff: Pulse “조정값 저장” when adjustments dirty

## Summary
셋팅값 조정 필요 선택 후 중량·추천횟수·가동범위를 바꾸면, 조정값 저장(기록카드: 셋팅값 저장하기) 버튼에 계획 저장과 같은 attention 애니메이션이 적용됩니다.

## Git
- Branch: `main`
- Commit: 5ac6cdfa

## Test focus
1. Records or detail → 셋팅값 조정 필요
2. Change weight / reps / ROM → save button pulses (green attention)
3. After save, pulse stops

## Fast checks
```bash
rg -n "preferencesDirty|save-btn--attention|btn--save-attention" frontend/src/components/recommendation frontend/src/styles/recommendation.css
```

## as-is → to-be
| as-is | to-be |
|-------|--------|
| Dirty adjustments, static save button | Same pulse attention as plan-save |
