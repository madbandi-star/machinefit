# Secret / OAuth key rotation

MachineFit must not commit live API keys. OAuth **client** ids used by the SPA are
loaded at runtime from the API (`GET /api/v1/auth/oauth/client-config`) backed by
**Render environment variables**.

## What leaked (repo history)

These values were previously hardcoded in `.github/workflows/frontend-deploy.yml`
and/or `render.yaml`. Treat them as **compromised** and rotate:

| Item | Where it lived | Action |
|------|----------------|--------|
| Google OAuth Web Client ID (`…apps.googleusercontent.com`) | workflow + `render.yaml` | Google Cloud Console → APIs & Services → Credentials → create a **new** OAuth 2.0 Client ID (Web), restrict Authorized JavaScript origins / redirect URIs to `https://machine-fit.com` and `https://madbandi-star.github.io`. Delete or disable the old client after cutover. |
| Kakao JavaScript key | workflow | Kakao Developers → App → App keys → **reissue JavaScript key** (or create a new app key and retire the old). Restrict site domain. |
| Kakao REST API key / Client secret | Render only (never commit) | Reissue in Kakao Developers if unsure; update Render `KAKAO_REST_API_KEY` / `KAKAO_CLIENT_SECRET`. |

> Google Client ID and Kakao JS key are *browser-visible by design* after the SPA
> fetches them. The goal of this change is: **not in git**, **not baked into the
> Pages bundle at build time**, and **rotatable via Render without a frontend rebuild**.

## Render env (source of truth)

Set / update on **machinefit-api → Environment**:

```text
GOOGLE_CLIENT_ID=<new google web client id>
KAKAO_JS_KEY=<new kakao javascript key>
KAKAO_REST_API_KEY=<kakao rest api key>
KAKAO_CLIENT_SECRET=<optional>
APPLE_CLIENT_ID=<optional>
APPLE_REDIRECT_URI=<optional>
```

> **Do not paste `KEY=value` into the Value field.** Render already has the key name.
> Wrong: `GOOGLE_CLIENT_ID=6000….apps.googleusercontent.com`  
> Right: `6000….apps.googleusercontent.com`  
> A prefixed value causes Google `401 invalid_client` / “OAuth client was not found”.

Then **Manual Deploy** (or restart) so the process picks up env. SPA clients refresh
the config within ~60s (`Cache-Control`) or on next full page load.

## After rotation checklist

1. Update Render env with **new** values (do not put them in git).
2. Redeploy backend.
3. Confirm `GET https://<api>/api/v1/auth/oauth/client-config` returns the new ids (no secrets beyond the JS key / client ids).
4. Smoke-test Kakao + Google login on production.
5. In provider consoles, **delete / disable** the old keys.
6. Optionally run `npm run secrets:scan` to ensure hardcoded patterns are gone from the tree.

## Local development

`backend/.env`:

```text
GOOGLE_CLIENT_ID=...
KAKAO_JS_KEY=...
KAKAO_REST_API_KEY=...
```

Optional frontend-only fallback (dev convenience, never for Pages CI):

```text
VITE_GOOGLE_CLIENT_ID=...
VITE_KAKAO_JS_KEY=...
```

## Other secrets (never in the SPA)

| Secret | Store |
|--------|--------|
| `DATABASE_URL`, `JWT_*`, `SUPABASE_SERVICE_ROLE_KEY` | Render |
| `POLAR_ACCESS_TOKEN`, `POLAR_WEBHOOK_SECRET` | Render |
| `RESEND_API_KEY`, `SMTP_PASS` | Render |
| `SENTRY_DSN` (backend) / `VITE_SENTRY_DSN` (frontend DSN is public-ish) | Render / GitHub Actions secrets |
| `SENTRY_AUTH_TOKEN` | GitHub Actions secrets only |
