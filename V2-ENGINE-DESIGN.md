# V2 engine design

## Authoritative state

`Session` owns fixed configuration, revision, lifecycle, seat order, stack supply, all card locations, contributions, per-actor reopening thresholds, public commands, and the last 100 completed records. `Action` is a discriminated command union. `SessionStatus` distinguishes new session, active hand, completed hand, human elimination, and session completion.

The public APIs are `createSession`, `startHand`, `getLegalActions`, `validateAction`, `applyAction`, and `getPlayView`. Pot construction/settlement is standalone in `pots.ts`. Internal forced transitions move streets and finish hands. Applying an action clones previous state; validation happens before any mutation. Ordinary start-hand calls create a fresh secure shuffled deck. Tests can inject a shuffle source or deck. Time and randomness are supplied outside the React reducer where relevant.

## Round closure

Blinds do not count as voluntary actions. On each street an actionable seat needs a turn if it has not acted or has not matched the current target. The scheduler searches clockwise after the last actor. For zero or one covering stacks, it gives only a required response to an opposing commitment and otherwise runs the board. After closure, burns and board cards are drawn from the actual deck. Up to four forced transitions finish a hand; impossible exhaustion/transition conditions throw diagnostics.

## Raises

`actedAt = null` means unacted. After acting a seat records the current target and current full-raise increment. It can raise again when `currentBet - actedAt >= reopenSize`. Full raises increase the global minimum increment; short all-ins increase only the target. Cumulative shorts therefore reopen each actor at its own threshold, including callers at different short-raise levels. A player cannot raise into opponents who are all-in.

## Pots

Sort distinct contribution caps. For each interval multiply the width by contributor count, retain non-folded eligibility, and return any unmatched top interval. Merge neighboring layers with identical eligibility. Validate physical card uniqueness across all supplied players and the board, then evaluate each pot’s eligible hands independently, divide in integer units, and allocate remainders clockwise left of the dealer. This prevents both excess awards to short stacks and artificial side pots from folded contribution thresholds.

Settlement moves all awards/refunds to stacks and clears commitments in one transition. Elimination follows settlement, never an intermediate zero-stack all-in. The hand record captures before/after stacks, actions, tabled cards, board, awards, and refunds; folded cards and undealt/burn cards are absent.

## Validation and presentation

`assertSession` checks configuration, lifecycle, valid identities/amounts, card uniqueness and 52-card accounting, street/burn counts, actor eligibility, outstanding action, contribution logs, conservation, history eligibility, and historical payout accounting. It runs during save/load, controller transitions, and every stress transition. Invalid snapshots are quarantined rather than silently repaired.

Table rendering uses a visibility projection that excludes deck/burns and masks private opponents. The React controller retains the full session for authoritative transitions and persistence; this offline client is not a security boundary against its owner. The controller rejects commands whose session ID or revision is obsolete. NPC delays are cancellable effects; changing pacing or leaving the screen cannot grant a second action. See component regressions for StrictMode restoration and double-click coverage.
