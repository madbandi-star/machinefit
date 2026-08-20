# PRO tips OEM rollout handoff

## Done (after HS on main)
| Brand | V / P / N | Migration |
|-------|-----------|-----------|
| LIFE_FITNESS | 34 / 35 / 11 | 156 |
| NAUTILUS | 24 / 45 / 11 | 157 |
| CYBEX | 14 / 54 / 12 | 158 |
| HOIST | 24 / 44 / 12 | 159 |
| MATRIX | 20 / 48 / 12 | 160 |
| PRECOR | 30 / 38 / 12 | 161 |
| PRIME_FITNESS | 34 / 38 / 8 | 162 |

## Pipeline
```bash
node database/scripts/generate-oem-pro-tips.mjs --brand=CODE
npm run db:validate-pro-tips -- database/catalog/pro-tips/<slug>_pro_tips.csv --brand=CODE
node database/scripts/export-oem-pro-tips-migration.mjs --brand=CODE --migration=NNN_<slug>_pro_tips.sql
```

## Next
ARSENAL_STRENGTH → FREEMOTION → PARAMOUNT → ROGERS_STRENGTH → PANATTA → GYM80 → TECHNOGYM → ATLANTIS → GYMLECO → WATSON → TELJU → NEWTECH → DRAX → LEXCO → BODYSTONE → FOCUS → MIGANG → TGS_STRENGTH → IKK_SPORTS → STEX → EDITION80

## Notes
- Branch/PR: `cursor/life-fitness-pro-tips-35b3` → https://github.com/madbandi-star/machinefit/pull/269
- PRIME sources: Evolution (E-*), Hybrid (H-*), Plate Loaded (P-*/XP-*), FT-123, L-130, PRODIGY racks
- No API/UI/recommend changes; PRECOR↔PRIME tip identity 0
- Deploy via Render migrate (agent DB auth failed)
