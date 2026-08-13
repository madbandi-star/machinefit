# Test handoff — Records “…” → “더보기”

## Summary
기록 페이지 일자조회 우측 메뉴와 개별 기구카드 메뉴의 `…` 아이콘을 텍스트 「더보기」로 교체.

## Test focus
1. 기록 > 일자조회 오른쪽: 「더보기」 표시·탭 시 날짜 관리 시트
2. 개별 기구카드: 「더보기」 표시·탭 시 카드 메뉴
3. 순서 변경(화살표) 아이콘은 유지

## Fast checks
```
rg -n "moreLabel|day-menu-trigger|more-trigger" frontend/src/components/records frontend/src/styles/records.css frontend/src/i18n/locales/ko/machines.json
```
