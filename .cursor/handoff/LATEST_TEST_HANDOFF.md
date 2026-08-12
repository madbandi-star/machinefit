# Test handoff — Home profile/fortune copy tweaks

## Summary
홈 `[프로필 설정 필요]`에서 「설정에서 입력해 주세요.」를 제거했고, 헬창운세 안내 KO 문구를 짧게 바꿨습니다.

## Test focus
1. 프로필 배너: `맞춤 추천을 위해 키·몸무게가 필요해요.`만 (설정에서… 없음)
2. 홈 운세: `생년월일과 탄생시를 입력하면, 헬창운세를 확인할 수 있어요.`

## Fast checks
```
rg profileIncompleteBody frontend/src/i18n/locales/ko/common.json
rg "입력하면, 헬창운세" frontend/src/i18n/locales/ko/fortune.json
```

## as-is → to-be
- as-is: …필요해요. 설정에서 입력해 주세요. / …오늘의 헬창운세를…
- to-be: …필요해요. / …입력하면, 헬창운세를…
