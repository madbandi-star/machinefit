# Admin dense lists + search

## Summary
Admin glance pages densified (smaller buttons/KPIs/rows) so mobile can show ~15+ list items. Search added/improved on users, moderation, backup history, and retention scheduled.

## Git
- branch: `main`
- commit: `a7780ffd`

## Test focus
1. Admin Users on ~390px width: ??15 collapsed rows visible in the list area
2. Search works on Users / Moderation / Backup history / Retention scheduled
3. Q&A + Fortune queues still usable with compact action buttons

## Fast checks
```bash
rg -n "ag-queue|min-height: 1\.85rem|gap: 0\.15rem" frontend/src/styles/admin-glance.css
rg -n "usersSearchPlaceholder|moderationSearchPlaceholder|scheduledSearchPlaceholder" frontend/src/pages/admin frontend/src/i18n/locales/ko/admin.json
npm run test:smoke:changed
```

## as-is ?? to-be
- **as-is:** Large buttons, sparse rows (~3 users on mobile), missing search on several admin queues
- **to-be:** Dense glance rows + compact `btn--sm`; search on users/moderation/backup/retention scheduled; mobile subtitle hidden to reclaim viewport
