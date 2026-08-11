# Test handoff — OAuth CSRF + usage write gates

## Summary
Kakao authorize now sends and checks `state`. Apple ID tokens require a client `nonce` verified by jose. Workout card/log/template writes call `assertUsageAllowed` (no-op while `limits_enforced=false`).

## Test focus
1. Kakao login: return URL with wrong `?state=` must not exchange the code; toast `oauthStateMismatch`
2. Apple login (when enabled): missing/wrong nonce → 400 `OAUTH_NONCE_REQUIRED` / invalid token
3. With default DB policy (`limits_enforced=false`): create workout card still 201
4. If ops turns enforcement on and free_daily_limit=0: POST workout-card → 402 `USAGE_LIMIT`; photo board still works for MEMBER
5. Gym/member add still uses `PLAN_LIMIT`, not usage

## as-is → to-be
- as-is: Kakao state unused; Apple no nonce; usage check was advisory-only
- to-be: Kakao state bind; Apple nonce; write APIs gated by admin usage policy

## Fast checks
```
npx tsx shared/src/utils/oauth-csrf.test.ts
npx tsx shared/src/validators/auth.schema.test.ts
npx tsx backend/server/services/usage-limit-decision.test.ts
```
