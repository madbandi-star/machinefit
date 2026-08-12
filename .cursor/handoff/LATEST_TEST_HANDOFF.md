# Test handoff — My Page workout calendar header copy

## Summary
운동 캘린더 펼침 시 제목을 `운동 캘린더 {{month}} 운동일 {{count}}일` 한 줄로 표시. 안내 문구 삭제.

## Test focus
1. 펼치면 한 줄 헤딩
2. 「운동을 기록한 날을…」없음

## Fast checks
```
rg workoutCalendarHeading frontend/src
rg workoutCalendarDesc frontend/src || true
```
