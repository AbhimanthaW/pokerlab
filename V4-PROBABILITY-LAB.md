# V4 Probability Lab

## Scenario and isolation

Learn → Probability Lab has a separate two-dimensional card editor. Select up to two private cards, zero through five board cards and up to 20 additional known unavailable cards. A valid final-hand calculation requires exactly two private cards. All cards use the canonical V1 identity validator; duplicates, invalid counts and insufficient unseen cards are rejected. Individual cards can be removed, the scenario reset, or a fresh valid scenario securely randomized. Editing cancels existing work and clears results so unrelated scenarios are never compared.

This feature imports no active Play state, NPC observation, replay, hidden deck, burns or dealing seed. Its random experiment seed is independent of Play. It does not update educational grading/progress or the active session. No scenario/result dataset is persisted.

## Exact drawing questions

Let U = 52 minus all known cards, and K be the matching suit/rank count in U. The next-card probability is the exact ratio K/U. Dynamic explanations subtract observed matching cards from the standard 13-per-suit or 4-per-rank totals.

For at least one matching suit in d draws without replacement, the favorable unordered outcomes are C(U,d) − C(U−K,d), with denominator C(U,d). This hypergeometric complement explicitly accounts for dependent draws. Ratios remain integer counts until display. For private Ah Kh and board Qh Jh 2c, there are 9 hearts among 47 unseen cards; over two draws the ratio is (1081−703)/1081. Marking additional unavailable hearts changes both numerator and denominator.

## Final-hand distribution

With b community cards, fill the board using unordered combinations of 5−b cards from U. There are C(U,5−b) equally likely completions. Each completion calls the unchanged V1 `evaluate` function on the two private cards plus the full board. No alternate hand-ranking implementation is used.

Counts normalize across the nine best-five categories. A straight flush belongs to its own row, not also to the flush row. The selected threshold sums categories at or above the chosen ranking. It describes a final ranking threshold, not a recommendation, opponent equity, or a guarantee of improvement from the currently made hand. Ace-low straights follow the existing evaluator.

Enumeration is limited to 25,000 combinations and runs in a worker. Flop scenarios normally require 1,081 completions; turn scenarios normally require 46; a known complete board requires one. Earlier scenarios exceeding the limit explicitly offer simulation instead. No large enumeration runs synchronously on the UI thread. Combination arithmetic checks safe integer bounds.

## Monte Carlo and uncertainty

Simulation permits 100–100,000 whole trials and an unsigned 32-bit seed. Mulberry32 is the existing deterministic experimental random source. Every trial takes a partial Fisher–Yates sample without replacement from a separate unseen-card pool, then calls the same evaluator. Trials are independent re-samples of the same scenario; repeated trials can share cards, while an individual trial cannot duplicate a card.

The results table distinguishes exact counts/ratios from estimated frequencies, shows trial count/seed, per-category Wilson 95% score intervals, and absolute error in percentage points when both methods are available. Intervals are individual binomial category intervals, not simultaneous multinomial guarantees. Frequencies fluctuate; more finite trials do not guarantee monotonically smaller error. These are card-completion probabilities, not a poker solver or wagering recommendation.

## Worker protocol and cleanup

`lab.worker.ts` handles typed request IDs and progress/result/error messages. Progress is throttled to at most roughly 20 messages/second. `useCalculation` owns exactly one dedicated worker; cancellation, editing, replacement and unmount terminate it, increment request identity and reject obsolete responses. Errors retain the scenario and prior finished results. Unsupported Worker environments still allow scenario editing and immediate exact draw ratios, with an explicit calculation error. No UI-thread expensive fallback silently runs.

`node scripts/verify-probability-worker.mjs` executes the built production bundle in a Node worker host, verifying exact/simulation results, progress and termination. This is an additional bundle check, not a browser Worker acceptance claim.

## Tests

Independent fixtures include C(52,5)=2,598,960, C(47,2)=1,081; the nine-of-47 heart example; dependent two-draw counts; known-unavailable-card adjustments; nine remaining hearts on a turn draw; royal flush/wheel cases; normalization; seeded reproducibility; five-standard-error simulation agreement; and Wilson boundary/symmetry values. Component tests cover scenario editing/explanations; hook tests cover progress, cancellation, stale responses, result separation and cleanup. Real browser/layout/Worker acceptance remains pending due the documented launch blocker.
