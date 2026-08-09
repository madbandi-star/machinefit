# Test handoff: Home notice UI polish

## Summary
Removed ??? from home latest-notice. Restyled as one clean tappable row (badge + title + chevron). UI/CSS only.

## Git
- Branch: `main`
- Commit: pending

## Test focus
1. No ??? on home notice
2. Whole banner opens notice detail
3. Compact single-line UI; important styling still clear

## Fast checks
```bash
rg -n "home-notice-banner__more|notices.more" frontend/src/components/home/HomeNoticeBanner
```

## As-is ? To-be
- **As-is**: Cluttered pill + ???
- **To-be**: Clean glass row, no more link
