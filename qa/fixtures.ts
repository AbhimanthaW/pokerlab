// Development/browser QA fixtures. This module is never imported by the production app.
import { createDeck, parseCards, seededRandom } from "../src/domain/cards";
import {
  applyAction,
  createSession,
  startHand,
} from "../src/domain/play/engine";
import { DEFAULT_CONFIG } from "../src/domain/play/types";
function deck(prefix: string) {
  const first = parseCards(prefix);
  return [
    ...first,
    ...createDeck().filter((c) => !first.some((x) => x.id === c.id)),
  ];
}
export function scenario(kind: string) {
  const opponents = kind === "victory" ? 1 : kind === "eliminated" ? 2 : 5;
  let s = createSession({ ...DEFAULT_CONFIG, opponents }, seededRandom(1));
  s.dealer = kind === "victory" ? 1 : kind === "eliminated" ? 2 : 1;
  if (kind === "victory") {
    s = startHand(s, undefined, deck("As Ks Ah Kh Qc 2s 3d 7h Qd 8c Qh 9d"));
    s = applyAction(s, { type: "ALL_IN", playerId: "npc-1" });
  } else if (kind === "eliminated") {
    s = startHand(
      s,
      undefined,
      deck("Ks As 2c Kh Ah 3c Qc 2s 3d 7h Qd 8c Qh 9d"),
    );
    s = applyAction(s, { type: "FOLD", playerId: "npc-2" });
    s = applyAction(s, { type: "ALL_IN", playerId: "you" });
    s = applyAction(s, { type: "CALL", playerId: "npc-1" });
  } else s = startHand(s, seededRandom(11));
  return s;
}
