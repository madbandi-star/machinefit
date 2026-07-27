# Latest test handoff — Lifted weight share card polish

**Branch:** `main` · **Commit:** pending

## Change

누적무게 공유 카드 **정렬·여백** 수정.

- 🏋️ / 볼링공 이모지 `textBaseline: middle` 중앙 정렬
- 히어로·비교 박스 높이 = 콘텐츠 기준 (내부 빈 공간 제거)
- 전체 블록 세로 중앙, 하단 여백 축소
- `MachineFit에서 확인하세요!` 삭제

## Test

누적무게 → 공유 카드 만들기

```bash
npm run build --prefix frontend
```

