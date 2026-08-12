# Test handoff — Rejoin copy line breaks

## Summary
재가입 약관 KO 문구 줄바꿈만 적용.

## Test focus
1. `다시 이용해 주셔서 감사합니다.` 다음 줄에 `이전 계정과…`
2. `새로운 회원으로 가입됩니다.` 다음 줄에 `아이디는…`
3. `…설정은` 다음 줄에 `복구되지 않습니다.`

## Fast checks
```
rg "감사합니다.\\n\\n이전" frontend/src/i18n/locales/ko/common.json
rg "white-space: pre-line" frontend/src/styles/auth.css
```
