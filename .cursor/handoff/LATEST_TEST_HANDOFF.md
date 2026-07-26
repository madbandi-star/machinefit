# Latest test handoff — Achievements category filter grid

**Branch:** `main`

## Change

업적 페이지 카테고리 필터 UI — 가로 스크롤 제거, 한눈에 보는 그리드.

- 전체 · 총볼륨 · … · 시즌업적까지 **4열 그리드**(넓은 화면 6열)
- 이모지 + 짧은 라벨 컴팩트 칩
- 패널 카드 스타일

## Test focus

1. `/my-page/achievements` → **업적** 탭
2. 카테고리 패널에 가로 스크롤 없음
3. 각 카테고리 탭 시 목록 필터 동작

## Fast checks

```bash
npm run build --prefix frontend
npm run test:smoke:changed
```

## as-is → to-be

| As-is | To-be |
|-------|-------|
| 긴 가로 스크롤 칩 | 4열 그리드, 전체 카테고리 한눈에 |
