# PokerLab V2

Local Texas Hold’em learning and single-player simulation, extending V1. No backend, accounts, external APIs, deployment, real currency, purchases, refill, rebuy, prizes or redeemable rewards.

## Launch

Node.js **22.12+**, npm, and a modern Web Crypto browser are required. From this directory:

```sh
npm ci
npm run dev
```

Open **http://127.0.0.1:5173/** and choose **Play**. Keep the terminal running. Installation needs registry access; playing uses no external service.

Default Play: one human, three NPCs, 1,000 fictional chips each, fixed 5/10 blinds. Configure one to five opponents and three difficulties. NPC pace can be instant, normal, or relaxed. Amount fields are **final street totals**. Calls show chips added; All-in shows the resulting total. Only legal commands appear.

Dealer and blinds rotate; full/short/cumulative raises, side pots, refunds, ties and odd chips are handled. Eliminations occur after settlement. Last survivor wins; early human elimination ends the user’s session without an unseen NPC tournament. Opponents use approximate personality heuristics, not solvers.

The active Play hand and latest 100 completed records save automatically. Refresh restores the exact hand. Leaving Play pauses NPC presentation. Ending/discarding a live session requires confirmation. Saves are browser-local, unencrypted and readable through developer tools; clearing browser data removes them. Use one Play tab at a time.

## Learn

V1 Practice Table, all three trainers, rankings, explanations, progress and settings remain. Active Learn hands reset on reload; completed progress persists. Learn uses pokerlab.v1; Play uses pokerlab.play.v2. No migration or overwrite of Learn data is required. Shared motion and suit preferences apply throughout the app.

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

Production output: dist/. Development qa/ fixtures are excluded from the production build and never determine ordinary game outcomes.

152 routine tests, TypeScript, lint, build, 5,000-hand stress audit and exhaustive 2,598,960-hand evaluator census passed. Historical live browser observations are retained in the QA report. Fresh macOS browser acceptance remains blocked before page execution: installed Chrome aborts at launch and installed headless Chromium is denied Mach-port bootstrap permission. The current suite collects 17 cases, but none is claimed as passing. This remains an outstanding acceptance requirement.

See STATUS.md, TESTING.md, GAME-RULES.md, ARCHITECTURE.md and the four V2 design/specification/QA documents for details.
