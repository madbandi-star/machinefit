# Data retention inventory (migration 111)

Operational catalog for MachineFit admin retention policies.
Periods are **admin-editable applied policy**, not hard-coded statutory law.

## Seeded policies (24)

| Code | Category | Tables | Default period | Auto-delete | Notes |
|---|---|---|---|---|---|
| user_account_pii | personal | users | 30d / withdrawn | yes | Anonymize at withdraw |
| social_auth_live | auth | auth_providers | 0d / withdrawn | yes | Immediate detach |
| social_auth_withdrawals | auth | auth_provider_withdrawals | 3y | no | Archive |
| trial_identity_ledger | auth | trial_identity_ledger | 5y | no | Abuse prevention |
| workout_logs | workout | workout_logs | 30d / withdrawn | yes | Purge after grace |
| workout_cards | workout | workout_cards | 30d / withdrawn | yes | |
| favorites | workout | favorites | 30d / withdrawn | yes | |
| recent_history | workout | recent_history | 30d / withdrawn | yes | |
| user_machine_preferences | service | user_machine_preferences | 30d / withdrawn | yes | |
| community_posts | community | posts, photo_posts | 30d / withdrawn | yes | |
| community_comments | community | comments, photo_post_comments | 30d / withdrawn | yes | |
| friends_graph | service | friendships, friend_requests | 30d / withdrawn | yes | |
| user_locations_gps | personal | user_locations | 30d | yes | Coords scrub; region may remain |
| user_consents | personal | user_consents | 5y | no | Consent facts separate from service data |
| consent_ip_meta | log | user_consents (ip/ua) | 365d | yes | Scrub meta only |
| auth_login_events | log | auth_login_events | 365d | yes | |
| payment_history | payment | payment_history | 5y | no | Not purged on withdraw |
| subscriptions | payment | subscriptions | 5y | no | |
| billing_logs | payment | billing_logs, webhook_events | 3y | no | |
| admin_audit_logs | log | admin_audit_logs | 3y | no | |
| notifications | service | notifications | 30d / withdrawn | yes | |
| deactivated_account_purge | service | batch purge set | 30d / withdrawn | yes | Drives privacy-retention job |
| refresh_tokens | auth | refresh_tokens | 0d / withdrawn | yes | |
| backup_files | other | backup_logs | 90d | yes | Coordinate with backup_settings |

## Consent catalog (7)

terms, privacy, marketing, location, push_service, payment, community

## Scheduler

`startPrivacyRetentionJob` — daily pass; prefers DB policy days via `getActivePeriodDays`, falls back to `DATA_RETENTION` constants.

## Gaps / legal review

- Exact statutory periods for payments / consents: **[법률 검토 필요]**
- Backup object storage TTL vs `backup_files` policy alignment
- Per-row scheduled records currently focus on withdrawn-account purge; other types are policy catalog + job TTL
- No SUPER_ADMIN role in repo — all admin APIs use `Role.ADMIN`
