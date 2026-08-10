# Test handoff — Easy mode X → normal mode

## Summary
이지모드 마법사 우측상단 **X**가 `/easy`(이지 홈)으로 가던 것을 **보통모드 + 홈**으로 바꿨습니다. 왼쪽 ← 는 기존 뒤로가기 유지.

## Git
- branch: `main`
- commit: (push 후 갱신)

## Changed files
- `frontend/src/pages/easy-mode/EasyWizardPage.tsx`

## Test focus
1. 마법사 1·2·3단계 X → 보통모드 홈
2. 평가(rate) 화면 X도 동일
3. ← 는 이전 단계/이지 홈 유지

## Fast checks
```bash
rg -n "exitToNormalMode" frontend/src/pages/easy-mode/EasyWizardPage.tsx
```

## as-is → to-be
- **as-is:** X ≈ 뒤로 (이지 홈)
- **to-be:** X = 보통모드 종료
