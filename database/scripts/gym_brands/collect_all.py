"""Collect brand gym branches and write seed JSON under database/seeds/gym_brands/."""
from __future__ import annotations

import json
import re
import sys
from collections import Counter
from pathlib import Path

from collectors import BRAND_SPECS, collect_brand, save_brand_json
from common import name_key

SEED_DIR = Path(__file__).resolve().parents[2] / "seeds" / "gym_brands"


def main(argv: list[str] | None = None) -> int:
    argv = argv or sys.argv[1:]
    only = set(argv) if argv else None
    all_items = []
    for spec in BRAND_SPECS:
        if only and spec.brand not in only:
            continue
        print(f"collecting {spec.brand} ...")
        items = collect_brand(spec)
        print(f"  {spec.brand}: {len(items)}")
        save_brand_json(spec.brand, items)
        all_items.extend(items)

    # Deduplicate by brand + normalized name
    seen: set[tuple[str, str]] = set()
    uniq = []
    for item in all_items:
        key = name_key(item.brand, item.name)
        if key in seen:
            continue
        seen.add(key)
        uniq.append(item.to_dict())

    SEED_DIR.mkdir(parents=True, exist_ok=True)
    out = SEED_DIR / "all_brands.json"
    out.write_text(json.dumps(uniq, ensure_ascii=False, indent=2), encoding="utf-8")
    print("TOTAL", len(uniq), Counter(x["brand"] for x in uniq))
    print("wrote", out)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
