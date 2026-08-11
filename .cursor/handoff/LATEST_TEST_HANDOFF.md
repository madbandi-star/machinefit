# Test handoff — Render tsc fix

## Summary
Backend `tsc` failed on Render (`fa063dff`): unused `userId`, duplicate `assert` import in a test compiled by `tsc`, jose v5 `JWTVerifyOptions` has no `nonce`. Fixed those and excluded `*.test.ts` from the backend build.

## Test focus
1. Render Deploy Backend for this commit is `success`
2. Apple/Google login still works (nonce checked on JWT payload, not jose options)
3. Banner click still 204; events store null user_id

## as-is → to-be
- as-is: Render build exit 2 on `tsc`
- to-be: `npm run build` in backend succeeds; nonce still enforced in payload

## Fast checks
```
npm run typecheck --workspace=backend
```
(Local may still miss `jszip`/`sanitize-html` if backend node_modules incomplete; Render `npm ci` has them.)
