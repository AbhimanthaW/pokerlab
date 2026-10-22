import { expect, it } from "vitest";
import { seededRandom } from "../cards";
import {
  applyAction,
  createSession,
  getLegalActions,
  startHand,
  validateAction,
} from "./engine";
import { assertSession } from "./invariants";
import { DEFAULT_CONFIG, type Action, type Session } from "./types";
import { chooseNpcAction } from "./policy";
import { observeNpc } from "./observation";

it("completes 5,000 seeded hands with conservation, turn, card and lifecycle assertions after every transition", () => {
  let transitions = 0,
    eliminations = 0,
    sessions = 0,
    winners = 0;
  for (let seed = 1, hands = 0; hands < 5000; seed++) {
    const random = seededRandom(seed);
    const opponents = 1 + (seed % 5);
    let s: Session = createSession(
      {
        ...DEFAULT_CONFIG,
        opponents,
        difficulty: (["beginner", "standard", "challenge"] as const)[seed % 3],
      },
      random,
      0,
    );
    assertSession(s);
    sessions++;
    for (let h = 0; h < 30 && hands < 5000; h++) {
      s = startHand(s, random);
      assertSession(s);
      transitions++;
      for (let step = 0; s.status === "hand_in_progress"; step++) {
        if (step > 1800)
          throw new Error(`Deadlock seed ${seed}, hand ${s.handNumber}`);
        const l = getLegalActions(s, s.actor!);
        const options: Action[] = [
          { type: l.check ? "CHECK" : "CALL", playerId: s.actor! },
        ];
        if (l.fold) options.push({ type: "FOLD", playerId: s.actor! });
        if (l.bet || l.raise)
          options.push({
            type: l.bet ? "BET" : "RAISE",
            playerId: s.actor!,
            to: l.minTo + Math.floor(random() * (l.maxTo - l.minTo + 1)),
          });
        if (l.allIn) options.push({ type: "ALL_IN", playerId: s.actor! });
        const a =
          seed % 2 === 0 && s.actor !== "you"
            ? chooseNpcAction(observeNpc(s, s.actor!), random)
            : options[Math.floor(random() * options.length)];
        expect(
          validateAction(s, a),
          `seed ${seed}, hand ${s.handNumber}, step ${step}`,
        ).toBeNull();
        s = applyAction(s, a, s.revision, 1000 + transitions);
        assertSession(s);
        transitions++;
      }
      hands++;
      eliminations += s.players.filter(
        (p) => p.eliminatedHand === s.handNumber,
      ).length;
      if (s.status === "session_complete") winners++;
      if (s.status !== "hand_complete") break;
    }
  }
  console.info(
    JSON.stringify({
      stressHands: 5000,
      transitions,
      sessions,
      eliminations,
      winners,
    }),
  );
  expect(transitions).toBeGreaterThan(15000);
  expect(eliminations).toBeGreaterThan(500);
  expect(winners).toBeGreaterThan(100);
}, 120000);
