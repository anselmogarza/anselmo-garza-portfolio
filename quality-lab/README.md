# Anselmo Garza — Quality Lab

A buildless, responsive portfolio. Serve `dist/` using any static HTTP server,
or open `dist/index.html` directly. No installation or build step is required.

## Demo

Run the save check, inspect the timeline, open The fix, apply the ordering
change, and verify with the same check. Reset returns the scenario to its
initial state, including during an in-flight run. The demo executes a browser
state model; it does not run Playwright, C#, or a real database.

## Content

`dist/game.html` adds The Uncollectible Coin, a single-screen stick figure
platformer and collision investigation. Normal movement passes, but endpoint-only
pickup checks miss fast crossings and controlled frame hitches. A +20px hitbox
patch passes the original fast reproduction while failing a larger crossing and
incorrectly collecting a near miss. Regression unlocks a swept movement-path fix
that preserves the original coin bounds and passes the same five checks.

Manual play offers normal, fast, and simulated hitch conditions. Replays isolate
horizontal movement with gravity paused and use the same pickup detector as play.
The hitch models a 180ms gap at 1,500px/s (270px), without stalling the browser.
The evidence overlay preserves before/after positions and the crossing path.
The regression matrix checks normal movement, fast crossing, hitch, near miss,
and collecting exactly once. Applying either change leaves verification pending;
only a full passing regression marks the path fix verified. Reset cancels replay,
clears evidence and results, and restores the endpoint detector.

Run `node quality-lab/check-game.cjs` for all three detector matrices, shared manual
behavior, geometric edge cases, single jump, bounds, and landing. Optional Windows
browser QA with installed Edge and Node.js 22+:
`node quality-lab/check-game-browser.cjs`. It checks the full investigation,
regression gates, replay cancellation, and mobile layout; screenshots go to the OS
temporary folder. Set `EDGE_PATH` for another Edge location.

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
