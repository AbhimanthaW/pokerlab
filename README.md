# PokerLab V4 — The Living Table

An offline educational Hold’em application with Learn, single-player Hold’em, an immersive 3D room, living NPCs, read-only hand replay and Probability Lab. **V4 browser/visual acceptance remains pending; automated implementation checks pass.** No deployment, backend, accounts, real currency, purchases, refill, prizes or redeemable rewards.

## Launch

Node.js 22.12+ and npm are required:

```sh
npm ci
npm run dev
```

Open http://127.0.0.1:5173/ and choose Play. Installation needs registry access; playing uses no external service. A WebGL2-capable browser enables 3D; the retained 2D table remains available manually and on renderer failure.

Play hides the ordinary sidebar and fills the viewport. The physical 3D cards remain central, with readable card/opponent summaries behind Table details; 3D card reveals do not replay on ordinary actions. The settings icon or Escape opens the pause menu. Drag/touch looks around within limits; scroll zooms; keyboard-operable menu buttons adjust/reset the camera. Browser fullscreen is optional and entered only through its control. Return to Learn preserves the active hand. Audio starts locked until you enable it; master/music/effects/ambient levels are separate. Low/Medium/High/Auto graphics and reduced-motion behavior are supported.

Default sessions retain one human, three NPCs, equal 1,000 fictional chips and fixed 5/10 blinds. Configure one to five NPCs and three difficulties. Legal controls, raises, pots, all-ins, elimination, history and outcomes use the preserved V2 rules engine. V4 adds replay metadata at settlement and a bounded public-memory policy extension. Numerical chip totals are exact; 3D tokens are bounded representative stacks. The session stops at last-player-standing victory or early human elimination after hand resolution.

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

Strict TypeScript, lint, 227 routine tests and production build pass. All 196 V1–V3.1 tests remain, including the original 5,000-hand stress suite; V4 adds a 600-hand memory/replay stress suite. There are 36 committed browser cases, but the fresh installed-Chrome attempt exits SIGABRT before page execution. No fresh visual review, FPS result or full browser acceptance is claimed. See V4-QA-REPORT.md for evidence and remaining checks.

The scene is lazy-loaded in a roughly 940 kB minified chunk (~251 kB gzip); Vite emits a size warning. The original bundled instrumental is a 146-second WAV, fetched after audio enable. Regenerate it with python3 scripts/compose_lounge.py from this directory. Asset origins and licenses are documented in V3-ASSET-LICENSES.md.

See ARCHITECTURE.md, GAME-RULES.md, TESTING.md and the V2/V3 specification, design and QA documents. Source packages exclude node_modules, build output, caches and generated test reports. No cloud deployment has been performed.

## V3.1 polish

Play now uses compact contextual actions; select Bet/Raise to edit and confirm a final total, or Cancel/Escape to return. Table details provides readable cards and opponent stacks without permanent duplicate overlays. Desktop camera framing is adjusted while preserving the seated room. Existing saves and Learn progress are retained. Automated checks pass; actual browser visual/audio acceptance is still pending. See [V3.1-POLISH-REPORT.md](V3.1-POLISH-REPORT.md).

## V4: The Living Table

- **Living NPCs:** personality-specific motion/posture, lightweight facial cues, bounded memory of public actions/reveals and optional short milestone text. Character dialogue is configurable in Pause/settings.
- **Replay:** choose Replay last hand after settlement or Replay hand in Hand history. Play/pause, restart, event stepping, timeline seek and 0.5×/1×/2× speed reuse the existing 3D room. Return to live Play preserves the exact session; a refresh restores live Play. Older history is labeled limited when private-card metadata is missing.
- **Probability Lab:** under Learn, select private/board/unavailable cards. Inspect exact conditional ratios, enumerate up to 25,000 board completions, or run 100–100,000 seeded simulations in a cancellable Web Worker. Compare counts, frequencies, Wilson intervals and estimation error. Calculations are isolated from live cards and deck order.

New hands retain optional replay metadata inside the compatible schema-2 save; separate `pokerlab.v4.settings` and `pokerlab.v4.public-memory` version-1 keys hold small preferences/public summaries. No migration discards old progress or active sessions.

Run `npm test`, `npm run typecheck`, `npm run lint`, `npm run build`; then optionally `node scripts/verify-probability-worker.mjs`. Run `npm run test:e2e` on a browser-capable host. See [V4-QA-REPORT.md](V4-QA-REPORT.md), [V4-REPLAY-ARCHITECTURE.md](V4-REPLAY-ARCHITECTURE.md), [V4-NPC-SYSTEM.md](V4-NPC-SYSTEM.md) and [V4-PROBABILITY-LAB.md](V4-PROBABILITY-LAB.md).
