# MachineFit username & social login privacy data flow

> Technical documentation for privacy-minimizing username design.
> This is **not** a legal determination. Final compliance review (개인정보 처리방침 / counsel) is separate.

## Concepts (kept separate)

| Concept | Storage | Purpose |
|---------|---------|---------|
| Social auth identity | `auth_providers.provider` + `provider_user_id` | Login / account linking only |
| Provider email (optional) | `auth_providers.provider_email`, maybe `users.email` | Account contact / synthetic fallback |
| MachineFit public username | `users.display_name` (product “아이디”) | Public identifier in app UI |
| Provider profile name / nickname | **Not stored** for username; not mapped into `display_name` | Must not become public ID |

**Rule:** Social login authenticates. Provider real name / nickname is **not** the MachineFit username.

## Signup flow (new members)

```
Kakao / Google / Apple SDK
        ↓
Credential verify (provider user id + optional email + optional avatar URL)
        ↓
Existing auth_providers link? → login
        ↓ (new)
Pending token (provider ids only — no profile name staged)
        ↓
Terms consent
        ↓
generateRandomUsername() → validateUsername() → uniqueness check
        ↓
INSERT users.display_name = MachineFit random username
        ↓
Signup-complete screen shows generated ID (change CTA → My Page)
```

Provider `name` / `nickname` / `displayName` are **not** used in username generation.

## Random username

- Function: `generateRandomUsername()` in `@machinefit/shared` (`shared/src/utils/username.ts`)
- Shape: `[fitness Korean prefix][4 digits]` e.g. `머신러너4821`
- No email, phone, DOB, provider id, or provider name inputs

## Uniqueness

1. Pre-insert `isDisplayNameTaken` (case-insensitive among `is_active` users)
2. Retry loop on collision
3. DB unique index `uq_users_display_name_active_ci` on `lower(display_name) WHERE is_active` (migration `109`)

Deactivated accounts share display name `탈퇴회원` and are excluded from the unique index.

## Username change

Shared gate: `validateUsername()` (+ server `applyUsernameChange`)

Paths:

- Member: `PATCH /users/me` `{ displayName }`
- Admin: `PATCH /admin/users/:id` `{ displayName }`

Checks include length, charset, spaces, reserved/impersonation, profanity, phone/email shape, obvious Korean real-name shape. Optional in-memory compare to a transient provider profile name is available but **provider names are not persisted** for that purpose.

## Existing members

- Existing `display_name` values are **not** bulk-renamed.
- Only active-row collisions are disambiguated when creating the unique index.
- Legacy values that fail new validation remain until the user chooses a new ID.

## Provider field inventory (auth path)

| Field | Received? | Stored? | Public username? |
|-------|-----------|---------|------------------|
| provider user id | Yes | `auth_providers` | No |
| email | Sometimes | users / auth_providers (or synthetic) | No |
| Google `name` | Parsed then discarded | No | No |
| Kakao nickname | Parsed then discarded | No | No |
| Apple name (client) | Not forwarded | No | No |
| avatar URL | Optional | `users.avatar_url` | Profile image only |

## Counsel / policy review checklist

- Confirm privacy policy wording matches: username is MachineFit-generated; social names not used as public IDs
- Confirm retention of `auth_providers` / email vs avatar
- Confirm public exposure surfaces (friends, community, live) show `display_name` only
