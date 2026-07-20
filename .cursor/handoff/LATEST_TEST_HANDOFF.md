# Latest test handoff

> 프로그램테스트 에이전트: 이 파일 + `latest.json`을 먼저 읽으세요.  
> Agent URL: https://cursor.com/agents/bc-019f7d59-bc4b-7526-a842-4068cf31def4  
> Agent name: **프로그램테스트**

## Summary

테스트 에이전트 표기를 `Program test` → `프로그램테스트`로 통일했습니다. (URL 동일)

## Changed files

- `.cursor/rules/test-handoff.mdc`
- `.cursor/rules/deploy-auto.mdc`
- `.cursor/handoff/latest.json`
- `.cursor/handoff/LATEST_TEST_HANDOFF.md`
- `scripts/smoke-changed.mjs`

## Test focus (only this)

1. 룰/핸드오프에 `프로그램테스트`가 쓰이는지
2. 예전 영문 `Program test`가 룰에 남아있지 않은지

## Fast checks (prefer — no Pages wait)

```bash
npm run test:smoke:changed
```

## Production check

불필요

## as-is → to-be

- **as-is:** 문서/룰에 Program test 표기
- **to-be:** 프로그램테스트로 통일 (bcId/URL 동일)
