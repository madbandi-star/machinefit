# Test handoff — Rejoin terms DOB + welcome alignment

## Summary
재가입/가입 약관 화면의 생년월일을 스크롤 피커로 교체(우측 넘침 제거), 「다시 머신핏을…」 환영 영역 가로·세로 정렬 정리.

## Test focus
1. 생년월일 UI가 화면 밖으로 안 나감
2. 재가입 환영 카드: 아이콘·제목 중앙, 안내 문단 정렬
3. 연/월/일 선택 후 다른 필수 동의와 함께 계속 가능

## Fast checks
```
rg SignupBirthDateField frontend/src/pages/auth/terms
rg terms-agree__rejoin-head frontend/src/styles/auth.css
rg 'type="date"' frontend/src/pages/auth/terms/TermsAgreementPage.tsx || true
```

## as-is → to-be
- as-is: native date 넘침 + 환영 영역 정렬 불량
- to-be: 피커 + 정렬된 환영 카드
