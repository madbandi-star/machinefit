# Latest test handoff — Achievement emoji center + badge gap



**Branch:** `main` · **Commit:** `c8139c6`



## Change



1. **이모지 중앙 정렬** — `measureText` + `actualBoundingBox`로 시각적 중심 맞춤 (좌우 쏠림 방지)

2. **배지 ↔ 이모지 간격** — 글로우 반경 기준(~84px) → **배지 하단 + 6px** 바로 아래 배치



## Test



업적 → 공유하기 → 이모지 중앙·배지 간격 확인



```bash

npm run build --prefix frontend

```
