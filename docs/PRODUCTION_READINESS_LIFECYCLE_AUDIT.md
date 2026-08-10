# MachineFit Production Readiness — Lifecycle Audit

Date: 2026-08-10  
Scope: Auth, membership, workouts, billing, privacy, admin, ops  
Principle: Analyze first; fix CRITICAL/HIGH only with minimal safe changes.

## A. Overall status

**Production Ready with Issues**

- Free / social-login beta (payments off): viable after this hardening deploy + Render migrate `112`.
- Paid Polar open: still requires ops secrets (`POLAR_*`, deploy hook) and residual review items below.

## B–E. Findings table

| # | Area | Process | Current state | Risk | Problem | Recommended / action | Open-before |
|---|---|---|---|---|---|---|---|
| 1 | Auth | Refresh after logout | **Fixed** | CRITICAL | Empty refresh store allowed legacy JWT reuse | Require stored refresh hash | YES |
| 2 | Auth | OAuth pending replay | **Fixed** | HIGH | Pending JWT minted sessions repeatedly | jti ledger + single consume | YES |
| 3 | Auth | Logout revoke (Pages) | **Fixed** | HIGH | Cookie blocked → no server revoke | FE sends refreshToken body | YES |
| 4 | Auth | Age 14 attestation | **Fixed** | HIGH | UI-only; API bypass | `agreeAge14` required + `user_consents.age14` | YES |
| 5 | Billing | Withdraw → cancel PG | **Fixed** | CRITICAL | Polar kept renewing after withdraw | `cancelSubscriptionOnWithdraw` | YES (paid) |
| 6 | Billing | Seed `FREE30` | **Fixed** | CRITICAL | Unlimited free Premium via coupon | Migration deactivates `FREE30` | YES (paid) |
| 7 | Billing | Referral Premium | **Fixed** | HIGH | Farming via invite apply | Flag `referral_premium_reward=false` | YES (paid) |
| 8 | Auth | Provider→username | OK | LOW | Signup uses random only | Keep; change-path provider match optional | NO |
| 9 | Auth | Withdraw/rejoin | OK | LOW | New user_id; no data restore | Keep + trial ledger | NO |
| 10 | Auth | Email auto-merge | OK | — | No auto-merge across providers | Keep | NO |
| 11 | Auth | Apple login | Partial | MEDIUM | BE ready; FE coming soon | Enable only when E2E ready | NO |
| 12 | Auth | Google accessToken aud | Gap | MEDIUM | userinfo without audience bind | Prefer ID token | Soft YES |
| 13 | Auth | Multi-device logout-all UX | Partial | MEDIUM | No dedicated “logout all devices” button | Future; logout-by-refresh clears all | NO |
| 14 | Auth | Access JWT denylist | Gap | MEDIUM | Access valid ~15m after logout | session_epoch if needed | NO |
| 15 | Workout | Day vs all delete | OK | — | Day delete only | Keep | NO |
| 16 | Workout | Ownership / IDOR | OK | — | gymScope + user_id checks | Keep | NO |
| 17 | Billing | Polar webhook sig | OK | — | HMAC + skew + claim | Improve claim-on-failure retry | NO |
| 18 | Billing | Lemon Squeezy | Stub | LOW | Unconfigured | Leave until needed | NO |
| 19 | Trial | Rejoin abuse | OK | LOW | `trial_identity_ledger` | Keep | NO |
| 20 | Privacy | GPS / consent IP | OK | LOW | TTL scrub + consent gate | Legal confirm windows | NO |
| 21 | Privacy | Token logging | OK | LOW | No plain token logs found | Keep scrubbing | NO |
| 22 | Admin | Role gate | OK | LOW | `requireMinRole(ADMIN)` + live recheck | Keep | NO |
| 23 | Rate limit | Multi-instance | Gap | MEDIUM | In-memory store | Redis store | Soft YES |
| 24 | Deploy | Render hook | Gap | HIGH (ops) | `RENDER_DEPLOY_HOOK_URL` empty | Set secret or Manual Deploy | YES |
| 25 | Backup | Restore drill | Gap | HIGH (ops) | Backup exists; restore drill not evidenced | Run restore drill | YES |
| 26 | Legal | Business / privacy copy | External | HIGH | Registration / counsel | External checklist | YES |
| 27 | PWA | ChunkLoadError | Mitigated | MEDIUM | Prior Pages cache issues | Keep deploy retry workflow | NO |
| 28 | Timezone | Dates | Mixed | MEDIUM | UTC storage / KST display | Document service TZ policy | NO |
| 29 | Secrets | Git / FE | OK | LOW | `.env` ignored; FE public VITE only | Rotate if ever leaked | NO |
| 30 | Auth | connectProvider + withdrawn | **Fixed** | MEDIUM | Blocked on stale links | `releaseInactiveProviderLink` | Soft YES |

## F. Code changes in this pass

| File | Change | Why |
|---|---|---|
| `auth.service.ts` | Remove refresh empty-store bypass; pending jti; age14; withdraw billing cancel; connect release | CRITICAL/HIGH auth |
| `jwt.util.ts` | Pending tokens include `jti` | Single-use signup |
| `oauth-pending.repository.ts` | jti register/consume | Single-use signup |
| `auth.controller.ts` | Logout accepts body refreshToken | Pages cookie gap |
| `auth.schema.ts` | `agreeAge14` required | Server attestation |
| `billing.service.ts` | `cancelSubscriptionOnWithdraw` | Stop renewals |
| `performLogout.ts` / `api/index.ts` / Terms page | Send refresh + age14 | FE alignment |
| `112_prod_readiness_auth_billing_hardening.sql` | jti table; disable FREE30; referral flag off | Paid abuse + pending |

## G. Not changed (and why)

- Full auth/payment rewrite — out of scope; logic kept.
- Access JWT denylist / session_epoch — residual 15m window accepted.
- Google ID-token-only — FE change + QA; soft.
- Redis rate limits — infra.
- Legal registration / counsel — not code.
- Mass data deletion / username rewrite — forbidden.
- Apple FE enable — product decision.

## H. Privacy notes

- Username: MachineFit random at signup; provider names nulled in verify.
- Consents: separate `user_consents` (+ age14 attestation).
- Payments retained on withdraw; GPS deleted; purge after grace via retention job.
- **[법률 검토 필요]** statutory retention periods; age-14 legal effect; marketing/location copy.

## I–K. Lifecycle summary

- **Member**: signup → random username → use → change username → logout → withdraw (anonymize + cancel sub) → rejoin as **new** user_id.
- **Payment**: trial ledger blocks re-trial; FREE30 disabled; referral rewards off; Polar webhook signed.
- **Incidents**: FE Pages deploy OK after i18n sync; BE needs Render Manual Deploy / hook; DB auto-migrate on boot when redeployed.

## L. Tests

- `shared` build + backend/frontend `tsc` (run in this change set).
- Full E2E OAuth/payment matrix: not executed in this environment (no prod secrets / DB auth).

## M. Open judgment

1. Deploy this branch to `main` + **Render redeploy** (migration 112).
2. Confirm health + smoke: login, logout, signup age14, withdraw (if paid: Polar cancel log).
3. Paid open additionally needs: Polar secrets, backup restore drill, legal checklist, referral redesign before re-enable.
