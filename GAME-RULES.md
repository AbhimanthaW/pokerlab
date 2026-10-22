# Implemented rules

## Learn and shared evaluator

V1 Learn remains non-wagering: two round-robin private cards, manual flop/turn/river (one burn per community street), showdown and review. Opponents remain hidden until showdown. It has no blinds/action rounds. Skips do not reduce accuracy. Trainer recognition, best-five equivalence, comparisons and predictions use the actual evaluator.

Evaluate every five-card combination from five, six or seven available cards. Compare category then tie ranks lexicographically. Either, both or neither hole card can be used. Suits and unused cards never break ties. Ace is high except the five-high A-2-3-4-5 wheel; Q-K-A-2-3 is not a straight.

| Strongest first | Tie breakers |
| --- | --- |
| Straight Flush (royal is ace-high) | Highest card |
| Four of a Kind | Quad rank, kicker |
| Full House | Trips, pair |
| Flush | All five ranks descending |
| Straight | Highest card |
| Three of a Kind | Trips, two kickers |
| Two Pair | High pair, low pair, kicker |
| One Pair | Pair, three kickers |
| High Card | Five ranks descending |

## Play reference

Principal reference: [2026 Poker TDA Rules v1.1](https://www.pokertda.com/view-poker-tda-rules/), checked 21 October 2026; especially Rules 17, 21, 23, 36-C, 45 and 49. This digital simulation does not claim universal procedural tournament compliance.

TDA rules used by permission of the Poker TDA, Copyright 2026, [http://www.pokertda.com](http://www.pokertda.com), All rights reserved.

## Sessions, positions and dealing

One human and one to five NPCs start equal at 1,000 fictional integer chips. Fixed 5/10 blinds; no ante, rake, rebuys, add-ons, escalation, purchases, prizes or value. Initial dealer is fairly drawn. Each hand uses a fresh unbiased cryptographic Fisher–Yates shuffle.

Clockwise with three-plus survivors: next survivor becomes dealer; first eligible after dealer is SB, next BB. Preflop starts after BB, postflop after dealer. Heads-up: dealer is SB, dealt last each pass, first preflop/last postflop. On entering heads-up, advance BB clockwise from the previous BB and make the other survivor dealer, preventing consecutive BB. Eliminated seats are skipped. Partial blinds post available chips; with multiple actionable stacks the nominal preflop target remains 10. A lone covering stack faces only actual unmatched opposing chips.

Deal two private cards clockwise, then burn one before each 3/1/1 community street. If all others fold, end immediately without revealing hidden/future cards. If no further decisions remain, burn/run the board and settle synchronously.

## Commands and reopening

In-turn FOLD/CHECK/CALL/BET/RAISE/ALL_IN use one legal-action source for human and NPC. Calls add the due amount capped by stack. Bets/raises use final street totals. Opening minimum is 10; next minimum is current target plus last full increment. Reject negative/fractional/oversized/under-minimum/out-of-turn/ineligible commands before mutation. Use dedicated ALL_IN for a valid short all-in; no physical chip-gesture interpretation. Folding with a free check is binding without a physical penalty.

Per actor, remember last matched target and full-raise threshold. Unacted actors retain rights; an acted actor’s raising reopens when cumulative target increase reaches its threshold. Short all-ins change target but not the full increment. Example: raise 10 to 100 (increment 90), then all-ins to 140 and 190 reopen an actor who acted at 100; minimum next total is 280. A caller at 140 has not faced another full increment. A postflop opening all-in to 4 can be called for 4 or raised by an unacted player to at least 14. Earlier checks need full cumulative reopening.

Blinds are not voluntary action; BB retains its option. End a round when every actionable player has acted and matched, folded or gone all-in. A lone covering stack gets only a needed call/fold response, never a dry side-pot raise.

## Pots, ties and elimination

Contribution caps form layers. Folded money counts but folded hands cannot win. Merge adjacent layers with identical eligibility; folded thresholds alone do not create real side pots. Return a one-contributor top layer as uncalled excess. Resolve each actual pot independently among eligible hands. Equal tuples split using integer division; odd chips go to tied winners clockwise left of dealer. All live showdown hands table; folded cards stay hidden in history, and fold winners need not show.

Move awards/refunds into stacks together, clear commitments, then eliminate zero stacks. Stacks plus unpaid commitments always equal original supply; completed hands hold all chips in stacks. Same-hand busts rank by starting stack; equal starts share a place. Last survivor wins. Human bust with multiple survivors ends the user’s session with human standing and others labeled still in.

## Simplifications

Three-plus play uses a moving **live button**, not physical TDA dead-button procedure, following the requested first-eligible-seat policy. Heads-up BB continuity is adjusted separately. Live showdown hands table together; forced runouts resolve immediately with display-only transitions. No optional muck/show order, floor penalties, misdeals, chip-motion rules, table transfers/balancing, late entry, clocks, physical disputes or other session variants.
