# PokerLab V3 — The Night Room

An offline educational Hold’em application with V1 Learn, the V2 single-player game engine, and a new immersive 3D presentation. **V3 visual/browser acceptance is still pending; it is not claimed complete.** No deployment, backend, accounts, real currency, purchases, refill, prizes or redeemable rewards.

## Launch

Node.js 22.12+ and npm are required:

```sh
npm ci
npm run dev
```

Open http://127.0.0.1:5173/ and choose Play. Installation needs registry access; playing uses no external service. A WebGL2-capable browser enables 3D; the retained 2D table remains available manually and on renderer failure.

Play hides the ordinary sidebar and fills the viewport. The board has a readable flop/turn/river strip and a private-hand dock; 3D card reveals do not replay on ordinary actions. The settings icon or Escape opens the pause menu. Drag/touch looks around within limits; scroll zooms; keyboard-operable menu buttons adjust/reset the camera. Browser fullscreen is optional and entered only through its control. Return to Learn preserves the active hand. Audio starts locked until you enable it; master/music/effects/ambient levels are separate. Low/Medium/High/Auto graphics and reduced-motion behavior are supported.

Default sessions retain one human, three NPCs, equal 1,000 fictional chips and fixed 5/10 blinds. Configure one to five NPCs and three difficulties. Legal controls, raises, pots, all-ins, elimination, history and outcomes use the unchanged V2 engine. Numerical chip totals are exact; 3D tokens are bounded representative stacks. The session stops at last-player-standing victory or early human elimination after hand resolution.

## Data and Learn

V1 Practice Table, all three trainers, rankings, progress, settings and explanations remain. Learn data keeps pokerlab.v1. Full active sessions and the latest 100 completed hands keep pokerlab.play.v2/schema 2. V3 display/audio preferences use pokerlab.immersive.v3/schema 1. No game-save migration is required. Saves are local, unencrypted, and not coordinated across tabs; use one Play tab at a time.

## Verify

```sh
npm run typecheck
npm run lint
npm test
npm run build
POKERLAB_EXHAUSTIVE=1 npm test -- src/domain/census.test.ts
npx playwright install chromium
npm run test:e2e
```

Strict TypeScript, lint, 189 routine tests and production build pass. The unchanged 5,000-hand stress test passes; all 152 existing tests remain. There are 28 committed browser cases, but the current Chromium launch fails before page execution with macOS Mach-port bootstrap Permission denied (1100). No fresh visual review, FPS result or full browser acceptance is claimed. See V3-QA-REPORT.md for the exact blocker and manual checklist.

The scene is lazy-loaded in a roughly 940 kB minified chunk (~251 kB gzip); Vite emits a size warning. The original bundled instrumental is a 146-second WAV, fetched after audio enable. Regenerate it with python3 scripts/compose_lounge.py from this directory. Asset origins and licenses are documented in V3-ASSET-LICENSES.md.

See ARCHITECTURE.md, GAME-RULES.md, TESTING.md and the V2/V3 specification, design and QA documents. Source packages exclude node_modules, build output, caches and generated test reports. No cloud deployment has been performed.
