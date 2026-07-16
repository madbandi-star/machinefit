# MachineFit — Table Reference

All tables include `id` (UUID PK), `created_at`, `updated_at` unless noted.

## Identity & Access

| Table | Purpose | Key columns |
|-------|---------|-------------|
| `roles` | Role definitions | `code`: guest, member, owner, admin |
| `users` | User accounts | `email`, `role_id`, `language_id`, `country_id`, `unit_height`, `unit_weight` |
| `refresh_tokens` | JWT refresh tokens | `user_id`, `token_hash`, `expires_at` |
| `owner_applications` | Gym owner signup workflow | `user_id`, `status`, `reviewed_by` |
| `guest_sessions` | Pre-login tracking | `session_id`, `language_code` |

## i18n & Locale

| Table | Purpose | Key columns |
|-------|---------|-------------|
| `countries` | Country list | `code` (ISO), `name` (JSONB), `default_timezone` |
| `languages` | Supported locales | `code`: ko, en, ja, zh |
| `translations` | Admin-managed UI strings | `key`, `namespace`, `values` (JSONB) |
| `board_types` | Community board types | `code`: free, request, announcement |

## Machine Catalog (Code-Centric)

| Table | Purpose | Key columns |
|-------|---------|-------------|
| `brands` | Equipment brands | **`code`** (canonical), `name` (JSONB) |
| `machines` | Strength machines | **`code`** (canonical), `brand_id`, `name` (JSONB), `muscle_group` |
| `machine_aliases` | Search/AI name mapping | `machine_id`, `alias`, `alias_type` |
| `machine_images` | Machine photos | `machine_id`, `image_url`, `is_primary` |
| `machine_videos` | Hosted videos | `machine_id`, `video_url` |
| `youtube_videos` | YouTube links | `machine_id`, `youtube_id`, `language_code` |
| `machine_settings` | Recommendation rules | `machine_id`, `gender`, `experience_level`, height range |
| `machine_qr_codes` | Global QR → machine | `machine_id`, **`qr_code`**, `deep_link_path` |
| `machine_embeddings` | AI vector storage | `machine_id`, `ai_model_id`, `embedding` (JSONB) |

## Gym System

| Table | Purpose | Key columns |
|-------|---------|-------------|
| `gyms` | Gym locations | `owner_id`, **`slug`**, `registration_status`, lat/lng, `amenities` |
| `gym_photos` | Gym images | `gym_id`, `photo_url` |
| `gym_machines` | Machine inventory | `gym_id`, `machine_id`, `quantity`, `instance_label` |
| `gym_machine_qr_codes` | Per-gym machine QR | `gym_machine_id`, `qr_code` |

## Recommendations & Activity

| Table | Purpose | Key columns |
|-------|---------|-------------|
| `machine_recommendations` | Generated results | `machine_id`, `user_id`, `session_id`, settings snapshot |
| `favorites` | Saved machines | `user_id`, `machine_id`, **`source`**, `metadata` |
| `recent_history` | View timeline | `user_id`, `recommendation_id`, **`source`** |
| `workout_sessions` | Future workout log | `user_id`, `machine_id`, `external_provider` |

## Community

| Table | Purpose | Key columns |
|-------|---------|-------------|
| `posts` | Board posts | `board_type`, `user_id`, `language_code` |
| `comments` | Nested comments | `post_id`, `parent_id` |
| `likes` | Post likes | `user_id`, `post_id` |
| `reports` | Moderation reports | `reporter_id`, `status` |
| `post_attachments` | File uploads | `post_id`, `file_url` |
| `machine_requests` | Machine request board | `user_id`, `post_id`, `requested_machine_code`, `status` |

## AI & QR Events

| Table | Purpose | Key columns |
|-------|---------|-------------|
| `ai_models` | Model registry | `code`, `model_type`, `version` |
| `vision_recognition_logs` | Camera scan results | `image_url`, `predicted_machine_id`, `confidence` |
| `qr_scan_events` | QR scan analytics | `qr_code`, `machine_id`, `gym_id` |

## Notifications

| Table | Purpose | Key columns |
|-------|---------|-------------|
| `notifications` | In-app alerts | `user_id`, `type`, `title` (JSONB), `payload` |

---

## Canonical Identifiers

| Entity | API field | DB column | Example |
|--------|-----------|-----------|---------|
| Machine | `machineCode` | `machines.code` | `HS_ISO_LATERAL_HIGH_ROW` |
| Brand | `brandCode` | `brands.code` | `HAMMER_STRENGTH` |
| Gym | `gymSlug` | `gyms.slug` | `gold-gym-gangnam` |
| QR | `qrCode` | `machine_qr_codes.qr_code` | `MF-HS_ISO_LATERAL_HIGH_ROW` |
| User | `userId` | `users.id` | UUID |
| Locale | `languageCode` | `languages.code` | `ko` |

## Source Enum (favorites, history, workouts)

| Value | Meaning |
|-------|---------|
| `manual` | User action |
| `recommendation` | From recommendation flow |
| `qr_scan` | QR code scanned |
| `camera` | AI camera recognition |
| `search` | From search/browse |

## Gym Registration Status

| Status | Visible in finder |
|--------|-------------------|
| `draft` | No |
| `pending` | No |
| `approved` | Yes (if `is_active`) |
| `rejected` | No |
