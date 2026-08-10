# Test handoff — Demo account purge

## Summary
Production DB hard-purged: `admin@machinefit.com`, `demo1`–`demo3`, `demo_test2@gmail.com` (+ related rows).  
`demo_test@gmail.com` was **not** in DB; closest match `demo_test2@gmail.com` was removed.

## Test focus
1. Login with deleted emails fails
2. Remaining admins still work (`madbandi@gmail.com`, kakao admin)
3. Dry-run `node scripts/purge-target-accounts.mjs` returns matched: 0 for those targets

## as-is → to-be
- as-is: dummy/demo accounts in prod
- to-be: accounts + related data removed; purge script kept for ops
