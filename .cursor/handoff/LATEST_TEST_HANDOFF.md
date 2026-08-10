# Test handoff ??Admin data retention UI polish

## Summary
?°ì´??ë³´ì¡´Â·?? œ ê´€ë¦?4?”ë©´ UI ?•ë¦¬: KPI/ì¹?êµ¬ì¡°?????ì„¸ ?¨ë„, ?„ìš© CSS.

## Git
- branch: `main`
- commit: `cce46fa5`

## Changed files
- `frontend/src/pages/admin/data-retention/*.tsx` (4)
- `frontend/src/styles/admin-data-retention.css`
- `frontend/src/i18n/locales/{ko,en,ja,zh}/admin.json`

## Test focus
1. ?•ì±… ëª©ë¡ ? íƒ ???ì„¸/ê¸°ê°„ ë³€ê²?
2. ?? œ ?ˆì • ë³´ë¥˜ (ëª¨ë°”???¬í•¨)
3. ?´ë ¥Â·ê°ì‚¬ ë¡œê·¸ ?œì‹œ

## Fast checks
```bash
rg -n "admin-retention|AdminPanel" frontend/src/pages/admin/data-retention frontend/src/styles/admin-data-retention.css
```

## as-is ??to-be
- **as-is:** ì¡°ë????Œì´ë¸?+ ?ë¬¸ ON/OFF
- **to-be:** ì¹´ë“œ/??+ ë±ƒì? + ? íƒ ?ì„¸ ?¨ë„

## Note
FE only ??Pages deploy.
