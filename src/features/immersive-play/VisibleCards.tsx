import { CardView } from "../../components/Cards";
import type { Card } from "../../domain/types";

export function CommunityCards({ board }: { board: readonly Card[] }) {
  return <section className="community-readout" aria-label="Community cards">
    {([{ name: "Flop", slots: [0, 1, 2] }, { name: "Turn", slots: [3] }, { name: "River", slots: [4] }] as const).map(({ name, slots }) =>
      <div className="community-street" role="group" aria-label={name} key={name}>
        <span className="readout-title">{name}</span>
        <div className="readout-cards">{slots.map((index) => board[index]
          ? <CardView card={board[index]} key={index} small />
          : <span className="readout-slot" key={index} aria-label={`${name} card not dealt`}>—</span>)}</div>
      </div>)}
  </section>;
}
export function PrivateCards({ cards, folded }: { cards: readonly Card[]; folded: boolean }) {
  return <div className={`private-readout ${folded ? "folded" : ""}`} aria-label="Your private cards">
    <span className="readout-title">{folded ? "Folded hand" : "Your hand"}</span>
    <div className="readout-cards">{cards.map((card) => <CardView card={card} key={card.id} small />)}</div>
  </div>;
}
