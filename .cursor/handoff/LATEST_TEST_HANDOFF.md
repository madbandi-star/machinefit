# Test handoff — Birth consent save (select-all + server flag)

## Summary
생년월일·탄생시 저장이 「필수 동의 항목을 모두 체크해 주세요」로 실패하던 문제를 재수정. 「전체 선택」이 다시 누르면 전부 해제되던 동작 제거. API는 raw body에서 `birthProfileConsent`를 재적용.

## Test focus
1. 설정 → 생년월일·탄생시: 날짜/시간 입력 후 **필수 동의 항목 전체 선택** → 저장 성공
2. 전체 선택 후 같은 행을 다시 눌러도 체크가 **풀리지 않음**
3. 개별 항목(엔터테인먼트·만 14세 포함) 5개가 모두 on인지 확인
4. (선택) 네트워크에서 PATCH `/users/me` body에 `birthProfileConsent: true` 포함

## Fast checks
```
rg -n "selectAll|consentBirthServerToast|birthConsentChecksRef" frontend/src/pages/settings/SettingsPage.tsx frontend/src/components/settings/ProfileDataConsentBlock/ProfileDataConsentBlock.tsx
rg -n "raw.birthProfileConsent" backend/server/controllers/user.controller.ts
```

## Production checks
- Pages Deploy Frontend success 후 hard refresh
- Deploy Backend to Render success (backend controller 변경)

## As-is → To-be
- as-is: 전체 선택해도 생년월일·탄생시 동의 toast로 저장 실패
- to-be: 전체 선택 유지 + 서버 동의 플래그로 저장 성공

## Deploy note
frontend + backend → Pages + Render 둘 다 필요
