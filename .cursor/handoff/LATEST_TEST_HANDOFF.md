# Test handoff: Pulse 「셋팅값 저장하기」 after adjust click

## Summary
기록페이지에서 「셋팅값 조정 필요」를 누르면 「셋팅값 저장하기」로 바뀐 버튼에 계획 저장과 같은 attention 애니메이션이 바로 적용됩니다.

## Git
- Branch: `main`
- Commit: ca89761d

## Test focus
1. Records → card → 셋팅값 조정 필요
2. Button becomes 셋팅값 저장하기 and pulses (green)
3. After save, pulse stops

## Fast checks
```bash
rg -n "badSaveAttention|btn--save-attention" frontend/src/components/recommendation/FitFeedbackPanel frontend/src/styles/recommendation.css
```

## as-is → to-be
| as-is | to-be |
|-------|--------|
| Pulse only when fields dirty / overridden by --active | Pulse while in save mode after adjust click |
