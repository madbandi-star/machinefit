# Test handoff ??Sentry free-tier wiring

## Summary
MachineFit??**Sentry ë¬´ë£Œ(Developer)** ëª¨ë‹ˆ?°ë§??ìµœì†Œ ë³€ê²½ìœ¼ë¡??°ê²°?ˆìŠµ?ˆë‹¤. DSN???†ìœ¼ë©?ê¸°ì¡´ì²˜ëŸ¼ no-op?…ë‹ˆ??

## Operator steps (?„ìˆ˜)
1. sentry.io ë¬´ë£Œ ê°€?????„ë¡œ?íŠ¸ 2ê°? `machinefit-frontend`, `machinefit-backend`
2. **Render** env: `SENTRY_DSN` (backend DSN), `SENTRY_ENVIRONMENT=production`, `SENTRY_TRACES_SAMPLE_RATE=0.05`
3. **GitHub Secrets**: `VITE_SENTRY_DSN` (frontend DSN)
4. (? íƒ) source maps: `SENTRY_AUTH_TOKEN`, `SENTRY_ORG`, `SENTRY_PROJECT`
5. Render ?¬ë°°??+ main FE ë°°í¬ ??Sentry Issues ?•ì¸

## Git
- branch: `main`
- commit: (push ??ê°±ì‹ )

## Test focus
1. DSN ?†ì´ ë¡œê·¸?????´ì?ëª¨ë“œ ?•ìƒ
2. DSN ?¤ì • ???˜ë„??FE/BE ?¤ë¥˜ê°€ Issues???œì‹œ
3. ?´ë©”/? í°???´ë²¤?¸ì— ?†ëŠ”ì§€

## Note
Render + GitHub Secrets ?†ì´???€?œë³´?œì— ?´ë²¤?¸ê? ???¤ì–´?µë‹ˆ??
