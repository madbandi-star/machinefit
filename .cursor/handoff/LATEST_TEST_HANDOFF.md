# Test handoff — Age 14 server gate + withdraw purge

## Summary
Platform accounts now reject under-14 age/birthDate (DB CHECK + Zod). Gym facility members may still be under 14 (documented). 30-day withdraw purge now deletes trades/PT/support/templates/owner gym rosters/storage, while keeping payments, consents, trial ledger.

## Test focus
1. PATCH /users/me with birthDate of a 13-year-old → 400
2. age: 14 + child birthDate → 400
3. Gym member create with child birthDate still allowed
4. Privacy /privacy s3 lists expanded purge + trial ledger keep
5. Settings withdraw confirm lists deleted vs kept
6. After Render migrate 118, users.age < 14 cannot be stored

## as-is → to-be
- as-is: checkbox-only age; purge missed gym/trades/PT/files
- to-be: server 14+ for accounts; purge matches privacy copy
