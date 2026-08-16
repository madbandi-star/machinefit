# Missed plans date shows weekday

## Summary
Ȩ ��ģ � ��ȹ ��¥�� `08-15(��)`ó�� **��-��(����)** �� ǥ���մϴ�.

## Git
- branch: `main`
- commit: 52224e4f

## Changed files
- `frontend/src/components/home/HomePlannedWorkoutCard/HomePlannedWorkoutCard.tsx`
- `frontend/src/utils/historyDate.ts` (`formatShortDateWithWeekday`)

## Test focus
1. ��ģ ��ȹ ��¥�� `MM-DD(����)` ����
2. ���� ���� ����

## Fast checks
```bash
rg -n "formatShortDateWithWeekday" frontend/src/utils/historyDate.ts frontend/src/components/home/HomePlannedWorkoutCard/HomePlannedWorkoutCard.tsx
```

## As-is �� To-be
- **As-is:** `08-15`
- **To-be:** `08-15(��)`
