import { ArrowRight } from "lucide-react";
import { CardRow } from "../components/Cards";
import { parseCards } from "../domain/cards";
import type { HandCategory } from "../domain/types";
const rankings: {
  name: HandCategory;
  cards: string;
  explanation: string;
  edge: string;
}[] = [
  {
    name: "Straight Flush",
    cards: "As Ks Qs Js Ts",
    explanation:
      "Five consecutive ranks, all of the same suit. Beats four of a kind.",
    edge: "An Ace-high straight flush is a royal flush. Aces can also be low in A–2–3–4–5.",
  },
  {
    name: "Four of a Kind",
    cards: "Qs Qh Qd Qc As",
    explanation:
      "Four cards of one rank, plus a kicker. Beats a full house; loses to a straight flush.",
    edge: "Compare the four matching cards first, then the kicker.",
  },
  {
    name: "Full House",
    cards: "Ks Kh Kd 8c 8s",
    explanation:
      "Three cards of one rank and two of another. Beats a flush; loses to four of a kind.",
    edge: "Compare the three-of-a-kind rank first, then the pair. Three Kings beat three Queens regardless of the pair.",
  },
  {
    name: "Flush",
    cards: "Ah Jh 8h 5h 2h",
    explanation:
      "Five cards of the same suit. Beats a straight; loses to a full house.",
    edge: "Compare all five ranks from highest to lowest. Suits themselves have equal value.",
  },
  {
    name: "Straight",
    cards: "9s 8d 7h 6c 5d",
    explanation:
      "Five consecutive ranks in mixed suits. Beats three of a kind; loses to a flush.",
    edge: "A–2–3–4–5 is five-high. Q–K–A–2–3 is not a straight. Only the top rank decides between straights.",
  },
  {
    name: "Three of a Kind",
    cards: "7s 7h 7d Ac 4d",
    explanation:
      "Three cards of one rank and two other ranks. Beats two pair; loses to a straight.",
    edge: "Compare the triplet rank, then the highest kicker, then the second kicker.",
  },
  {
    name: "Two Pair",
    cards: "Js Jh 6d 6c As",
    explanation:
      "Two cards of one rank, two of another, and a kicker. Beats one pair; loses to three of a kind.",
    edge: "Compare the higher pair first, the lower pair second, then the kicker.",
  },
  {
    name: "One Pair",
    cards: "Ts Th Ac 8d 3s",
    explanation:
      "Two cards of one rank and three other ranks. Beats high card; loses to two pair.",
    edge: "Compare the pair rank, then each of the three kickers from high to low.",
  },
  {
    name: "High Card",
    cards: "As Kd 9h 6c 3d",
    explanation:
      "No pair, straight, or flush. The weakest category; one pair beats it.",
    edge: "Compare the highest card, then the next highest, continuing through all five.",
  },
];
export default function Reference({ onPractice }: { onPractice: () => void }) {
  return (
    <>
      <div className="section-heading">
        <div>
          <p className="eyebrow">THE FUNDAMENTALS</p>
          <h1>Know a good hand when you see one.</h1>
        </div>
      </div>
      <div className="toolbar">
        <p className="muted">
          Nine categories. Strongest first. Every suit is equal.
        </p>
        <button className="secondary-button" onClick={onPractice}>
          Back to practice <ArrowRight size={16} />
        </button>
      </div>
      <div className="reference-grid">
        {rankings.map((item, index) => (
          <section key={item.name} className="panel reference-item">
            <div className="toolbar">
              <span className="rank-number">
                {String(index + 1).padStart(2, "0")}
              </span>
              <h2 className="section-heading">{item.name}</h2>
            </div>
            <CardRow cards={parseCards(item.cards)} small />
            <p>{item.explanation}</p>
            <p className="muted">{item.edge}</p>
          </section>
        ))}
      </div>
      <section className="panel">
        <p className="eyebrow">The Hold’em rule</p>
        <h2 className="section-heading">
          The best five cards tell the whole story.
        </h2>
        <p className="muted">
          Use any five cards from your two private cards and five community
          cards: two, one, or none of your private cards. If the board is
          everyone’s best hand, everyone ties. Extra cards and suit colors
          cannot break a tie.
        </p>
        <button className="primary-button" onClick={onPractice}>
          Take a seat <ArrowRight size={16} />
        </button>
      </section>
    </>
  );
}
