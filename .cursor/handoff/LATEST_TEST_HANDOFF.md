# Latest test handoff — Lifted share card text trim

**Branch:** `main` · **Commit:** pending

## Change

누적무게 **공유카드만** 수정 (페이지 본문 UI는 유지):

- ~~`님은 지금까지`~~ → 이름(`labelName`)만 표시
- ~~`를 들어올렸습니다`~~ → KG 아래 마무리 문구 제거

## Test

누적무게 → 공유 카드 만들기

```bash
npm run build --prefix frontend
```