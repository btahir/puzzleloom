# Performance evidence

Local production static export, Chromium, Lighthouse 13.5, default mobile simulation (including CPU slowdown). Measured in the cloud container; real device/network performance varies.

Latest run (2026-10-01, owner's Mac, after the redesign):

| Page | Performance | Accessibility | LCP | Total blocking time |
|---|---:|---:|---:|---:|
| Home | 91 | 100 | 3.5 s | 30 ms |
| Large print word search | 91 | 100 | 3.5 s | 20 ms |

Earlier run (2026-09-30, cloud container):

| Page | Performance | Accessibility | LCP | Total blocking time |
|---|---:|---:|---:|---:|
| Home | 90 | 100 | 3.3 s | 150 ms |
| Word search maker | 92 | 100 | 3.0 s | 180 ms |

Both meet the brief’s performance ≥90 / accessibility ≥95 thresholds in these runs. Reports are in ignored `.lighthouseci/home.json` and `.lighthouseci/landing.json`.

The initial home run scored 65. Moving font/PDF work into the worker, prerendering the initial paper, and preloading self-hosted UI fonts removed blocking client work and improved the final scores. Generation and export remain local; no third-party runtime requests were added. Layout shift in the home run was 0.006.

The crossword benchmark is recorded separately in [bench.md](bench.md). A four-times CPU-throttled browser readiness check is recorded in ACCEPTANCE.md after execution.

Four-times CPU-throttled functional check completed: maker ready in 1,635 ms, switch to word search in 658 ms, and actual PDF download in 431 ms. Evidence is in ignored `.lighthouseci/cpu-check.json`. This is a local functional measurement, not a claim about all classroom hardware.
