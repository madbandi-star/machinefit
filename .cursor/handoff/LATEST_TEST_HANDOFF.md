# Test handoff — Move Easy mode button left of music player

## Summary
헤더 Easy 모드 버튼을 MachineFit 로고 옆에서 음악 플레이어(MotivationMediaControls) 좌측으로 이동.

## Test focus
1. 헤더 우측: Easy → 음악 → 알림 순서
2. 로고 옆에 Easy 버튼 없음

## Fast checks
```
rg -n "EasyMiniHeaderButton|MotivationMediaControls" frontend/src/components/layout/Header/Header.tsx
```

## As-is → To-be
- as-is: 로고 | Easy … 음악
- to-be: 로고 … Easy | 음악
