# Testing PokerLab V5

Node.js 22.12+ and npm ci are required. Run from this directory:

```sh
npm run typecheck
npm run lint
npm test
npm run build
POKERLAB_EXHAUSTIVE=1 npm test -- src/domain/census.test.ts
npm test -- src/domain/play/stress.test.ts --reporter=verbose --silent=false
```

## Automated results

260 routine tests pass, retaining all 227 V1–V4 tests. Strict TypeScript includes src, E2E and QA fixtures; lint and production build pass. Original rules/card/evaluator/observation modules are preserved; V4 adds completed-hand metadata, public-memory policy integration and new isolated modules. The ordinary suite includes the original 5,000-hand invariant stress test and the additional 600-hand V4 suite. The exhaustive five-card census remains optional; the earlier V2 run passed all 2,598,960 hands. A skipped test does not imply a fresh exhaustive pass.

V3 presentation.test.ts covers public visibility, legitimate showdown cards, silent restoration, stale/duplicate events, cancellation, bounded rapid queues, exact snapshot convergence, seat anchors, camera limits and quality choices. preferences.test.ts covers schema isolation, recovery and explicit fullscreen/rejection. AudioManager.test.ts covers activation, singleton playback resources, independent levels, inactive behavior, cleanup, async unmount, autoplay rejection and WAV validity/duration. ImmersivePlay.test.tsx covers sidebar removal/Learn return, shared-controller display switching, renderer fallback, settings/focus/Escape, StrictMode cleanup and NPC pause/resume. Its scene is mocked; it is not a WebGL or screenshot test. cardMotion.test.ts uses real Three.js Groups with a controlled frame hook to verify reveal/placement lifecycles and stable texture identity across cloned states. VisibleCards.test.tsx verifies flop/turn/river isolation and stable displayed-card nodes.

## Browser suite

```sh
npx playwright install chromium
npm run test:e2e
```

42 collected cases: six V1 regressions, eleven V2 flows, twelve V3/V3.1 cases, seven V4 cases and six V5 cases. V3 covers actual canvas/labels/control bounds at 1920x1080, 1440x900, 1280x800, 768x1024, 390x844 and 320x640; switching/Learn/refresh; context loss; fullscreen rejection; final victory and early human elimination. Browser fixtures are test-only and do not choose ordinary game outcomes. POKERLAB_CHROMIUM_PATH selects a compatible installed browser; PLAYWRIGHT_BASE_URL reuses an existing server. The default config starts Vite on localhost:5173.

Historical V3 result: the focused V3 desktop attempt failed at browser launch, before page assertions, with bootstrap_check_in org.chromium.Chromium.MachPortRendezvousServer: Permission denied (1100), followed by SIGTRAP. No passing browser result or rendered screenshot is claimed. No browser restrictions were bypassed. Rerun in a normal environment that allows Chromium subprocesses.

Historical V4 attempt: installed Chrome exits SIGABRT before page creation, with kill EPERM during cleanup. See the V4 verification section below.


## Final V5 native browser acceptance

**Date:** 22 October 2026

Environment: Native macOS Terminal, Playwright-managed Chromium.

Final results:

- 42 browser tests passed.
- No browser test failures.
- Playwright runtime: approximately 2.5 minutes.

The tests cover:

- 3D scene rendering and responsive viewports
- Legal player actions and NPC interactions
- Session restoration and chip accounting
- 2D fallback after renderer failure
- Play Mode controls and fullscreen rejection
- V1 educational regression flows
- Probability Lab and Web Worker behavior
- Completed-hand replay and safe live return
- V5 customization, card inspection and session preservation

The earlier Chrome SIGABRT, SIGTRAP and sandbox permission failures were execution-environment blockers encountered during development. Native Chromium testing subsequently succeeded.

The final repaired test uses the native HTML summary disclosure for Action History rather than incorrectly querying a button.

Browser test success does not independently establish audio listening quality, real physical-device touch behavior, or sustained GPU/FPS performance.

## Manual visual/audio/performance gate

Use V3-QA-REPORT.md's checklist. Inspect actual room/table/characters/cards/chips, seat/order markers, lighting, camera limits/reset, all six viewport sizes, no control overlap and card readability. Complete a session, review pots/history, refresh mid-hand, return to Learn and retry 2D/3D. Test real fullscreen entry/Escape and renderer context loss without losing the hand.

Listen through the full music piece and loop; test every volume/mute, effects, inactive-tab behavior and repeated Play entry/exit. Measure FPS/frame time, draw calls, memory and repeated GPU/audio cleanup on real desktop/mobile hardware. No FPS target is claimed achieved yet. The Vite lazy-scene chunk size warning is documented rather than suppressed. Formal screen-reader, physical touch-device, Firefox and Safari checks remain pending.

## V3.1 verification (22 October 2026)

196 routine tests pass (one optional exhaustive census skipped), including seven new control/integration/projection tests. Strict TypeScript, lint and production build pass. All 25 domain files match the retained V3 baseline byte for byte. The existing 5,000-hand stress test remains included. Browser suite now collects 29 cases; the focused 1440×900 run could not open a browser (missing bundled executable; installed Chrome exited SIGABRT before page creation). No new browser screenshots, FPS, real fullscreen or audio listening pass is claimed. See the polish report for remaining acceptance steps.

## V4 verification (22 October 2026)

227 routine tests pass; one optional exhaustive census is skipped. All 196 V1–V3.1 tests are retained. Strict TypeScript, lint and production build pass. The 5,000-hand suite reports 26,313 transitions, 710 sessions, 1,535 eliminations and 360 winners. The additional seed-7412 memory-aware suite reports 600 hands, 78 sessions, 7,029 transitions and 12,914 individually checked replay snapshots.

New coverage spans replay accounting/privacy/legacy/corrupt metadata/direct seeking, playback timing/cleanup, real live-controller isolation and restoration, probability counts and evaluation fixtures, seeded estimates/intervals/limits, worker ownership/cancellation/stale messages, UI card selection and NPC memory/profile behavior. `node scripts/verify-probability-worker.mjs` runs the production bundle in a real Node worker host; it is separate from browser Web Worker acceptance.

36 Playwright cases are collected, including seven V4 desktop/tablet/mobile scenarios. The focused V4 real-worker browser test is blocked by installed Chrome exiting SIGABRT before page creation; cleanup reports kill EPERM. It is not an application assertion failure and supplies no browser PASS or screenshot. Actual touch/graphics/audio/fullscreen/worker behavior on browser devices remains pending. See V4-QA-REPORT.md for commands and precise limits.

## V5 verification (22 October 2026)

260 routine tests pass (one optional exhaustive census skipped), including 33 additions for coordinator/player/dealer stages, partial-board runouts, reduced motion, human priority, replay speed, camera/gaze bounds, instant audio, geometry/resource lifetime, preferences, preview/apply/cancel/restore, card inspection, stable flights/tilts and audio scheduling/panning/cleanup. Original tests are retained. Strict TypeScript, lint and production build pass. All 32 domain files match the V4 ZIP byte for byte. Both retained stress suites pass unchanged.

The focused V5 1440×900 Playwright attempt is blocked by installed Chrome exiting SIGABRT before a page/context; cleanup reports kill EPERM. The full 42-case browser suite is collected, not passed. No actual room capture, physical touch/fullscreen check, audio listening or GPU/FPS result is claimed. A software projection of the actual 272-triangle hand geometry was inspected; this is model-only evidence. Reproduce the SVG study with `node --experimental-strip-types scripts/render-hand-study.mjs` on the specified Node 22 runtime. See V5-QA-REPORT.md for limits and commands.
