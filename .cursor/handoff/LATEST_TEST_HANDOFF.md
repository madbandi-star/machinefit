# Test handoff — Fix birth-profile consent save

## Summary
생년월일·탄생시 필수 동의를 체크해도 저장이 거절되던 문제를 수정. 동의 행을 버튼 토글+함수형 state로 바꾸고, 「필수 전체 선택」추가, 저장 시 `birthProfileConsent`를 mutate 인자로 확실히 전달.

## Test focus
1. 설정 → 생년월일·탄생시: 필수 전체 선택 후 저장 성공
2. 동의 토스트 없이 저장됨
3. 저장 후 동의 완료 UI

## Fast checks
```
rg consentCheckAll frontend/src
rg birthProfileConsent frontend/src/pages/settings/SettingsPage.tsx
```
