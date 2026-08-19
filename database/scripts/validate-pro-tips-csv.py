#!/usr/bin/env python3
"""Validate MachineFit PRO tips CSV before import."""
from __future__ import annotations

import csv
import json
import os
import re
import sys
from collections import Counter, defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
MIGRATION = ROOT / "database/migrations/133_seed_foundation_brands_standard_types.sql"

MAX_BYTES = 5000
MAX_LINES = 30
EXCLUDED_BRANDS = {"BODYWEIGHT", "FREE_WEIGHT"}
EXPECTED_BRANDS = 29
EXPECTED_MACHINES_PER_BRAND = 80
EXPECTED_ROWS = EXPECTED_BRANDS * EXPECTED_MACHINES_PER_BRAND

REQUIRED_HEADERS = ("brand_code", "machine_name", "exercise_tip", "exercise_tip_en")


def utf8_len(text: str) -> int:
    return len(text.encode("utf-8"))


def line_count(text: str) -> int:
    if not text.strip():
        return 0
    return len([ln for ln in re.split(r"\r?\n", text) if ln.strip()])


def load_brand_codes_from_migration() -> set[str]:
    text = MIGRATION.read_text(encoding="utf-8")
    codes = set(re.findall(r"'([A-Z0-9_]+)',\s*\n\s*'\{", text))
    # Also catch UPDATE/INSERT single-line brand codes
    codes.update(re.findall(r"WHERE code = '([A-Z0-9_]+)'", text))
    codes.update(re.findall(r"INSERT INTO brands \(code[^)]*\)\s*\nSELECT\s*\n\s*'([A-Z0-9_]+)'", text))
    return {c for c in codes if c not in EXCLUDED_BRANDS}


def load_standard_machine_names_from_migration() -> set[str]:
    text = MIGRATION.read_text(encoding="utf-8")
    names: set[str] = set()
    for m in re.finditer(r"'STD_[A-Z0-9_]+',\s*'\{\"ko\":\"([^\"]+)\"", text):
        names.add(m.group(1))
    return names


def try_load_db_catalog() -> dict[tuple[str, str], str] | None:
    """Return map (brand_code, std_name_ko) -> machine_code from live DB."""
    env_path = ROOT / "backend/.env"
    if not env_path.exists():
        return None
    db_url = None
    for line in env_path.read_text(encoding="utf-8").splitlines():
        if line.startswith("DATABASE_URL="):
            db_url = line.split("=", 1)[1].strip().strip('"').strip("'")
            break
    if not db_url:
        return None
    try:
        import psycopg2  # type: ignore
    except ImportError:
        return None
    try:
        conn = psycopg2.connect(db_url)
    except Exception:
        return None
    cur = conn.cursor()
    cur.execute(
        """
        SELECT b.code,
               COALESCE(st.name->>'ko', m.name->>'ko') AS std_ko,
               m.code AS machine_code,
               m.name->>'ko' AS machine_name_ko
        FROM machines m
        JOIN brands b ON b.id = m.brand_id
        LEFT JOIN standard_machine_types st ON st.id = m.standard_type_id
        WHERE b.code NOT IN ('BODYWEIGHT', 'FREE_WEIGHT')
          AND m.is_active = TRUE
        """
    )
    mapping: dict[tuple[str, str], str] = {}
    full_name_map: dict[tuple[str, str], str] = {}
    for brand_code, std_ko, machine_code, machine_name_ko in cur.fetchall():
        if std_ko:
            mapping[(brand_code, std_ko)] = machine_code
        if machine_name_ko:
            full_name_map[(brand_code, machine_name_ko)] = machine_code
            if std_ko and machine_name_ko.endswith(std_ko):
                mapping.setdefault((brand_code, std_ko), machine_code)
    conn.close()
    return {"std": mapping, "full": full_name_map}


