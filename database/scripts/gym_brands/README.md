# Brand gym location collectors

Modular collectors for nationwide chain gyms used by register/settings autocomplete.

## Brands

- 스포애니 (official site `branch.php` — includes lat/lng)
- 짐박스, 고투피트니스, 에이블짐, 더블유짐, 휘트니스M, 스포짐, 팀윤짐, 바디채널, 커브스, 헬스보이짐  
  (Kakao Map place search — road address + lat/lng)

## Add a brand

1. Append a `BrandSpec` in `collectors.py`
2. `python collect_all.py <브랜드명>`
3. `python rebuild_all_brands.py` (optional merge) or re-run `collect_all.py`
4. `python build_migration.py` → writes `065_…` (or bump migration number)

## Output

- `database/seeds/gym_brands/*.json`
- `database/seeds/gym_brands/all_brands.json`
- Migration upserts into `gym_directory` with `source='brand_chain'`
