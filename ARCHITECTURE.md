# Architecture

Client-only React/strict TypeScript/Vite application. Domain functions own all rules; UI never independently changes chips, cards, legal actions or outcomes. No backend or remote data store.

## Preserved Learn boundary

V1 domain/cards.ts owns canonical identities, validation, cryptographic unbiased shuffle and deterministic injection. evaluation.ts evaluates all five-card subsets and compares structured tuples. game.ts remains the educational table reducer with burns, showdown and visibility projection. exercises.ts, prediction.ts and probability.ts retain actual-state grading and visible-card probability. Card components render accessible symbols without implementing rules.

App owns hash navigation, the V1 reducer, shared settings and progress. Practice stays mounted across navigation; Trainer records each exercise once. Learn’s pokerlab.v1 save retains validated preferences, lifetime totals and 500 detailed records (20 shown). Active Learn hands reset on reload; completed results persist. The secure domain/id.ts helper replaces randomUUID dependency on local HTTP hosts.

## Play modules

| Module | Responsibility |
| --- | --- |
| domain/play/types.ts | Sessions, seats, commands, legal descriptors, pots/history/lifecycle |
| domain/play/engine.ts | Creation, dealing, positions, legality, scheduling, forced streets, settlement, elimination, public projection |
| domain/play/pots.ts | Contribution caps, eligibility, refunds, pot awards and odd chips |
| domain/play/invariants.ts | Runtime card/lifecycle/chip/log/history/payout validation |
| domain/play/observation.ts | Explicit detached frozen NPC allowlist |
| domain/play/policy.ts | Personality/difficulty heuristic and safe legal fallback |
| features/play/usePlay.ts | Command reducer, persistence synchronization, cancellable NPC presentation |
| features/play/Play.tsx | Setup, table and lifecycle screens |
| features/play/ActionControls.tsx | Accessible legal total amounts/slider/commands |
| features/play/HandHistory.tsx | Public actions, tabled hands, awards and stack changes |
| lib/playStorage.ts | Separate schema-2 save/load and invalid-save quarantine |
| qa/ | Development-only actual iframe viewports and deterministic fixtures |

Commands carry session identity and revision, so obsolete timers or duplicate clicks cannot act on a later/new session. Setup and next-hand randomness are created outside React’s reducer. Domain forced transitions resolve synchronously; timers only pace display. Cleanup cancels work on turn, pace and navigation changes. The controller asserts new state and retains the last valid state on errors. Storage effects warn on failure without disabling in-memory play.

Play restores the full active deck/card locations, contributions, positions, actor and 100 completed public records. Corrupt saves remain untouched until explicit discard. Learn’s existing key/schema are unchanged. getPlayView masks opponents and excludes deck/burns; NPC policy receives a narrower allowlist and never receives Session. Browser-local saves remain inspectable by their owner; this is not an adversarial multiplayer sandbox.

Detailed algorithms are in V2-ENGINE-DESIGN.md and V2-NPC-DESIGN.md.
