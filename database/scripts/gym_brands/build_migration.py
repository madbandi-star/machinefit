"""Build gym_directory migration SQL from all_brands.json (geocoded lat/lng required)."""
from __future__ import annotations

import json
import re
import uuid
from pathlib import Path

from common import esc_sql

SEED = Path(__file__).resolve().parents[2] / "seeds" / "gym_brands" / "all_brands.json"
OUT = Path(__file__).resolve().parents[2] / "migrations" / "065_gym_directory_brand_chains.sql"


def normalize(name: str) -> str:
    return re.sub(r"\s+", "", name).lower()


def parse_region(address: str) -> tuple[str | None, str | None]:
    """Best-effort state/city labels from KR road address for FK resolution."""
    parts = address.split()
    if not parts:
        return None, None
    state = parts[0]
    # Normalize short forms
    aliases = {
        "서울": "서울특별시",
        "부산": "부산광역시",
        "대구": "대구광역시",
        "인천": "인천광역시",
        "광주": "광주광역시",
        "대전": "대전광역시",
        "울산": "울산광역시",
        "세종": "세종특별자치시",
        "경기": "경기도",
        "강원": "강원특별자치도",
        "충북": "충청북도",
        "충남": "충청남도",
        "전북": "전북특별자치도",
        "전남": "전라남도",
        "경북": "경상북도",
        "경남": "경상남도",
        "제주": "제주특별자치도",
    }
    state = aliases.get(state, state)
    city = parts[1] if len(parts) > 1 else None
    # For 시/군/구 labels keep as-is; multi-gu cities often "수원시 영통구" style later
    if city and city.endswith(("시", "군", "구")):
        return state, city
    return state, city


def main() -> None:
    rows = json.loads(SEED.read_text(encoding="utf-8"))
    # Upsert key is (source, source_ref) — keep first occurrence only.
    seen_refs: set[str] = set()
    deduped = []
    for row in rows:
        ref = row["source_ref"]
        if ref in seen_refs:
            continue
        seen_refs.add(ref)
        deduped.append(row)
    rows = deduped

    values: list[str] = []
    for row in rows:
        brand = row["brand"]
        name = row["name"]
        address = row["address"]
        lat = float(row["latitude"])
        lng = float(row["longitude"])
        source_ref = row["source_ref"]
        if len(source_ref) > 80:
            source_ref = source_ref[:80]
        state, city = parse_region(address)
        rid = str(uuid.uuid5(uuid.NAMESPACE_URL, f"brand_chain:{source_ref}"))
        values.append(
            "("
            f"'{rid}'::uuid, {esc_sql(name)}, {esc_sql(normalize(name))}, {esc_sql(brand)}, "
            f"{esc_sql(address)}, {esc_sql(state)}, {esc_sql(city)}, NULL, "
            f"{lat}, {lng}, 'brand_chain', {esc_sql(source_ref)}, TRUE)"
        )

    lines = [
        "-- Brand-chain gym directory (geocoded). Upsert by (source, source_ref).",
        "-- Brands: 스포애니, 짐박스, 고투피트니스, 에이블짐, 더블유짐, 휘트니스M, 스포짐, 팀윤짐, 바디채널, 커브스",
        "",
        "INSERT INTO gym_directory (",
        "  id, name, name_normalized, brand, address, state_name, city_name, district_name,",
        "  latitude, longitude, source, source_ref, is_active",
        ")",
        "VALUES",
        ",\n".join(values),
        "ON CONFLICT (source, source_ref) DO UPDATE SET",
        "  name = EXCLUDED.name,",
        "  name_normalized = EXCLUDED.name_normalized,",
        "  brand = EXCLUDED.brand,",
        "  address = EXCLUDED.address,",
        "  state_name = COALESCE(EXCLUDED.state_name, gym_directory.state_name),",
        "  city_name = COALESCE(EXCLUDED.city_name, gym_directory.city_name),",
        "  latitude = EXCLUDED.latitude,",
        "  longitude = EXCLUDED.longitude,",
        "  is_active = TRUE,",
        "  updated_at = NOW();",
        "",
        "",
        "UPDATE gym_directory d",
        "SET state_id = s.id,",
        "    state_name = COALESCE(d.state_name, s.name->>'ko')",
        "FROM location_states s",
        "WHERE d.source = 'brand_chain'",
        "  AND d.state_id IS NULL",
        "  AND d.state_name IS NOT NULL",
        "  AND s.country_code = 'KR'",
        "  AND (",
        "    d.state_name ILIKE '%' || (s.name->>'ko') || '%'",
        "    OR (s.name->>'ko') ILIKE '%' || d.state_name || '%'",
        "  );",
        "",
        "UPDATE gym_directory d",
        "SET city_id = c.id,",
        "    city_name = COALESCE(d.city_name, c.name->>'ko'),",
        "    state_id = COALESCE(d.state_id, c.state_id)",
        "FROM location_cities c",
        "JOIN location_states s ON s.id = c.state_id AND s.country_code = 'KR'",
        "WHERE d.source = 'brand_chain'",
        "  AND d.city_id IS NULL",
        "  AND d.city_name IS NOT NULL",
        "  AND (",
        "    d.city_name ILIKE '%' || (c.name->>'ko') || '%'",
        "    OR (c.name->>'ko') ILIKE '%' || d.city_name || '%'",
        "  )",
        "  AND (d.state_id IS NULL OR c.state_id = d.state_id);",
        "",
        "-- Prefer brand_chain rows with coordinates when older chain seeds lack lat/lng.",
        "UPDATE gym_directory old",
        "SET is_active = FALSE, updated_at = NOW()",
        "FROM gym_directory neu",
        "WHERE old.source IN ('official_chain', 'community_famous', 'osm')",
        "  AND neu.source = 'brand_chain'",
        "  AND neu.is_active = TRUE",
        "  AND old.is_active = TRUE",
        "  AND old.name_normalized = neu.name_normalized;",
        "",
    ]
    OUT.write_text("\n".join(lines) + "\n", encoding="utf-8")
    print(f"Wrote {OUT} ({len(values)} rows)")


if __name__ == "__main__":
    main()
