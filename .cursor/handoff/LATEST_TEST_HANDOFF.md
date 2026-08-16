# Test handoff — Naver SEO crawl fixes

## Summary
robots Allow:/, sitemap includes https://machine-fit.com/, home canonical/OG/JSON-LD on apex, brand title updated. Cloudflare 301→rewrite still required (docs/NAVER_SEO.md).

## Git
- Branch: `main`
- Commit: _(after push)_

## Test focus
1. npm run seo:validate in frontend
2. After deploy: robots/sitemap content
3. CF rewrite for / → 200

## As-is → To-be
- **As-is:** Apex 301 + weak brand home signals
- **To-be:** Code-side SEO aligned to apex; CF rewrite ops step
