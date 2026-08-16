# Chevron carousel nav on horizontal scrolls

## Summary
Added reusable `ScrollCarousel` chevron buttons for home recent/favorites, search muscle/brand chips, plus overflow-prone admin chip rows and a few user extras.

## Git
- branch: `main`
- commit: `a9a54a2a`

## Test focus
1. Home recent/favorites ? chevrons when overflow; click scrolls
2. Search muscle/brand chips ? same
3. Admin ops tabs / long chip rows ? chevrons when overflow; hidden when not

## Fast checks
```bash
rg -n "ScrollCarousel|scroll-carousel|chevronLeft" frontend/src/components frontend/src/pages/admin frontend/src/styles/scroll-carousel.css
```

## as-is �� to-be
- **as-is:** Horizontal rows only swipe/scrollbar
- **to-be:** Chevron prev/next when content overflows
