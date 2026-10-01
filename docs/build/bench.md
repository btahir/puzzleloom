# Crossword and word-search benchmark

Run with `pnpm bench`. Timings are machine-dependent; 60 seeds per row. "Garden" lists are short original CC0 words; "Long words" lists are realistic classroom vocabulary (7-14 letters) from the test fixtures.

## Crossword, default settings (automatic size)

No size is given, so the engine starts from an estimate and widens the allowed box only when it must, then keeps the most compact layout it finds.

| List | Complete | Valid | p50 ms | p95 ms | Mean size | Mean area | Mean aspect | Crossings/word |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| Garden 10 | 60/60 | 60/60 | 3.3 | 4.8 | 10.2 | 90 | 1.17 | 1.80 |
| Garden 15 | 60/60 | 60/60 | 7.3 | 14.3 | 12.8 | 150 | 1.10 | 1.90 |
| Garden 25 | 60/60 | 60/60 | 20.4 | 39.5 | 16.6 | 252 | 1.10 | 1.95 |
| Garden 40 | 60/60 | 60/60 | 51.3 | 100.5 | 20.9 | 416 | 1.05 | 1.98 |
| Long words 15 | 60/60 | 60/60 | 13.9 | 14.5 | 15.6 | 224 | 1.08 | 1.97 |
| Long words 25 | 60/60 | 60/60 | 31.0 | 32.2 | 19.4 | 350 | 1.07 | 2.01 |
| Long words 40 | 60/60 | 60/60 | 69.2 | 71.9 | 23.8 | 543 | 1.04 | 2.01 |

## Crossword, explicit sizes

An explicit size is a hard limit: the box never grows past it, and the run fails with an explanation if the list does not fit. Cells show completed layouts out of 60.

| List | 10 | 12 | 15 | 18 | 20 | 24 | 30 |
|---|---:|---:|---:|---:|---:|---:|---:|
| Garden 10 | 57 | 60 | 60 | 60 | 60 | 60 | 60 |
| Garden 15 | 0 | 41 | 60 | 60 | 60 | 60 | 60 |
| Garden 25 | 0 | 0 | 15 | 60 | 60 | 60 | 60 |
| Garden 40 | 0 | 0 | 0 | 0 | 47 | 60 | 60 |
| Long words 15 | 0 | 0 | 57 | 60 | 60 | 60 | 60 |
| Long words 25 | 0 | 0 | 0 | 13 | 60 | 60 | 60 |
| Long words 40 | 0 | 0 | 0 | 0 | 0 | 60 | 60 |

## Word search, default settings (automatic size)

Hard difficulty (all eight directions), the same lists. Fill never spells a blocked word; "Blocked words" counts blocklist hits across all 60 grids and must be 0.

| List | Complete | Valid | p95 ms | Mean size | Blocked words |
|---|---:|---:|---:|---:|---:|
| Garden 10 | 60/60 | 60/60 | 1.5 | 12.0 | 0 |
| Garden 15 | 60/60 | 60/60 | 1.3 | 14.0 | 0 |
| Garden 25 | 60/60 | 60/60 | 2.7 | 18.0 | 0 |
| Garden 40 | 60/60 | 60/60 | 5.4 | 23.0 | 0 |
| Long words 15 | 60/60 | 60/60 | 2.5 | 18.0 | 0 |
| Long words 25 | 60/60 | 60/60 | 4.3 | 22.0 | 0 |
| Long words 40 | 60/60 | 60/60 | 8.1 | 27.0 | 0 |

Awkward input: AAA / ZZZ is rejected with a disconnected-word explanation. Some small lists have no valid crossing at all (for example OCEAN, LEAF and PEAR: every shared letter sits next to another). Incomplete searches fail explicitly with the words that could not be placed; words are never dropped.
