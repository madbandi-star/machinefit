# Test handoff ??Hide data management for member

## Summary
member ?±ê¸‰ ë§ˆì´?˜ì´ì§€?ì„œ ?°ì´??ê´€ë¦?ë©”ë‰´ ?¨ê?. `/settings/data` ?¼ìš°?¸ì? `/backup/*` API??`PREMIUM_MEMBER` ?´ìƒë§?

## Git
- branch: `main`
- commit: `bc0eca48`

## Changed files
- `frontend/src/pages/my-page/MyPage.tsx`
- `frontend/src/routes/index.tsx`
- `backend/server/routes/backup.routes.ts`

## Test focus
1. member: ê°œì¸ ?¤ì •???°ì´??ê´€ë¦??†ìŒ
2. member: `/settings/data` ì§ì ‘ ?‘ê·¼ ì°¨ë‹¨
3. premium_member+: ë©”ë‰´Â·ë°±ì—… ?•ìƒ

## Fast checks
```bash
rg -n "DATA_MANAGEMENT|showAboveMember|PREMIUM_MEMBER" frontend/src/pages/my-page/MyPage.tsx frontend/src/routes/index.tsx backend/server/routes/backup.routes.ts
```

## as-is ??to-be
- **as-is:** member???°ì´??ê´€ë¦??¸ì¶œ
- **to-be:** member ?¨ê? + ?¼ìš°??API ê°€??

## Note
FE + BE ë°°í¬ ?„ìš”.
