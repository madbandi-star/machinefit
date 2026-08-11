# Test handoff — Stop member GPS collect/store/send

## Summary
User current location (GPS) is no longer read in the browser, not sent to MachineFit APIs, and not stored on `user_locations`. Gym search uses name + 시군구 dropdown. Facility catalog coordinates are unchanged.

## Test focus
1. Gym Finder: no 「내 주변」; region filter + search still returns gyms
2. Settings 지역·헬스장: no GPS button / locationOptIn checkbox; save works with dropdown
3. `GET /api/v1/gyms/nearby` → 404
4. `POST /api/v1/locations/reverse-geocode` → 404
5. `PUT /locations/me` with latitude/longitude still saves region only (GPS null)
6. Signup terms: no GPS location consent row
7. After Render migrate 119, existing `user_locations` GPS columns are null

## as-is → to-be
- as-is: GPS to nearby/reverse-geocode + optional DB store
- to-be: no member GPS; manual region only

## Fast checks
`rg -n "getCurrentPosition|navigator.geolocation|/gyms/nearby" frontend backend --glob "*.{ts,tsx}"`
