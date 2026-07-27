# Latest test handoff — Lifter DNA quote line wrap

**Branch:** `main` · **Commit:** pending

## Change

공유 카드 **긴 인용문(oneLiner) 줄바꿈**.

- 약 20자 기준 + 쉼표·마침표 등에서 끊기
- 여러 줄일 때 여는/닫는 따옴표는 첫·마지막 줄만
- 박스 안 세로 중앙 정렬 유지

## Test

운동성향 → 공유 카드 — 긴 문장이 2~3줄로 자연스럽게 나뉘는지 확인

```bash
npm run build --prefix frontend
```

