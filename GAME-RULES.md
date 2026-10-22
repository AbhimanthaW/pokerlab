# Implemented game rules

PokerLab implements standard Texas Hold’em card distribution and showdown comparison as a non-wagering educational exercise.

## Dealing sequence

Each hand starts with a fresh shuffled standard 52-card deck: four equal-valued suits and ranks 2 through Ace. There is one human and one to five opponents. Two private cards are dealt to every participant in two round-robin passes.

| Phase         | Visible information and next transition                                                                               |
| ------------- | --------------------------------------------------------------------------------------------------------------------- |
| Not started   | Empty table; Start hand creates the deck and deals private cards.                                                     |
| Private cards | The human sees their two cards; opponents remain hidden. Reveal flop burns one card, then reveals three shared cards. |
| Flop          | Three community cards. Reveal turn burns one card and reveals a fourth.                                               |
| Turn          | Four community cards. Reveal river burns one card and reveals the fifth.                                              |
| River         | Five community cards. An optional winner/tie prediction is submitted when showdown is revealed.                       |
| Showdown      | All private cards are visible; every participant’s best hand and all tied winners are evaluated.                      |
| Review        | The completed hand and this hand’s recorded learning outcomes can be reviewed. Next hand starts fresh.                |

Burned cards stay unknown. The human sees opponents only at showdown and review. Invalid phase transitions and overlapping starts are rejected. The application does not rotate a dealer button or implement positions because no betting or positional exercise is included.

## Best five cards

At the flop, the human has five available cards; at the turn six; at the river seven. The evaluator checks every five-card combination and keeps the strongest ranking tuple: one combination for five cards, six for six cards, and 21 for seven cards.

At showdown, use any five of two private cards plus five community cards. A player may use both, one, or neither private card. Cards outside the best five never break ties. Selecting a different five-card combination with the same strongest tuple is equally correct.

## Rankings and tie breakers

Stronger categories appear first below. The evaluator stores the category rank first, then the listed tie breakers in descending comparison priority. Tuples are compared lexicographically.

| Category        | Tie breakers                                                                     |
| --------------- | -------------------------------------------------------------------------------- |
| Straight Flush  | Highest straight card. An Ace-high straight flush is displayed as a royal flush. |
| Four of a Kind  | Four-of-a-kind rank, then kicker.                                                |
| Full House      | Three-of-a-kind rank, then pair rank.                                            |
| Flush           | All five card ranks, highest to lowest.                                          |
| Straight        | Highest straight card.                                                           |
| Three of a Kind | Triplet rank, then two kickers highest first.                                    |
| Two Pair        | Higher pair, lower pair, then kicker.                                            |
| One Pair        | Pair rank, then three kickers highest first.                                     |
| High Card       | All five card ranks, highest to lowest.                                          |

Ace normally ranks 14. In A–2–3–4–5 it ranks low, making a **five-high** straight. Q–K–A–2–3 is not a straight. Suit never breaks a tie. Equal tuples produce an exact tie, including when everyone’s best hand is the community board. Every participant with the strongest tuple is a winner.

## Learning and probability

Recognition and selection exercises use the currently available cards. Comparison exercises evaluate both shown hands. Explanations come from actual evaluator results. Correct, incorrect, skipped, and unfinished outcomes remain distinct; skips never reduce accuracy.

Showdown predictions compare actual hidden hands after submission. A tied result requires the tie answer. Because opponents’ cards are unknown, prediction accuracy is not a measure of strategic skill.

The table’s ace calculation is `(4 − visible aces) / (52 − visible cards)`. It describes the next unknown card conditional only on visible cards; hidden hands and burns remain part of the unknown set. It does not expose hidden cards or calculate betting equity.

## Intentional exclusions

There are no blinds, antes, betting rounds, checks, calls, raises, folds, pots, chip stacks, side pots, rake, payouts, prizes, or real-money services. Opponents have hidden cards but make no betting decisions. All dealt participants remain eligible at showdown.
