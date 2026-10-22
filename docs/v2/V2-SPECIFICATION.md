# PokerLab V2 implementation specification

This is the implemented scope, not a claim that outstanding verification has passed. See the QA report for acceptance status.

## Product

Retain the entire V1 Learn environment. Add a separate offline Play section for one human and one to five autonomous NPCs, with fictional chips and a last-player-standing session. Default: three NPCs, equal 1,000-chip stacks, fixed 5/10 blinds. No antes, rake, refill, rebuy, prizes, payments, accounts, multiplayer, external decision service, or deployment.

## Engine contract

Use the existing canonical cards, unbiased Fisher–Yates shuffle, and exhaustive best-five evaluator. A fresh shuffled deck is used every ordinary hand. Injected decks/randomness exist only at domain and test boundaries; no scenario library or test query controls ordinary Play.

Clockwise dealing, partial blinds, heads-up order, valid turn scheduling, all six action commands, full/short/cumulative raises, automatic all-in runouts, early fold awards, multiple capped pots, exact ties, odd chips, and refunds are implemented. Integer chips and supply conservation are mandatory. Sessions stop at sole-survivor victory or human elimination after hand resolution. Dealer policy and conscious digital simplifications are specified in GAME-RULES.md.

## NPC contract

Four personality profiles and three difficulties use observed cards and public state only. Policy input is an explicit detached, deeply frozen allowlist. All generated commands pass the same authoritative legality checks as human commands. Pacing is presentation-only, with session and revision guards against stale work.

## Interface and data

Legal controls show total commitment ranges and call amounts. Seats show positions, stacks, last actions, folded/all-in/eliminated states. Board, pots, results, public action log, and bounded completed history explain the actual engine state. Navigation preserves Learn; leaving Play pauses NPC execution. Motion and card appearance settings apply globally.

Play saves complete active state under schema 2 in its own key, retaining 100 completed hands. Learn’s schema/key remain unchanged. Missing data yields defaults; invalid Play saves are held for explicit discard; denied storage produces an in-memory-play warning. Session duration is elapsed wall-clock time, including time away.

## Acceptance

Meaningful domain, NPC, storage, UI, stress, evaluator-census, and browser checks are required. Automated verification and live browser checks are recorded separately. Standalone Playwright launch remains an environment blocker in this delivery and must be rerun before declaring the full definition of done satisfied.
