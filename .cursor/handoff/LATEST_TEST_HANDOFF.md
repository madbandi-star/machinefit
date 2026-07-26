# Latest test handoff — records voice coach settings-only

**Branch:** `main`  
**Scope:** frontend

## Change

On **records page** (history `WorkoutLogPanel` voice coach), hide:

- 목소리 여성/남성
- 준비 카운트
- 세션 구성
- 카운트 모드
- 하나더(원모어) 세기 + 원모어 횟수
- 마지막에 버텨!!! 추가
- 휴식 후 자동 시작
- 휴식 중 주의사항·운동팁 듣기

**My Page → Settings** keeps all of the above. Saved values still apply on records.

Recommendation/workout page voice coach is unchanged.

## Test focus

1. Records → expand card → voice coach ON → hidden controls above **not visible**; start/stop works with saved settings
2. My Page → Settings → voice coach → all controls **still visible**
3. Machine recommendation page → voice coach → full controls **still visible**

## Fast checks

```bash
npm run build --prefix frontend
```

## Deploy

- Frontend: GitHub Pages (push to `main`)
- Backend: not needed
