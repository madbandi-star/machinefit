# PRO tips OEM rollout handoff

## Done on main
| Brand | V / P / N | Migration | Deploy |
|-------|-----------|-----------|--------|
| … FREEMOTION–PANATTA | … | 163–167 | `ce262be` |
| GYM80 | 29 / 45 / 6 | 168 | `1a6efe2` live |
| TECHNOGYM | 23 / 47 / 10 | 169 | `1a6efe2` live |
| ATLANTIS | 35 / 37 / 8 | 170 | `1a6efe2` live |
| GYMLECO | 33 / 41 / 6 | 171 | `1a6efe2` live |
| WATSON | 64 / 13 / 3 | 172 | PR pending |
| TELJU | 45 / 17 / 18 | 173 | PR pending |
| NEWTECH | 47 / 12 / 21 | 174 | PR pending |
| DRAX | 51 / 19 / 10 | 175 | PR pending |

## Pipeline
```bash
node database/scripts/generate-oem-pro-tips.mjs --brand=CODE
npm run db:validate-pro-tips -- database/catalog/pro-tips/<slug>_pro_tips.csv --brand=CODE
node database/scripts/export-oem-pro-tips-migration.mjs --brand=CODE --migration=NNN_<slug>_pro_tips.sql
```

## Next (8 remaining)
LEXCO → BODYSTONE → FOCUS → MIGANG → TGS_STRENGTH → IKK_SPORTS → STEX → EDITION80

## Notes
- Branch: `cursor/oem-pro-tips-watson-drax-35b3`
- WATSON: Plate Loaded / Animal · TELJU: SHOCK · NEWTECH: OnHim / M-Torture · DRAX: Welliv / Pure Plate / Forge
- Canonical 80 machine names; no API/UI/recommend changes; tip identity = 0
- Deploy via Render migrate after merge to main
