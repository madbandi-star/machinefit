# Test handoff — Delete-account confirm spacing

## Summary
회원탈퇴 확인 창「남는 것」줄에서 띄어쓰기만 바꿨습니다. 의미는 동일합니다.

## Test focus
1. 설정 → 회원탈퇴 → 확인 대화상자
2. 「남는 것」에 `무료체험 남용방지 식별키`, `소셜제공자 식별자`

## Fast checks
```
npx tsx frontend/src/utils/splitGuideBlocks.test.ts
rg "남용방지 식별키" frontend/src/i18n/locales/ko/common.json
```

## as-is → to-be
- as-is: 무료체험 남용 방지 식별키 / 소셜 제공자 식별자
- to-be: 무료체험 남용방지 식별키 / 소셜제공자 식별자
