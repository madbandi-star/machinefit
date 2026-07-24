#!/usr/bin/env python3
"""Build curated DC/community-famous gym_directory migration SQL."""
from __future__ import annotations

import re
import uuid
from pathlib import Path

OUT = Path(__file__).resolve().parents[1] / "migrations" / "063_gym_directory_dc_gallery.sql"


def normalize(name: str) -> str:
    return re.sub(r"\s+", "", name).lower()


def esc(value: str | None) -> str:
    if value is None or value == "":
        return "NULL"
    return "'" + value.replace("'", "''") + "'"


# (name, state, city, district|None, address|None)
ENTRIES: list[tuple[str, str, str, str | None, str | None]] = [
    ("올라잇짐 망포점", "경기도", "수원시 영통구", None, "경기도 수원시 영통구 영통로 136"),
    ("올라잇짐", "경기도", "수원시 영통구", None, "경기도 수원시 영통구 영통로 136"),
    ("올라잇짐 만덕점", "부산광역시", "북구", None, "부산광역시 북구 만덕3로33번길 4-9"),
    ("올라잇짐 나성점", "세종특별자치시", "세종시", None, "세종특별자치시 한누리대로 253"),
    ("지방부수리 불당점", "충청남도", "천안시 서북구", None, "충청남도 천안시 서북구 검은들1길 26"),
    ("지방부수리", "충청남도", "천안시 서북구", None, "충청남도 천안시 서북구 검은들1길 26"),
    ("브이짐 김포점", "경기도", "김포시", None, "경기도 김포시 풍무로 20"),
    ("브이짐", "경기도", "김포시", None, "경기도 김포시 풍무로 20"),
    ("피플짐 천안성정점", "충청남도", "천안시 서북구", None, "충청남도 천안시 서북구 동서대로 129-12"),
    ("피플짐 천안점", "충청남도", "천안시 서북구", None, "충청남도 천안시 서북구 동서대로 129-12"),
    ("피플짐", "충청남도", "천안시 서북구", None, "충청남도 천안시 서북구 동서대로 129-12"),
    ("자마이카 신림점", "서울특별시", "관악구", None, "서울특별시 관악구 신림로 340"),
    ("자마이카", "서울특별시", "관악구", None, "서울특별시 관악구 신림로 340"),
    ("자미이카 신림점", "서울특별시", "관악구", None, "서울특별시 관악구 신림로 340"),
    ("밀리언짐 회룡점", "경기도", "의정부시", None, "경기도 의정부시 평화로 359"),
    ("밀리언짐 암사점", "서울특별시", "강동구", None, "서울특별시 강동구 상암로3길 8"),
    ("밀리언짐 목동점", "서울특별시", "양천구", None, None),
    ("밀리언짐 잠실점", "서울특별시", "송파구", None, None),
    ("밀리언짐 위례점", "경기도", "성남시 수정구", None, None),
    ("밀리언짐 상계점", "서울특별시", "노원구", None, None),
    ("로드투짐 불당점", "충청남도", "천안시 서북구", None, "충청남도 천안시 서북구 불당23로 73-27"),
    ("로드투짐", "충청남도", "천안시 서북구", None, "충청남도 천안시 서북구 불당23로 73-27"),
    ("애니핏 하남점", "경기도", "하남시", None, None),
    ("애니핏", "경기도", "하남시", None, None),
    ("동아짐 시흥점", "경기도", "시흥시", None, None),
    ("동아짐", "경기도", "시흥시", None, None),
    ("시그널 헬스장 부천", "경기도", "부천시", None, None),
    ("시그널", "경기도", "부천시", None, None),
    ("매볼 배곧점", "경기도", "시흥시", None, None),
    ("매볼", "경기도", "시흥시", None, None),
    ("쏘마 일산점", "경기도", "고양시 일산동구", None, None),
    ("쏘마", "경기도", "고양시 일산동구", None, None),
    ("바이칼 헬스장", "서울특별시", "강남구", None, None),
    ("짐80서울", "서울특별시", "강남구", None, None),
    ("콤마짐 망우역점", "서울특별시", "성동구", None, None),
    ("라이트짐 고덕2호점", "경기도", "평택시", None, None),
    ("머슬피플 청라점", "인천광역시", "서구", None, None),
    ("디에이트짐 부천상동2호점", "경기도", "부천시", None, None),
    ("트리오짐 강일점", "서울특별시", "강동구", None, None),
    ("워라밸 피트니스 천호", "서울특별시", "강동구", None, None),
    ("워라밸피트니스 방학역점", "서울특별시", "도봉구", None, None),
    ("파이어짐 오목교역점", "서울특별시", "양천구", None, None),
    ("라이언짐 암사역점", "서울특별시", "강동구", None, None),
    ("핏좋아짐 거북섬점", "경기도", "시흥시", None, None),
    ("짐라이트 고척점", "서울특별시", "구로구", None, None),
    ("쿠키짐", "충청북도", "청주시", None, None),
    ("호크아이짐", "강원특별자치도", "원주시", None, None),
    ("올인짐 의정부본점", "경기도", "의정부시", None, None),
    ("빌리언짐 호암점", "충청북도", "충주시", None, None),
    ("제이피트니스 개금점", "부산광역시", "부산진구", None, None),
    ("비해피휘트니스 수영점", "부산광역시", "수영구", None, None),
    ("피트니스인앤스타 서면점", "부산광역시", "부산진구", None, None),
    ("피트니스인앤스타 부산대점", "부산광역시", "금정구", None, None),
    ("더플레이짐 농성점", "광주광역시", "서구", None, None),
    ("바이브피트니스 첨단2지구점", "광주광역시", "북구", None, None),
    ("정관장GYM 죽림점", "경상남도", "통영시", None, None),
    ("트리트라움 웰니스 피트니스", "강원특별자치도", "동해시", None, None),
]


