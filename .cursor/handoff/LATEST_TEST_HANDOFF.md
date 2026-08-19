# Test handoff — MachineFit PRO tips

## Summary
Admin **주의·팁** editor now includes **머신핏PRO팁** (`machines.pro_tips`, JSONB `{ko:[],en:[]}`). App validation: **max 5000 UTF-8 bytes per locale** (and per line).

## Test focus
1. Admin → 주의·팁 → open a machine → see 머신핏PRO팁 section
2. Save ko/en PRO tips → reload → values persist
3. Oversized content (>5000 UTF-8 bytes for one locale) → save fails validation
4. Confirm migration `153_machinefit_pro_tips.sql` applied on DB (column already existed from 034; comment/ensure)

## Fast checks
- `npm run build --workspace=shared`
- Grep: `proTips` in `AdminMachineTipsPage.tsx` and `5000` in `admin-catalog.schema.ts`

## As-is → To-be
- **as-is:** Admin only edited warnings + tips; `pro_tips` unused in admin UI
- **to-be:** Admin can manage MachineFit PRO tips with 5000-byte locale limit

**Branch:** `main`  
**Commit:** `5e201c81`
