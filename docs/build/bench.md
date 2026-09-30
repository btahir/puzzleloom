# Crossword benchmark

Run with `pnpm bench`. Timings are machine-dependent; 30 seeds per size, maximum grid 30. Synthetic garden vocabulary is original CC0 data.

| Words | Complete | Valid | p95 ms | Mean crossings/word | Mean bounding area |
|---|---:|---:|---:|---:|---:|
| 10 | 30/30 | 30/30 | 12.2 | 1.82 | 99 |
| 15 | 30/30 | 30/30 | 15.8 | 1.91 | 159 |
| 25 | 30/30 | 30/30 | 25.2 | 1.94 | 281 |
| 40 | 30/30 | 30/30 | 52.9 | 1.97 | 431 |

Awkward input: AAA / ZZZ is rejected with a disconnected-word explanation. Arbitrary connected word lists are not guaranteed solvable by the bounded heuristic; incomplete searches fail explicitly, never dropping words.
