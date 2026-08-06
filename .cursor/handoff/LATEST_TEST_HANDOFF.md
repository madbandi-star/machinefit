# Test handoff: Rest/count compact + persistent rest + media mini

## Summary
- Rest timer is global (survives route/API navigation); full→compact button; auto-compact on route change
- Voice count fullscreen has compact (소형모드) button
- Voice coach detail pickers: pin checkbox (sticky)
- Music/video players: minimize to compact / expand back

## Git
- Branch: `main`
- Commit: pending

## Changed files (key)
- `frontend/src/store/restTimer.store.ts`
- `frontend/src/components/recommendation/GlobalRestTimerHost/GlobalRestTimerHost.tsx`
- `frontend/src/components/recommendation/RestTimerBanner/RestTimerBanner.tsx`
- `frontend/src/components/recommendation/WorkoutDisplayOverlay/WorkoutDisplayOverlay.tsx`
- `frontend/src/components/recommendation/WorkoutLogPanel/WorkoutLogPanel.tsx`
- `frontend/src/components/home/HomeWorkoutToolsSection/HomeWorkoutToolsSection.tsx`
- `frontend/src/components/recommendation/VoiceCoachPanel/VoiceCoachPanel.tsx`
- `frontend/src/components/motivation/MotivationMediaControls/*`
- `frontend/src/layouts/MainLayout.tsx`

## Test focus
1. Start rest → navigate away → timer still runs (banner)
2. Rest fullscreen → 소형모드 → banner; expand back
3. Count fullscreen → 소형모드 → panel live count
4. Voice coach: 세부 피커 고정 checkbox sticks pickers while scrolling
5. Music/video: minimize ↔ expand without stopping playback

## Fast checks
```bash
rg -n "useRestTimerStore|GlobalRestTimerHost|mf-music-mini|pinPickers" frontend/src
```

## as-is → to-be
| as-is | to-be |
|-------|--------|
| Rest dies on navigation | Global endsAt store + layout host |
| No shrink on full rest/count | Minimize to compact |
| No pin on pickers | Pin checkbox |
| Music/video full only | Compact mini modes |
