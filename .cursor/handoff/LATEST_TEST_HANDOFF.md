# Test handoff — Count session full-mode button

## Summary
홈 횟수세기 소형 배너에 휴식 타이머와 같이 「전체모드」를 항상 표시.

## Test focus
1. 홈 → 횟수세기 시작
2. 소형 배너에 「전체모드」 버튼 확인 (설정 「운동 중 전체 화면」 OFF여도)
3. 탭 → 전체화면 → 소형모드 → 다시 전체모드

## Fast checks
```
rg -n "onExpand=\{expand\}" frontend/src/components/recommendation/GlobalCountSessionHost/GlobalCountSessionHost.tsx
```

## As-is → To-be
- **as-is**: `workoutFullscreenDisplay`일 때만 expand
- **to-be**: 휴식과 동일하게 항상 expand

## Deploy note
Frontend only (Pages).
