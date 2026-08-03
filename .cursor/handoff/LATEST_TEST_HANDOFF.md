# Latest test handoff - Remove Easy onboarding page

**Branch:** `main` | **Commit:** `780c75f`

## Change

Removed Easy Mode first-visit onboarding (`EASY MODEë¡??œìž‘?´ìš”`). Header EASY and `/easy` always show the regular Easy home. Old `/easy/onboarding` redirects to `/easy`.

## Test focus

- First open of Easy ??Easy home (start workout), not welcome page
- `/easy/onboarding` ??`/easy`

## Fast checks

```bash
npm run test:smoke:changed
```

## Deploy

- Frontend only

## as-is -> to-be

- **as-is:** First visit showed onboarding
- **to-be:** Always regular Easy home
