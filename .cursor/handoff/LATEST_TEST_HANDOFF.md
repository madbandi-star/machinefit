# Latest test handoff — 목표 횟수 picker fix

**Branch:** `main`

## Change

목표 횟수만 1로 남던 문제: `ScrollPicker`가 초기 scroll을 사용자 입력으로 오인해 `onChange(1)` 호출 → 다른 picker는 정상.

- programmatic scroll vs 사용자 touch/wheel/pointer 분리
- scroll 위치는 `scrollTop = index * itemHeight`로 동기화

## Test focus

1. 설정 **기본 목표 횟수** 확인 (예: 12)
2. 추천 결과 / 기록 카드 — **목표 횟수** 동일하게 시작, scroll로 변경 가능
3. 카운트 간격·원모어·버텨 시간 회귀 없음

## Fast checks

```bash
npm run build --prefix frontend
npm run test:smoke:changed
```
