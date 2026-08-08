# Test handoff: Unknown push sender label → 시스템 알림

## Summary
알림에서 발송자 정보가 없을 때 보이던 「발송자 정보 없음」을 「시스템 알림」으로 변경했습니다.

## Git
- Branch: `main`
- Commit: pending

## Test focus
1. 발송자 없는 푸시/알림 항목에 「시스템 알림」 표시

## Fast checks
```bash
rg -n "pushSenderUnknown" frontend/src/i18n/locales/ko/notifications.json
```

## as-is → to-be
| as-is | to-be |
|-------|--------|
| 발송자 정보 없음 | 시스템 알림 |
