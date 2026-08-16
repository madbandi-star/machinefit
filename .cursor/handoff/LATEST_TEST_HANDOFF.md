# Test handoff ? Banner not showing

## Summary
Production `GET /banners/public/*` returned `banners: []` for all 5 slots. Marketing consent alone cannot show creatives if the server filters them out. Fix: public list accepts desktop **or** mobile image; mobile upload also fills desktop when empty; admin UI lists explicit blockers (inactive / no image / no slots / schedule).

## Git
- Branch: `main`
- Commit: _(filled after commit)_

## Test focus
1. Admin → 배너 목록: banners show **미노출** with reasons when inactive or no image.
2. Edit banner: Status **활성**, upload image, slots checked, leave start/end empty → **노출 가능**.
3. App user with marketing opt-in: scroll to bottom of Home / My ? banner appears.
4. After backend redeploy (+ migration 139 if needed): `GET .../banners/public/MAIN_BOTTOM` non-empty.

## Fast checks
```bash
rg -n "mobile_image_url IS NOT NULL|getBannerPublishBlockers|139_banner" backend frontend database
```

## Production
- Render: redeploy backend; optionally run `139_banner_public_image_fallback.sql` for existing mobile-only rows.
- Confirm public API then returns banners when admin status=active + image present.

## as-is → to-be
- **as-is:** Slots + marketing set; app shows nothing; public API empty.
- **to-be:** Admin shows why not live; public API returns creatives when active+image; users with marketing consent see page-bottom banners.
