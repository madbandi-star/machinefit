"""Brand collector registry — add a new brand by appending a BrandSpec."""
from __future__ import annotations

import json
import re
import urllib.request
from dataclasses import dataclass
from pathlib import Path
from typing import Callable

from . import kakao_client
from .common import BrandGym, normalize_spaces

SEED_DIR = Path(__file__).resolve().parents[2] / "seeds" / "gym_brands"


@dataclass(frozen=True)
class BrandSpec:
    brand: str
    queries: tuple[str, ...]
    match: Callable[[str], bool]
    normalize_name: Callable[[str], str] | None = None
    collector: str = "kakao"  # kakao | spoany_official


def _norm_gymbox(name: str) -> str:
    n = normalize_spaces(name)
    return n.replace("짐박스피트니스", "짐박스").replace("짐박스 피트니스", "짐박스")


BRAND_SPECS: list[BrandSpec] = [
    BrandSpec(
        brand="스포애니",
        queries=("스포애니",),
        match=lambda n: "스포애니" in n.replace(" ", ""),
        collector="spoany_official",
    ),
    BrandSpec(
        brand="짐박스",
        queries=("짐박스", "짐박스피트니스"),
        match=lambda n: "짐박스" in n.replace(" ", ""),
        normalize_name=_norm_gymbox,
    ),
    BrandSpec(
        brand="고투피트니스",
        queries=("고투피트니스", "고투 피트니스", "GOTO FITNESS", "고투어반", "고투 어반"),
        match=lambda n: bool(re.search(r"고투|GOTO", n, re.I)),
    ),
    BrandSpec(
        brand="에이블짐",
        queries=("에이블짐",),
        match=lambda n: "에이블짐" in n.replace(" ", ""),
    ),
    BrandSpec(
        brand="더블유짐",
        queries=("더블유짐", "W짐", "W GYM"),
        match=lambda n: ("더블유짐" in n.replace(" ", ""))
        or bool(re.search(r"\bW\s*GYM\b", n, re.I))
        or n.replace(" ", "").startswith("W짐"),
    ),
    BrandSpec(
        brand="휘트니스M",
        queries=("휘트니스M", "휘트니스 M", "휘트니스엠", "Fitness M", "FitnessM"),
        match=lambda n: bool(
            re.search(r"휘트니스\s*M|휘트니스엠|Fitness\s*M|피트니스\s*M", n, re.I)
        ),
    ),
    BrandSpec(
        brand="스포짐",
        queries=("스포짐",),
        match=lambda n: "스포짐" in n.replace(" ", ""),
    ),
    BrandSpec(
        brand="팀윤짐",
        queries=("팀윤짐",),
        match=lambda n: "팀윤짐" in n.replace(" ", ""),
    ),
    BrandSpec(
        brand="바디채널",
        queries=("바디채널",),
        match=lambda n: "바디채널" in n.replace(" ", ""),
    ),
    BrandSpec(
        brand="커브스",
        queries=("커브스", "Curves"),
        match=lambda n: bool(re.search(r"커브스|Curves", n, re.I)),
    ),
    BrandSpec(
        brand="헬스보이짐",
        queries=("헬스보이짐", "헬스보이 짐", "헬스보이짐 프리미엄"),
        match=lambda n: "헬스보이" in n.replace(" ", ""),
    ),
]


def collect_spoany_official() -> list[BrandGym]:
    req = urllib.request.Request(
        "https://www.spoany.co.kr/branch.php",
        headers={"User-Agent": kakao_client.UA["User-Agent"]},
    )
    html = urllib.request.urlopen(req, timeout=40).read().decode("utf-8", "replace")
    m = re.search(r"branchList\s*=\s*(\[.*?\]);", html, re.S)
    if not m:
        raise RuntimeError("spoany branchList not found")
    rows = json.loads(m.group(1))
    out: list[BrandGym] = []
    for row in rows:
        if str(row.get("b_open")) != "1":
            continue
        if not row.get("b_lat") or not row.get("b_lng"):
            continue
        addr = " ".join(x for x in [row.get("b_address"), row.get("b_address2")] if x).strip()
        if not addr:
            continue
        out.append(
            BrandGym(
                brand="스포애니",
                name=f"스포애니 {row['b_name']}",
                address=addr,
                latitude=float(row["b_lat"]),
                longitude=float(row["b_lng"]),
                source_ref=f"spoany:{row.get('b_id') or row.get('idx')}",
            )
        )
    return out


def collect_brand(spec: BrandSpec) -> list[BrandGym]:
    if spec.collector == "spoany_official":
        return collect_spoany_official()
    places = kakao_client.collect_places(list(spec.queries), spec.match)
    out: list[BrandGym] = []
    for place in places:
        name = place["name"]
        if spec.normalize_name:
            name = spec.normalize_name(name)
        out.append(
            BrandGym(
                brand=spec.brand,
                name=normalize_spaces(name),
                address=place["address"],
                latitude=place["latitude"],
                longitude=place["longitude"],
                source_ref=place["source_ref"],
            )
        )
    return out


def save_brand_json(brand: str, items: list[BrandGym]) -> Path:
    SEED_DIR.mkdir(parents=True, exist_ok=True)
    path = SEED_DIR / f"{brand}.json"
    path.write_text(
        json.dumps([g.to_dict() for g in items], ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    return path
