#!/usr/bin/env python3
from __future__ import annotations

import json
import os
import sys
import time
import urllib.parse
import urllib.request

ENDPOINT = "https://overpass.kumi.systems/api/interpreter"
STATE = "/tmp/kr_gym_fetch_state.json"
OUT = "/workspace/database/seeds/kr_gym_directory_raw.json"

TILES = {
    "gangwon_a": (37.7, 127.5, 38.1, 128.2),
    "gangwon_b": (37.7, 128.2, 38.1, 129.0),
    "gangwon_c": (37.3, 127.7, 37.7, 128.5),
    "gangwon_d": (37.0, 128.0, 37.3, 129.3),
    "chungbuk_a": (36.6, 127.3, 37.1, 128.0),
    "chungbuk_b": (36.4, 127.7, 36.8, 128.5),
    "chungnam_a": (36.4, 126.4, 36.9, 127.0),
    "chungnam_b": (36.1, 126.7, 36.5, 127.4),
    "jeonbuk_a": (35.7, 126.6, 36.0, 127.2),
    "jeonbuk_b": (35.4, 126.8, 35.7, 127.5),
    "jeonnam_a": (34.9, 126.3, 35.3, 126.9),
    "jeonnam_b": (34.6, 126.5, 34.9, 127.2),
    "jeonnam_c": (34.2, 126.4, 34.6, 127.0),
    "gyeongbuk_a": (35.8, 128.2, 36.3, 128.8),
    "gyeongbuk_b": (35.8, 128.8, 36.3, 129.4),
    "gyeongbuk_c": (36.3, 128.2, 36.8, 129.0),
    "gyeongbuk_d": (36.6, 128.8, 37.1, 129.5),
    "gyeongnam_a": (35.1, 128.0, 35.5, 128.6),
    "gyeongnam_b": (35.1, 128.6, 35.5, 129.1),
    "gyeongnam_c": (34.7, 127.7, 35.1, 128.5),
    "jeju": (33.1, 126.1, 33.6, 126.98),
}


def load_state() -> dict:
    if os.path.exists(STATE):
        return json.load(open(STATE))
    return {"done": [], "elements": {}}


def save(state: dict) -> None:
    with open(STATE, "w") as f:
        json.dump(state, f)
    out = {"elements": list(state["elements"].values())}
    with open(OUT, "w", encoding="utf-8") as f:
        json.dump(out, f, ensure_ascii=False)


def fetch(bbox: tuple[float, float, float, float]) -> list[dict]:
    s, w, n, e = bbox
    q = f"""[out:json][timeout:45];
(
  node["leisure"="fitness_centre"]({s},{w},{n},{e});
  way["leisure"="fitness_centre"]({s},{w},{n},{e});
  node["amenity"="gym"]({s},{w},{n},{e});
  way["amenity"="gym"]({s},{w},{n},{e});
);
out center tags;"""
    data = urllib.parse.urlencode({"data": q}).encode()
    req = urllib.request.Request(ENDPOINT, data=data, method="POST")
    with urllib.request.urlopen(req, timeout=70) as resp:
        return json.load(resp).get("elements", [])


def main() -> int:
    names = sys.argv[1:] or list(TILES)
    state = load_state()
    for name in names:
        if name not in TILES:
            print(f"unknown {name}")
            return 1
        if name in state["done"]:
            print(f"skip {name}")
            continue
        for attempt in range(3):
            try:
                print(f"fetch {name} {attempt + 1}", flush=True)
                els = fetch(TILES[name])
                for el in els:
                    state["elements"][str(el["id"])] = el
                state["done"].append(name)
                save(state)
                print(f"  +{len(els)} total={len(state['elements'])}", flush=True)
                return 0
            except Exception as ex:  # noqa: BLE001
                print(f"  fail {ex}", flush=True)
                time.sleep(2)
        return 1
    save(state)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
