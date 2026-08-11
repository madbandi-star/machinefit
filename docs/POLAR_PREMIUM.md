# MachineFit Premium (Polar) — 운영 가이드

웹(PWA) 전용 월간 Premium 구독. App Store / Google Play 없음.

| 항목 | 값 |
|------|-----|
| 요금 | 월 ₩3,000 (자동 갱신) |
| 취소 | 언제든 가능 · **현재 기간 종료까지 Premium 유지** |
| Provider | [Polar.sh](https://polar.sh) |
| Migration | `database/migrations/100_polar_premium_subscription.sql` |

---

## 1. Polar Dashboard 설정

1. [polar.sh](https://polar.sh) 조직 생성 (필요 시 **Sandbox** 조직도 생성)
2. **Products → Catalogue** 에서 Premium 상품 생성
   - Recurring / Monthly
   - Price: KRW 3,000 (또는 Polar가 지원하는 통화로 동일 금액)
3. Product ID 복사 → `POLAR_PREMIUM_PRODUCT_ID` (또는 `plan_master.polar_product_id`)
4. **Settings → Developers** 에서 Organization Access Token 발급 → `POLAR_ACCESS_TOKEN`
5. Organization ID → `POLAR_ORGANIZATION_ID`

---

## 2. Webhook 등록

1. Polar → Settings → Webhooks → Add endpoint  
2. URL (Render):

```text
https://<your-api>.onrender.com/api/v1/polar/webhook
```

또는

```text
https://<your-api>.onrender.com/api/v1/webhook/polar
```

3. Secret 복사 → `POLAR_WEBHOOK_SECRET` (`whsec_…` 권장)
4. Subscribe at least:

- `subscription.canceled` / `subscription.revoked` / `subscription.cycled`
- `order.paid` / `order.refunded` / `order.failed`

`order.created` and generic `subscription.updated` are **not** treated as payment. Premium is granted only on `order.paid` or `subscription.cycled`/`renewed`. After `refunded`, only a new `order.paid` may restore Premium. Withdrawn accounts never reactivate.

서명 검증: Standard Webhooks (`webhook-id` / `webhook-timestamp` / `webhook-signature`).  
중복 이벤트는 `webhook_events` PK로 무시.

---

## 3. Render 환경변수

| Key | 필수 | 설명 |
|-----|------|------|
| `PAYMENT_PROVIDER` | yes | `polar` |
| `POLAR_ACCESS_TOKEN` | yes | Org access token |
| `POLAR_WEBHOOK_SECRET` | yes | Webhook signing secret |
| `POLAR_ORGANIZATION_ID` | recommended | Org id |
| `POLAR_PREMIUM_PRODUCT_ID` | yes* | Product id (*또는 DB `plan_master.polar_product_id`) |
| `POLAR_SERVER` | no | `sandbox` \| `production` (default) |
| `POLAR_SUCCESS_URL` | no | Checkout success (default my-page) |
| `POLAR_RETURN_URL` | no | Checkout cancel/back |
| `FRONTEND_BASE_URL` | yes | e.g. `https://machine-fit.com/machinefit` |
| `CORS_ORIGIN` | yes | include frontend origin |

`render.yaml` 에 키 자리가 정의되어 있습니다. 값은 Dashboard에서 sync=false 로 입력.

---

## 4. Backend API

| Method | Path | 설명 |
|--------|------|------|
| POST | `/api/v1/billing/create-checkout` | Polar Checkout Session |
| GET | `/api/v1/billing/status` | Premium 상태 뷰 |
| GET | `/api/v1/billing/history` | 결제 이력 |
| GET | `/api/v1/billing/invoices` | history alias |
| POST | `/api/v1/billing/cancel` | 기간 종료 취소 |
| POST | `/api/v1/billing/resume` | 자동갱신 재개 |
| POST | `/api/v1/billing/coupon` | 쿠폰 적용 |
| POST | `/api/v1/polar/webhook` | Polar webhook |
| POST | `/api/v1/subscription/trial` | 7일 체험 |
| Admin | `/api/v1/admin/subscriptions/*` | 강제 부여/종료/연장 |
| Admin | `/api/v1/admin/coupons` | 쿠폰 CRUD |
| Admin | `/api/v1/admin/subscriptions/:id/refund` | 환불+종료 |
| Admin | `/api/v1/admin/subscriptions/:id/grant-trial` | 체험 지급 |

기존 `/subscription/*`, `/payment/*` 경로도 유지.

---

## 5. DB / 캐시

- Source of truth: `subscriptions` + `payment_history`
- Cache: `users.membership_type`, `premium_*`, `polar_*`, `subscription_status`, `trial_used`
- Idempotency: `webhook_events`
- Audit: `billing_logs`
- Coupons: `coupons` / `coupon_history` (WELCOME 50%, FREE30)
- Referral rewards: `referral_history` (+30일 양측, friend invite 연동)

---

## 6. 테스트 체크리스트

- [ ] 무료회원 → Checkout → Premium 활성
- [ ] 가입 시 7일 체험 (`signup_trial_auto`)
- [ ] 구독 갱신 webhook (`subscription.cycled` / `order.paid`)
- [ ] 구독 취소 → 기간 종료까지 Premium
- [ ] 기간 경과 → scheduler `expired` + FREE
- [ ] 환불 → FREE + `refunded`
- [ ] Webhook signature 실패 → 401
- [ ] 중복 webhook id → skip
- [ ] `requirePremium` 403 (비 Premium)
- [ ] 쿠폰 FREE30 / WELCOME
- [ ] 추천인 코드 → 양측 +30일
- [ ] 결제내역 UI
- [ ] 관리자 강제 부여/종료/쿠폰/환불

---

## 7. Frontend 변경 요약

- `PremiumProvider` — 로그인 시 상태 조회·갱신
- `SubscriptionPlanCard` — 전 회원 마이페이지 Premium 카드
- `PaymentHistoryPage` — `/my-page/billing/history`
- `PremiumUpgradeModal` — Polar checkout 이동
- Toast: success / cancel / refund / cancel-at-period-end
