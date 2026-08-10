# Test handoff ??Fix JSON backup restore (JSZip central directory)

## Summary
JSON ë³µêµ¬ ??`Can't find end of central directory` ë°œìƒ. CORSë¡?`Content-Disposition`????ë³´ì—¬ JSON??`*.zip`?¼ë¡œ ?€?¥ë˜ê³? ?œë²„ê°€ ?•ì¥?ë§Œ ë³´ê³  ZIP?¼ë¡œ ?Œì‹±?? ë§¤ì§ë°”ì´???ë³„ + CORS expose + FE Content-Type ?´ë°±?¼ë¡œ ?˜ì •.

## Git
- branch: `main`
- commit: `39dbffcc`

## Changed files
- `backend/server/backup/backup-zip.ts`
- `backend/server/app.ts`
- `backend/server/services/backup.service.ts`
- `backend/server/services/system-backup.service.ts`
- `frontend/src/api/backup.api.ts`

## Test focus
1. JSON ë°±ì—… ?Œì¼ ë³µêµ¬ ?±ê³µ (?Œì¼ëª…ì´ `.zip`?´ì–´??JSON ?´ìš©?´ë©´ ?±ê³µ)
2. ZIP ë³µêµ¬??ê¸°ì¡´ì²˜ëŸ¼ ?±ê³µ
3. ??JSONë³´ë‚´ê¸??Œì¼ëª…ì´ `.json`?¼ë¡œ ?€?¥ë˜?”ì? (FE+BE ë°°í¬ ??

## Fast checks
```bash
rg -n "hasZipMagic|exposedHeaders|machinefit_backup.json" backend/server/backup/backup-zip.ts backend/server/app.ts frontend/src/api/backup.api.ts
```

## as-is ??to-be
- **as-is:** JSON ?´ìš© + `.zip` ?´ë¦„ ??JSZip ?¤íŒ¨
- **to-be:** PK ë§¤ì§ ?†ìœ¼ë©?JSON ?Œì‹±; ZIP?€ ë§¤ì§ë°”ì´?¸ì¼ ?Œë§Œ

## Note
Backend + frontend. Render + GitHub Pages both needed for full fix; BE alone unblocks restore of already-misnamed JSON files.
