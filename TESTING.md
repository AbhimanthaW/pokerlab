# Testing

Run from the project directory after `npm ci` with Node.js 22.12 or newer.

## Routine checks

```sh
npm run typecheck
npm run lint
npm test
npm run build
```

Vitest uses jsdom and React Testing Library setup. Tests live beside the modules they exercise. The exhaustive census is intentionally skipped during a normal test run.

## Coverage

- **Deck:** 52 unique canonical cards, rank/suit validation, deterministic injected shuffle, unchanged source deck, removal, correct dealing, and exhaustion.
- **Evaluator:** all nine categories; royal and wheel straight flushes; Ace-high straights; full house versus flush; competing trips and pairs; every kicker position; exact and community-only ties; best five of six/seven; equivalent selections; duplicate and invalid cards.
- **Game:** one through five opponents, round-robin private cards, phase/card counts, burn sequence, hidden information, complete showdown, multiple winners, restart/reset, malformed starts, and invalid transitions.
- **Exercises:** correct/incorrect/skipped grading, best-five equivalence, invalid selections, comparison kickers/ties, and legal generated examples across all three difficulties.
- **Predictions and probability:** grading from actual hidden hands; ties and skips; rejected incomplete states; visible-card-only probability and invalid input.
- **App UI:** table visibility/progression, immediate feedback, single submission, skipped accounting, navigation continuity, session-unique records, next-hand opponent preference, keyboard card selection, skip-link routing, and collapsed-navigation accessible names.
- **Storage:** missing/corrupt/unsupported schemas, validated preferences/cards/timestamps, denied storage access, deduplication, skip accounting, bounded detailed history, and lifetime totals after reload.

## Exhaustive evaluator audit

```sh
POKERLAB_EXHAUSTIVE=1 npm test -- src/domain/census.test.ts
```

This evaluates **all 2,598,960 distinct five-card hands** and compares category counts against the independently derived exact census:

| Category        |     Hands |
| --------------- | --------: |
| High Card       | 1,302,540 |
| One Pair        | 1,098,240 |
| Two Pair        |   123,552 |
| Three of a Kind |    54,912 |
| Straight        |    10,200 |
| Flush           |     5,108 |
| Full House      |     3,744 |
| Four of a Kind  |       624 |
| Straight Flush  |        40 |

Royal flushes are included among straight flushes. The census checks category classification comprehensively; targeted tests separately check comparison ordering and best-of-seven selection.

## Browser tests

```sh
npx playwright install chromium
npm run test:e2e
```

Playwright browser installation is needed once per environment unless the configured browser is already installed. Browser checks must cover a complete table hand, answer submission, hidden-card reveal, a new hand, persisted progress after reload, trainer submission, and a mobile viewport. Use the Playwright configuration for the actual server and browser selection.

Earlier implementation notes report six Playwright scenarios passing in local Chromium 153: full hand through review/restart, all trainer types, persistence and reset, and five-opponent layouts at 320/390/768px. Those notes record desktop showdown and responsive table/trainer screenshot review with no console or page errors. Firefox and Safari were not tested. In the resumed session, `npm run test:e2e` was attempted again but blocked before browser launch: Vite could not listen on 127.0.0.1:5173 (EPERM). These historical results are not a fresh browser pass; rerun locally with server permissions.

For an existing compatible Chromium binary, set `POKERLAB_CHROMIUM_PATH` to its absolute executable path before running the suite. The default uses Playwright’s installed Chromium. No personal machine path is embedded in the config. The tests use shuffled hands and assert invariant behavior; deterministic card and randomness fixtures live in domain tests. Reports and captures are under `playwright-report/` and `test-results/`, both ignored source artifacts.

## Verification record

| Check                                     | Observed result                      |
| ----------------------------------------- | ------------------------------------ |
| Strict TypeScript                         | Passed                               |
| ESLint                                    | Passed                               |
| Normal unit/domain/storage run            | 89 passed; 1 optional census skipped |
| Separate exhaustive five-card census      | Passed: all 2,598,960 hands          |
| Production build                          | Passed                               |
| UI/component tests                        | 8 passed (included in the 89)        |
| Playwright end-to-end                     | Current run blocked: localhost EPERM; earlier notes report 6 passed |
| Desktop, tablet, mobile visual inspection | Earlier notes: 1440/768/390/320px; current inspection blocked |
