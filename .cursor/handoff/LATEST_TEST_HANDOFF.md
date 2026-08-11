# Test handoff — remaining red-team fix list 5–7

## Summary
Usage consume is atomic when limits_enforced. Admin billing writes need confirmText GRANT. Polar sandbox drill doc + scenario unit tests. PITR/restore drill in BACKUP_RESTORE.

## Test focus
1. Admin subscriptions: without GRANT, extend/set/end fail
2. With GRANT, extend works
3. System restore still requires YES
4. Unit: polar-webhook-scenarios.test.ts

## Fast checks
```
npx tsx backend/server/payments/polar-webhook-scenarios.test.ts
```

## as-is → to-be
- as-is: usage check-then-act; admin billing one click; Polar drill undocumented
- to-be: locked consume; GRANT step-up; sandbox checklist
