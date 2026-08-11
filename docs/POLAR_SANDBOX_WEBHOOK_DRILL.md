# Polar sandbox webhook drill

Code maps only `order.paid` and `subscription.cycled`/`renewed` to Premium. Run this in Polar **Sandbox** before production charges.

## Setup

1. `PAYMENT_PROVIDER=polar`, `POLAR_SERVER=sandbox`, Polar sandbox token + webhook secret.
2. Webhook URL: `https://<api>/api/v1/polar/webhook`
3. Subscribe: `order.paid`, `order.refunded`, `order.failed`, `subscription.cycled`, `subscription.canceled`, `subscription.revoked`.
   Do not rely on `order.created` or `subscription.updated` for entitlement.

## Cases

| # | Action | Expected app state |
|---|---------|-------------------|
| A | Open checkout, abandon (order.created only if Polar sends it) | Stay FREE |
| B | Complete sandbox payment (`order.paid`) | PREMIUM |
| C | Refund in Polar dashboard | FREE, `subscription_status=refunded` |
| D | After C, replay/send `subscription.updated` | Stay FREE |
| E | After C, new sandbox `order.paid` | PREMIUM again |
| F | Withdraw a paid test user | Local CANCELED immediately; Polar subscription revoked (or `polar_cancel_retries` + DR alert if Polar down) |
| G | Send `order.paid` then `order.refunded` out of order if Polar retries | Final FREE if refund is last processed event; refund lock blocks later `updated` |

Automated mapping/policy: `npx tsx backend/server/payments/polar-webhook-scenarios.test.ts`

## Record

Date, sandbox org, webhook delivery ids, and pass/fail for A–G. Keep the log in ops wiki, not git.
