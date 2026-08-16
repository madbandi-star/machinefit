# Test handoff — Unified ad placement system

## Summary
Central ad policy engine + AdSlot over existing CMS banners. Interstitial/sticky/rewarded/native stay **flag OFF** until admin enables. **Apply migration 140** on Postgres, then Render redeploy.

## Git
- Branch: `main`
- Commit: pending

## Test focus
1. Free user + marketing opt-in: home/my bottom CMS still works.
2. Paid/admin: CMS denied (`AUDIENCE_BLOCKED`) unless policy toggled.
3. `/admin/ads`: flags, placements, frequency, stats.
4. Flags off: no interstitial on navigate / workout complete.
5. Quota 429: LIMIT_REACHED event fires; rewarded UI only if `REWARDED_AD_ENABLED`.

## Fast checks
```bash
rg -n "adRouter|/ads/decision|AdSlot|140_ad_placement" backend frontend database shared
npm run build --workspace=shared
```

## as-is → to-be
- **as-is:** Bottom CMS only, client marketing gate, no frequency caps.
- **to-be:** Server decision + caps + admin flags; CMS via AdSlot; SDK-ready mock provider.
