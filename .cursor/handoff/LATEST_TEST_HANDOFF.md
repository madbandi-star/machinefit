# Test handoff ??Fix backup restore `user_gym_id` error

## Summary
?°ì´?°ê?ë¦?ë³µêµ¬ ??`column gm.user_gym_id does not exist` ?˜ì •. `gym_members.gym_id`ë¡?ì¡°ì¸.

## Git
- branch: `main`
- commit: 7a86bc5d

## Changed files
- `backend/server/services/backup.service.ts`

## Test focus
1. ?ë©”?´íŠ¸4885 (member) ??ë§ˆì´?˜ì´ì§€ ?°ì´?°ê?ë¦?ë³µêµ¬ ?±ê³µ
2. ?€ ?¬ìš©???¤ì½”???°ì´?°ëŠ” ê±´ë„ˆ?€ ? ì?

## Fast checks
```bash
rg -n "gm.gym_id|user_gym_id|scopeOwned" backend/server/services/backup.service.ts
```

## as-is ??to-be
- **as-is:** ?˜ëª»??ì»¬ëŸ¼ `gm.user_gym_id`ë¡?ë³µêµ¬ ?¤íŒ¨
- **to-be:** `gm.gym_id` + owner ê²€ì¦ìœ¼ë¡?ë³µêµ¬ ê°€??

## Note
Render ë°±ì—”???¬ë°°???„ìš”.
