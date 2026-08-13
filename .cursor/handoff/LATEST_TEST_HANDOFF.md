# Test handoff — Distinguish marketing vs event consent labels

## Summary
개인정보 권리센터(및 설정)에서 거의 같던 두 알림 동의 라벨을 구분: 「일반 마케팅·혜택 안내 받기」vs「이벤트·캠페인 알림 받기」+ 짧은 설명.

## Test focus
1. `/settings/privacy-rights` 동의 관리: 두 토글 라벨·설명이 확실히 다름
2. 설정 `marketingOptIn` 문구도 일반 마케팅으로 통일
3. 동작(필드)은 그대로 marketingOptIn / eventOptIn

## Fast checks
```
rg -n "일반 마케팅|이벤트·캠페인|marketingOptInHint|eventOptInHint" frontend/src/i18n/locales/ko/common.json frontend/src/pages/settings/PrivacyRightsPage.tsx
```

## As-is → To-be
- as-is: 이벤트·프로모션 알림 받기 / 이벤트/프로모션 알림 수신
- to-be: 일반 마케팅·혜택 안내 받기 / 이벤트·캠페인 알림 받기 (+ hint)
