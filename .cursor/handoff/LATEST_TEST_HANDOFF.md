# Test handoff — PRO tips meta + HAMMER_STRENGTH pilot

## Summary

Phase **A** (infrastructure) and Phase **B** pilot for **HAMMER_STRENGTH** are implemented locally.

- New column: `machines.pro_tips_meta` (migration `154_pro_tips_meta.sql`) — applied on dev DB
- Import script saves meta + supports `--brand=CODE`, `--clear-brand`, `--clear-first`
- Validate script supports `--single-brand`, meta quality checks (VERIFIED requires source_url, no template phrases)
- Generated + imported **80** HAMMER_STRENGTH PRO tips with verification metadata

## Verification counts (HAMMER_STRENGTH)

| Status | Count |
|--------|------:|
| VERIFIED | 52 |
| PARTIALLY_VERIFIED | 16 |
| BRAND_MODEL_NOT_FOUND | 12 |

## Fast checks

```bash
node database/scripts/validate-pro-tips-csv.mjs database/catalog/pro-tips/hammer_strength_pro_tips.csv --single-brand --brand=HAMMER_STRENGTH
npm run db:import-pro-tips -- database/catalog/pro-tips/hammer_strength_pro_tips.csv --dry-run --brand=HAMMER_STRENGTH
```

## DB spot-check (after import)

```sql
SELECT pro_tips_meta->>'verification_status' AS status, COUNT(*)
FROM machines m JOIN brands b ON b.id = m.brand_id
WHERE b.code = 'HAMMER_STRENGTH' AND m.is_active
GROUP BY 1;
-- expect 52 / 16 / 12
```

## As-is → To-be

- **As-is:** Template pro_tips for all 2,320 OEM machines; no verification metadata.
- **To-be:** HAMMER_STRENGTH 80 machines have manufacturer-verified tips + `pro_tips_meta`; other brands unchanged until rolled out brand-by-brand.

## Note

Production DB needs migration `154` before importing other brands. No API/UI contract change — recommendation still reads `pro_tips` text only.
