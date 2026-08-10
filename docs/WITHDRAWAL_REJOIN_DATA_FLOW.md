# MachineFit membership withdrawal & rejoin data flow

> Technical control documentation — **not** a legal determination.
> Retention periods for payments/consents should be confirmed against the privacy policy and counsel.

## Account states

| Status | Storage | Meaning |
|--------|---------|---------|
| `ACTIVE` | `users.account_status='ACTIVE'`, `is_active=true` | Normal use |
| `WITHDRAWN` | `account_status='WITHDRAWN'`, `is_active=false`, `deactivated_at` set | Member withdrew; API access denied |

There is no “restore old account” path. Rejoin = **new** `users.id`.

## Withdrawal flow

```
Settings → confirm → DELETE /auth/me
        ↓
snapshot trial_identity_ledger (oauth subject keys)
        ↓
TRANSACTION
  users → WITHDRAWN + anonymize email/username/PII
  archive auth_providers → auth_provider_withdrawals
  DELETE auth_providers          ← frees social subject for rejoin
  DELETE refresh_tokens
  DELETE user_locations
        ↓
clear FE auth → LOGIN
```

Immediate effects:

- Access/refresh unusable (`is_active` check + refresh rows deleted)
- Public username discarded (`탈퇴회원`); prior random ID freed for uniqueness among ACTIVE users
- Community authorship shows `탈퇴회원` while posts remain
- Workout/favorites/etc. stay on **old** user_id until retention purge (~30d) — never copied to a future user

## Rejoin flow (same Kakao/Google/Apple subject)

```
Social auth success
        ↓
auth_providers live link?
  → ACTIVE user → login
  → WITHDRAWN/inactive → release link → treat as new signup (reason=rejoin)
  → none → signup (reason=rejoin if withdrawal archive exists)
        ↓
terms consent (+ rejoin notice)
        ↓
NEW users row + generateRandomUsername()
        ↓
NEW auth_providers link
        ↓
ACTIVE (workout history empty)
```

Provider `name` / nickname / displayName are **not** used for username.

## Data classification (withdraw)

| Class | Examples | Handling |
|-------|----------|----------|
| A Immediate minimize | email, display_name, avatar, body metrics, location, opt-ins | Anonymize / delete on withdraw |
| B Auth subject (minimal) | provider + provider_user_id | Move to `auth_provider_withdrawals`; remove live link |
| C Operational purge | workouts, favorites, friends, UGC, notifications | Hard delete after grace (`privacyRetentionService`) |
| D Possible legal/billing retain | payments, subscriptions, consent records, users row | Keep; not auto-copied to new user |
| E Abuse prevention | `trial_identity_ledger` | Keep; blocks second free trial |

Counsel should confirm D retention windows against policy.

## What is never done

- Social profile name → MachineFit username
- Rejoin copying old username / workouts / settings
- Linking old user_id to new user_id
- Bulk rename of existing ACTIVE members
