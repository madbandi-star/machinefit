# Test handoff — Standard image thumbnail badge

## Summary
공통머신 사진을 쓸 때 썸네일 모서리에 **공통** 배지 + 툴팁(브랜드 실물과 다를 수 있음)을 표시합니다.

## Surfaces
- 홈 최근/즐겨찾기 미니카드
- 즐겨찾기 전체보기
- 기록 기구 카드
- 검색 리스트

## Fast checks
```bash
cd frontend && npx vitest run src/utils/catalogAssets.resolveMachineImageUrl.test.ts
```

## As-is → To-be
- **As-is:** 공통 사진인지 표시 없음
- **To-be:** `/media/standard-machine-images/` URL일 때만 배지
