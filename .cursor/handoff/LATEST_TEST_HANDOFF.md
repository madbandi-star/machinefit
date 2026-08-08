# Test handoff: Records nudge after recommendation result

## Summary
신선한 추천 결과 화면에 「기록 보기」 안내 배너를 추가하고, 하단 기록 탭에 짧은 팁·펄스 강조를 띄워 기록 페이지로 유도합니다. 하루 1회 닫기·기록 진입 시 해제.

## Git
- Branch: `main`
- Commit: pending

## Test focus
1. 검색→추천→결과: 배너 + 하단 기록 탭 펄스/팁 표시
2. 기록 보기 CTA → 해당 날짜 기록 페이지
3. 배너 X → 오늘 다시 안 보임 + 네비 강조 해제
4. 기록에서 연 결과(logDate 있음)에는 넛지 없음
5. 하단 기록 탭 탭 시 강조 해제

## Fast checks
```bash
rg -n "recordsNavNudge|recordsNudgeTitle|RECORDS_NUDGE_DISMISS_KEY|bottom-nav__item--nudge" frontend/src
```

## as-is → to-be
| as-is | to-be |
|-------|--------|
| 추천 결과에서 기록 탭 유도 없음 | 배너 CTA + 하단 기록 탭 약한 강조 |
