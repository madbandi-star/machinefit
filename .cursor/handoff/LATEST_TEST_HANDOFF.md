# Test handoff — Home latest notice always on top

## Summary
홈 `[최신 공지]`를 `home-page` 최상단으로 올렸습니다. 프로필 설정 필요 배너·헬스장 선택 등보다 위에 옵니다.

## Test focus
1. 프로필 미완료 + 공지 있는 계정: 공지가 프로필 CTA보다 위
2. 프리미엄 등 헬스장 선택 노출 시에도 공지가 그 위

## Fast checks
```
rg -n "HomeNoticeBanner|ProfileIncompleteBanner" frontend/src/pages/home/HomePage.tsx
```

## as-is → to-be
- as-is: ProfileIncompleteBanner → HomeNoticeBanner
- to-be: HomeNoticeBanner first, then gym / install / profile banner
