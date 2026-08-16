# Search brand chips text-only

## Summary
Search brand filter chips no longer show circular OEM logos (Hammer Strength, Life Fitness, Cybex, Technogym). Text-only like Atlantis. Bodyweight/free-weight glyphs kept.

## Git
- branch: `main`
- commit: `PENDING`

## Test focus
1. Search brand row: HS/LF/Cybex/Technogym = text only (no round image)
2. Atlantis unchanged; ¸Ç¸ö/ÇÁ¸® still have glyph

## Fast checks
```bash
rg -n "resolveBrandLogoUrl|filter-chip__brand-logo" frontend/src/components/machines/BrandFilterChips/BrandFilterChips.tsx
```

## as-is ¡æ to-be
- **as-is:** Circular brand logos on OEM chips
- **to-be:** Text-only OEM chips (Atlantis style)
