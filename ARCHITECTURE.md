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


## V3 immersive presentation

features/immersive-play/ contains the viewport shell, preferences, modal, lifecycle/fullscreen hooks, public presentation adapter/event queue, lazy scene components and audio manager. The App conditionally removes its sidebar/topbar for Play and retains the mounted Learn practice state. The existing Play component gained a ControlledPlay renderer so fallback shares the shell's single usePlay controller. V3 added a pause input without changing the domain directory. V4 adds the small, explicit history/memory integrations described below.

Scene modules are PokerRoom/PokerTable3D, PokerScene/CameraDirector, NPCCharacter3D, Card3D and ChipStack3D. No scene component receives hidden state or an engine dispatcher. Camera and quality calculations live in presentation.ts. Presentation effects are cancellable, bounded and subordinate to snapshots. Audio has one owner with explicit activation, independent levels, page-visibility handling and teardown. V3 preferences are isolated from existing schemas.

The rendering architecture, coordinate conventions and lifecycle details are in V3-RENDERING-ARCHITECTURE.md. The original music generator and all visual assets are local. Browser/GPU acceptance is still pending; see V3-QA-REPORT.md.

## V4 boundaries

The only original domain-file changes are optional version-1 completed-hand replay metadata in `play/types.ts`/`engine.ts` and the bounded memory score adjustment in `policy.ts`. Rules, card/evaluator algorithms, legal-action scheduling, settlement amounts and NPC observation allowlists remain unchanged. `play/publicMemory.ts` derives bounded detached public summaries. The controller persists them and rebuilds from authoritative history on restoration, independently of the visual personality system.

`domain/replay/timeline.ts` reuses existing action/history records and derives an absolute presentation snapshot for any event position, without a live session or rules call. `ReplayViewer` shares `PokerScene`; its independent timing controller pauses the live controller and cannot dispatch game commands. History metadata is allowlisted and version-validated. Live visual effects establish a silent baseline on replay return.

`domain/probability-lab/engine.ts` owns pure scenario/count/enumeration/simulation math, using canonical cards and the existing evaluator. The Learn editor owns its independent scenario. A dedicated worker runs all final-hand distributions, with typed request identities, throttled progress, cancellation/termination and stale-response rejection. It has no import of Play/replay/session state. Small exact next-draw ratios remain immediate.

V4 adds no runtime dependencies or services. The existing Play and educational storage schemas remain; V4 preferences/public memory use separate version-1 keys. See the V4 design documents for algorithms, tests and limits.
