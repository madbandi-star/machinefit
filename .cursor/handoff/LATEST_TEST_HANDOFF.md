# Test handoff — Remove ja/zh from UI language picker

## Summary
상단·설정 언어 선택에서 일본어·중국어를 제거했습니다. 이미 ja/zh로 저장된 UI 언어는 영어로 맞춥니다.

## Test focus
1. 헤더 언어 드롭다운: 한국어 / English만
2. 설정 → 언어: 동일
3. (선택) localStorage `machinefit-settings`에 locale ja였다면 새로고침 후 en

## Fast checks
```
rg UI_LOCALES shared/src/constants/locales.ts
rg UI_LOCALES frontend/src/components/settings/LanguageSelector/LanguageSelector.tsx
```

## as-is → to-be
- as-is: ko / en / ja / zh
- to-be: ko / en only
