# Test handoff — apex `/` → `/machinefit/` redirect

## Summary
`https://machine-fit.com/` 가 앱 basename(`/machinefit`)과 안 맞아 검은 화면이던 문제. `index.html`에서 `/`를 `/machinefit/`로 보냅니다.

## Test focus
1. `https://machine-fit.com/` → 홈 앱이 보이는지
2. `https://machine-fit.com/machinefit/` 직접 접속
3. `www.machine-fit.com` 은 526일 수 있음 (apex만)

## Fast checks
- `frontend/index.html` 에 `location.replace('/machinefit/'` 있는지

## As-is → To-be
- as-is: apex는 HTML 200이지만 React 라우트 불일치로 빈 화면
- to-be: apex에서 앱 루트로 이동

**Branch:** `main`
**Commit:** `06467d88`
