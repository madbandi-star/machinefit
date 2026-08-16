# Workout plan reminder copy update

## Summary
Workout plan reminder body changed to `???���� ������ ��� �ֽ��ϴ�.???` (no count).

## Git
- branch: `main`
- commit: 47d53dfe

## Changed files
- `backend/server/services/workout-card.service.ts`

## Test focus
1. New Korean copy (and EN equivalent)
2. Reminder still once/day when eligible

## Fast checks
```bash
rg -n "���� ������ ��� �ֽ��ϴ�" backend/server/services/workout-card.service.ts
```

## As-is �� To-be
- **As-is:** `���� ������ ��� N�� �ֽ��ϴ�.`
- **To-be:** `???���� ������ ��� �ֽ��ϴ�.???`

## Note
Backend change ? Render redeploy required for production.
