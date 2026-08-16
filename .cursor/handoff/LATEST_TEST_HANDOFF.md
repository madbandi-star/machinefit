# Glanceable admin Q&A management UX

## Summary
Admin Q&A list redesigned for glanceability: KPI publish/review filters, category chips, expandable dense rows, and top-viewed side panel instead of a wide table.

## Git
- branch: `main`
- commit: `935b9f8c`

## Test focus
1. `/admin/qa` KPI strip filters all / published / hidden / needs-review
2. Category chips + search still filter the list
3. Dense expandable rows: publish toggle, edit, delete
4. Top-viewed side panel shows popular articles

## Fast checks
```bash
rg -n "admin-qa|PublishFilter|expandedId|topViewed" frontend/src/pages/admin/qa/AdminQaPage.tsx frontend/src/styles/admin-qa.css
```

## Production checks
- After Deploy Frontend success: open admin Q&A and confirm glanceable layout

## as-is ¡æ to-be
- **as-is:** Wide table hard to scan for publish state and review needs
- **to-be:** KPI + chips + dense expandable rows + top-viewed panel
