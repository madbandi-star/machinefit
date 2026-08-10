# Test handoff ??Remove FitZone mock gyms from admin

## Summary
ê´€ë¦¬ì ?¬ìŠ¤???˜ì´ì§€ê°€ DBê°€ ?„ë‹ˆ??`MOCK_GYMS`(FitZone Gangnam ??ë¥???ƒ ë³´ì—¬ì£¼ë˜ ë¬¸ì œë¥??˜ì •?ˆìŠµ?ˆë‹¤. ?´ì œ `gyms` ?Œì´ë¸”ì„ ì¡°íšŒ?©ë‹ˆ?? mock/seed ?”ë???ë¹„ì› ?µë‹ˆ??

## Git
- branch: `main`
- commit: (push ??ê°±ì‹ )

## Changed files
- `backend/server/repositories/admin.repository.ts`
- `backend/server/services/admin.service.ts`
- `backend/server/controllers/admin.controller.ts`
- `backend/server/data/mock.ts`
- `backend/server/repositories/gym-directory.repository.ts`
- `database/seeds/gyms.sql`

## Test focus
1. ê´€ë¦¬ì > ?¬ìŠ¤?¥ì— FitZone / Iron Temple / PowerHouse ?†ìŒ
2. ?±ë¡???´ì˜ ?¬ìŠ¤?¥ì´ ?†ìœ¼ë©?ë¹?ëª©ë¡
3. (?ˆì„ ?? ?¸ì¦ ? ê????¤ì œ DB??ë°˜ì˜

## Fast checks
```bash
rg -n "FitZone" backend/server/data/mock.ts
rg -n "FROM gyms" backend/server/repositories/admin.repository.ts
```

## Note
**Render backend ?¬ë°°???„ìš”.**

## as-is ??to-be
- **as-is:** ?”ë? 3ê°???ƒ ?œì‹œ
- **to-be:** ?¤ë°?´í„°ë§?(?„ì¬ DB gyms=0?´ë©´ ë¹??”ë©´)