def parse_csv(path: Path) -> tuple[list[str], list[dict[str, str]]]:
    with path.open("r", encoding="utf-8-sig", newline="") as f:
        reader = csv.DictReader(f)
        if reader.fieldnames is None:
            raise ValueError("Missing header row")
        headers = [h.strip() for h in reader.fieldnames if h]
        rows = []
        for raw in reader:
            row = {k.strip(): (v or "").strip() for k, v in raw.items() if k}
            rows.append(row)
        return headers, rows


def main() -> int:
    if len(sys.argv) < 2:
        print("Usage: validate-pro-tips-csv.py <csv-path>", file=sys.stderr)
        return 2
    csv_path = Path(sys.argv[1])
    if not csv_path.exists():
        print(f"File not found: {csv_path}", file=sys.stderr)
        return 2

    headers, rows = parse_csv(csv_path)
    report: dict = {
        "file": str(csv_path),
        "headers": headers,
        "rowCount": len(rows),
        "errors": [],
        "warnings": [],
        "stats": {},
    }

    missing_headers = [h for h in REQUIRED_HEADERS if h not in headers]
    if missing_headers:
        report["errors"].append(f"Missing columns: {', '.join(missing_headers)}")

    known_brands = load_brand_codes_from_migration()
    known_std_names = load_standard_machine_names_from_migration()
    db_maps = try_load_db_catalog()

    dup_counter: Counter[tuple[str, str]] = Counter()
    brand_counts: Counter[str] = Counter()
    unknown_brands: Counter[str] = Counter()
    unknown_machine_names: Counter[str] = Counter()
    over_bytes_ko: list[dict] = []
    over_bytes_en: list[dict] = []
    over_lines_ko: list[dict] = []
    over_lines_en: list[dict] = []
    empty_ko: list[int] = []
    empty_en: list[int] = []
    unmatched_db: list[dict] = []

    for idx, row in enumerate(rows, start=2):
        brand = row.get("brand_code", "").strip().upper()
        machine = row.get("machine_name", "").strip()
        tip_ko = row.get("exercise_tip", "")
        tip_en = row.get("exercise_tip_en", "")

        if not brand:
            report["errors"].append(f"Row {idx}: empty brand_code")
            continue
        if not machine:
            report["errors"].append(f"Row {idx}: empty machine_name")
            continue

        dup_counter[(brand, machine)] += 1
        brand_counts[brand] += 1

        if brand in EXCLUDED_BRANDS:
            report["errors"].append(f"Row {idx}: excluded brand {brand}")
        elif brand not in known_brands:
            unknown_brands[brand] += 1

        if machine not in known_std_names:
            unknown_machine_names[machine] += 1

        if not tip_ko.strip():
            empty_ko.append(idx)
        if not tip_en.strip():
            empty_en.append(idx)

        ko_bytes = utf8_len(tip_ko)
        en_bytes = utf8_len(tip_en) if tip_en.strip() else 0
        ko_lines = line_count(tip_ko)
        en_lines = line_count(tip_en)

        if ko_bytes > MAX_BYTES:
            over_bytes_ko.append({"row": idx, "brand": brand, "machine": machine, "bytes": ko_bytes})
        if tip_en.strip() and en_bytes > MAX_BYTES:
            over_bytes_en.append({"row": idx, "brand": brand, "machine": machine, "bytes": en_bytes})
        if ko_lines > MAX_LINES:
            over_lines_ko.append({"row": idx, "brand": brand, "machine": machine, "lines": ko_lines})
        if en_lines > MAX_LINES:
            over_lines_en.append({"row": idx, "brand": brand, "machine": machine, "lines": en_lines})

        if db_maps is not None:
            key = (brand, machine)
            std_map = db_maps["std"]
            full_map = db_maps["full"]
            if key not in std_map and key not in full_map:
                unmatched_db.append({"row": idx, "brand": brand, "machine": machine})

    duplicates = [(k, c) for k, c in dup_counter.items() if c > 1]
    if duplicates:
        report["errors"].append(f"Duplicate brand+machine pairs: {len(duplicates)}")
        report["stats"]["duplicateExamples"] = [
            {"brand": k[0], "machine": k[1], "count": c} for k, c in duplicates[:20]
        ]

    wrong_brand_counts = {
        b: c for b, c in brand_counts.items() if c != EXPECTED_MACHINES_PER_BRAND and b not in EXCLUDED_BRANDS
    }

    report["stats"].update(
        {
            "expectedRows": EXPECTED_ROWS,
            "brandCount": len(brand_counts),
            "brandsWithWrongRowCount": wrong_brand_counts,
            "unknownBrands": dict(unknown_brands.most_common(20)),
            "unknownMachineNameCount": len(unknown_machine_names),
            "unknownMachineNameExamples": list(unknown_machine_names.keys())[:20],
            "emptyKoRows": len(empty_ko),
            "emptyEnRows": len(empty_en),
            "overBytesKo": len(over_bytes_ko),
            "overBytesEn": len(over_bytes_en),
            "overLinesKo": len(over_lines_ko),
            "overLinesEn": len(over_lines_en),
            "maxKoBytes": max((utf8_len(r.get("exercise_tip", "")) for r in rows), default=0),
            "maxEnBytes": max((utf8_len(r.get("exercise_tip_en", "")) for r in rows), default=0),
            "avgKoBytes": round(sum(utf8_len(r.get("exercise_tip", "")) for r in rows) / max(len(rows), 1)),
            "avgEnBytes": round(sum(utf8_len(r.get("exercise_tip_en", "")) for r in rows) / max(len(rows), 1)),
            "dbMatchChecked": db_maps is not None,
            "dbUnmatchedRows": len(unmatched_db),
        }
    )

    if len(rows) != EXPECTED_ROWS:
        report["errors"].append(f"Row count {len(rows)} != expected {EXPECTED_ROWS}")

    if wrong_brand_counts:
        report["errors"].append(f"Brands not exactly {EXPECTED_MACHINES_PER_BRAND} rows: {len(wrong_brand_counts)}")

    if unknown_brands:
        report["errors"].append(f"Unknown brand codes: {len(unknown_brands)}")

    if empty_ko:
        report["errors"].append(f"Empty exercise_tip rows: {len(empty_ko)}")

    if over_bytes_ko:
        report["errors"].append(f"exercise_tip exceeds {MAX_BYTES} bytes: {len(over_bytes_ko)} rows")
        report["stats"]["overBytesKoExamples"] = over_bytes_ko[:10]

    if over_bytes_en:
        report["errors"].append(f"exercise_tip_en exceeds {MAX_BYTES} bytes: {len(over_bytes_en)} rows")
        report["stats"]["overBytesEnExamples"] = over_bytes_en[:10]

    if over_lines_ko:
        report["warnings"].append(f"exercise_tip exceeds {MAX_LINES} lines: {len(over_lines_ko)} rows")
        report["stats"]["overLinesKoExamples"] = over_lines_ko[:10]

    if over_lines_en:
        report["warnings"].append(f"exercise_tip_en exceeds {MAX_LINES} lines: {len(over_lines_en)} rows")
        report["stats"]["overLinesEnExamples"] = over_lines_en[:10]

    if empty_en:
        report["warnings"].append(f"Empty exercise_tip_en rows: {len(empty_en)} (will copy ko on import)")

    if unknown_machine_names:
        report["warnings"].append(
            f"machine_name not in standard 80-type catalog: {len(unknown_machine_names)} unique names"
        )

    if db_maps is not None and unmatched_db:
        report["errors"].append(f"Could not match to DB machines: {len(unmatched_db)} rows")
        report["stats"]["dbUnmatchedExamples"] = unmatched_db[:20]
    elif db_maps is None:
        report["warnings"].append("Live DB match skipped (no DATABASE_URL/psycopg2)")

    out_path = ROOT / ".cursor/handoff/pro-tips-csv-validation.json"
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")

    print(json.dumps(report, ensure_ascii=False, indent=2))
    return 0 if not report["errors"] else 1


if __name__ == "__main__":
    raise SystemExit(main())
