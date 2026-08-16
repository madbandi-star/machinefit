# Compact missed-plans strip on Home

## Summary
홈 놓친 운동 계획을 큰 배너가 아니라 **오늘의 운동 계획**과 같은 한 줄 스트립으로 압축했습니다. 머신·날짜가 한눈에 보이고, 액션은 짧은 칩(오늘로/날짜/삭제/무시)입니다.

## Git
- branch: `main`
- commit: `d821a988`

## Changed files
- `frontend/src/components/home/HomePlannedWorkoutCard/HomePlannedWorkoutCard.tsx`
- `frontend/src/styles/home.css`
- `frontend/src/styles/records.css`
- `frontend/src/i18n/locales/{ko,en,ja,zh}/machines.json`

## Test focus
1. 놓친 계획이 있을 때 홈에서 한 줄 스트립 표시 (운세 위)
2. `오늘로` / `날짜` / `삭제` / `무시` 동작
3. 세로 공간이 이전 큰 배너보다 확실히 작음

## Fast checks
```bash
rg -n "home-missed-plans" frontend/src/components/home/HomePlannedWorkoutCard/HomePlannedWorkoutCard.tsx frontend/src/styles/home.css
rg -n "missed-plans-banner" frontend/src || true
```

## As-is → To-be
- **As-is:** 큰 주황 배너 + 풀 사이즈 버튼 4개
- **To-be:** 컴팩트 한 줄 스트립 + 짧은 칩 액션
