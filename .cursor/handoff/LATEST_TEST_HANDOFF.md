# Latest test handoff — Achievement card + lifted hero spacing

**Branch:** `main` · **Commit:** `f0cbb4c`

## Change

### 업적 공유카드
- 720×900 (누적무게와 동일)
- DNA/누적무게 스타일 배경·패널·푸터
- **획득일시** 표시 추가

### 누적무게 공유카드
- **210 KG** 영역 위 여백 축소 (헤드라인↔KG 간격 8px)
- **"를 들어올렸습니다."** KG 숫자 기준으로 함께 상향

## Test

```bash
npm run build --prefix frontend
```

- 업적 → 공유하기
- 누적무게 → 공유 카드 만들기
