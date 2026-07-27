# Latest test handoff — Voice count seed + editable pickers

**Branch:** `main`

## Change

추천 결과·기록 카드 음성 카운트 picker가 **설정값으로 시작**하고 **사용자가 숫자 변경 가능**.

- `WorkoutLogPanel`: settings hydration 후 snapshot으로 picker state seed, 카드별 local edit
- `ScrollPicker`: `scrollIntoView`로 초기 scroll 위치 고정 (최솟값 1/0.8/1/1 표시 버그)
- read-only 제거

## Test focus

1. **마이페이지 설정**에서 목표횟수·간격·원모어·버텨 시간 확인
2. **검색 → 추천받기 → 결과** — 위와 동일한 값으로 시작, scroll로 변경 가능
3. **기록 카드** 펼침 — 동일
4. 카운트 시작 — picker에 보이는 값으로 동작

## Fast checks

```bash
npm run build --prefix frontend
npm run test:smoke:changed
```

## as-is → to-be

| As-is | To-be |
|-------|-------|
| Pickers show 1 / 0.8 / 1 / 1 | Match Settings on load |
| Read-only | Editable per card/session |
