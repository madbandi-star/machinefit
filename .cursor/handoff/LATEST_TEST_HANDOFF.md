# Test handoff — Standard machine brand link select

## Summary
관리자 공통머신 등록/수정 시 브랜드 다중 선택(+전체 선택)으로 `machines`에 연결. 이미 연결된 브랜드는 additive만(해제 없음).

## Fast checks
```bash
npm run build --prefix shared
npm run typecheck --prefix frontend
npm run typecheck --prefix backend
```

## As-is → To-be
- **As-is:** 공통 타입만 생성, 브랜드 수동/스크립트 연결
- **To-be:** 폼에서 N개(또는 전체) 브랜드 선택 후 저장 시 연결
