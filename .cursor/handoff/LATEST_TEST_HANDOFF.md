# Test handoff — Admin brand display order controls

## Summary
관리자 브랜드 목록에 **표시순서 숫자**를 크게 보여주고, **맨위 / 위 / 아래 / 맨아래** 화살표로 순서를 변경. API: `PATCH /admin/catalog/brands/:id/sort-move`.

## Test focus
1. 각 카드에 표시순서 숫자 배지
2. 화살표로 이동 후 목록·검색·내 브랜드 순서 반영 (BE 배포 후)
3. 맨 위/맨 아래 항목에서 해당 방향 버튼 비활성 (표시순 오름차순 1페이지 기준)

## Fast checks
```
rg -n "sort-move|moveBrandSort|ag-brand-order" backend/server frontend/src
```

## Deploy
- Render 백엔드 필수
- Pages FE

## As-is → To-be
- as-is: 순서 숫자만 meta에 약하게 표시, 편집 폼으로만 변경
- to-be: 목록에서 바로 순서 이동
