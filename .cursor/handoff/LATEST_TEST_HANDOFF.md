# Latest test handoff — Female hold Sino-Korean countdown

**Branch:** `main`  
**Scope:** frontend (voice coach hold)

## Change

여성·한국어 팩 **버텨!!! 시간** 초 카운트를 한자어 숫자로 읽도록 수정.

- **Before:** `rep-*` 클립 → 열 아홉, 여덟…둘, 하나
- **After:** TTS 한자어 → 십구, 십팔…삼, 이, 일
- 운동 **횟수** 카운트(`rep-*`)는 기존 순우리말 유지

## Test focus

1. 설정 > 음성 카운트: 여성·한국어 + 버텨 시간 19초(또는 12초 등)
2. 카운트 시작 → hold 구간에서 **십구, 십팔, 십칠…** 확인
3. 횟수 구간은 여전히 **하나, 둘, 셋…** (변경 없음)

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
