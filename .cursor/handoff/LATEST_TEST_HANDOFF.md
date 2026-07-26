# Latest test handoff — Hold seconds male Korean clips

**Branch:** `main`  
**Scope:** frontend + hold-ko MP3 assets

## Change

버텨!!! **초 카운트**가 OS TTS(여성 목소리) 대신 **남성 한국어 MP3 클립** 재생.

- 새 팩: `public/voice-coach/hold-ko/` (구 male 한국어 cd/rep 클립)
- 1–10초: `cd-*`, 11–30초: `rep-*`, 31+ TTS 남성 한국어 fallback
- 큐(버텨!!!)/완료 멘트는 기존 팩 유지

## Test focus

1. 여성·한국어 + 버텨 10초 → hold 초가 **남성** 목소리 (십, 구, …)
2. DevTools Network: `/voice-coach/hold-ko/cd-10.mp3` 등 fetch 확인
3. 여성 TTS로 읽히면 실패

## Fast checks

```bash
cd frontend
npx vite-node src/utils/voiceHold.test.ts
npx vite-node src/utils/voiceCoachClips.test.ts
npm run build --prefix frontend
```

## Deploy

- Frontend: GitHub Pages (push to `main`)
- Backend: 변경 없음
