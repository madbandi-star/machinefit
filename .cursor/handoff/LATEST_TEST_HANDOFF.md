# Test handoff — Points history search

## Summary
내 헬창력 → 헬창력 내역에 검색창 추가. 설명·액션·날짜·포인트로 클라이언트 필터.

## Test focus
1. 마이/내 헬창력 페이지 열기
2. 내역 위 검색창 입력
3. 매칭 행만 표시, 카운트 `N/전체`
4. 결과 없으면 emptySearch 문구

## Fast checks
```
rg -n "searchPlaceholder|filteredItems|SearchBar" frontend/src/pages/points/PointsPage.tsx
```

## As-is → To-be
- **as-is**: 내역 전체만 스크롤
- **to-be**: 검색으로 필터

## Deploy note
Frontend only (Pages).
