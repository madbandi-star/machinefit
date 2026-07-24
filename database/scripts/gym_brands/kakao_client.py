"""Kakao Map place search client (public mapsearch endpoint)."""
from __future__ import annotations

import json
import time
import urllib.parse
import urllib.request
from typing import Any, Callable

UA = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
    ),
    "Referer": "https://map.kakao.com/",
}

DEFAULT_REGIONS = [
    "",
    "서울",
    "경기",
    "인천",
    "부산",
    "대구",
    "광주",
    "대전",
    "울산",
    "세종",
    "강원",
    "충북",
    "충남",
    "전북",
    "전남",
    "경북",
    "경남",
    "제주",
]


def search(query: str, page: int = 1, timeout: int = 25) -> dict[str, Any]:
    url = "https://search.map.kakao.com/mapsearch/map.daum?" + urllib.parse.urlencode(
        {"q": query, "page": page}
    )
    req = urllib.request.Request(url, headers=UA)
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        return json.loads(resp.read().decode("utf-8"))


def collect_places(
    queries: list[str],
    match: Callable[[str], bool],
    *,
    regions: list[str] | None = None,
    max_pages: int = 8,
    sleep_s: float = 0.2,
    exclude_categories: frozenset[str] = frozenset(
        {"카페", "음식점", "편의점", "미용실", "병원", "약국"}
    ),
) -> list[dict[str, Any]]:
    """Collect open places with road address + lat/lng."""
    regions = regions if regions is not None else DEFAULT_REGIONS
    seen: set[str] = set()
    items: list[dict[str, Any]] = []

    for qbase in queries:
        for region in regions:
            q = f"{qbase} {region}".strip() if region else qbase
            for page in range(1, max_pages + 1):
                try:
                    data = search(q, page)
                except Exception as exc:  # noqa: BLE001 — collectors must be resilient
                    print(f"  kakao err {q!r} p{page}: {exc}")
                    time.sleep(1)
                    continue
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
                    cate = place.get("last_cate_name") or ""
                    if cate in exclude_categories:
                        continue
                    lat, lon = place.get("lat"), place.get("lon")
                    if lat is None or lon is None:
                        continue
                    addr = (place.get("new_address") or place.get("address") or "").strip()
                    if not addr:
                        continue
                    seen.add(cid)
                    items.append(
                        {
                            "name": name,
                            "address": addr,
                            "latitude": float(lat),
                            "longitude": float(lon),
                            "source_ref": f"kakao:{cid}",
                            "category": cate,
                            "raw_name": name,
                        }
                    )
                total = int(data.get("place_totalcount") or 0)
                if page * 15 >= total:
                    break
                time.sleep(sleep_s)
            time.sleep(sleep_s)
    return items
