# PRO tips OEM rollout handoff

## Done (after HS on main)
| Brand | V / P / N | Migration |
|-------|-----------|-----------|
| LIFE_FITNESS | 34 / 35 / 11 | 156 |
| NAUTILUS | 24 / 45 / 11 | 157 |
| CYBEX | 14 / 54 / 12 | 158 |
| HOIST | 24 / 44 / 12 | 159 |

## Pipeline
```bash
node database/scripts/generate-oem-pro-tips.mjs --brand=CODE
npm run db:validate-pro-tips -- database/catalog/pro-tips/<slug>_pro_tips.csv --brand=CODE
node database/scripts/export-oem-pro-tips-migration.mjs --brand=CODE --migration=NNN_<slug>_pro_tips.sql
```

## Next
MATRIX → PRECOR → PRIME_FITNESS → ARSENAL_STRENGTH → FREEMOTION → PARAMOUNT → ROGERS_STRENGTH → PANATTA → GYM80 → TECHNOGYM → ATLANTIS → GYMLECO → WATSON → TELJU → NEWTECH → DRAX → LEXCO → BODYSTONE → FOCUS → MIGANG → TGS_STRENGTH → IKK_SPORTS → STEX → EDITION80

## Notes
- No API/UI/recommend changes; cross-brand tip identity 0
- Deploy via Render migrate (agent DB auth failed)
