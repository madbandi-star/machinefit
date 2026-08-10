# MachineFit Production Readiness Report

> Engineering readiness audit (code/DB/config). Not a penetration-test certificate.  
> Audit date: 2026-08-10 · Branch: `cursor/prod-readiness-critical-35b3`

## 최종판정

**READY_WITH_WARNINGS**

Critical payment/webhook and production boot gaps found in audit were **fixed in this sprint**.  
Remaining items are HIGH/MEDIUM operational warnings (trial re-signup abuse, full mobile device matrix, live restore drill on staging, lawyer/business registration) — not open-blockers for a **free** launch with payments off, and not Critical for paid launch **if** Polar secrets + strong JWT + DATABASE_URL are set on Render.

---

## CRITICAL

| ID | 항목 | 상태 | 문제 | 조치 |
|---|---|---|---|---|
| C1 | Unsigned Dummy webhook → Premium | **FIXED** | `POST /webhook/dummy` accepted any JSON and activated Premium | Prod disables Dummy; Dummy requires `DUMMY_WEBHOOK_SECRET` header; Polar never falls back to Dummy for verify |
| C2 | Polar misconfig → Dummy verifier | **FIXED** | Missing Polar secrets silently used Dummy | `getWebhookPaymentProvider` / `getPaymentProvider` fail closed in production |
| C3 | Weak JWT defaults in production | **FIXED** | Default `dev-secret-*` forgeable if env missing | `assertProductionSafety()` refuses boot without strong JWT secrets |
| C4 | Production without DATABASE_URL (mock mode) | **FIXED** | In-memory mocks possible if DB unset | Production requires `DATABASE_URL` |

## HIGH

| ID | 항목 | 상태 | 문제 | 조치 |
|---|---|---|---|---|
| H1 | Preference gymId/memberId scope | **FIXED** | Trusted client scope without ownership | `gymScopeService.resolveMemberForWrite` on preference/feedback |
| H2 | Fortune/DNA/growth/achievements scope | **FIXED** | Same pattern | Ownership assert before service calls |
| H3 | Owner gymId routes | **FIXED** | Platform OWNER role could touch any gymId | `assertPlatformGymOperator` on owner machine APIs |
| H4 | Guest recommendation PII by UUID | **FIXED** | `user_id` null readable by any authed user | Authenticated viewers denied for anonymous rows |
| H5 | Public `/ops/health` infra leak | **FIXED** | Memory/DB/pool details public | Moved to `/ops/admin/health` (admin only); FE updated |
| H6 | `/warmup` host/userPrefix leak | **FIXED** | DB shape on public endpoint | Minimal status only |
| H7 | Checkout double-click sessions | **FIXED** | New Polar session every click | 60s reuse cache per user/plan/coupon |
| H8 | Content/search rate limits | **FIXED** | Only global 3000/15m | `contentWriteRateLimit` + `searchRateLimit` |
| H9 | Trial re-signup abuse | **FIXED** | New OAuth user → new 7-day trial | `trial_identity_ledger` (oauth/email) survives deactivate + purge |
| H10 | `requirePremium` unused on routes | **OPEN** | Entitlement mostly PLAN_LIMIT / cache | Mount selectively without changing product matrix — follow-up |

## MEDIUM

| ID | 항목 | 상태 | 문제 | 조치 |
|---|---|---|---|---|
| M1 | Community post double-submit | OPEN | No idempotency key | FE disable + rate limit mitigates |
| M2 | TLS `rejectUnauthorized:false` to Supabase | OPEN | Pooler TLS quirk | Document / revisit with Supabase CA |
| M3 | Live backup restore drill | OPEN | Code path exists; staging drill not run here | Run on staging before paid open |
| M4 | Mobile real-device matrix | OPEN | Not executed in this agent env | Manual QA checklist |
| M5 | Admin audit log coverage | PARTIAL | Ops audits exist; expand delete/PII events | Follow-up |

