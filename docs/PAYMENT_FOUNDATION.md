# Payment / Subscription Foundation

선개발 결제·구독 기반 구조입니다.  
**Polar Premium 실결제 연동:** [`docs/POLAR_PREMIUM.md`](./POLAR_PREMIUM.md) (`PAYMENT_PROVIDER=polar`).

Dummy 모드(`PAYMENT_PROVIDER=dummy`)에서는 실제 과금이 없습니다.

---

## 1. 현재 ERD 분석 결과

### 재사용
| 기존 | 역할 |
|------|------|
| `users.subscription_plan` (`free` \| `premium`) | 체육관/멤버 한도 등 기존 `PLAN_LIMIT` entitlement 캐시 |
| `roles` + `users.role_id` | FREE/PREMIUM/VIP/TRAINER/OWNER/ADMIN에 대응하는 Role 사다리 (`guest`→`admin`) |
| `shared` Role helpers | `hasMinRole`, `roleGrantsPremiumPlan` 등 |

### 새로 두지 않은 것
- `gym_members`에 SaaS 결제 컬럼을 추가하지 않음 (체육관 회원권 ≠ SaaS 구독)
- 기존 `subscription.service.ts` 한도 로직을 변경하지 않음 → billing 서비스가 `users.subscription_plan`만 동기화

### Role 매핑 (표시용 FREE/PREMIUM/VIP)
- FREE ↔ `member` (+ entitlement `free`)
- PREMIUM ↔ `premium_member` 또는 plan `PREMIUM`/`VIP` live
- VIP ↔ `vip_member` 또는 plan `VIP` live
- TRAINER / OWNER / ADMIN ↔ 기존 Role 코드

---

## 2. 생성된 테이블

Migration: `database/migrations/097_payment_subscription_foundation.sql`

| 테이블 | 설명 |
|--------|------|
| `plan_master` | FREE / PREMIUM / VIP 플랜 마스터 (가격, trial_days, 한도 메타) |
| `subscriptions` | 사용자 SaaS 구독 라이프사이클 |
| `payment_history` | 결제 원장 (mock row 허용) |
| `feature_flags` | Feature gate ON/OFF |
| `users.trial_consumed_at` | 계정당 체험 1회 |

**Rollback**

```sql
DROP TABLE IF EXISTS payment_history;
DROP TABLE IF EXISTS subscriptions;
DROP TABLE IF EXISTS feature_flags;
DROP TABLE IF EXISTS plan_master;
ALTER TABLE users DROP COLUMN IF EXISTS trial_consumed_at;
```

---

## 3. 변경된 ERD (요약)

```
users 1──* subscriptions *──1 plan_master
users 1──* payment_history *──0..1 subscriptions
plan_master ← feature_flags.min_plan_code (optional)
```

- Live 구독은 사용자당 최대 1건 (`ACTIVE|TRIAL|PAUSED|PENDING` partial unique index)
- `users.subscription_plan`은 기존 한도 API와 호환을 위한 캐시 (source of truth는 `subscriptions`)

---

## 4. API 목록

### Public / Member
| Method | Path | Auth | 설명 |
|--------|------|------|------|
| GET | `/api/v1/plans` | optional | 활성 플랜 목록 |
| GET | `/api/v1/subscription` | yes | 최신/라이브 구독 row |
| GET | `/api/v1/subscription/status` | yes | 마이페이지용 상태 뷰 (`paymentReady: false`, `checkoutLabel: 준비중`) |
| POST | `/api/v1/subscription/trial` | yes | 체험 시작 (1회) |
| POST | `/api/v1/subscription/cancel` | yes | 구독 취소 |
| GET | `/api/v1/payment/history` | yes | 결제 이력 |
| GET | `/api/v1/payment/providers` | no | Provider 목록 (active=env) |

### Admin
| Method | Path | 설명 |
|--------|------|------|
| GET | `/api/v1/admin/subscriptions` | 회원 검색·상태·만료임박 |
| GET | `/api/v1/admin/subscriptions/:userId` | 상태 조회 |
| POST | `/api/v1/admin/subscriptions/:userId/extend` | 연장 |
| POST | `/api/v1/admin/subscriptions/:userId/end` | 종료 |
| POST | `/api/v1/admin/subscriptions/:userId/set` | 플랜/상태 지정 |

### Webhooks (mock)
| Method | Path |
|--------|------|
| POST | `/api/v1/webhook/toss` |
| POST | `/api/v1/webhook/portone` |
| POST | `/api/v1/webhook/lemonsqueezy` |
| POST | `/api/v1/webhook/polar` |
| POST | `/api/v1/webhook/stripe` |
| POST | `/api/v1/webhook/google` |
| POST | `/api/v1/webhook/apple` |
| POST | `/api/v1/webhook/dummy` |

