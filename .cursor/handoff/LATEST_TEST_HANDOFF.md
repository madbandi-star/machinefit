# Test handoff — Records menus → gear icons

## Summary
기록 페이지 일자조회 우측 메뉴와 개별 기구카드 메뉴를 「더보기」 텍스트 대신 **톱니바퀴(설정) 아이콘** 버튼으로 교체.

## Git
- branch: `main`
- commit: `b4e54df8` (+ follow-up CSS sync in HistoryDayActionsSheet if present)

## Test focus
1. 기록 > 일자조회 오른쪽: 톱니바퀴 아이콘 · 탭 시 날짜 관리 시트
2. 개별 기구카드: 톱니바퀴 아이콘 · 탭 시 카드 메뉴
3. 순서 변경(화살표) 아이콘은 유지 / 「더보기」 문구 없음

## Fast checks
```
rg -n "name=\"settings\"|<Settings|day-menu-trigger|order-trigger" frontend/src/components/records frontend/src/components/icons/Icon.tsx
rg -n "more-trigger|더보기" frontend/src/components/records/HistoryListPanel frontend/src/components/records/HistoryRecordCard || true
```

## As-is → To-be
- **As-is:** 「더보기」 텍스트 라벨
- **To-be:** 정사각 톱니바퀴 아이콘 버튼
