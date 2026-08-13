# Test handoff — Privacy rights exercise cards UI

## Summary
개인정보 권리센터의 정정·삭제·처리정지 UI를 native details에서 카드형 아코디언으로 교체. 폼 오버플로/깨짐 방지, 인벤토리 2열(좁으면 1열), 체크박스·CTA 정리.

## Test focus
1. `/settings/privacy-rights` → 권리 행사: 정정/삭제/정지 카드 펼침 (한 번에 하나)
2. 정정 폼 input/select/textarea 가로 깨짐 없음
3. 삭제: 삭제가능/보존 목록 + 체크 후 CTA
4. 처리정지: 체크 후 CTA

## Fast checks
```
rg -n "pr-card|pr-field|openExercise|correctionBadge" frontend/src/pages/settings/PrivacyRightsPage.tsx frontend/src/styles/privacy-rights.css frontend/src/i18n/locales/ko/common.json
```

## As-is → To-be
- as-is: details 패널, 깨지는 form-field
- to-be: 배지+리드 카드 아코디언, 전용 pr-field 스타일