---

## 5. Provider Interface 구조

`backend/server/payments/provider.interface.ts`

- `createCheckout` / `verifyPayment`
- `createSubscription` / `cancelSubscription` / `pauseSubscription` / `resumeSubscription`
- `refund` / `getPayment` / `getSubscription`
- `verifyWebhook(headers, rawBody)` → `{ ok, events[] }` (검증·파싱만)

서비스 레이어(`billing.service`)가 `applyWebhookEvent`로 DB 반영.

---

## 6. Adapter 구조

```
backend/server/payments/
  provider.interface.ts
  provider.factory.ts          # PAYMENT_PROVIDER → instance
  providers/
    dummy/dummy.provider.ts    # ✅ 구현
    stub.provider.ts           # 미연동 공통 stub
    toss/ portone/ lemonsqueezy/ polar/ stripe/
    google-play/ apple/        # stub only
```

`getPaymentProvider()`는 현재 `dummy`만 실제 인스턴스화. 미지의 값은 dummy로 fallback (과금 방지).

---

## 7. 권한 구조

- Role: 기존 `shared/src/constants/roles.ts` + `requireMinRole` / `requireRole`
- Billing helpers: `hasPremiumAccess` / `hasVipAccess` / `hasTrainerAccess` / `hasOwnerAccess` / `hasAdminAccess`
- Middleware: `middlewares/feature-gate.middleware.ts`
  - `requirePremium()` / `requireVip()` / `requireFeature(flagKey)`
  - `hasPremium()` / `hasVip()` / …

기존 라우트 권한은 변경하지 않음 (additive).

---

## 8. Feature Gate 구조

테이블 `feature_flags`:
- `checkout_enabled` = false (실결제 UI OFF)
- `trial_enabled` = true
- `premium_gym_limits` = true (문서/플래그; 기존 한도 로직은 `subscription_plan` 유지)

코드 수정 없이 DB에서 ON/OFF. `requireFeature('key')`로 라우트 가드 가능.

---

## 9. Webhook 구조

1. `POST /webhook/:provider` → controller
2. Provider `verifyWebhook` (서명 검증 + 이벤트 정규화)
3. `billing.service.applyWebhookEvent` (payment_history / subscription 반영)

현재는 Dummy 파서로 mock JSON만 처리.

---

## 10. 향후 Toss Payments 연동

1. `providers/toss/toss.provider.ts`에 Toss API 구현
2. `provider.factory.ts`에 `case 'toss'` 등록
3. env: `PAYMENT_PROVIDER=toss`, `TOSS_SECRET_KEY`, `TOSS_WEBHOOK_SECRET`
4. `feature_flags.checkout_enabled = true`
5. Webhook: `/webhook/toss` 서명 검증을 Toss adapter로 교체

---

## 11. 향후 PortOne 연동

1. `portone.provider.ts` 구현 (아임포트 REST)
2. factory 등록 + `PAYMENT_PROVIDER=portone`
3. `PORTONE_API_KEY` / `PORTONE_API_SECRET` / webhook secret

---

## 12. 향후 Lemon Squeezy 연동

1. `lemonsqueezy.provider.ts` + Checkout/Subscription API
2. `PAYMENT_PROVIDER=lemonsqueezy`
3. Signing secret으로 `/webhook/lemonsqueezy` 검증

---

## 13. 향후 Polar.sh 연동

1. `polar.provider.ts`
2. `PAYMENT_PROVIDER=polar`
3. Polar webhook → normalize → `applyWebhookEvent`

---

## 14. 향후 Stripe 연동

1. `stripe.provider.ts` (Checkout Session / Customer Portal)
2. `PAYMENT_PROVIDER=stripe`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`
3. Stripe Event → WebhookEvent 매핑

---

## 15. 향후 Google Play Billing 연동

1. `google-play.provider.ts` (Play Developer API purchase verify)
2. `PAYMENT_PROVIDER=google`
3. RTDN / PubSub → `/webhook/google`

---

## 16. 향후 Apple App Store IAP 연동

1. `apple.provider.ts` (App Store Server API)
2. `PAYMENT_PROVIDER=apple`
3. Server Notifications V2 → `/webhook/apple`

---

## 환경변수

```bash
PAYMENT_PROVIDER=dummy   # toss|portone|lemonsqueezy|polar|stripe|google|apple
```

## 마이그레이션

```bash
npm run db:migrate
```

`097` 적용 필요. (이전에 `096`이 미적용이면 함께 적용)

## 프론트

- 마이페이지: 현재 플랜 / 체험 / 시작·종료일 + 결제 버튼 **준비중**
- 관리자: `/admin/subscriptions` 검색·플랜변경·연장·종료
