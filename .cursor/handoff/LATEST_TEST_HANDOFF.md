# Latest test handoff — Share card size + comparison padding

**Branch:** `main` · **Commit:** pending

## Change

1. **카드 크기** — 780×975 → **720×900**
2. **"이 무게는 어느 정도?"** — 위 여백 +8px (`COMP_SECTION_TOP_PAD`)
3. **tip ("헤비 볼링공 수준이에요.")** — 아래 여백 +10px (`COMP_TIP_BOTTOM_PAD`)

## Test

누적무게 → 공유 카드 만들기

```bash
npm run build --prefix frontend
```
