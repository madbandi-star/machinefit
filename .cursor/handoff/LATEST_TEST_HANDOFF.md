# Latest test handoff — Voice 목표 횟수 ↔ 추천/조정 연동

**Branch:** `main`

## Change

음성카운트 **목표 횟수**를 fit feedback 횟수와 연동.

| 동작 | 결과 |
|------|------|
| 추천값 잘맞음 | 목표 횟수 = 추천횟수 |
| 셋팅값 조정필요 | 목표 횟수 = 조정횟수 |
| 조정횟수 ± | 목표 횟수 같이 변경 |
| 조정 모드에서 목표 횟수 scroll | 조정횟수 같이 변경 |

카운트 간격·원모어·버텨 시간은 설정값 유지.

## Test focus

1. 추천 결과 — 잘맞음 / 조정필요 각각 목표 횟수 확인
2. 조정 모드 ± ↔ voice picker 양방향
3. 기록 카드 동일

## Fast checks

```bash
npm run build --prefix frontend
npm run test:smoke:changed
```
