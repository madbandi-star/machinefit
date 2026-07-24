#!/usr/bin/env python3
"""Convert OSM KR gym crawl JSON into gym_directory seed SQL."""
from __future__ import annotations

import json
import re
import uuid
from pathlib import Path

RAW = Path("/workspace/database/seeds/kr_gym_directory_raw.json")
OUT = Path("/workspace/database/seeds/kr_gym_directory.sql")

CHAIN_SUFFIXES = [
    "피트니스",
    "헬스",
    "짐",
    "GYM",
    "Gym",
    "휘트니스",
    "클럽",
]


def normalize(name: str) -> str:
    return re.sub(r"\s+", "", name).lower()


def esc(value: str | None) -> str:
    if value is None:
        return "NULL"
    return "'" + value.replace("'", "''") + "'"


def coords(el: dict) -> tuple[float | None, float | None]:
    if "lat" in el and "lon" in el:
        return float(el["lat"]), float(el["lon"])
    center = el.get("center") or {}
    if "lat" in center and "lon" in center:
        return float(center["lat"]), float(center["lon"])
    return None, None


def main() -> None:
    raw = json.loads(RAW.read_text(encoding="utf-8"))
    rows: list[dict] = []
    seen_names: set[str] = set()

    for el in raw.get("elements", []):
        tags = el.get("tags") or {}
        name = (tags.get("name") or tags.get("name:ko") or "").strip()
        if not name or len(name) < 2:
            continue
        key = normalize(name)
        # keep duplicates across cities; unique by osm id
        lat, lon = coords(el)
        city = (
            tags.get("addr:city")
            or tags.get("addr:county")
            or tags.get("addr:province")
            or tags.get("is_in:city")
        )
        district = tags.get("addr:district") or tags.get("addr:suburb") or tags.get("addr:neighbourhood")
        state = tags.get("addr:state") or tags.get("addr:province") or tags.get("is_in:state")
        address = tags.get("addr:full") or tags.get("addr:street")
        if address and tags.get("addr:housenumber"):
            address = f"{address} {tags['addr:housenumber']}"
        rows.append(
            {
                "id": str(uuid.uuid5(uuid.NAMESPACE_URL, f"osm:{el.get('type')}:{el.get('id')}")),
                "name": name,
                "name_normalized": key,
                "address": address,
                "state_name": state,
                "city_name": city,
                "district_name": district,
                "lat": lat,
                "lon": lon,
                "source_ref": f"{el.get('type')}:{el.get('id')}",
            }
        )
        seen_names.add(key)

    lines = [
        "-- Auto-generated from OSM KR fitness_centre / gym crawl.",
        "-- Location FKs are resolved after insert via name matching.",
        "",
        "INSERT INTO gym_directory (",
        "  id, name, name_normalized, address, state_name, city_name, district_name,",
        "  latitude, longitude, source, source_ref, is_active",
        ")",
        "VALUES",
    ]

    value_sql = []
    for r in rows:
        value_sql.append(
            "("
            + ", ".join(
                [
                    esc(r["id"]) + "::uuid",
                    esc(r["name"]),
                    esc(r["name_normalized"]),
                    esc(r["address"]),
                    esc(r["state_name"]),
                    esc(r["city_name"]),
                    esc(r["district_name"]),
                    "NULL" if r["lat"] is None else str(r["lat"]),
                    "NULL" if r["lon"] is None else str(r["lon"]),
                    esc("osm"),
                    esc(r["source_ref"]),
                    "TRUE",
                ]
            )
            + ")"
        )

    lines.append(",\n".join(value_sql) + "")
    lines.append("ON CONFLICT (source, source_ref) DO NOTHING;")
    lines.append("")
    lines.append("-- Resolve location FKs from crawled admin names / nearest city when possible.")
    lines.append(
        """
UPDATE gym_directory d
SET state_id = s.id,
    state_name = COALESCE(d.state_name, s.name->>'ko')
FROM location_states s
WHERE d.state_id IS NULL
  AND s.country_code = 'KR'
  AND d.state_name IS NOT NULL
  AND (
    d.state_name ILIKE '%' || (s.name->>'ko') || '%'
    OR d.state_name ILIKE '%' || (s.name->>'en') || '%'
    OR (s.name->>'ko') ILIKE '%' || d.state_name || '%'
  );

UPDATE gym_directory d
SET city_id = c.id,
    city_name = COALESCE(d.city_name, c.name->>'ko'),
    state_id = COALESCE(d.state_id, c.state_id)
FROM location_cities c
WHERE d.city_id IS NULL
  AND d.city_name IS NOT NULL
  AND (
    d.city_name ILIKE '%' || (c.name->>'ko') || '%'
    OR (c.name->>'ko') ILIKE '%' || d.city_name || '%'
  );

UPDATE gym_directory d
SET district_id = x.id,
    district_name = COALESCE(d.district_name, x.name->>'ko'),
    city_id = COALESCE(d.city_id, x.city_id)
FROM location_districts x
WHERE d.district_id IS NULL
  AND d.district_name IS NOT NULL
  AND (
    d.district_name ILIKE '%' || (x.name->>'ko') || '%'
    OR (x.name->>'ko') ILIKE '%' || d.district_name || '%'
  );
""".strip()
    )

    OUT.write_text("\n".join(lines) + "\n", encoding="utf-8")
    print(f"wrote {OUT} rows={len(rows)}")


if __name__ == "__main__":
    main()
