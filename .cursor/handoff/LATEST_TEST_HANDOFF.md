# Test handoff — Auth landing line break on `/` + `/login`

## Summary
이전에 `/login`만 바꿔서 게스트 홈(`/`)에서는 안 보였음. 이제 공유 랜딩에 줄바꿈 적용 + 게스트 홈 푸터도 고객센터 아래 숨김.

## Test focus
1. `/` 비로그인: feat3 「기록하고 분석하여」줄바꿈
2. `/`·`/login` 푸터: 고객센터 아래 trademark/cookie 없음
3. 로그인 후 일반 앱 푸터는 trademark/cookie 유지

## Fast checks
```
rg -n "landingFeat3Desc|hideBelowSupport|feature-desc" frontend/src/components/auth/AuthLandingScreen frontend/src/layouts frontend/src/i18n/locales/ko/common.json frontend/src/styles/auth.css
```

## As-is → To-be
- as-is: `/`에서 한 줄 + 푸터 하단 고지 유지
- to-be: `/`·`/login` 모두 줄바꿈 + 고객센터 아래 제거
