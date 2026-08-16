# Test handoff ? My page banner / share spacing

## Summary
Add vertical gap between `MY_BOTTOM` promo banner and the Share App button on My page.

## Git
- Branch: `main`
- Commit: 70a790fb

## Test focus
1. Marketing opt-in + live banner: banner and share button are not flush (~24?40px gap).
2. No banner: share/actions block looks unchanged.

## Fast checks
```bash
rg -n "promo-banner-slot \\+ .my-page__actions" frontend/src/styles/components.css
```

## as-is �� to-be
- **as-is:** Banner and share button sit flush.
- **to-be:** Clear vertical separation when a banner is shown.
