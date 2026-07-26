# Latest test handoff — Settings-only voice coach pickers

**Branch:** `main`  
**Scope:** frontend

## Change

Records card 음성 카운트: 목표횟수/카운트간격/원모어/버텨 시간 = **설정 > 음성 카운트** 값 (읽기 전용).

- 변경은 **마이페이지 > 설정 > 음성 카운트**에서만
- 기록 카드에서 picker 스크롤 불가
- 카운트 세션도 설정값 사용 (추천 횟수로 덮어쓰지 않음)

## Test focus

1. Settings에서 값 변경 → Records 카드에 동일 표시
2. Records picker 조작해도 설정/다른 카드에 반영 안 됨
3. 카운트 시작 → 설정 목표 횟수 기준
4. 추천 결과 페이지 pickers는 여전히 편집 가능

## Fast checks

```bash
npm run build --prefix frontend
```

## Deploy

- Frontend: GitHub Pages (push to `main`)
