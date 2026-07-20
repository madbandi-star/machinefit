# Latest test handoff

> Program test agent: read this file + `latest.json` first.  
> Agent URL: https://cursor.com/agents/bc-019f7d59-bc4b-7526-a842-4068cf31def4

## Summary

프로그램수정 → Program test 핸드오프 프로토콜과 **Pages 대기 없는** 빠른 스모크를 추가했습니다.

## Changed files

- `.cursor/rules/test-handoff.mdc`
- `.cursor/rules/deploy-auto.mdc`
- `.cursor/handoff/latest.json`
- `.cursor/handoff/LATEST_TEST_HANDOFF.md`
- `scripts/smoke-changed.mjs`
- `package.json` (`test:smoke:changed`)

## Test focus (only this)

1. 핸드오프 파일이 존재하고 내용이 유효한가
2. `npm run test:smoke:changed`가 성공하는가

## Fast checks (prefer — no Pages wait)

```bash
npm run test:smoke:changed
```

## Production check

불필요 (툴링 변경, UI 배포 검증 대상 아님)

## as-is → to-be

- **as-is:** Program test가 transcript/Pages에 의존해 수정분을 찾음
- **to-be:** `.cursor/handoff/*` + `npm run test:smoke:changed`로 수정분만 즉시 검증
