# Polar Premium — 제출 / QA 체크리스트

## 산출물

1. DB Migration: `database/migrations/100_polar_premium_subscription.sql`
2. Backend API: `docs/POLAR_PREMIUM.md` §4
3. Frontend 변경: PremiumProvider, SubscriptionPlanCard, PaymentHistoryPage, PremiumUpgradeModal, billing.api, routes, i18n
4. Backend 변경: polar.provider, billing.service/repository, routes, webhook, premium-expire job, auth trial, friend referral reward
5. Polar Dashboard: `docs/POLAR_PREMIUM.md` §1
6. Webhook: `docs/POLAR_PREMIUM.md` §2
7. Render env: `docs/POLAR_PREMIUM.md` §3 + `render.yaml`
8. 테스트: 아래 목록
9. 폴더 구조: `backend/server/payments/providers/polar/`, `frontend/src/providers/PremiumProvider.tsx`, `frontend/src/pages/billing/`
10. Types: `shared/src/types/billing.types.ts`, `shared/src/validators/billing.schema.ts`

## QA

- [ ] Migration 100 적용
- [ ] Render `POLAR_*` + `PAYMENT_PROVIDER=polar`
- [ ] 무료 → Checkout → Premium
- [ ] 가입 체험 7일
- [ ] 취소 후 기간 유지
- [ ] Scheduler 만료
- [ ] 환불
- [ ] Webhook 서명 / 중복
- [ ] 쿠폰 · 추천인
- [ ] 관리자 강제 부여/종료
- [ ] 결제내역 UI
