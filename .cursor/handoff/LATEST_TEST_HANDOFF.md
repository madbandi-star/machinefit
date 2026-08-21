# Test handoff — Disable soft-launch construction gate

## Summary
소프트 런치 허용목록 게이트 기본 OFF. 로그인 사용자가 공사중으로 가지 않음.

## Test focus
1. 허용목록에 없는 계정으로 로그인 → 홈
2. 공사중 페이지로 강제 리다이렉트 없음

## Fast checks
```
rg -n "return raw === '1'" shared/src/constants/active-service-access.ts
rg -n "isSoftLaunchAccessEnforced" frontend/src/routes/guards/AuthGuard.tsx
```

## Deploy note
shared 변경 → Frontend Pages + Render backend 재배포.
