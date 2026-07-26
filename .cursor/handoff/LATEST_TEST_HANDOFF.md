# Latest test handoff — Achievements header tabs + AI disclaimer

**Branch:** `main`

## Change

1. **업적 페이지** — `[업적][랭킹]` 탭을 좌측 상단 **업적** 타이틀 옆으로 이동
2. **AI 면책 문구** — `compliance.disclaimer.ai` 문구 변경 (2줄)

## Test focus

1. `/my-page/achievements` — `업적 [업적] [랭킹]` 헤더 레이아웃, 탭 전환
2. 추천 결과 / Lifter DNA 등 — 새 AI 면책 문구 2줄 표시

## Fast checks

```bash
npm run build --prefix frontend
npm run test:smoke:changed
```

## as-is → to-be

| Area | As-is | To-be |
|------|-------|-------|
| Achievements tabs | Hero 아래 별도 행 | 타이틀 옆 |
| AI disclaimer | 참고용 추정… 의료 조언 아님 | 참고용이며 오차… / 의료적 판단 대체 안 함 |
