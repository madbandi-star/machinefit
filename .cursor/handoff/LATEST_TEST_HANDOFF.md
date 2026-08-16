# Test handoff — Search brands = admin display order

## Summary
검색(및 Easy mode 피커) 브랜드 칩 정렬을 하드코딩 우선순위에서 관리자 **표시순서(`sortOrder`)** 로 변경.

## Test focus
1. 검색 페이지 브랜드 칩 순서 = 관리자 브랜드 표시순서
2. Easy mode 머신 피커 브랜드 칩도 동일
3. API에 없는 맨몸/프리만 fallback으로 끼워 넣음 (있으면 admin 순서 따름)

## Fast checks
```
rg -n "compareBrandsByDisplayOrder|BRAND_SEARCH_ORDER" frontend/src/utils/sortBrandsForSearch.ts
```

## Note
공개 `/brands`에 `sortOrder`가 있어야 함 (이전 BE 커밋). Render 미배포면 순서가 전부 0으로 보일 수 있음.

## As-is → To-be
- as-is: BODYWEIGHT → FREE_WEIGHT → Hammer… 고정
- to-be: admin sort_order ASC
