# Testing PokerLab V3

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

189 routine tests pass: all 152 pre-V3 tests plus 37 new tests. Strict TypeScript includes src, E2E and QA fixtures; lint and production build pass. The V1/V2 domain directory is unchanged. The ordinary suite includes the 5,000-hand seeded stress test with invariant assertions after every transition. The exhaustive five-card census is optional in routine runs; its earlier separate V2 run passed all 2,598,960 hands. Do not infer a fresh exhaustive run from a skipped routine test.

V3 presentation.test.ts covers public visibility, legitimate showdown cards, silent restoration, stale/duplicate events, cancellation, bounded rapid queues, exact snapshot convergence, seat anchors, camera limits and quality choices. preferences.test.ts covers schema isolation, recovery and explicit fullscreen/rejection. AudioManager.test.ts covers activation, singleton playback resources, independent levels, inactive behavior, cleanup, async unmount, autoplay rejection and WAV validity/duration. ImmersivePlay.test.tsx covers sidebar removal/Learn return, shared-controller display switching, renderer fallback, settings/focus/Escape, StrictMode cleanup and NPC pause/resume. Its scene is mocked; it is not a WebGL or screenshot test. cardMotion.test.ts uses real Three.js Groups with a controlled frame hook to verify reveal/placement lifecycles and stable texture identity across cloned states. VisibleCards.test.tsx verifies flop/turn/river isolation and stable displayed-card nodes.

## Browser suite

```sh
npx playwright install chromium
npm run test:e2e
```

28 collected cases: six V1 regressions, eleven retained V2 flows in the 2D renderer, and eleven V3 cases. V3 covers actual canvas/labels/control bounds at 1920x1080, 1440x900, 1280x800, 768x1024, 390x844 and 320x640; switching/Learn/refresh; context loss; fullscreen rejection; final victory and early human elimination. Browser fixtures are test-only and do not choose ordinary game outcomes. POKERLAB_CHROMIUM_PATH selects a compatible installed browser; PLAYWRIGHT_BASE_URL reuses an existing server. The default config starts Vite on localhost:5173.

Current result: the focused V3 desktop attempt failed at browser launch, before page assertions, with bootstrap_check_in org.chromium.Chromium.MachPortRendezvousServer: Permission denied (1100), followed by SIGTRAP. No passing browser result or rendered screenshot is claimed. No browser restrictions were bypassed. Rerun in a normal environment that allows Chromium subprocesses.

## Manual visual/audio/performance gate

Use V3-QA-REPORT.md's checklist. Inspect actual room/table/characters/cards/chips, seat/order markers, lighting, camera limits/reset, all six viewport sizes, no control overlap and card readability. Complete a session, review pots/history, refresh mid-hand, return to Learn and retry 2D/3D. Test real fullscreen entry/Escape and renderer context loss without losing the hand.

Listen through the full music piece and loop; test every volume/mute, effects, inactive-tab behavior and repeated Play entry/exit. Measure FPS/frame time, draw calls, memory and repeated GPU/audio cleanup on real desktop/mobile hardware. No FPS target is claimed achieved yet. The Vite lazy-scene chunk size warning is documented rather than suppressed. Formal screen-reader, physical touch-device, Firefox and Safari checks remain pending.
