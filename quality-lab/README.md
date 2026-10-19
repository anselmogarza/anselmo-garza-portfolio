# Anselmo Garza — Quality Lab

A buildless, responsive portfolio. Serve `dist/` using any static HTTP server,
or open `dist/index.html` directly. No installation or build step is required.

## Demo

Run the save check, inspect the timeline, open The fix, apply the ordering
change, and verify with the same check. Reset returns the scenario to its
initial state, including during an in-flight run. The demo executes a browser
state model; it does not run Playwright, C#, or a real database.

## Content

`dist/game.html` adds The Missing Point, a single-screen stick figure platformer.
Touching the coin removes it, but the incomplete pickup handler never awards the point. Run one pickup replay, inspect two assertions (coin removed and score
increased), follow the short event timeline, apply the fix, and rerun the same test.
Each coin starts with collected: false and value: 1. The player starts with score: 0.
The fix records collection and awards the point before hiding the coin, guarded
against duplicate pickups. Retesting also invokes the pickup callback again to
verify no additional point is awarded. Manual play and replay share all movement
and pickup code. Restart play keeps the current fix; Reset investigation restores
the bug, clears evidence, and cancels an in-flight replay.

Run `node quality-lab/check-game.cjs` for the failing/passing pickup, event order,
duplicate guard, single jump, bounds, and landing. Optional Windows browser QA:
`node quality-lab/check-game-browser.cjs` (installed Edge and Node.js 22+).
Screenshots go to the OS temporary folder; set `EDGE_PATH` for another Edge location.

`dist/migration.html` adds a source-review migration workshop inspired by a
supplied open-window example. Excerpts use generic identifiers and explain the
intended async retry contract, coverage mapping, and unresolved runtime checks.
No compilation, execution, retry implementation, or full parity is claimed.
The collapsible browser playground executes JavaScript against a mock Settings
screen. Delayed rendering is 1.1 seconds; optional retries poll every 100ms up
to 1.8 seconds. One-shot checks expose the timing failure. Both success and
failure clean up the mock session; reset cancels a pending run. The highlighted
C# is illustrative and includes additional state checks beyond the short excerpt.
`node quality-lab/check-migration.cjs` verifies the runner with a virtual clock.
Optional browser QA on Windows with installed Edge and Node.js 22+:
`node quality-lab/check-migration-browser.cjs`. Set `EDGE_PATH` if Edge is
installed elsewhere. This uses a temporary browser profile, checks real DOM
behavior and mobile width, and writes screenshots to the OS temporary folder.
It does not run the displayed C# or validate the employer framework.
The async cleanup example uses `await home.AssertBrowserTabCount();`; its
default expected count and retry behavior require framework verification.
Both HTML pages share navigation with a direct Migration Workshop link and
an Overview link back to the portfolio. The workshop also has a breadcrumb
and footer link home.

The CV is downloadable as `Anselmo_Garza_CV.pdf`, with selectable text and
clickable email and portfolio links. A plain-text alternative is also available.
Regenerate the two-page PDF after editing the text CV:

```sh
node quality-lab/build-cv.cjs
```

Run this command from the repository root. No PDF dependencies are required.
The PDF links to the public GitHub Pages portfolio:
https://anselmogarza.github.io/anselmo-garza-portfolio/
The separate ChatGPT Sites deployment remains private.

Confirmed career progression: Junior QA
Dev Engineer at Epicor from January 2013 to January 2016, Senior QA Dev Engineer
since January 2016, and four-person regression QA team leadership since May 2026.
Suite execution times are approximate and compare unchanged scope: full
regression 16 to 8 hours, Open 12 to 6, and Retrieve 8 to 4.
Professional AI workflows cover migration, analysis, reporting, and PR-based
test-suite recommendations; the browser demo does not execute those workflows.
API testing is basic exposure. Execution-time measurement does not establish
load-testing or application-security testing expertise.
Confirm official English degree wording before formal applications.
The order app and incident case are fictional, not employer artifacts.

## Hosting

`.openai/hosting.json` declares `dist` as the static output directory.
GitHub Actions publishes the same directory to GitHub Pages after validation.
The PDF generator uses the public Pages URL so it can be shared with recruiters.
Google Fonts is optional; system font fallbacks work offline.
