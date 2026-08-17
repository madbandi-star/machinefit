# Test handoff — Production boot crash fix

## Summary
`ServiceUnavailableScreen` used `useLocation()` outside `RouterProvider` → blank `machine-fit.com`. Switched path check to `window.location.pathname`.

## Test focus
1. https://machine-fit.com/ loads (not blank `#root`)
2. Console에 `useLocation() may be used only in the context of a <Router>` 없음
3. 홈/헤더에서 동기부여 음악·동영상 버튼 표시

## As-is → To-be
- as-is: 사이트 전체 흰/검 빈 화면
- to-be: 앱 정상 부트

**Commit:** pending
