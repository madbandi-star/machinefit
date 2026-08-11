# Test handoff — received templates destination

## Summary
Taking a template from the share hub now opens **My page → My templates → 받아온 템플릿**. That list no longer filters by active gym, and each received row has a Records CTA.

## Test focus
1. Hub → open post → 받아가기 → lands on `/my-page/templates#received` with the copy listed
2. Already taken: sticky button is “내 템플릿에서 보기”
3. Received row: 운동 기록에서 쓰기 → `/records`

## as-is → to-be
- as-is: download toast only; no obvious place to see the copy
- to-be: navigate to My templates received section

## Fast checks
```
npm run i18n:audit
```
