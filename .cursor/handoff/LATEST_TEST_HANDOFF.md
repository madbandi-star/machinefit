# Test handoff: Admin top nav 2-row + scrollbar

## Summary
Admin shell top menu is now a **2-row** grid that scrolls horizontally, with a **visible** thin scrollbar (was one long row with scrollbar hidden).

## Git
- Branch: `main`
- Commit: pending

## Changed files
- `frontend/src/styles/admin.css`

## Test focus
1. Open any admin page (`/admin`).
2. Top nav shows links in **two rows**.
3. Horizontal scrollbar is visible when content overflows.
4. Active menu item still highlights.

## Fast checks
```bash
rg -n "grid-template-rows: repeat\(2" frontend/src/styles/admin.css
npm run test:smoke:changed
```

## as-is ? to-be
| as-is | to-be |
|-------|--------|
| 1? + ???? ?? | 2? + ????? ?? |
