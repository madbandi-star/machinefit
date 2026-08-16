# Test handoff — Sync self gym member name with username

## Summary
Home member chip showed stale `gym_members.name` after username change. Self members now follow `displayName` in the UI, and username updates sync `is_self` member names in DB. 사레레 already backfilled.

## Git
- Branch: `main`
- Commit: pending

## Test focus
1. Home → gym row right chip shows account username for self.
2. Rename username → self member label updates.
3. Non-self members still show their own names.

## Fast checks
```bash
rg -n "syncSelfMemberNames|accountDisplayName" backend/server/repositories/gym-member.repository.ts backend/server/services/user.service.ts frontend/src/components/gyms/MemberSelector/MemberSelector.tsx
```

## Deploy
Frontend Pages + **Render backend** (sync on rename).
