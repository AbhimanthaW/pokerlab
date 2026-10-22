
# PokerLab

**An offline Texas Hold'em simulator and interactive learning environment, featuring a stylized 3D cardroom, autonomous NPCs, cinematic replays, and probability analysis.**

PokerLab began as an educational poker trainer and evolved into an immersive single-player card-game experience.

Version 5.0 is the final release of the original learning and simulation application. Future development of **PokerLab: The Night Room** takes the project toward a standalone narrative game.

## Features

### Texas Hold'em

- Complete No-Limit Texas Hold'em simulation
- Freshly shuffled 52-card deck for each hand
- One human player against configurable NPC opponents
- Fictional chips, blinds, raises, folds, and all-ins
- Pot and side-pot resolution
- Dealer rotation, eliminations, and last-player-standing sessions
- Autonomous NPCs with distinct behavior profiles
- Local session persistence and hand history

### Immersive 3D cardroom

- Stylized low-poly casino lounge
- Animated NPC characters and dealer
- First-person seated camera and player hands
- Physical 3D cards and fictional chips
- Card dealing, chip movement, and character animations
- Standard, Cinematic, and Instant camera modes
- Music, sound effects, and environmental ambience
- Room, felt, card-back, chip, and player-hand customization
- Responsive HUD and graphics quality settings

### Learning and analysis

- Interactive hand-training exercises
- Hand-ranking reference
- Educational feedback and saved progress
- Cinematic completed-hand replay
- Probability Lab with custom scenarios
- Exact combinatorial calculations
- Cancellable probability simulations and confidence intervals

## Technology

- React
- TypeScript
- Vite
- Three.js
- React Three Fiber
- Drei
- Playwright
- Vitest

The application runs locally without a backend, account, or external API.


## Getting started

### Prerequisites

- Node.js 22.12.0 or newer
- npm
- A modern browser

### Installation

Clone the repository:

```bash
git clone https://github.com/AbhimanthaW/pokerlab.git
cd pokerlab
```

Install dependencies:

```bash
npm ci
```

Start the development server:

```bash
npm run dev
```

Open the URL printed by Vite, normally:

http://127.0.0.1:5173/

### Production build

```bash
npm run build
npm run preview
```

The application runs entirely locally. No account, backend, deployment, or external API is required.

## Testing

From the `pokerlab` application directory:

```bash
npm run typecheck
npm run lint
npm test
npm run build
```

Install Playwright's Chromium browser if necessary:

```bash
npx playwright install chromium
```

Run the browser suite:

```bash
npm run test:e2e
```

### V5 verification

The final native macOS verification reported:

| Check | Result |
| --- | --- |
| Unit tests | 260 passed |
| Playwright E2E tests | 42 passed |
| TypeScript | Passed |
| Lint | Passed |
| Production build | Passed |
| Core game stress suite | 5,000 hands |
| Additional V4/V5 regression stress | 600 hands |

The optional exhaustive five-card census was not rerun during V5 verification.

Physical-device audio listening and sustained GPU/FPS profiling remain separate acceptance activities.


## Project structure

```text
pokerlab/
├── .gitignore
├── README.md
├── ARCHITECTURE.md
├── GAME-RULES.md
├── STATUS.md
├── TESTING.md
├── package.json
├── package-lock.json
├── playwright.config.ts
├── vite.config.ts
├── src/
│   ├── app/
│   ├── components/
│   ├── domain/
│   ├── features/
│   └── lib/
├── public/
│   └── audio/
├── e2e/
├── qa/
└── scripts/
```

The repository root is also the application root.

Version-specific design documents, implementation notes, asset licenses, and QA reports are maintained at the repository root.

See [ARCHITECTURE.md](ARCHITECTURE.md) for the technical design, [TESTING.md](TESTING.md) for verification procedures, and [STATUS.md](STATUS.md) for the current release status.

## Version history

| Version | Milestone |
| --- | --- |
| V1 | Educational foundation and hand evaluation |
| V2 | Complete Texas Hold'em simulation and NPC opponents |
| V3 | Immersive 3D cardroom |
| V3.1 | Camera, HUD, and UX refinement |
| V4 | Living NPCs, hand replay, and Probability Lab |
| V5 | Player hands, dealer animation, customization, cinematics, and atmosphere |

### Future development

**V6: The Night Room**

A separate game-development direction focused on a fully explorable casino, character-driven mystery, investigation, and narrative gameplay.

The V5 release remains preserved independently.

## Project status

**V5.0.0 — Final learning and simulation release**

Development and testing are local. No hosted production deployment is included.

## Licensing and assets

Source-code licensing has not yet been finalized.

See the application asset-license documentation for relevant asset provenance and usage terms. Do not assume all audiovisual assets are covered by a future source-code license.

## Disclaimer

PokerLab is a fictional-chip-only software project. It does not support real-money transactions, deposits, withdrawals, purchases of chips, or redeemable rewards.