# Test handoff: Single-line home notice banner

## Summary
Home ?? ?? banner is one horizontal line (icon · label · title · more). UI/CSS only.

## Git
- Branch: `main`
- Commit: pending

## Test focus
1. Home notice is single-line height
2. Long title ellipsizes; ??? / title links work
3. Important notice still distinct

## Fast checks
```bash
rg -n "home-notice-banner__line|home-notice-banner__copy" frontend/src
```

## As-is ? To-be
- **As-is**: Two-line label+title with large icon
- **To-be**: One compact row
