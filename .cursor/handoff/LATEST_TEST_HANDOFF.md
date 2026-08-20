# Test handoff — Search My Brands scope

## Summary

Logged-in users on machine search with brand **전체** now only see machines from **내 브랜드**. Guests still see the full catalog.

## As-is → To-be

- **As-is:** Brand chips = My Brands, but list/search with 전체 returned all brands.
- **To-be:** 전체 passes `brandCodes=<favorite codes>` to `/machines`; backend filters `b.code = ANY(...)`.

## Fast checks

1. Login → `/machines` → 전체 → results only from favorite brands.
2. Search a machine name that exists only on a non-favorite brand → no results.
3. Guest → 전체 still shows non-favorite brands.
4. Select one My Brand chip → that brand only (unchanged).

## Deploy

Needs **Render** (shared + API) and **GitHub Pages** (FE).
