# Test handoff — Birth save vs body-metrics consent false positive

## Summary
생년월일 저장 시 서버가 `age`를 계산해 넣으면서 **신체정보 동의**까지 요구해 `CONSENT_REQUIRED`가 나던 버그 수정. 「전체 선택」토글은 원래 on/off로 복구.

## Root cause
`updateMe`가 `birthDate` → `payload.age` 도출 후 `touchesBodyMetrics`에 `age`를 포함 → `bodyMetricsConsent` 없이 거부. FE는 이를 생년월일 서버 동의 실패로 표시.

## Test focus
1. 설정 → 생년월일·탄생시만: 필수 동의 체크 → 저장 **성공** (신체정보 섹션 동의 안 해도 됨)
2. 「전체 선택」다시 누르면 해제되는 기존 토글 동작
3. 신체정보(키/몸무게 등) 저장은 여전히 신체 동의 필요

## Fast checks
```
rg -n "touchesBodyMetrics" -A 8 backend/server/services/user.service.ts
rg -n "toggleAll" frontend/src/components/settings/ProfileDataConsentBlock/ProfileDataConsentBlock.tsx
```

## Production checks
- **Deploy Backend to Render success 필수** (이 수정이 BE)
- Pages는 select-all 복구 FE 포함 시

## As-is → To-be
- as-is: 생년월일 동의 전부 체크해도 서버 동의 확인 실패 toast
- to-be: 생년월일 동의만으로 저장 성공
