#!/usr/bin/env python3
"""Rebuild all_brands.json from per-brand seeds + quick GOTO/FitnessM refresh."""
from __future__ import annotations

import json
import re
import time
import urllib.parse
import urllib.request
from collections import Counter
from pathlib import Path

UA = {
    "User-Agent": "Mozilla/5.0 MachineFitBot/1.0",
    "Referer": "https://map.kakao.com/",
}
SEED = Path("/workspace/database/seeds/gym_brands")


def kakao(q: str, page: int = 1) -> dict:
    url = "https://search.map.kakao.com/mapsearch/map.daum?" + urllib.parse.urlencode(
        {"q": q, "page": page}
    )
    req = urllib.request.Request(url, headers=UA)
    with urllib.request.urlopen(req, timeout=20) as resp:
        return json.loads(resp.read().decode())


def quick(brand: str, queries: list[str], match) -> list[dict]:
    seen: set[str] = set()
    items: list[dict] = []
    for q in queries:
        for page in range(1, 12):
            try:
                data = kakao(q, page)
            except Exception as exc:  # noqa: BLE001
                print(exc)
                break
            places = data.get("place") or []
            if not places:
                break
            for place in places:
                cid = str(place.get("confirmid") or "")
                if not cid or cid in seen:
                    continue
                name = place.get("name") or ""
                if not match(name):
                    continue
                if place.get("openoff_status") == "N":
                    continue
                if place.get("lat") is None or place.get("lon") is None:
                    continue
                addr = (place.get("new_address") or place.get("address") or "").strip()
                if not addr:
                    continue
                seen.add(cid)
                items.append(
                    {
                        "brand": brand,
                        "name": re.sub(r"\s+", " ", name).strip(),
                        "address": addr,
                        "latitude": float(place["lat"]),
                        "longitude": float(place["lon"]),
                        "source_ref": f"kakao:{cid}",
                    }
                )
            total = int(data.get("place_totalcount") or 0)
            if page * 15 >= total:
                break
            time.sleep(0.15)
        time.sleep(0.1)
    return items


def main() -> None:
    goto = quick(
        "고투피트니스",
        ["고투피트니스", "고투어반", "GOTO FITNESS", "고투 둔촌", "고투 논현", "고투 정릉", "고투 용인"],
        lambda n: bool(re.search(r"고투|GOTO", n, re.I)),
    )
    print("GOTO", len(goto), [x["name"] for x in goto])
    (SEED / "고투피트니스.json").write_text(json.dumps(goto, ensure_ascii=False, indent=2), encoding="utf-8")

    fm = quick(
        "휘트니스M",
        ["휘트니스M", "휘트니스엠", "Fitness M 헬스", "휘트니스 M점"],
        lambda n: bool(re.search(r"휘트니스\s*M|휘트니스엠|Fitness\s*M", n, re.I)),
    )
    print("FM", len(fm), [x["name"] for x in fm])
    (SEED / "휘트니스M.json").write_text(json.dumps(fm, ensure_ascii=False, indent=2), encoding="utf-8")

    all_items: list[dict] = []
    html = urllib.request.urlopen(
        urllib.request.Request("https://www.spoany.co.kr/branch.php", headers=UA),
        timeout=40,
    ).read().decode("utf-8", "replace")
    match = re.search(r"branchList\s*=\s*(\[.*?\]);", html, re.S)
    assert match
    for row in json.loads(match.group(1)):
        if str(row.get("b_open")) != "1" or not row.get("b_lat"):
            continue
        addr = " ".join(x for x in [row.get("b_address"), row.get("b_address2")] if x).strip()
        all_items.append(
            {
                "brand": "스포애니",
                "name": f"스포애니 {row['b_name']}",
                "address": addr,
                "latitude": float(row["b_lat"]),
                "longitude": float(row["b_lng"]),
                "source_ref": f"spoany:{row.get('b_id') or row.get('idx')}",
            }
        )

    noise = re.compile(r"(카페|치킨|피자|마트|병원|약국|호텔|모텔|펜션|크라브마가)")
    for brand in [
        "짐박스",
        "에이블짐",
        "더블유짐",
        "스포짐",
        "팀윤짐",
        "바디채널",
        "커브스",
        "고투피트니스",
        "휘트니스M",
    ]:
        data = json.loads((SEED / f"{brand}.json").read_text(encoding="utf-8"))
        for item in data:
            name = item["name"]
            if noise.search(name):
                continue
            if brand == "더블유짐" and "더블유" not in name and not re.search(r"W\s*GYM|W짐", name, re.I):
                continue
            if brand == "스포짐" and "스포짐" not in name.replace(" ", ""):
                continue
            if brand == "커브스" and not re.search(r"커브스|Curves", name, re.I):
                continue
            row = dict(item)
            row["brand"] = brand
            if brand == "짐박스":
                row["name"] = row["name"].replace("짐박스피트니스", "짐박스").replace("짐박스 피트니스", "짐박스")
            all_items.append(row)

    seen: set[tuple[str, str]] = set()
    uniq: list[dict] = []
    for item in all_items:
        key = (item["brand"], re.sub(r"\s+", "", item["name"]).lower())
        if key in seen:
            continue
        seen.add(key)
        uniq.append(
            {
                "brand": item["brand"],
                "name": item["name"],
                "address": item["address"],
                "latitude": item["latitude"],
                "longitude": item["longitude"],
                "source_ref": item["source_ref"],
            }
        )

    (SEED / "all_brands.json").write_text(json.dumps(uniq, ensure_ascii=False, indent=2), encoding="utf-8")
    print("TOTAL", len(uniq), Counter(x["brand"] for x in uniq))


if __name__ == "__main__":
    main()
