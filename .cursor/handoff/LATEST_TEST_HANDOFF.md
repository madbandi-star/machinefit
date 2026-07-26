# Latest test handoff — Full-screen workout display

**Branch:** `main`  
**Scope:** frontend

## Change

- **휴식 타이머 + 카운트** → 전체 화면 오버레이 (설정 ON 시)
- **좌측 상단** — MachineFit 로고 + 서비스명
- **설정** — 마이페이지 > 설정 > 휴식 시간 > **운동 중 전체 화면 표시** (기본 ON)

## Test focus

1. Settings toggle ON → 세트 완료 후 전체 화면 휴식 `M:SS`
2. **카운트 시작** → 전체 화면 카운트 숫자 + 중지
3. Toggle OFF → 기존 인라인 배너/패널만
4. 추천 페이지에서도 동일

## Fast checks

```bash
npm run build --prefix frontend
```

## Deploy

- Frontend: GitHub Pages (push to `main`)
- Backend: not needed
