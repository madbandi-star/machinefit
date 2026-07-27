# Latest test handoff — Share card layout reset

**Branch:** `main` · **Commit:** pending

## Change

1. **배경** — KG 워터마크·헬스장 실루엣 등 제거 → 페이지/카드 **그radient**만
2. **"를 들어올렸습니다." ↔ 비교 카드** — 사이 공백 제거 (순차 배치)
3. **비교 카드 ↔ MachineFit 푸터** — 사이 공백 제거
4. **상하 여백 동일** — 전체 콘텐츠 블록 카드 내 **수직 중앙**

## Test

누적무게 → 공유 카드 만들기

```bash
npm run build --prefix frontend
```
