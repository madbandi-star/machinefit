# PRO tips OEM rollout handoff

## Done
- HAMMER_STRENGTH (80) — migration 155 on main
- LIFE_FITNESS (80) — V34 / P35 / N11 — migration 156
- NAUTILUS (80) — V24 / P45 / N11 — migration 157
- CYBEX (80) — V14 / P54 / N12 — migration 158

## Pipeline
```bash
node database/scripts/generate-oem-pro-tips.mjs --brand=CODE
npm run db:validate-pro-tips -- database/catalog/pro-tips/<slug>_pro_tips.csv --brand=CODE
node database/scripts/export-oem-pro-tips-migration.mjs --brand=CODE --migration=NNN_<slug>_pro_tips.sql
```

## Next
HOIST → MATRIX → PRECOR → PRIME_FITNESS → ARSENAL_STRENGTH → FREEMOTION → PARAMOUNT → ROGERS_STRENGTH → PANATTA → GYM80 → TECHNOGYM → ATLANTIS → GYMLECO → WATSON → TELJU → NEWTECH → DRAX → LEXCO → BODYSTONE → FOCUS → MIGANG → TGS_STRENGTH → IKK_SPORTS → STEX → EDITION80

## Notes
- No API/UI/recommend changes
- Cross-brand tip identity must stay 0
- Trainer coaching style; deploy via Render migrate (agent DB auth failed)
