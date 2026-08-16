# Test handoff — My Brands order = admin display order

## Summary
마이페이지 「내 브랜드」 캡션 칩을 관리자 브랜드 **표시순서(`sort_order`)** 기준으로 정렬. 공개 브랜드 목록 API도 `sortOrder` 반환 + `ORDER BY sort_order`.

## Test focus
1. 관리자 브랜드 표시순서와 내 브랜드 칩 순서가 일치
2. 즐겨찾기(별)는 표시만 바꾸고 순서를 앞으로 끌어올리지 않음
3. 검색 필터 후에도 남은 항목은 sortOrder 유지

## Fast checks
```
rg -n "sort_order ASC|\\(a\\.sortOrder" backend/server/repositories/machine.repository.ts frontend/src/pages/brand-favorites/BrandFavoritesPage.tsx
```

## Production
- Render 백엔드 재배포 필수 (API에 sortOrder 포함)
- Pages FE 배포

## As-is → To-be
- as-is: 즐겨찾기 우선 + 가나다/알파벳
- to-be: 관리자 표시순서
