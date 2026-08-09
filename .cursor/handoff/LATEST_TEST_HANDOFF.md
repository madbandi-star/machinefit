# Test handoff ? Incomplete [??] nudge animation

## Summary
???? ?????? **???** `[??]`? ???? ??. ???? ??? ?? 1?? pulse, ??? ??? ????? ??.

## Git
- branch: `main`
- commit: 728c2e0c

## Changed files
- `frontend/src/components/recommendation/WorkoutLogPanel/WorkoutLogPanel.tsx`
- `frontend/src/styles/recommendation.css`
- `frontend/src/i18n/locales/{ko,en,ja,zh}/machines.json`

## Test focus
1. Records ? expand card ? next incomplete `[??]` soft pulse
2. Complete a set ? pulse moves to next unfinished set
3. All complete ? no pulse
4. Hover/focus pauses animation; `prefers-reduced-motion` ? static highlight

## Fast checks
```bash
rg -n "complete-btn--nudge|workout-complete-nudge|nextIncompleteSetIndex" frontend/src/components/recommendation/WorkoutLogPanel/WorkoutLogPanel.tsx frontend/src/styles/recommendation.css
```

## as-is ? to-be
- **as-is:** Incomplete complete buttons had no affordance animation
- **to-be:** Soft primary breathe on next incomplete only
