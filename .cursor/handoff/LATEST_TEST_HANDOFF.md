# Test handoff ??Remove ops monitoring from My Page

## Summary
ë§ˆì´?˜ì´ì§€ **ê´€ë¦¬ì ?„êµ¬**?ì„œ **?´ì˜ ëª¨ë‹ˆ?°ë§** ë©”ë‰´ë¥??œê±°?ˆìŠµ?ˆë‹¤. `/admin/ops` ?¼ìš°?¸Â·ê?ë¦¬ì ?€?œë³´???¬ì´?œë°” ì§„ì…?€ ê·¸ë?ë¡œì…?ˆë‹¤.

## Git
- branch: `main`
- commit: (push ??ê°±ì‹ )

## Changed files
- `frontend/src/pages/my-page/MyPage.tsx`
- `frontend/src/i18n/locales/{ko,en,ja,zh}/common.json` (`opsMonitoring` ???œê±°)

## Test focus
1. admin ë§ˆì´?˜ì´ì§€ ??ê´€ë¦¬ì ?„êµ¬???´ì˜ ëª¨ë‹ˆ?°ë§ ?†ìŒ
2. ê´€ë¦¬ì ?€?œë³´?œë§Œ ?œì‹œ
3. ê´€ë¦¬ì ?€?œë³´???¬ì´?œë°”?ì„œ ?´ì˜ ëª¨ë‹ˆ?°ë§ ?‘ê·¼ ê°€??

## Fast checks
```bash
rg -n "opsMonitoring|ADMIN_OPS" frontend/src/pages/my-page/MyPage.tsx
```
(ë§¤ì¹˜ ?†ì–´????

## as-is ??to-be
- **as-is:** ë§ˆì´?˜ì´ì§€???´ì˜ ëª¨ë‹ˆ?°ë§ + ?€?œë³´??
- **to-be:** ?€?œë³´?œë§Œ
