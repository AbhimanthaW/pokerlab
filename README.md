# PokerLab

A local Texas Hold’em learning table built with React, strict TypeScript, Vite, Tailwind CSS, and Lucide icons. Practice recognizing hands, selecting the best five cards, and comparing showdown results without wagering.

## Run locally

Prerequisites: Node.js **22.12 or newer**, npm, and a modern browser with Web Crypto support. Installation requires access to the npm registry; the running app uses no external service.

```sh
npm ci
npm run dev
```

Open **http://127.0.0.1:5173**. Keep the terminal running; press Ctrl+C to stop it. No account, environment variables, backend, cloud database, or API keys are needed.

## What you can do

- Deal a fresh hand against one to five hidden opponents. Reveal the flop, turn, river, and showdown at your own pace.
- Identify your current hand and choose its best five cards on each community-card street. Any equivalent optimal five-card selection is accepted.
- Predict the showdown winner or a tie before opponents’ cards are revealed. These predictions involve unknown information and do not measure strategic skill.
- Train separately with hand recognition, best-five selection, and comparison problems at three difficulties.
- Consult all nine hand rankings with illustrated examples and tie-breaking rules.
- Review accuracy, exercise history, and frequently missed categories; configure opponents, motion, animation speed, and suit colors.

Continuing from a street records its unfinished table exercises as **skipped**, never incorrect. Trainer questions left without submission are unfinished and are not recorded. There is no timer.

## Data and privacy

Settings, lifetime counts, and the most recent 500 detailed results are saved in this browser’s localStorage. The Progress screen displays the latest 20 explanations. Reloading starts a fresh table while keeping saved learning progress. Clearing browser data removes that progress. Settings includes a progress reset that preserves preferences.

There are no wagers, chips, prizes, payments, multiplayer services, accounts, analytics services, or solver recommendations.

## Development commands

```sh
npm run typecheck
npm run lint
npm test
npm run build
npm run preview
```

The production files are emitted to `dist/`. Preview uses the URL printed by Vite. See [TESTING.md](TESTING.md) for Playwright and the optional exhaustive evaluator audit.

## Project guide

- [ARCHITECTURE.md](ARCHITECTURE.md): modules, state, and persistence.
- [GAME-RULES.md](GAME-RULES.md): dealing, rankings, and comparison rules.
- [TESTING.md](TESTING.md): suites and verification commands.
- [STATUS.md](STATUS.md): implemented behavior, verification, and limitations.
