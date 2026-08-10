# Test handoff — Fix JSON backup restore (JSZip central directory)

## Summary
JSON 복구 시 `Can't find end of central directory` 발생. CORS로 `Content-Disposition`이 안 보여 JSON이 `*.zip`으로 저장되고, 서버가 확장자만 보고 ZIP으로 파싱함. 매직바이트 판별 + CORS expose + FE Content-Type 폴백으로 수정.

## Git
- branch: `main`
- commit: PENDING

## Changed files
- `backend/server/backup/backup-zip.ts`
- `backend/server/app.ts`
- `backend/server/services/backup.service.ts`
- `backend/server/services/system-backup.service.ts`
- `frontend/src/api/backup.api.ts`

## Test focus
1. JSON 백업 파일 복구 성공 (파일명이 `.zip`이어도 JSON 내용이면 성공)
2. ZIP 복구는 기존처럼 성공
3. 새 JSON보내기 파일명이 `.json`으로 저장되는지 (FE+BE 배포 후)

## Fast checks
```bash
rg -n "hasZipMagic|exposedHeaders|machinefit_backup.json" backend/server/backup/backup-zip.ts backend/server/app.ts frontend/src/api/backup.api.ts
```

## as-is → to-be
- **as-is:** JSON 내용 + `.zip` 이름 → JSZip 실패
- **to-be:** PK 매직 없으면 JSON 파싱; ZIP은 매직바이트일 때만

## Note
Backend + frontend. Render + GitHub Pages both needed for full fix; BE alone unblocks restore of already-misnamed JSON files.
