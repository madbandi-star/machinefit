# Test handoff — 45도 → 45° 레그 프레스

## Summary
공통 `STD_45_LEG_PRESS`는 이미 **45° 레그 프레스**. 브랜드 29대 이름을 공통에 맞춰 **45도 → 45°**로 동기화. migration 187 프로덕션 적용 완료.

## Git
- branch: `main`
- commit: `f2e912c6da11be9db0f7f2144ee5df0076759119`

## Test focus
1. 브랜드/검색 이름에 「45도」 없고 「45° 레그 프레스」
2. 공통 타입 표시명 동일

## Fast checks
```bash
npm run test --prefix frontend -- --run src/utils/freeWeightDisplay.test.ts
```

## As-is → To-be
| As-is | To-be |
|-------|-------|
| …45도 레그 프레스 | …45° 레그 프레스 |
