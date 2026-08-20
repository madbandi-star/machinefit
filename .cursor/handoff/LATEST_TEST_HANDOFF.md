# PRO tips OEM rollout handoff

## Done (after HS on main)
| Brand | V / P / N | Migration | Deploy |
|-------|-----------|-----------|--------|
| LIFE_FITNESS … PANATTA | … | 156–167 | main `ce262be` / Render live |
| GYM80 | 29 / 45 / 6 | 168 | PR pending |
| TECHNOGYM | 23 / 47 / 10 | 169 | PR pending |
| ATLANTIS | 35 / 37 / 8 | 170 | PR pending |
| GYMLECO | 33 / 41 / 6 | 171 | PR pending |

## Pipeline
```bash
node database/scripts/generate-oem-pro-tips.mjs --brand=CODE
npm run db:validate-pro-tips -- database/catalog/pro-tips/<slug>_pro_tips.csv --brand=CODE
node database/scripts/export-oem-pro-tips-migration.mjs --brand=CODE --migration=NNN_<slug>_pro_tips.sql
```

## Next (12 remaining)
WATSON → TELJU → NEWTECH → DRAX → LEXCO → BODYSTONE → FOCUS → MIGANG → TGS_STRENGTH → IKK_SPORTS → STEX → EDITION80

## Notes
- Branch: `cursor/oem-pro-tips-gym80-gymleco-35b3`
- Research remapped to canonical 80 machine names (freemotion list)
- GYM80: Pure Kraft / Sygnum · TECHNOGYM: Selection / Pure Strength · ATLANTIS: P/PW · GYMLECO: plate/selector
- No API/UI/recommend changes; cross-brand tip identity = 0
- Deploy via Render migrate after merge to main
