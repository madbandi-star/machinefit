# Test handoff — Fix birth profile consent save

## Summary
Settings birth/body/location saves always send feature consent attestation after the checkbox gate, fixing CONSENT_REQUIRED when FE thought consent was already done (or omitted the flag) under version skew.

## Git
- Branch: `main`
- Commit: pending

## Test focus
1. Settings → 생년월일·탄생시 → 전체 선택 → 저장 → success.
2. If already-agreed banner shows, Save still works.

## Fast checks
```bash
rg -n "birthProfileConsent: true|bodyMetricsConsent: true|locationGymConsent: true" frontend/src/pages/settings/SettingsPage.tsx
```

## Deploy
Frontend Pages only.
