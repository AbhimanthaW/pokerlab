# NPC design

NPC decisions are local TypeScript functions; no model service, inference engine, training backend, or hidden-card access is involved.

`observeNpc` constructs an explicit allowlist: own two cards, revealed board, own/public stacks and contributions, public seat positions and action history, pot, street, legal descriptor, assigned personality, and difficulty. Arrays and card objects are detached copies and deeply frozen. The policy module imports the observation type, not Session. It cannot mutate source cards or see deck order, burns, other hole cards, or unrevealed results through this boundary.

## Decision process

Preflop strength is approximated from ranks, pairing, suitedness, connectivity, and gaps. Postflop it uses the existing evaluator’s visible-hand category and relevant ranks. Standard/Challenge add basic draw information. Challenge considers more participants, public aggression, paired boards, position, and stack exposure. A call-cost/pot fraction and controlled noise influence selectivity and action choice. Permitted raises are sized within the legal total range.

Profiles have different aggression, selectivity, and variability parameters:

| Profile | Behavior |
| --- | --- |
| Cautious | More selective, low aggression, narrower variation |
| Aggressive | More initiation, broader participation |
| Casual | Much wider judgment noise and less consistent choices |
| Analytical | Low noise and consistent visible-information evaluation |

Beginner adds larger judgment noise; Challenge uses additional public features. None changes cards, chip supply, legality, or outcomes. This is a lightweight behavior heuristic, not calibrated equity, range inference, or a solver. Statistical strength claims are intentionally absent.

The policy accepts injected randomness. `safeNpcAction` validates its proposed command against the observation’s legal descriptor and substitutes check or fold if malformed. The controller also validates through the game engine. An engine/policy diagnostic pauses NPC presentation; storage-write warnings do not disable in-memory play.

## Verification

Tests verify allowed observation keys, absence of human-card IDs, frozen detached values, identical observations/decisions when inaccessible cards change, legal actions for all profiles and difficulties, seeded repeatability, malformed-output fallback, and differing aggression frequencies on identical observed states. Stress runs mix random legal choices with these NPC decisions. Presentation tests check StrictMode remount, timer cleanup, revision guards, and duplicate clicks.

Because the game runs offline in the owner’s browser, its complete save is readable using developer tools. The restricted API prevents accidental policy information leakage; it is not an OS sandbox against deliberately rewritten code.
