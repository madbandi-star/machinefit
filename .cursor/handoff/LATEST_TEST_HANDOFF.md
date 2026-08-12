# Test handoff — Rejoin terms agreement UI

## Summary
탈퇴 후 재가입 약관 동의 화면 UI를 머신핏 블랙·그린에 맞춰 정리했습니다. 문구는 그대로입니다.

## Test focus
1. 탈퇴 → 같은 소셜로 재로그인 → 약관 동의 화면
2. 상단: MachineFit + 「약관에 동의해 주세요」+ 재가입 환영 카드(새 회원 / 복구 안 됨)
3. 전체 동의 한 줄 탭, 각 항목 탭, 「전문 보기」로 문서 이동
4. 신규 가입(재가입 아님)도 생년월일·체험 안내가 보이는지

## Fast checks
```
rg terms-agree--rejoin frontend/src/pages/auth/terms/TermsAgreementPage.tsx
rg terms-agree__rejoin-facts frontend/src/styles/auth.css
```

## as-is → to-be
- as-is: 슬레이트 배경, 항상 켜진 초록 체크, 회색 재가입 박스, 화살표만 있는 문서 링크
- to-be: 블랙+그린, 환영 카드, 행 전체 탭, 「전문 보기」
