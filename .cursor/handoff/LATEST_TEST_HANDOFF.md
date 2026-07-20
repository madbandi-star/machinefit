# Latest test handoff — experience × goal recommend weight/reps

**Branch:** `cursor/experience-goal-recommend-weight-reps-35b3`  
**Scope:** shared + backend + frontend settings panel fallback

## Change
Recommended **weight** and **reps** now vary by `experienceLevel` × `workoutGoal`, grounded in:
- ACSM Position Stand (progression / %1RM / rep zones)
- Schoenfeld hypertrophy loading research
- NSCA novice→advanced loading guidance

### Weight
- Goal multipliers refined (strength heavier, rehab/conditioning lighter)
- New experience×goal intensity factors
- Cold-start `EXPERIENCE_WEIGHT_MULTIPLIERS` slightly retuned

### Reps
- Full matrix per experience × goal (e.g. beginner strength 5–8, intermediate 3–6, advanced 2–5)

## Deploy
- Frontend: Pages
- **Backend/shared: Render Manual Deploy required**
