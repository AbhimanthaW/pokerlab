# Testing

Node.js 22.12+ and npm ci are required.

```sh
npm run typecheck
npm run lint
npm test
npm run build
POKERLAB_EXHAUSTIVE=1 npm test -- src/domain/census.test.ts
```

**152 routine tests pass**, including all 89 original V1 tests. One exhaustive test is optional; its separate run passed all 2,598,960 five-card combinations against exact category totals. Targeted fixtures cover all categories, tie/kicker ordering, wheel/royal hands, best-of-seven and equivalent optimal selections.

## V2 coverage

- engine.test.ts: dealing/positions, genuine heads-up transition after elimination, partial blinds, BB option, actions/rejections, full/short/cumulative raises, per-player reopening, short opening, partial calls, fold wins, independent pots, folded contributions, refunds, ties/odd chips and session outcomes.
- npc.test.ts: all profiles/difficulties, legal/reproducible actions, different aggression, frozen explicit allowlists, inaccessible-card independence and malformed-output fallback.
- playStorage.test.ts: exact restore, stale revisions, separate Learn data, malformed/unsupported/corrupt snapshots, denied access, card/chip/actor errors, historical payout reconciliation and 100-hand bound.
- Play.test.tsx: seven component/controller regressions covering setup, legal controls, invalid amounts, hidden cards, remount, StrictMode timers, cancellation, double clicks, explicit corrupt-save discard, cross-session token guards and invalid-command diagnostics.
- stress.test.ts: 5,000 complete seeded hands, mixed varied legal choices/NPCs, one to five opponents and all difficulties; assertions after EVERY transition and a reproducible-seed deadlock guard.

Stress observed 26,313 transitions, 710 sessions, 1,535 eliminations and 360 sole-survivor outcomes without card, actor, chip, contribution-log, historical-payout or lifecycle violations.

```sh
npm test -- src/domain/play/stress.test.ts --reporter=verbose --silent=false
```

## End-to-end

```sh
npx playwright install chromium
npm run test:e2e
```

17 committed cases: six V1 regressions, eleven V2 cases including five widths (320/390/768/1280/1600), setup, human/NPC actions, pots, next hand, persistence, corruption, victory and human elimination. Fixtures are test-only, never ordinary Play controls. POKERLAB_CHROMIUM_PATH can select a compatible installed executable; PLAYWRIGHT_BASE_URL reuses an existing server. Otherwise the config launches Vite at localhost:5173. Reports/captures are ignored generated output.

**Current limitation:** the recovered delivery reported invalid browser downloads. In this resumed macOS audit, all 16 then-existing cases were blocked at installed Chrome launch (SIGABRT). A focused retry with the installed headless shell failed at `bootstrap_check_in org.chromium.Chromium.MachPortRendezvousServer: Permission denied (1100)`, before page execution. The improved suite now collects 17 cases. No standalone passing result is claimed; run outside this browser-launch restriction.

The ordinary-dealing smoke case permits a blind win before the human turn. A separate legal engine-built river fixture verifies settlement/next-hand/refresh without assuming the human survives an arbitrary random first hand. TypeScript checks E2E and development fixtures as well as src.

## Historical available-browser checks

The recovered delivery reported that live browser interaction separately verified ordinary Play through showdown/next hand, exact refresh, final all-in victory, early elimination, mobile controls, V1 hand completion and trainer grading. The development-only qa/viewport.html provides actual iframe CSS viewports; qa/fixtures.ts supplies legal deterministic scenarios only there. Both are excluded from production imports/build.

Client/scroll widths matched at 320/390/768/1280/1600 iframe widths (client excludes scrollbar). Screenshots reviewed at 320/390/768/1280; 1600 full-page capture timed out. These historical checks were not repeated in this macOS audit and are not the committed standalone suite and do not establish real touch-device, Firefox/Safari or formal screen-reader coverage. See V2-QA-REPORT.md.
