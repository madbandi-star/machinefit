# Test handoff: Fix plan date picker display

## Summary
Date picker no longer shows raw `2026-08-06()` (ISO + empty weekday parens). Shows locale label e.g. `2026년 8월 6일 (목)`; native date input is visually hidden and opened via “달력에서 고르기”.

## Git
- Branch: `main`
- Commit: `52164126`

## Test focus
1. Move/copy date modal preview is readable Korean (or locale), no empty `()`
2. Tap preview / “달력에서 고르기” opens system calendar
3. Today/Tomorrow still work

## as-is → to-be
| as-is | to-be |
|-------|--------|
| `2026-08-06()` in field | `2026년 8월 6일 (목)` + calendar affordance |

