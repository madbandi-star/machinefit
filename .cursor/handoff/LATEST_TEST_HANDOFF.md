# Latest test handoff — Settings voice coach picker grid

**Branch:** `main`  
**Scope:** frontend

## Change

Settings > 음성 카운트: 목표횟수 / 카운트간격 / 원모어횟수 / 버텨!!! 시간을 기록 카드와 동일한 ScrollPicker 그리드로 표시.

- 동적 2~4열 (세션 구성·하나더·버텨 설정에 따라)
- 버텨 시간: 드롭다운 → ScrollPicker

## Test focus

1. Settings > Voice Coach → picker layout matches expanded record card
2. Toggle 하나더 / 버텨 → columns update
3. Records page voice coach pickers still work

## Fast checks

```bash
npm run build --prefix frontend
```

## Deploy

- Frontend: GitHub Pages (push to `main`)
