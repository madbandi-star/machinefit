# Latest test handoff — Hold seconds male Korean TTS

**Branch:** `main`  
**Scope:** frontend (voice hold countdown)

## Change

**버텨!!! 시간** 초 카운트를 목소리 팩과 무관하게 **남성 · 한국어 TTS** + 한자어 숫자(십구…일)로 고정.

- Hold 큐(버텨!!!) / 완료 멘트 → 기존처럼 선택 팩
- Hold 초 카운트만 항상 남성 한국어

## Test focus

1. 여성·한국어 팩 + 버텨 10초 → 횟수는 여성, hold 초는 남성 한국어 `십`, `구`…
2. 남성·English 팩 + hold → 초 카운트가 English five/four가 **아닌** `십`, `구`…

## Fast checks

```bash
cd frontend
npx vite-node src/utils/voiceHold.test.ts
npx vite-node src/utils/speechManager.hold.test.ts
npm run build --prefix frontend
```

## Deploy

- Frontend: GitHub Pages (push to `main`)
- Backend: 변경 없음
