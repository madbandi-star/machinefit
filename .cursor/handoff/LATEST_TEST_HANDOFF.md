# Latest test handoff — UI/UX bugs batch

**Branch:** `cursor/fix-uiux-bugs-batch-35b3`  
**Scope:** Frontend-only UI/UX fixes (#1–#26). No backend/shared/migration changes.

## Fixed (sequential verify)

1. Login return keeps `search`/`hash`
2. Recommend form shows error + retry (no stuck skeleton)
3. History/set complete touch targets ~44px (`2.75rem`)
4. History summary KPIs from real logs (no 3870kg/48min dummies)
5. FW machine detail bottom padding for sticky CTA
6. WeightStepper respects `unitWeight` (kg/lb)
7. History cards default collapsed; VoiceCoach only when focused
8. Result sticky header under app header (`top: var(--header-height)`)
9. Modals: scroll lock, Esc, focus trap (`useModalAccessibility`)
10. Unchecking set complete clears rest timer
11. Search filters synced to URL (`q`/`muscle`/`brand`/`scope`)
12. FW history without muscle unlocks picker (`lockTargetMuscle` only when muscle set)
13. Bookmark save/update only (no remove); remove via cancel/delete
14. Toast 3s + raised above sticky CTA
15. FW muscle chip clears on retap
16. Set-complete autosave silent (no toast spam)
17. Light-theme history card tokens
18. NumericStepper readonly (no fake tap) when manual input off
19. AuthGuard hydrate skeleton
20. QueryErrorMessage optional retry
21. Confirm danger: no backdrop dismiss
22. Settings units draft until Save
23. Growth empty CTA → machine search
24. History `focus=` always cleared
25. Machine detail honors `?logDate=` (+ workout log panel)
26. Voice coach enable disabled while running

## Deploy

- Frontend: merge → GitHub Pages
- Backend: no Render redeploy needed for this batch
