# Architecture

PokerLab is a client-only application. React renders the interface; framework-independent domain modules own every poker rule. There is no application server or remote data store. Vite is the local development and production build tool.

## Module boundaries

| Module                      | Responsibility                                                                                                                 |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `src/domain/types.ts`       | Typed card, hand, game, answer, exercise, result, and preference contracts.                                                    |
| `src/domain/cards.ts`       | Canonical card identities, deck validation, unbiased shuffle, injected test randomness, dealing, removal, and fixture parsing. |
| `src/domain/evaluation.ts`  | Five-card evaluation, best-of-six/seven combinations, descriptions, and lexicographic comparisons.                             |
| `src/domain/game.ts`        | Explicit table transitions, dealing with burns, showdown winners, and safe player visibility projection.                       |
| `src/domain/exercises.ts`   | Legal random and curated trainer problems; evaluator-based recognition, comparison, selection, and skip grading.               |
| `src/domain/prediction.ts`  | River prediction grading against actual hands, including tied winners.                                                         |
| `src/domain/probability.ts` | Ace probability conditional only on visible cards.                                                                             |
| `src/components/Cards.tsx`  | Accessible card rendering and selectable card rows; no poker evaluation.                                                       |
| `src/features/`             | Practice, Trainer, Reference, Progress, and Settings screens.                                                                  |
| `src/lib/storage.ts`        | Schema validation, safe recovery, bounded history, lifetime counts, and progress summaries.                                    |
| `src/app/App.tsx`           | Hash navigation, application reducer, persisted data, settings, storage warnings, and an error boundary.                       |
| `src/styles.css`            | Responsive tabletop styling, design tokens, visible focus, card transitions, reduced-motion and four-color modes.              |

## State flow

`App` owns the table through `useReducer(gameReducer, initialGame)`. Practice dispatches typed actions; the reducer permits only valid phase transitions. It returns unchanged state for invalid transitions. Opponent card components receive the visibility projection rather than raw private cards before showdown.

Practice holds transient answer and selection state for the current hand. Its per-session UUID and hand/street/exercise keys prevent duplicate progress records and collisions across reloads. The Practice component stays mounted while navigating so an active hand survives page changes. Trainer owns its current exercise, selection, and locked feedback state; its submit guard records each result once.

Grading returns a typed result from the same evaluator used at showdown. `onRecord` appends it through a functional application-state update. Settings update shared preferences; opponent changes apply when the next hand starts. Reload deliberately discards the active hand.

## Persistence

The `pokerlab.v1` localStorage entry has a versioned schema: `version`, `settings`, `records`, and `totals`. No personal information is requested or stored.

Every loaded setting, result, card identity, category, timestamp, count, and totals breakdown is validated. Missing data receives defaults. Damaged or unsupported data produces a visible recovery warning. Recoverable settings or recent records are retained where valid; inconsistent lifetime totals are rebuilt from retained history. Storage read/write failures leave practice usable in memory and explain the persistence limitation.

Detailed history is bounded to 500 unique results. Lifetime totals retain correct, incorrect, and skipped counts, exercise-type breakdowns, and missed categories beyond that bound. Progress displays the most recent 20 detailed explanations. Accuracy excludes skips; completed means answered correctly or incorrectly.

## Testing boundaries

Domain tests import domain functions directly. Storage tests supply an in-memory Storage implementation. UI and browser checks exercise the shared rules through actual controls rather than implementing a second evaluator in the interface. See `TESTING.md` for the current verification state.
