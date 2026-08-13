# Test handoff: Stop collecting OAuth user emails

## Summary
MachineFit no longer stores, returns, or displays OAuth account emails. Login continues with `(provider, provider_user_id)`. Migration `130` nulls existing emails and adds a partial unique index for any future non-null emails.

## Git
- Branch: `main`
- Commit: `e61fe486`

## Test focus
1. OAuth login / signup / rejoin still works (provider link only).
2. `/auth` responses: `user.email === ''`; access JWT has no email.
3. My Page: no email row / copy UI.
4. Linked providers: status text only (no provider email).
5. Workout report: view + copy only (no send-to-my-email).
6. Billing checkout: Polar payload has no `customer_email`.
7. Admin users: no real account email shown.

## Fast checks (no Pages wait)
```powershell
Test-Path database/migrations/130_remove_user_email_storage.sql
rg -n "providerEmail: null|email: ''|customer_email" backend/server
rg -n "openid profile|scope: 'name'" frontend/src/utils/oauthClient.ts
rg -n "handleCopyEmail|myPage\.email" frontend/src/pages/my-page/MyPage.tsx
```

## Production checks
- Apply migration **130** on Render DB
- Redeploy Render backend + GitHub Pages frontend
- Smoke OAuth login for an existing linked account

## as-is → to-be
- **as-is:** OAuth emails stored on `users` / `auth_providers` and returned in JWT/UI
- **to-be:** Emails nulled; API returns `''`; UI does not show account email; login by provider id
