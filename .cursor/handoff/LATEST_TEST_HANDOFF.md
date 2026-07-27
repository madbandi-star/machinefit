# Latest test handoff — Recommend result voice count settings

**Branch:** `main`

## Change

추천 결과 페이지 음성 카운트 영역이 설정값 대신 **목표횟수 1 / 카운트간격 0** 등으로 잘못 보이던 문제 수정.

- `WorkoutLogPanel` history variant(기록 카드·추천 결과 공통): 설정 store 값 직접 사용, picker read-only
- 설정 persist hydration 후 VoiceCoachPanel 마운트
- `ScrollPicker` 초기 scroll 시 잘못된 `onChange` 방지
- settings merge 시 voice count 숫자 clamp

## Test focus

1. **검색 → 기구 → 추천받기 → 결과 페이지** — 목표횟수·카운트간격·원모어·버텨 시간 = 마이페이지 설정
2. **기록 페이지** 카드 펼침 — 동일하게 설정값 표시 (회귀 없음)
3. 카운트 시작 시 설정과 동일한 횟수/간격으로 동작

## Fast checks

```bash
npm run build --prefix frontend
npm run test:smoke:changed
```

## as-is → to-be

| As-is | To-be |
|-------|-------|
| Recommend result voice pickers show 1 / 0 / wrong values | Match My Page → Settings voice count |
