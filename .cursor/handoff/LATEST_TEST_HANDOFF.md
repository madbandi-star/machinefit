# Test handoff — PRO tips CSV import

## Summary
Imported **2,320** MachineFit PRO tips from CSV into `machines.pro_tips` (ko/en, one blob per locale).

## Commands
```bash
npm run db:validate-pro-tips -- "<csv-path>"
npm run db:import-pro-tips -- "<csv-path>" --dry-run
npm run db:import-pro-tips -- "<csv-path>"
```

## Test focus
1. Admin → 주의·팁 → pick any OEM machine → 머신핏PRO팁 filled
2. Content is long-form (sections/emojis), not line-split bullets
3. English column present for all rows

## Import result (local run)
- **Updated:** 2320 machines
- **Verify:** 2320 / 2320 OEM machines have `pro_tips.ko`

## As-is → To-be
- **as-is:** Empty pro_tips on catalog machines
- **to-be:** Full bilingual PRO tip content per brand×80 machine

**Branch:** `main`  
**Commit:** pending
