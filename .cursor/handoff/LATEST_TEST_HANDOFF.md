# Latest test handoff — Revert male Korean hold TTS

**Branch:** `main`  
**Scope:** rollback `d98f6be`

## Change

**롤백:** 버텨!!! 초 카운트 **남성 한국어 TTS 강제** 제거 → 팩별 동작 복원.

- **여성·한국어:** 한자어 TTS + 여성 목소리 (rep 클립 없음)
- **남성·English:** cd/rep 클립

## Test focus

1. 여성 팩 + hold → 초 카운트가 **여성** 한국어 TTS
2. 남성 팩 + hold → English 클립

## Fast checks

```bash
cd frontend
npx vite-node src/utils/voiceHold.test.ts
npm run build --prefix frontend
```

## Deploy

- Frontend: GitHub Pages (push to `main`)
