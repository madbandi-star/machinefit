# Naver / Google SEO — Cloudflare rewrite (required)

## Critical production issue (verified 2026-08-16)

`https://machine-fit.com/` currently responds with **HTTP 301** → `https://machine-fit.com/machinefit/`.

The SPA still deploys under Vite `base: '/machinefit/'` (GitHub project Pages). SEO tags now treat the **marketing home** as:

- Canonical / `og:url` / WebSite JSON-LD: `https://machine-fit.com/`
- Deep links remain: `https://machine-fit.com/machinefit/...`

If Cloudflare keeps a **301 redirect** from `/` → `/machinefit/`, crawlers see a redirect ↔ canonical conflict and brand queries like “머신핏” are harder to attach to the apex domain.

## Required Cloudflare change

Replace the **301 Redirect** with a **URL Rewrite** (or Transform Rule) so that:

| Browser URL | Edge behavior | Status |
|---|---|---|
| `https://machine-fit.com/` | Internally serve `/machinefit/` (or `/machinefit/index.html`) | **200** |
| `https://machine-fit.com/robots.txt` | Serve static `robots.txt` (already at Pages root via public/) | **200** |
| `https://machine-fit.com/sitemap.xml` | Serve static `sitemap.xml` | **200** |

Do **not** use Bot Fight Mode / WAF rules that challenge or block **Yeti** (Naver) or Googlebot.

## After the rewrite

1. Redeploy frontend (already pushes `robots.txt` / `sitemap.xml` / SEO `index.html`).
2. In Naver Search Advisor: resubmit `https://machine-fit.com/` and sitemap.
3. In Google Search Console: request indexing for `/` and inspect live URL.
4. Confirm live HTML: `curl -sI https://machine-fit.com/` → **200** (not 301).

## What code already fixed

- `Allow: /` robots policy (no accidental crawl lock)
- Single sitemap pointer
- Sitemap includes `https://machine-fit.com/`
- Home title/description/canonical/OG/JSON-LD brand “머신핏”
- Naver + Google site-verification meta retained
