# Latest test handoff — Share card 4:5 layout fix

**Branch:** `main` · **Commit:** `f507174`

## Change

누적무게 공유 카드 레이아웃 조정:

- **사이즈** 1080×1350 (운동성향 DNA 공유카드와 동일, 4:5)
- **비교 박스** 슬로건 ↔ 푸터 사이 **수직 중앙** 배치
- 슬로건↔비교, 비교↔푸터 간격 **16px**로 축소
- 카드 margin/padding DNA 카드와 동일 (margin 48, radius 40, pad 64)

## Test

누적무게 → **공유 카드 만들기** → 1080×1350 PNG

```bash
npm run build --prefix frontend
```

## as-is → to-be

- **as-is:** 9:16, 비교 박스 하단 여백 과다, 슬로건·푸터 간격 넓음
- **to-be:** 1080×1350, 비교 박스 중앙, 간격 축소
