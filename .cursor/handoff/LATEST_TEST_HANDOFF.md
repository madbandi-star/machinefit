# Latest test handoff — Revert hold-ko clips

**Branch:** `main`  
**Scope:** rollback `173ddfd` (hold-ko MP3 pack)

## Change

**롤백:** `hold-ko` 남성 MP3 클립 팩 제거 → 버텨!!! 초 카운트는 다시 **남성 한국어 TTS** (d98f6be 상태).

## Test focus

1. hold 구간에서 `/voice-coach/hold-ko/` 요청 **없음**
2. hold 초는 TTS 한자어 (십구…일)

## Fast checks

```bash
cd frontend
npx vite-node src/utils/voiceHold.test.ts
npm run build --prefix frontend
```

## Deploy

- Frontend: GitHub Pages (push to `main`)
