# Glanceable admin Helchang Fortune UX

## Summary
Fortune catalog admin redesigned: KPI active filters, category chips with counts, dense expandable rows with quick activate, and a side editor instead of a permanent top form.

## Git
- branch: `main`
- commit: `a0e4b89f`

## Test focus
1. `/admin/fortune` KPI strip filters all / active / inactive
2. Category chips + search filter the dense list
3. Expand row ?? edit opens side panel; activate/deactivate works
4. Create opens side editor without burying the list

## Fast checks
```bash
rg -n "aft-kpis|ActiveFilter|openCreate|toggleActiveMutation" frontend/src/pages/admin/fortune/AdminFortunePage.tsx frontend/src/styles/admin-fortune.css
```

## Production checks
- After Deploy Frontend success: open admin Helchang Fortune and confirm glanceable layout

## as-is ?? to-be
- **as-is:** Tall form always on top + bulky list cards hard to scan
- **to-be:** KPI + chips + dense rows + on-demand side editor
