# Test handoff — Phase 1 under-14 signup gate (birth date + KST age)

## Summary
OAuth complete now requires `birthDate`. The server computes 만 나이 in `Asia/Seoul` and does not INSERT a `users` row if under 14. `agreeAge14` alone is not enough. Profile PATCH cannot set `age` without `birthDate`. Gym facility members under 14 are unchanged.

## Test focus
1. New signup: terms page requires DOB; under-14 shows block UI and does not call complete (or 403 `AGE_RESTRICTED` if forced)
2. POST `/auth/oauth/complete` without `birthDate` → validation error; with under-14 DOB + `agreeAge14: true` → 403, no user row
3. Rejoin uses the same complete endpoint / DOB gate
4. PATCH `/users/me` `{ "age": 20 }` without birthDate → 400
5. Privacy 2026-08-13: s1 signup DOB required; s6 server KST age; reconsent for older privacy versions
6. Gym member create with under-14 birthDate still allowed

## as-is → to-be
- as-is: checkbox `agreeAge14` created the account
- to-be: required DOB + server KST full years; under-14 never creates a platform user

## Fast checks
```
npx tsx shared/src/utils/age-from-birth-date.test.ts
npx tsx shared/src/validators/auth.schema.test.ts
npx tsx backend/server/services/age-verification.service.test.ts
rg -n "assertPlatformAgeEligible|AGE_RESTRICTED|signupBirthDate" backend shared frontend/src
```

## Production checks (after Pages + Render)
- Social signup flow: DOB field, under-14 block copy
- Existing users with privacyVersion 2026-08-12 prompted to re-accept (2026-08-13)
