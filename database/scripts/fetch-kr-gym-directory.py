#!/usr/bin/env python3
"""Fetch KR fitness centres from OSM Overpass into a JSON seed file."""
from __future__ import annotations

import json
import os
import sys
import time
import urllib.error
import urllib.parse
import urllib.request

ENDPOINT = "https://overpass.kumi.systems/api/interpreter"
OUT = os.environ.get("OUT", "/workspace/database/seeds/kr_gym_directory_raw.json")
STATE_FILE = "/tmp/kr_gym_fetch_state.json"

REGIONS = [
    ("seoul", (37.42, 126.76, 37.70, 127.18)),
    ("gg1", (37.55, 126.6, 37.9, 127.3)),
    ("gg2", (37.2, 126.6, 37.55, 127.3)),
    ("gg3", (37.0, 126.5, 37.2, 127.5)),
    ("incheon", (37.35, 126.4, 37.6, 126.8)),
    ("busan", (35.0, 128.8, 35.3, 129.3)),
    ("daegu", (35.75, 128.45, 36.0, 128.75)),
    ("daejeon", (36.25, 127.25, 36.45, 127.5)),
    ("gwangju", (35.05, 126.75, 35.25, 127.0)),
    ("ulsan", (35.45, 129.15, 35.65, 129.45)),
    ("gangwon1", (37.5, 127.5, 38.3, 128.8)),
    ("gangwon2", (37.0, 127.7, 37.5, 129.3)),
    ("chungbuk", (36.4, 127.3, 37.1, 128.5)),
    ("chungnam", (36.1, 126.4, 36.9, 127.4)),
    ("jeonbuk", (35.4, 126.6, 36.0, 127.5)),
    ("jeonnam1", (34.6, 126.3, 35.3, 127.2)),
    ("jeonnam2", (34.2, 126.4, 34.6, 127.6)),
    ("gyeongbuk1", (35.8, 128.2, 36.6, 129.4)),
    ("gyeongbuk2", (36.6, 128.2, 37.1, 129.5)),
    ("gyeongnam1", (35.0, 128.0, 35.5, 129.1)),
    ("gyeongnam2", (34.7, 127.7, 35.0, 129.0)),
    ("jeju", (33.1, 126.1, 33.6, 126.98)),
]


def load_state() -> dict:
    if os.path.exists(STATE_FILE):
        return json.load(open(STATE_FILE))
    return {"done": [], "elements": {}}


def save_state(state: dict) -> None:
    with open(STATE_FILE, "w") as f:
        json.dump(state, f)


def fetch(bbox: tuple[float, float, float, float]) -> list[dict]:
    s, w, n, e = bbox
    q = f"""[out:json][timeout:60];
(
  node["leisure"="fitness_centre"]({s},{w},{n},{e});
  way["leisure"="fitness_centre"]({s},{w},{n},{e});
  node["amenity"="gym"]({s},{w},{n},{e});
  way["amenity"="gym"]({s},{w},{n},{e});
);
out center tags;"""
    data = urllib.parse.urlencode({"data": q}).encode()
    req = urllib.request.Request(ENDPOINT, data=data, method="POST")
    with urllib.request.urlopen(req, timeout=90) as resp:
        payload = json.load(resp)
    return payload.get("elements", [])


def main() -> int:
    only = sys.argv[1:] if len(sys.argv) > 1 else [r[0] for r in REGIONS]
    state = load_state()
    for name, bbox in REGIONS:
        if name not in only:
            continue
        if name in state["done"]:
            print(f"skip {name}", flush=True)
            continue
        ok = False
        for attempt in range(3):
            try:
                print(f"fetch {name} attempt {attempt + 1}", flush=True)
                els = fetch(bbox)
                for el in els:
                    state["elements"][str(el["id"])] = el
                state["done"].append(name)
                save_state(state)
                print(f"  +{len(els)} total={len(state['elements'])}", flush=True)
                ok = True
                time.sleep(2)
                break
            except Exception as ex:  # noqa: BLE001
                print(f"  fail: {ex}", flush=True)
                time.sleep(3)
        if not ok:
            print(f"FAILED {name}", flush=True)
            return 1

    out = {"elements": list(state["elements"].values())}
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    with open(OUT, "w", encoding="utf-8") as f:
        json.dump(out, f, ensure_ascii=False)
    named = sum(1 for e in out["elements"] if (e.get("tags") or {}).get("name"))
    print(f"wrote {OUT} total={len(out['elements'])} named={named}", flush=True)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
