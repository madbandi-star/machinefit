# Test handoff: Fix motivation audio playback

## Summary
??? ??? API ???(`/api/v1/media/motivation-audio/...`)? ??. ?? URL? ?? Supabase ?? ?? ???? ???. ???? `canplay` ? `play()`.

## Git
- Branch: `main`
- Commit: pending

## Changed files
- `backend/server/services/storage.service.ts`
- `backend/server/services/user-motivation-track.service.ts`
- `backend/server/controllers/motivation-audio-media.controller.ts`
- `backend/server/app.ts`
- `frontend/src/utils/motivationAudio.ts`
- `frontend/src/components/motivation/MotivationMediaControls/MotivationMediaControls.tsx`
- `frontend/src/pages/motivation-music/MotivationMusicPage.tsx`

## Test focus
1. **Render API ??? ??**
2. Pages Ctrl+F5 ? ?? ???? ??? ? ??
3. `???? ????` ???? ?? ??? ?

## Fast checks
```bash
rg -n "readMotivationAudio|motivationAudioPublicUrl|playHtmlAudio|serveMotivationAudio" backend/server frontend/src
```

## as-is ? to-be
| as-is | to-be |
|-------|--------|
| Supabase public URL 403 / ?? play() | API ??? + canplay ? ?? |
