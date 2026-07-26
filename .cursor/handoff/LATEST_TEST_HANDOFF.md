# Latest test handoff — records save includes 조정값

**Branch:** `main`  
**Scope:** frontend

## Change

Records card **저장하기** (and bookmark save) now also saves **조정값** when:

- 셋팅값 조정 UI is editable (`canSavePreferences`)
- User has unsaved adjustment edits (`settingsDirty`)

Order: 조정값 API → workout log upsert. Standalone **조정값 저장** button unchanged.

## Test focus

1. Adjust weight/reps → 저장하기 → both prefs + log saved; compare panel read-only after
2. Save with no adjustment edits → workout log only
3. 조정값 저장 button alone still works
4. Pref save error → workout log not saved

## Fast checks

```bash
npm run build --prefix frontend
```

## Deploy

- Frontend: GitHub Pages (push to `main`)
- Backend: not needed
