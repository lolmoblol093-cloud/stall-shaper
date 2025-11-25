# Stall ID Mapping Reference - Second Floor

This document provides a reference for all stall IDs mapped to their positions on the second floor interactive map.

## Second Floor Stall Mapping

| Position Index | Stall ID | Location Description |
|---------------|----------|---------------------|
| 0 | Super Market | Large polygon on left |
| 1 | c18 | Polygon below Super Market |
| 2 | c17 | Polygon diagonal |
| 3 | c16 | Polygon middle |
| 4 | c1 | Polygon right side |
| 5 | c15 | Large rectangle |
| 6 | c2 | Rectangle bottom middle |
| 7 | c19 | Rectangle left tall |
| 8 | c12 | Small rectangle |
| 9 | c11 | Small rectangle |
| 10 | c13 | Small rectangle |
| 11 | c14 | Small rectangle |
| 12 | c10 | Small rectangle |
| 13 | c6 | Small rectangle |
| 14 | c5 | Small rectangle |
| 15 | c9 | Small rectangle |
| 16 | c4 | Small rectangle |
| 17 | c8 | Small rectangle |
| 18 | c3 | Small rectangle |
| 19 | c7 | Small rectangle |

## Notes

- This mapping is used in `src/components/DirectoryMap.tsx`
- The position index corresponds to the order in the `stallIdMap` array
- Each stall ID links to the corresponding stall data in the Supabase database
- Ground floor stalls use a different system (b1-b75) with CSS Grid layout

## Ground Floor Stalls

Ground floor contains 75 stalls with IDs: **b1** through **b75**
- Layout: CSS Grid (5 rows × 15 columns)
- All stalls are rectangular and uniformly sized

---

*Last updated: 2025-11-25*
*Location: Project root directory*
