# Test handoff ??Fix withdrawn schedule sync

## Summary
ê´€ë¦¬ì **?°ì´??ë³´ì¡´Â·?? œ**??**?ˆí‡´ ê³„ì • ?¤ì?ì¤??™ê¸°??*ê°€ DB ?€??ì¶©ëŒ(Postgres `42P08`)ë¡??¤íŒ¨?˜ë˜ ë¬¸ì œë¥??˜ì •?ˆìŠµ?ˆë‹¤. `subject_id`(varchar)?€ `user_id`(uuid)??ê°™ì? `$3`ë¥??°ì? ?Šê³  `$3::text` / `$4::uuid`ë¡?ë¶„ë¦¬?ˆìŠµ?ˆë‹¤.

## Git
- branch: `main`
- commit: (push ??ê°±ì‹ )

## Changed files
- `backend/server/repositories/data-retention.repository.ts`

## Test focus
1. ê´€ë¦¬ì > ?°ì´??ë³´ì¡´Â·?? œ > **?ˆí‡´ ê³„ì • ?¤ì?ì¤??™ê¸°??* ?´ë¦­ ???±ê³µ ? ìŠ¤??(`n`ê±?ë°˜ì˜)
2. ?”ì•½ KPI / ?? œ ?ˆì • ëª©ë¡???ˆí‡´ ê³„ì • ?¤ì?ì¤„ì´ ë³´ì´?”ì?

## Fast checks
```bash
rg -n "\$3::text,\$4::uuid" backend/server/repositories/data-retention.repository.ts
```

## Production checks
- **Render backend redeploy ?„ìš”** (backend-only ë³€ê²?
- ë°°í¬ ???™ì¼ ë²„íŠ¼?¼ë¡œ ?¬í™•??

## as-is ??to-be
- **as-is:** ë²„íŠ¼ ?´ë¦­ ??"ì²˜ë¦¬?˜ì? ëª»í–ˆ?´ìš”?? ?¼ë°˜ ?¤ë¥˜
- **to-be:** ?™ê¸°???±ê³µ + upsert ê±´ìˆ˜ ? ìŠ¤??
