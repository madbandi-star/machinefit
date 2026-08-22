# Test handoff — Search list machine name only

## Summary
검색 추천 머신 카드 제목에서 브랜드 접두어를 제거하고 기구명만 표시합니다.

## Fast check
```bash
cd frontend && npx vitest run src/utils/freeWeightDisplay.test.ts
```

## As-is → To-be
- **As-is:** 아스날 스트렝스 어브도미널
- **To-be:** 어브도미널 (브랜드 줄은 유지)
