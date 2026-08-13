# Test handoff — Remove header language selector

## Summary
앱 헤더(홈 등 최상단 MachineFit 로고 옆) 언어 선택 compact 제거. 설정·로그인 랜딩 언어 선택은 유지.

## Test focus
1. 로그인 홈: 로고 옆에 KO/EN 없음
2. 설정에서 언어 변경 가능
3. 게스트 로그인 랜딩 세그먼트는 유지

## Fast checks
```
rg -n "LanguageSelector" frontend/src/components/layout/Header/Header.tsx
# expect: no matches
rg -n "LanguageSelector" frontend/src/pages/settings/SettingsPage.tsx frontend/src/components/auth/AuthLandingScreen
```

## As-is → To-be
- as-is: 헤더 로고 옆 compact 언어 피커
- to-be: 헤더에서 제거
