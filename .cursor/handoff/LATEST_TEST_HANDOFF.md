# Test handoff — Sentry free-tier wiring

## Summary
MachineFit에 **Sentry 무료(Developer)** 모니터링을 최소 변경으로 연결했습니다. DSN이 없으면 기존처럼 no-op입니다.

## Operator steps (필수)
1. sentry.io 무료 가입 → 프로젝트 2개: `machinefit-frontend`, `machinefit-backend`
2. **Render** env: `SENTRY_DSN` (backend DSN), `SENTRY_ENVIRONMENT=production`, `SENTRY_TRACES_SAMPLE_RATE=0.05`
3. **GitHub Secrets**: `VITE_SENTRY_DSN` (frontend DSN)
4. (선택) source maps: `SENTRY_AUTH_TOKEN`, `SENTRY_ORG`, `SENTRY_PROJECT`
5. Render 재배포 + main FE 배포 후 Sentry Issues 확인

## Git
- branch: `main`
- commit: (push 후 갱신)

## Test focus
1. DSN 없이 로그인/홈/이지모드 정상
2. DSN 설정 후 의도적 FE/BE 오류가 Issues에 표시
3. 이메/토큰이 이벤트에 없는지

## Note
Render + GitHub Secrets 없이는 대시보드에 이벤트가 안 들어옵니다.
