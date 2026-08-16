# Test handoff — Home recent/favorites empty UI

## Summary
홈 「최근 기록」「즐겨찾기」 빈 상태 카드를 캡처 UI에 맞게 스타일만 개선. 링크/쿼리/데이터 로직 변경 없음.

## Test focus
1. 기록·즐겨찾기 비어 있을 때: 초록 바 제목, 원형 아이콘, 배지, 점 패턴, 원형 chevron
2. 탭 시 기존과 동일 경로로 이동
3. 데이터가 있으면 기존 가로 스크롤 카드 유지

## Fast checks
```
rg -n "home-section-empty__badge|recentEmptyBadge" frontend/src
```

## As-is → To-be
- as-is: 단순 empty row
- to-be: 캡처와 같은 프리미엄 empty 카드
