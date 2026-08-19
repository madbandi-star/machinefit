# Test handoff — PRO tips on recommendation result

## Summary
Recommendation result page shows **머신핏PRO팁** below **운동팁**. Default **collapsed** (`<details>` without `open`).

## Test focus
1. Recommend any OEM machine with imported pro_tips
2. Scroll below 운동팁 → see “머신핏PRO팁” row (collapsed)
3. Expand → long-form bilingual blob (pre-wrap)
4. Refresh result URL (`?id=`) → proTips still present

## Deploy
- **Render** redeploy required (API `proTips` field)

**Branch:** `main`  
**Commit:** pending
