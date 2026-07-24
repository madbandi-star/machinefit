"""Gym brand location collectors (modular).

Usage:
  python collect_all.py              # all brands
  python collect_all.py 짐박스 에이블짐
  python build_migration.py          # JSON -> 065 SQL
"""

from .collectors import BRAND_SPECS, collect_brand
from .common import BrandGym

__all__ = ["BRAND_SPECS", "BrandGym", "collect_brand"]
