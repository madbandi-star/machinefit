# Test handoff: Records day-actions bottom sheet

## Summary
Replaced the cramped ⋯ dropdown (template save / delete day / apply template) with a bottom sheet: date header, icon rows with hints, inline template name form (no prompt), template chips, danger delete.

## Git
- Branch: `main`
- Commit: `a5d14d0f`

## Test focus
1. Records → date row ⋯ → bottom sheet opens
2. Save template → name field in sheet (not browser prompt)
3. Apply template / delete day still work; confirm dialog for delete

## as-is → to-be
| as-is | to-be |
|-------|--------|
| Tiny dropdown + emoji + prompt | Bottom sheet with clear actions |