def main() -> None:
    lines: list[str] = [
        "-- Community / DC Inside 헬스갤 famous & high-end machine gyms (curated).",
        "-- Upserts into gym_directory without touching owner-managed gyms.",
        "",
        "INSERT INTO gym_directory (",
        "  id, name, name_normalized, address, state_name, city_name, district_name,",
        "  latitude, longitude, source, source_ref, is_active",
        ")",
        "VALUES",
    ]
    vals: list[str] = []
    for name, state, city, district, address in ENTRIES:
        rid = str(uuid.uuid5(uuid.NAMESPACE_URL, f"dc_gallery:{normalize(name)}:{state}:{city}"))
        src_ref = f"dc:{normalize(name)}:{state}:{city}"
        if len(src_ref) > 80:
            raise SystemExit(f"source_ref too long ({len(src_ref)}): {src_ref}")
        vals.append(
            f"('{rid}'::uuid, {esc(name)}, {esc(normalize(name))}, {esc(address)}, "
            f"{esc(state)}, {esc(city)}, {esc(district)}, NULL, NULL, 'community_famous', {esc(src_ref)}, TRUE)"
        )
    lines.append(",\n".join(vals))
    lines.extend(
        [
            "ON CONFLICT (source, source_ref) DO UPDATE SET",
            "  name = EXCLUDED.name,",
            "  name_normalized = EXCLUDED.name_normalized,",
            "  address = COALESCE(EXCLUDED.address, gym_directory.address),",
            "  state_name = COALESCE(EXCLUDED.state_name, gym_directory.state_name),",
            "  city_name = COALESCE(EXCLUDED.city_name, gym_directory.city_name),",
            "  district_name = COALESCE(EXCLUDED.district_name, gym_directory.district_name),",
            "  is_active = TRUE,",
            "  updated_at = NOW();",
            "",
            "",
            "UPDATE gym_directory d",
            "SET state_id = s.id,",
            "    state_name = COALESCE(d.state_name, s.name->>'ko')",
            "FROM location_states s",
            "WHERE d.source = 'community_famous'",
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
            "WHERE d.source = 'community_famous'",
            "  AND d.city_id IS NULL",
            "  AND d.city_name IS NOT NULL",
            "  AND (",
            "    d.city_name ILIKE '%' || (c.name->>'ko') || '%'",
            "    OR (c.name->>'ko') ILIKE '%' || d.city_name || '%'",
            "  )",
            "  AND (d.state_id IS NULL OR c.state_id = d.state_id);",
            "",
            "UPDATE gym_directory d",
            "SET district_id = dist.id,",
            "    district_name = COALESCE(d.district_name, dist.name->>'ko')",
            "FROM location_districts dist",
            "JOIN location_cities c ON c.id = dist.city_id",
            "WHERE d.source = 'community_famous'",
            "  AND d.district_id IS NULL",
            "  AND d.district_name IS NOT NULL",
            "  AND d.city_id IS NOT NULL",
            "  AND dist.city_id = d.city_id",
            "  AND (",
            "    d.district_name ILIKE '%' || (dist.name->>'ko') || '%'",
            "    OR (dist.name->>'ko') ILIKE '%' || d.district_name || '%'",
            "  );",
            "",
        ]
    )
    OUT.write_text("\n".join(lines) + "\n", encoding="utf-8")
    print(f"Wrote {OUT} ({len(ENTRIES)} entries)")


if __name__ == "__main__":
    main()
