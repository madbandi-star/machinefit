"""Shared helpers for brand gym collectors."""
from __future__ import annotations

import re
from dataclasses import asdict, dataclass
from typing import Any


@dataclass
class BrandGym:
    brand: str
    name: str
    address: str
    latitude: float
    longitude: float
    source_ref: str

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)


def normalize_spaces(value: str) -> str:
    return re.sub(r"\s+", " ", value).strip()


def name_key(brand: str, name: str) -> tuple[str, str]:
    return brand, re.sub(r"\s+", "", name).lower()


def esc_sql(value: str | None) -> str:
    if value is None:
        return "NULL"
    return "'" + value.replace("'", "''") + "'"
