# MachineFit Database Design

Future-ready PostgreSQL schema for a global machine-fitting platform.

## Design Principles

| Principle | Implementation |
|-----------|----------------|
| **Machine codes are canonical** | `machines.code` is the global identifier (e.g. `HS_ISO_LATERAL_HIGH_ROW`). Display names live in JSONB i18n fields only. All FKs use `machine_id` (UUID), never display names. |
| **i18n by default** | User-facing labels stored as JSONB: `{ "ko": "...", "en": "...", "ja": "...", "zh": "..." }`. API resolves locale via `Accept-Language` or user preference. |
| **Codes over names in APIs** | REST paths and payloads use `machineCode`, `brandCode`, `gymSlug` — never localized names. |
| **AI-ready hooks** | Separate tables for embeddings, vision logs, QR scans — decoupled from core domain. |
| **Extensible metadata** | `JSONB metadata` columns on event tables for future fields without migrations. |
| **Audit trail** | `created_at`, `updated_at` on every table; soft-delete via `is_active` where appropriate. |

---

## Feature → Table Mapping

| Feature | Tables | Status |
|---------|--------|--------|
| Multilingual (i18n) | `languages`, `countries`, `translations`, JSONB on entities | Ready |
| Machine codes | `machines.code`, `machine_aliases`, `brands.code` | Ready |
| Gym owner accounts | `owner_applications`, `users.role_id` → `owner` | Ready |
| Gym registration | `gyms.registration_status`, `gyms.slug` | Ready |
| Gym machine inventory | `gym_machines`, `gym_machine_qr_codes` | Ready |
| Gym finder | `gyms` (lat/lng), `gym_amenities`, geo indexes | Ready |
| Community board | `posts`, `comments`, `likes`, `reports`, `post_attachments` | Ready |
| Machine request board | `machine_requests`, `posts.board_type = 'request'` | Ready |
| Favorites | `favorites` (+ `source` for QR/camera) | Implemented |
| Recent history | `recent_history` (+ `source`) | Implemented |
| Recommendations | `machine_settings`, `machine_recommendations` | Implemented |
| QR code support | `machine_qr_codes`, `gym_machine_qr_codes`, `qr_scan_events` | Schema ready |
| AI / camera recognition | `ai_models`, `machine_embeddings`, `vision_recognition_logs` | Schema ready |
| Workout history (future) | `workout_sessions` | Schema ready |
| Notifications | `notifications` | Implemented |

---

## Entity Groups

### 1. Identity & Access

```
roles ──< users ──< refresh_tokens
              ──< owner_applications
countries ──< users
languages ──< users
```

- **Owner flow**: Member submits `owner_applications` → Admin approves → `users.role_id` upgraded to `owner`.
- **Gym owner** can own multiple gyms via `gyms.owner_id`.

### 2. Machine Catalog (Code-Centric)

```
brands ──< machines ──< machine_images
                   ──< machine_videos
                   ──< youtube_videos
                   ──< machine_settings
                   ──< machine_aliases      (search / AI matching)
                   ──< machine_qr_codes     (global QR → machineCode)
                   ──< machine_embeddings   (AI vector search)
```

**Machine code format**: `{BRAND_PREFIX}_{MACHINE_SLUG}`  
Example: `HS_ISO_LATERAL_HIGH_ROW`

- APIs always accept/return `machineCode`, never localized `name`.
- `machine_aliases` maps alternate names (brand labels, gym labels, AI labels) → `machine_id`.

### 3. Gym System

```
users (owner) ──< gyms ──< gym_photos
                      ──< gym_machines ──< gym_machine_qr_codes
                      ──< gym_amenities (JSONB on gyms)
```

**Gym finder queries**:
- Geo: `latitude`, `longitude` + radius (Haversine in app layer)
- Filter: `country_id`, `city`, `is_verified`, `is_active`
- Machine filter: join `gym_machines` → `machines` where `machines.code = :machineCode`

**Gym registration lifecycle**:
`draft` → `pending` → `approved` | `rejected`

Only `approved` + `is_active` gyms appear in public finder.

### 4. Recommendations & User Activity

