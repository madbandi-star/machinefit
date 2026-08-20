# PRO tips OEM rollout handoff

## Done on main
| Brand | V / P / N | Migration | Deploy |
|-------|-----------|-----------|--------|
| … GYM80–GYMLECO | … | 168–171 | `1a6efe2` |
| WATSON | 64 / 13 / 3 | 172 | `e001902` live |
| TELJU | 45 / 17 / 18 | 173 | `e001902` live |
| NEWTECH | 47 / 12 / 21 | 174 | `e001902` live |
| DRAX | 51 / 19 / 10 | 175 | `e001902` live |
| LEXCO | 46 / 18 / 16 | 176 | PR pending |
| BODYSTONE | 30 / 20 / 30 | 177 | PR pending |
| FOCUS | 0 / 0 / 80 | 178 | PR pending (no public SKUs) |
| MIGANG | 18 / 7 / 55 | 179 | PR pending |

## Pipeline
```bash
node database/scripts/generate-oem-pro-tips.mjs --brand=CODE
npm run db:validate-pro-tips -- database/catalog/pro-tips/<slug>_pro_tips.csv --brand=CODE
node database/scripts/export-oem-pro-tips-migration.mjs --brand=CODE --migration=NNN_<slug>_pro_tips.sql
```

## Next (4 remaining — final batch)
TGS_STRENGTH → IKK_SPORTS → STEX → EDITION80

## Notes
- Branch: `cursor/oem-pro-tips-lexco-migang-35b3`
- LEXCO: Master/Falcon/LP · BODYSTONE: SW Club/Kairos · FOCUS: all NOT_FOUND (no public catalog) · MIGANG: Power Gym
- Tip identity = 0; no API/UI/recommend changes
- Deploy via Render migrate after merge to main
