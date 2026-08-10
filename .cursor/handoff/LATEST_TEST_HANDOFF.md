# Test handoff ??Hide photo board for member

## Summary
`member` ?±ê¸‰?ì„œ???¬ì§„ê²Œì‹œ??ë©”ë‰´/ì§„ì… ?¨ê?. `premium_member` ?´ìƒë§??‘ê·¼.

## Git
- branch: `main`
- commit: 126ce803

## Changed files
- `frontend/src/pages/my-page/MyPage.tsx`
- `frontend/src/pages/community/CommunityPage.tsx`
- `frontend/src/routes/index.tsx`
- `backend/server/routes/photo-board.routes.ts`

## Test focus
1. member ??ë§ˆì´?˜ì´ì§€/ì»¤ë??ˆí‹°???¬ì§„ê²Œì‹œ???†ìŒ
2. memberê°€ `/community/photo` ì§ì ‘ ì§„ì… ???ˆìœ¼ë¡?
3. premium_member+ ???•ìƒ ?´ìš©
4. ê´€ë¦¬ì ?¬ì§„ê²Œì‹œ??ëª¨ë”?ˆì´??? ì?

## Fast checks
```bash
rg -n "PHOTO_BOARD|PREMIUM_MEMBER|showAboveMember|showPhotoBoard" frontend/src/pages/my-page/MyPage.tsx frontend/src/pages/community/CommunityPage.tsx frontend/src/routes/index.tsx backend/server/routes/photo-board.routes.ts
```

## as-is ??to-be
- **as-is:** member???¬ì§„ê²Œì‹œ???¸ì¶œ
- **to-be:** member ?¨ê?/ì°¨ë‹¨, premium+ë§?
