# Test handoff ??Clear machine-request mock seeds

## Summary
ê´€ë¦¬ì ê¸°êµ¬?”ì²­??mock ?œë“œ(`req-1` Hammer Strength Pullover, `req-2` Cybex VR3)?€ ?¬í‘œ ?”ë?ë¥??œê±°?ˆìŠµ?ˆë‹¤. ?€?œë³´??`pendingRequests`??DB `machine_requests` pending ì¹´ìš´?¸ë? ?¬ìš©?©ë‹ˆ??

## Git
- branch: `main`
- commit: (push ??ê°±ì‹ )

## Changed files
- `backend/server/data/community.mock.ts`
- `backend/server/repositories/admin.repository.ts`

## Test focus
1. ê´€ë¦¬ì ê¸°êµ¬?”ì²­???˜í”Œ 2ê±?Downtown Fitness ?? ?†ìŒ
2. ?¤ì‚¬?©ì ?”ì²­ë§?ë³´ì´ê±°ë‚˜ ë¹?ëª©ë¡
3. ?€?œë³´???€ê¸??”ì²­ ??= DB pending

## Fast checks
```bash
rg -n "req-1|Pullover Machine|Downtown Fitness" backend/server/data/community.mock.ts
# no matches
rg -n "FROM machine_requests" backend/server/repositories/admin.repository.ts
```

## Note
**Render backend ?¬ë°°???„ìš”.**

## as-is ??to-be
- **as-is:** mock 2ê±?+ ?€?œë³´??mock ì¹´ìš´??
- **to-be:** mock ë¹„ì? + ?€?œë³´??DB ì¹´ìš´??