## LOW

| ID | 항목 | 상태 | 문제 | 조치 |
|---|---|---|---|---|
| L1 | PWA chunk recovery | PASS | Cap 3 + debounce | — |
| L2 | CORS `*` | PASS | Explicit `CORS_ORIGIN` list | — |
| L3 | SERVICE_ROLE in FE | PASS | Backend only | — |
| L4 | Deactivate session kill | PASS | Refresh deleted; access revalidated vs `is_active` | — |
| L5 | Workout log upsert unique | PASS | Unique + ON CONFLICT | — |

---

## 검사 요약

| 구분 | 수량 |
|------|------|
| 총 주요 검사 테마 | 40+ |
| CRITICAL found | 4 → 0 open |
| HIGH found | 10 → 1 open (H10) |
| MEDIUM open | 5 |
| PASS (no fix needed) | Authz core workouts/community, CORS, secrets in FE, PWA bound recovery |

---

## 직접 수정한 파일

| 파일 | 내용 | 위험 해결 |
|------|------|-----------|
| `backend/server/config/production-guards.ts` | Prod boot fail-closed | C3, C4 |
| `backend/server/index.ts` | Call production guards | C3, C4 |
| `backend/server/payments/provider.factory.ts` | No Dummy fallback in prod | C1, C2 |
| `backend/server/payments/providers/dummy/dummy.provider.ts` | Require shared secret | C1 |
| `backend/server/services/billing.service.ts` | Webhook resolver + checkout reuse; trial identity ledger | C1, H7, H9 |
| `database/migrations/108_trial_identity_ledger.sql` | Durable trial identity keys | H9 |
| `backend/server/controllers/feedback.controller.ts` | Scope ownership | H1 |
| `backend/server/controllers/fortune.controller.ts` | Scope ownership | H2 |
| `backend/server/controllers/lifter-dna.controller.ts` | Scope ownership | H2 |
| `backend/server/controllers/achievement.controller.ts` | Scope ownership | H2 |
| `backend/server/controllers/growth-timeline.controller.ts` | Scope ownership | H2 |
| `backend/server/services/owner.service.ts` | Platform gym operator assert | H3 |
| `backend/server/repositories/recommendation.repository.ts` | Anonymous row deny | H4 |
| `backend/server/routes/ops.routes.ts` | Admin-only detailed health | H5 |
| `backend/server/controllers/health.controller.ts` | Strip warmup diag | H6 |
| `backend/server/middlewares/rate-limit.middleware.ts` | Content/search limits | H8 |
| `backend/server/routes/community.routes.ts` | Write rate limit | H8 |
| `backend/server/routes/machine.routes.ts` | Search rate limit | H8 |
| `backend/server/routes/gym.routes.ts` | Search rate limit | H8 |
| `frontend/src/api/ops.api.ts` | Health path → admin | H5 |
| `config/env/.env.example` | Dummy webhook secret note | C1 |
| `PRODUCTION_READINESS_REPORT.md` | This report | — |

---

## 오픈 차단 조건 재검사 (§46)

| 조건 | 결과 |
|------|------|
| 타 사용자 개인정보 조회 / IDOR | Core workout paths OK; preference/owner/guest gaps **fixed** |
| 관리자 권한 우회 | Admin routers gated |
| 인증 우회 | Live `is_active` check |
| 결제 webhook 검증 없음 | **Fixed** (fail closed) |
| Secret FE 노출 | Not found |
| 운영 mock DB | **Fixed** (prod requires DATABASE_URL) |
| 탈퇴 불가 | Soft-delete + purge job exists |
| Production build | Typecheck required before merge |

---

## 법률 / 운영 잔여

- 사업자·통신판매 실값, 약관 변호사 검수 → LEGAL_AUDIT_REPORT
- Staging에서 백업 복구 리허설
- 실기기 모바일 QA

---

## 최종 판정

READY_WITH_WARNINGS
