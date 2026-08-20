# PRO tips OEM rollout handoff

## Done
- HAMMER_STRENGTH (80) — migration 155 on main
- LIFE_FITNESS (80) — VERIFIED 34 / PARTIAL 35 / NOT_FOUND 11 — migration 156
- NAUTILUS (80) — VERIFIED 24 / PARTIAL 45 / NOT_FOUND 11 — migration 157

## Pipeline
```bash
node database/scripts/generate-oem-pro-tips.mjs --brand=CODE
npm run db:validate-pro-tips -- database/catalog/pro-tips/<slug>_pro_tips.csv --brand=CODE
node database/scripts/export-oem-pro-tips-migration.mjs --brand=CODE --migration=NNN_<slug>_pro_tips.sql
# Prefer migration deploy (Render). Direct import needs working DATABASE_URL:
npm run db:import-pro-tips -- database/catalog/pro-tips/<slug>_pro_tips.csv --brand=CODE --clear-brand
```

## Next brands (seed order)
CYBEX → HOIST → MATRIX → PRECOR → PRIME_FITNESS → ARSENAL_STRENGTH → FREEMOTION → PARAMOUNT → ROGERS_STRENGTH → PANATTA → GYM80 → TECHNOGYM → ATLANTIS → GYMLECO → WATSON → TELJU → NEWTECH → DRAX → LEXCO → BODYSTONE → FOCUS → MIGANG → TGS_STRENGTH → IKK_SPORTS → STEX → EDITION80

## Notes
- Do not change API/UI/recommend logic
- No template copy-paste across brands (cross-brand tip identity must stay 0)
- Trainer coaching style (ONE KEY CUE … MACHINE FIT PRO TIP); no verification dumps in tip body
