# PokerLab V1 status

PokerLab V1 is implemented locally. No deployment or cloud resources were created. TypeScript, lint, 89 routine tests, and the production build were rerun successfully on 21 October 2026. Browser verification could not be repeated in the resumed session: starting Vite at 127.0.0.1:5173 failed with EPERM under the current environment permissions. Earlier browser results below are retained as historical implementation notes, not a fresh browser pass.

## Implemented

- React/TypeScript application with Practice Table, Hand Trainer, Hand Rankings, Progress, and Settings navigation.
- Validated 52-card deck, secure unbiased ordinary shuffle, deterministic injected randomness for fixtures, and pure evaluator/comparison modules.
- Best-five evaluation of five, six, or seven cards; all nine categories, complete kicker ordering, wheel straights, royal-flush display, and exact/multiple-winner ties.
- Explicit no-wager table progression, private cards, hidden opponents, community cards with burns, showdown, review, and fresh hands.
- Flop/turn/river recognition and best-five exercises; equivalent optimal selections, skips, actual-state explanations, and optional showdown predictions.
- Three trainer modes and three difficulties using legal randomized scenarios and curated edge cases.
- Illustrated ranking reference and a visible-information ace-probability example.
- Lifetime accuracy/counts by exercise type, frequently missed categories, the latest 500 detailed records, and the latest 20 explanations in the Progress screen.
- Versioned localStorage validation/recovery, storage-failure messaging, persisted settings, and confirmed progress reset.
- Responsive styling, keyboard-operable controls, visible focus, suit symbols independent of color, system/manual reduced motion, animation speed, and optional four-color suits.

## Verification

| Check                                                                  | Status                                                                                                                |
| ---------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| Strict TypeScript                                                      | Passed                                                                                                                |
| Lint                                                                   | Passed                                                                                                                |
| Unit/domain/storage suite                                              | 89 passed; 1 optional exhaustive test skipped in routine run                                                          |
| Separate exhaustive five-card census                                   | Passed: every one of 2,598,960 hands matched exact category counts                                                    |
| Production build                                                       | Passed: Vite production bundle generated                                                                              |
| Component integration tests                                            | Passed: 8 App interaction/accessibility regression tests (included in the 89)                                         |
| Playwright end-to-end flows                                            | Earlier implementation notes report 6 Chromium scenarios passed; current rerun blocked before launch (local port EPERM)                                                          |
| Actual browser interaction and desktop/tablet/mobile screenshot review | Earlier implementation notes report review at 1440/768/390/320px; not repeated in the resumed session |

Earlier implementation notes record a technical review of ranking tuples, tie handling, visibility, dealing uniqueness, exercise equivalence, storage recovery, and lifetime counting. Two integration defects identified in review were fixed: cross-reload table result ID collisions and the player-count label after changing next-hand opponent preferences.

## Limitations

- Current browser verification is blocked by local server permissions (EPERM); no fresh screenshot or browser inspection is claimed. Earlier implementation notes record verification in Chromium 153. Firefox/Safari and a formal screen-reader/contrast audit have not been run. The in-app browser renderer failed independently of the app; actual Chromium interaction and screenshots were used.
- Active hands and unfinished trainer exercises do not survive reload. Saved settings and completed/skipped results do.
- Browser storage is device/profile-specific and can be cleared or blocked. There is no cloud sync or export/import interface.
- Prediction results involve hidden information and should not be used to assess strategic ability. Their accuracy is displayed with that caveat.
- Difficulty changes examples; it does not alter poker rules or provide solver recommendations.
- Sound is not implemented, so no sound setting is presented.
- No betting, dealer-button rotation, chip stacks, multiplayer, accounts, backend, hosted resources, or deployment is included.
- The app requires a modern browser with Web Crypto and is intended to be served through localhost; opening `index.html` directly is not the supported launch path.

## Next priorities

No unfinished V1 core feature was found in source review or the passing routine checks. Repeat the Playwright suite and visual inspection in a session that can open localhost before treating current browser acceptance as verified. Useful optional priorities are Firefox/Safari browser coverage, additional curated teaching scenarios, and a user-requested progress export/import flow. No future feature is represented by a placeholder control.
