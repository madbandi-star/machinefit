# PRO tips OEM rollout handoff

## Status: COMPLETE (all OEM brands through EDITION80)

| Brand | V / P / N | Migration | Deploy |
|-------|-----------|-----------|--------|
| … LEXCO–MIGANG | … | 176–179 | `043dde3` live |
| TGS_STRENGTH | 0 / 0 / 80 | 180 | PR pending |
| IKK_SPORTS | 20 / 19 / 41 | 181 | PR pending |
| STEX | 0 / 0 / 80 | 182 | PR pending |
| EDITION80 | 0 / 0 / 80 | 183 | PR pending |

## Pipeline
```bash
node database/scripts/generate-oem-pro-tips.mjs --brand=CODE
npm run db:validate-pro-tips -- database/catalog/pro-tips/<slug>_pro_tips.csv --brand=CODE
node database/scripts/export-oem-pro-tips-migration.mjs --brand=CODE --migration=NNN_<slug>_pro_tips.sql
```

## Remaining
**0** OEM brands left after this PR merges.

## Notes
- Branch: `cursor/oem-pro-tips-tgs-edition80-35b3`
- TGS / STEX / EDITION80: no public strength SKU catalogs → all NOT_FOUND (gym-unit pattern tips still generated)
- IKK Sports: plate-loaded / cable lineup from ikksports.com
- Tip identity = 0; no API/UI/recommend changes
- Deploy via Render migrate after merge to main
