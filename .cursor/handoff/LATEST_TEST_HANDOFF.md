# Test handoff — Easy mode footer hide + step 2 tips UX

## Summary
1. 이지모드 레이아웃에서 하단 **이용약관(LegalFooter) 전체 제거**
2. 3스텝 2/3 추천확인: 「팁·주의사항 보기」접기 UI → **주의사항 / 운동팁 카드로 바로 노출** (한눈에 읽기)

## Git
- branch: `main`
- commit: `1400a3cd`

## Test focus
1. `/easy`, `/easy/wizard` 하단 약관·사업자 푸터 없음
2. 추천확인(2/3): 주의사항(있으면) → 운동팁(있으면) 카드가 펼쳐진 상태로 표시
3. 접기 토글 「팁·주의사항 보기」 없음

## Fast checks
```
rg -n "LegalFooter" frontend/src/layouts/EasyLayout.tsx || true
rg -n "easy-s2-coach|coachTitle|tipsSection" frontend/src/pages/easy-mode/EasyWizardPage.tsx frontend/src/i18n/locales/ko/common.json
```

## As-is → To-be
- **As-is:** 이지모드에도 LegalFooter / 팁은 details로 접힘
- **To-be:** 푸터 없음 + 팁·주의 카드 상시 표시
