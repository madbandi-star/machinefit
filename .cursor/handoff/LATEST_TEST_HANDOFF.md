# Fix i18n audit blocking Pages deploy

## Summary
Synced missing ja/zh locale keys so frontend build (`i18n-audit`) and GitHub Pages deploy succeed after admin densify.

## Git
- branch: `main`
- commit: `PENDING`

## Test focus
1. `node scripts/i18n-audit.mjs` ¡æ OK
2. Deploy Frontend workflow on `main` ¡æ success

## Fast checks
```bash
node scripts/i18n-audit.mjs
```

## as-is ¡æ to-be
- **as-is:** Pages deploy failed (missing ja/zh i18n keys)
- **to-be:** Audit clean; Pages deploy succeeds
