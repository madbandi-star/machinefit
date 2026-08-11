# Backup & Restore System

Operational backup/restore for MachineFit members and admins.

## 1. DB Migration SQL

- `database/migrations/101_backup_system.sql`
  - `backup_logs` — USER/SYSTEM × BACKUP/RESTORE audit + progress
  - `backup_settings` — singleton auto-backup hour (UTC) + retention (7/30/90)

Apply:

```bash
npm run db:migrate
npm run db:verify
```

Create private Supabase Storage bucket `backup` (auto-created when service role is configured) with folders:

- `user/<userId>/<jobId>/…`
- `system/<jobId>/…`

## 2. API 목록

Base path: `/api/v1`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/backup/export` | Member+ | User backup download (ZIP/JSON). Body: `{ format?, clientSettings? }` |
| POST | `/backup/import` | Member+ | User restore (`multipart`: `file`, `mode=merge\|replace`) |
| GET | `/backup/history` | Member+ | Own backup/restore history |
| GET | `/backup/jobs/:jobId` | Member+ | Progress (`0–100`) |
| GET | `/backup/download/:jobId` | Member+ | Re-download own backup file |
| POST | `/admin/system-backup` | Admin | Full logical system backup |
| POST | `/admin/system-restore` | Admin | System restore (`file` + `confirmText=YES`) |
| GET | `/admin/system-backup/history` | Admin | System history |
| GET | `/admin/system-backup/download/:jobId` | Admin | Download system backup |
| GET/PUT | `/admin/backup-settings` | Admin | Auto-backup schedule / retention |

## 3. Frontend 변경 파일

- `frontend/src/api/backup.api.ts`
- `frontend/src/pages/settings/DataManagementPage.tsx`
- `frontend/src/pages/admin/backup/AdminBackupPage.tsx`
- `frontend/src/routes/index.tsx`
- `frontend/src/constants/routes.ts`
- `frontend/src/layouts/AdminLayout.tsx`
- `frontend/src/pages/my-page/MyPage.tsx`
- `frontend/src/i18n/locales/{ko,en}/common.json`
- `frontend/src/i18n/locales/{ko,en}/admin.json`
- `frontend/src/styles/components.css`

UI entry:

- My Page → 데이터 관리 → `/settings/data`
- Admin → 백업 → `/admin/backup`

## 4. Backend 변경 파일

- `backend/server/routes/backup.routes.ts`
- `backend/server/routes/admin.routes.ts` (system endpoints)
- `backend/server/routes/index.ts`
- `backend/server/controllers/backup.controller.ts`
- `backend/server/services/backup.service.ts`
- `backend/server/services/system-backup.service.ts`
- `backend/server/repositories/backup.repository.ts`
- `backend/server/backup/backup-zip.ts`
- `backend/server/backup/providers/*`
- `backend/server/jobs/system-backup.job.ts`
- `backend/server/index.ts`
- `backend/server/config/env.ts` (`BACKUP_STORAGE_BUCKET`)
- `backend/server/middlewares/upload.middleware.ts`
- `shared/src/constants/backup.ts`
- `shared/src/types/backup.types.ts`
- `shared/src/validators/backup.schema.ts`

## 5. 백업 파일 구조

ZIP (`machinefit_backup_YYYYMMDD_HHMMSS.zip`):

```
manifest.json      # type, backup_version, checksum_sha256
backup.json        # payload
```

JSON-only export is also supported (same payload without ZIP wrapper).

## 6. JSON Schema (요약)

User payload (`type: "USER"`):

```json
{
  "backup_version": 1,
  "type": "USER",
  "exported_at": "ISO-8601",
  "app_version": "0.1.0",
  "user": { "id": "uuid", "premium": { "roleCode": "…", "isPremium": false } },
  "client_settings": { "restDurationSeconds": 90 },
  "workout_logs": [],
  "favorites": [],
  "recent_history": [],
  "user_machine_preferences": [],
  "recommendation_feedback": []
}
```

Validated by `userBackupPayloadSchema` / `systemBackupPayloadSchema` in `@machinefit/shared`.

## 7. 보안 적용 내용

- Users can only export/import/download **their own** rows (`user_id` scoped).
- Restore only writes into gym/member scopes the user still owns.
- Never includes: `password_hash`, refresh tokens, OAuth tokens, payment history, admin secrets.
- Premium/plan fields are **read-only** in user backups (not used to escalate roles on restore).
- Admin system restore requires typing `YES`.
- Storage bucket `backup` is **private**; downloads go through authenticated API.
- Extensible provider interface for future Drive/iCloud/Dropbox/NAS.

## 8. 테스트 체크리스트

- [ ] Member: My Page → 데이터 관리 → 백업 → ZIP 다운로드
- [ ] Member: JSON 백업 다운로드
- [ ] Member: merge 복구 — 동일 기록 중복 없음
- [ ] Member: replace 복구 — 기존 로그 교체
- [ ] Member: 손상 ZIP / 잘못된 schema → 에러, 기존 데이터 유지
- [ ] Member: 다른 사용자 백업 job download → 403
- [ ] Admin: 전체 백업 실행 + history
- [ ] Admin: YES 없이 restore → 거부
- [ ] Admin: YES + restore → 공지/카탈로그 upsert, 실패 시 롤백
- [ ] Admin: 자동 백업 hour/retention 저장
- [ ] Job progress UI 0→100%
- [ ] `npm run db:migrate` applies `101_backup_system.sql`

## 9. 성능 최적화 내용

- ZIP compression via JSZip DEFLATE (`streamFiles: true`)
- Progress updates on `backup_logs.progress` during export/import
- System export iterates tables incrementally (no full DB dump into one giant string until pack)
- Local disk fallback when Supabase Storage is unavailable (dev)
- Nightly job every 15m check; retention prune on `system/` prefix
- Large uploads capped by `BACKUP_MAX_UPLOAD_BYTES` (80MB)

## 10. 운영 메모

1. Deploy backend + run migration `101`.
2. Ensure Render has `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY`.
3. Confirm bucket `backup` exists (private).
4. Set auto-backup hour/retention in Admin → Backup.
5. Smoke: member backup/restore + admin system backup.

## 11. Supabase PITR 복구 드릴 (유료 오픈 전)

앱 ZIP 백업(`backup` private 버킷)은 논리 백업이다. 실수 DELETE / 마이그레이션 사고는 **Postgres PITR**이 필요하다.

1. Supabase Dashboard → Project → Database → Backups → **Point in Time Recovery** On (Pro 이상).
2. 복구 목표 시각(KST)과 대상 프로젝트를 적는다. 프로덕션에 덮어쓰지 말고 **복구 전용 프로젝트**로 restore.
3. 복구 DB URL을 스테이징 Render에만 연결 → `/ready` 200, 로그인, 결제 status, 관리자 백업 history 확인.
4. 통과 시각·담당자를 `docs` 또는 운영 위키에 남긴다. 분기마다 1회.
5. 앱 `POST /admin/system-restore` (`confirmText=YES`)는 카탈로그/공지 논리 복구용이며 PITR 대체가 아니다.
