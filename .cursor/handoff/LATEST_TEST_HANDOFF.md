# Test handoff — Machine images on home / favorites / records

## Summary
즐겨찾기·최근기록 API가 브랜드 갤러리만 보던 문제를 고쳤습니다. 커버 → 갤러리 → **공통머신(`standard_machine_images`)** 순으로 `primaryImageUrl`을 채웁니다. 즐겨찾기 전체보기 패널도 홈과 같은 이미지 해석을 씁니다.

## Git
- branch: `main`
- commit: `81dd178b`

## Changed files
- `backend/server/repositories/favorite.repository.ts`
- `backend/server/repositories/history.repository.ts`
- `backend/server/utils/primary-image-sql.ts`
- `frontend/src/components/records/FavoritesListPanel/FavoritesListPanel.tsx`
- `frontend/src/utils/catalogAssets.ts`
- `frontend/src/utils/catalogAssets.resolveMachineImageUrl.test.ts`

## Test focus
1. 홈 최근기록 / 즐겨찾기 미니카드 썸네일
2. 즐겨찾기 전체보기 리스트 썸네일
3. 기록 페이지 기구 카드 썸네일 (브랜드 전용 이미지 없는 공통 연동 머신)

## Fast checks
```bash
cd frontend && npx vitest run src/utils/catalogAssets.resolveMachineImageUrl.test.ts
```

## Production checks
- Pages: https://github.com/madbandi-star/machinefit/actions/runs/32553407984 — **success**
- Render: https://github.com/madbandi-star/machinefit/actions/runs/32553407986 — **success**
- 홈 /favorites / 기록에서 placeholder 대신 실제 기구 사진

## As-is → To-be
- **As-is:** 공통머신 이미지가 있어도 즐겨찾기·히스토리는 갤러리만 조회 → 대부분 placeholder
- **To-be:** 공통머신 이미지까지 COALESCE → 동일 머신이 홈·즐겨찾기·기록에서 사진 표시
