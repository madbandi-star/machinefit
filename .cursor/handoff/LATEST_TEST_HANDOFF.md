# Test handoff — consent page loop

## Summary
Agreeing on `/auth/terms` bounced back because cached `/me` still had `needsConsent: true`, and Pages vs Render legal-version mismatch made the server keep the flag. After accept we now write `/me` cache, stamp server legal versions, and treat newer stored dates as satisfied.

## Test focus
1. Logged-in user with outdated terms: agree → continue → home (not back to terms)
2. New OAuth signup: agree + DOB → signup complete, then home stays home
3. Repeat continue does not return to `/auth/terms`

## as-is → to-be
- as-is: continue → same terms page
- to-be: continue → home / signup-complete and stay there

## Fast checks
```
npx tsx --test shared/src/constants/legal.test.ts
```
