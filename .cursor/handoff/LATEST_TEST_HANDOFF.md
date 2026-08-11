# Test handoff — Polar paid events, refund lock, withdraw cancel, audio HMAC

## Summary
Premium is granted only on Polar `order.paid` / subscription cycle. Refunded users need a new paid order. Withdraw immediately revokes Polar (retry job + DR alert). Motivation audio requires HMAC; request images respect `is_hidden`.

## Test focus
1. Webhook `order.created` / `subscription.updated` does not grant Premium
2. After refund, `subscription.updated` does not restore Premium; `order.paid` does
3. Withdraw with Polar id: cancel retry row if Polar fails; local entitlement ends
4. GET `/media/motivation-audio/...` without `mexp`/`msig` → 401
5. Hidden machine-request image token → 404

## Fast checks
```
npx tsx backend/server/payments/polar/polar-event-map.test.ts
npx tsx backend/server/payments/webhook-activate-policy.test.ts
```

## as-is → to-be
- as-is: order.created / subscription.updated activated Premium; Polar cancel on withdraw swallowed; audio URLs public
- to-be: paid events only; refund lock; Polar revoke + retry; HMAC audio
