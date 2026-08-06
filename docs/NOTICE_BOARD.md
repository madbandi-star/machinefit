# Notice Board (공지사항)

Operational notice board for MachineFit with multilingual content, attachments, home banner/popup, and admin CRUD.

## 1. DB Migration

- `database/migrations/100_notices.sql`
- Tables: `notices`, `notice_translations`, `notice_attachments`, `notice_views`
- Soft delete via `deleted_at`
- Status: `DRAFT` / `PUBLISHED` / `HIDDEN` / `RESERVED`
- Flags: `is_pinned`, `is_important`, `is_banner`, `is_popup`
- Category: `notice` | `event` | `maintenance` | `update` | `other`

## 2. API (`/api/v1/notices`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/notices` | optional | Public list (admin=`true` for drafts) |
| GET | `/notices/banner` | optional | Home banner notice |
| GET | `/notices/popup` | optional | Login popup notice |
| GET | `/notices/stats` | admin | View stats / popular |
| GET | `/notices/:id` | optional | Detail (+30m view dedupe) |
| GET | `/notices/:id/attachments/:attachmentId/download` | optional | Download |
| POST | `/notices` | admin | Create |
| PUT | `/notices/:id` | admin | Update |
| DELETE | `/notices/:id` | admin | Soft delete |
| PATCH | `/notices/:id/publish` | admin | Publish / hide / reserve |
| PATCH | `/notices/:id/pin` | admin | Pin flag |
| PATCH | `/notices/:id/important` | admin | Important flag |
| PATCH | `/notices/:id/banner` | admin | Banner flag |
| PATCH | `/notices/:id/popup` | admin | Popup flag |
| POST | `/notices/:id/attachments` | admin | Upload file (multipart `file`) |
| DELETE | `/notices/:id/attachments/:attachmentId` | admin | Remove attachment |

Media proxy: `GET /api/v1/media/notice-attachments/*`

## 3. Admin screens

- `/admin/notices` — list, search, flags, stats, delete
- `/admin/notices/new` — create
- `/admin/notices/:noticeId` — edit (ko/en/ja/zh tabs, rich text, attachments, schedule)

## 4. Member screens

- `/community/notices` — list, category filter, search
- `/community/notices/:noticeId` — detail, attachments, prev/next
- Home: banner + login popup (`오늘 하루 보지 않기` / 최초 1회)

## 5. Storage

- Bucket: `notice-attachments` (env `NOTICE_ATTACHMENT_BUCKET`)
- Path: `{noticeId}/{timestamp}-{safeFileName}`
- Local fallback: `backend/uploads/notice-attachments/`
- Limits: 10 files / notice, 20MB each
- MIME: jpeg/png/webp/gif, pdf, zip

## 6. i18n structure

- DB: `notice_translations.language` ∈ `ko|en|ja|zh`
- UI: `community.notices.*`, `admin.notices.*` (ko/en)

## 7. Security

- Admin writes gated by `requireMinRole(Role.ADMIN)`
- HTML sanitized with `sanitize-html` (server) + DOMPurify (client)
- Attachment MIME + size checks
- Soft delete; public list only `PUBLISHED`
- View count dedupe 30 minutes per `user:` / `anon:` key

## 8. Extension hooks

- `noticeEvents.on('notice_published', handler)` — Push / in-app fan-out
- Job: `startNoticePublishJob()` every 60s publishes due `RESERVED` rows

## 9. Cache

- In-memory TTL list (30s) / detail (60s)
- Invalidated on create/update/delete/flag/publish/upload

## 10. Test checklist

- [ ] Migrate `100_notices.sql`
- [ ] Admin creates draft → publish → appears in public list
- [ ] Reserve with `publish_at` → auto-publishes after job tick
- [ ] Pin sorts above non-pinned
- [ ] Important shows red badge; NEW within 7 days
- [ ] Search title / body / both
- [ ] Category filters
- [ ] Attachment upload/download (image/pdf/zip)
- [ ] Inline image insert via file picker (no drag)
- [ ] View count does not increase twice within 30 minutes
- [ ] Home banner + popup (hide today / once)
- [ ] XSS payload in content is stripped
- [ ] Non-admin cannot POST/PUT/DELETE
