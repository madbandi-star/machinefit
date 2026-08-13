# Test handoff — Login page feat3 line break + footer trim

## Summary
로그인(`/login`)에서 세 번째 피처 문구를 「기록하고 분석하여 / 더 나은 결과로」로 줄바꿈. 고객센터(지원 메일) 아래 상표·쿠키 고지는 로그인 페이지만 제거. 게스트 홈 랜딩은 변경 없음.

## Test focus
1. `/login` KO: feat3 desc가 두 줄
2. `/login` 푸터: 약관 링크 + 고객센터까지 보이고, 그 아래 trademark/cookie 없음
3. 게스트 `/`(홈 랜딩): feat3 한 줄 유지, 푸터 trademark/cookie 유지

## Fast checks
```
rg -n "landingFeat3DescLogin|variant=\"login\"|hideBelowSupport" frontend/src
rg -n "hideBelowSupport" frontend/src/layouts/AuthLayout.tsx frontend/src/components/layout/LegalFooter/LegalFooter.tsx
```

## As-is → To-be
- as-is: `/login` feat3 한 줄; 푸터에 trademark+cookie
- to-be: `/login` feat3 줄바꿈; 고객센터 아래 제거; 홈 게스트 랜딩 무변경