```
machines ──< machine_recommendations ──< recent_history
         ──< favorites
```

- `machine_recommendations.session_id` — guest tracking before login.
- `favorites.source` / `recent_history.source`: `manual` | `recommendation` | `qr_scan` | `camera` | `search`

### 5. Community

```
users ──< posts ──< comments
              ──< likes
              ──< post_attachments
              ──< reports

users ──< machine_requests (linked to posts when board_type = 'request')
```

**Board types** (`board_types` reference table):
| code | purpose |
|------|---------|
| `free` | General discussion |
| `request` | Machine request board |
| `announcement` | Admin announcements |

### 6. AI & QR (Future-Ready)

```
machines ──< machine_qr_codes
         ──< machine_embeddings
         ──< vision_recognition_logs

gym_machines ──< gym_machine_qr_codes

users ──< qr_scan_events
      ──< vision_recognition_logs
```

**QR deep link format**:
```
https://machinefit.app/machinefit/machines/{machineCode}
https://machinefit.app/machinefit/gyms/{gymSlug}/machines/{machineCode}
```

**AI pipeline** (future):
1. User uploads image → `vision_recognition_logs`
2. Model predicts `machine_id` + confidence
3. If confidence > threshold → redirect to `/machines/{machineCode}`
4. Embeddings in `machine_embeddings` enable similarity search

### 7. Workout History (Future)

```
users ──< workout_sessions ──> machine_recommendations (optional link)
```

Placeholder for Apple Health, Google Fit, watch integrations.

---

## i18n Strategy

### Storage Pattern

| Content type | Storage | Example |
|--------------|---------|---------|
| Entity names | JSONB on row | `machines.name`, `brands.name` |
| Tips/warnings | JSONB per locale | `machine_settings.tips` → `{"en": ["..."], "ko": ["..."]}` |
| UI strings | `translations` table | Admin-managed keys |
| Notifications | JSONB | `notifications.title`, `notifications.body` |

### Locale Resolution Order

1. User `language_id` → `languages.code`
2. `Accept-Language` header
3. Fallback: `en`

### API Contract

```json
// Request
{ "machineCode": "HS_ISO_LATERAL_HIGH_ROW" }

// Response (locale resolved server-side)
{
  "code": "HS_ISO_LATERAL_HIGH_ROW",
  "name": "Iso-Lateral High Row",
  "brandCode": "HAMMER_STRENGTH"
}
```

Never return all locales in list endpoints — only requested locale. Admin endpoints return full JSONB.

---

## Indexes Strategy

| Query pattern | Index |
|---------------|-------|
| Machine by code | `UNIQUE(machines.code)` |
| Brand by code | `UNIQUE(brands.code)` |
| Gym geo search | `(latitude, longitude)` + `country_id` |
| Gym by slug | `UNIQUE(gyms.slug)` |
| Settings lookup | `(machine_id, gender, experience_level, height_min_cm, height_max_cm)` |
| History timeline | `(user_id, viewed_at DESC)` |
| QR lookup | `UNIQUE(machine_qr_codes.qr_code)` |
| AI embedding search | `ivfflat` on `machine_embeddings.embedding` (pgvector) |
| Community feed | `(board_type, created_at DESC)` |
| Full-text gym search | GIN `to_tsvector` on gym name + city |

---

## Migration Order

```
001_extensions.sql
002_roles_users.sql
003_countries_languages.sql
004_brands_machines.sql
005_gyms.sql
006_recommendations.sql
007_favorites_history.sql
008_community.sql
009_machine_requests.sql
010_notifications.sql
011_future_ready_schema.sql   ← AI, QR, owner, i18n extensions
012_rls_policies.sql          ← Supabase RLS (when connecting)
```

---

## What Is NOT Stored

| Avoid | Use instead |
|-------|-------------|
| Machine display name in favorites | `machine_id` FK + join |
| Hardcoded brand strings | `brands.code` |
| Localized names in URLs | `machineCode`, `gymSlug` |
| Raw passwords | `password_hash` (bcrypt) |
| Plain refresh tokens | `token_hash` |
