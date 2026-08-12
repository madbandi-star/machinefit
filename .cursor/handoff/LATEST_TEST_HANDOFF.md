# Test handoff — Move workout calendar above Insights

## Summary
마이페이지 운동 캘린더를 머신핏 인사이트 바로 위로 이동. 지역 설정 유도는 그 위에 두어 사이에 끼지 않게 함.

## Test focus
1. 순서: … → 운동 캘린더 → 머신핏 인사이트
2. 캘린더와 인사이트 사이에 「지역을 설정해 보세요」없음

## Fast checks
```
rg -n "WorkoutMonthCalendar|quickLinks|myPageNudge" frontend/src/pages/my-page/MyPage.tsx
```
