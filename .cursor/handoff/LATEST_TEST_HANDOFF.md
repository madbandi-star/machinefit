# Latest test handoff — My Page menu deploy batch

**Branch:** `main`

## Changes in this deploy

1. **MachineFit Insights** — 순서·이름: 운동성향 → 누적무게 → 업적
2. **친구 목록** — 친구 관리 → **개인설정** (회원)
3. *(already local)* Lab 실험실 서브메뉴 이동, Insights 라벨 (`ad12145`)

## Test focus

- `/machinefit/my-page` Insights 라벨·순서
- 개인설정에 친구 목록, 친구 관리에는 없음
- 실험실 섹션 항목 정상

## Fast checks

```bash
npm run build --prefix frontend
```

## Deploy

- Frontend: GitHub Pages (push to `main`)
