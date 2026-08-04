# Test handoff: Expand body-metrics on recommend ? Settings redirect

## Summary
When **????** redirects for incomplete profile (gender / height / weight), navigation targets `/settings#body-metrics` so the **????** section opens and scrolls into view.

## Git
- Branch: `main`
- Commit: pending

## Changed files
- `frontend/src/hooks/useRecommendMachine.ts`
- `frontend/src/components/settings/SettingsCollapsibleSection/SettingsCollapsibleSection.tsx`
- `frontend/src/pages/settings/SettingsPage.tsx`

## Test focus
1. Leave gender unset (or height/weight incomplete).
2. Search/machine detail ? **????**.
3. Lands on Settings with **????** expanded (gender / goal / metrics visible).

## Fast checks
```bash
rg -n "hash: 'body-metrics'|hashTargetsSection|#body-metrics" frontend/src/hooks/useRecommendMachine.ts frontend/src/components/settings/SettingsCollapsibleSection/SettingsCollapsibleSection.tsx frontend/src/pages/settings/SettingsPage.tsx
npm run test:smoke:changed
```

## as-is ? to-be
| as-is | to-be |
|-------|--------|
| `/settings` with sections collapsed | `/settings#body-metrics` expanded + scrolled |
