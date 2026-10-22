import type { Card } from "../domain/types";
const SUITS = { spades: "♠", hearts: "♥", clubs: "♣", diamonds: "♦" };
function rankLabel(rank: number) {
  return (
    ({ 11: "J", 12: "Q", 13: "K", 14: "A" } as Record<number, string>)[rank] ??
    String(rank)
  );
}
function cardLabel(card: Card) {
  return `${rankLabel(card.rank)} of ${card.suit}`;
}
export function CardView({
  card,
  selected = false,
  onClick,
  small = false,
  highlight = false,
}: {
  card?: Card;
  selected?: boolean;
  onClick?: () => void;
  small?: boolean;
  highlight?: boolean;
}) {
  const className = `playing-card ${card ? card.suit : "card-back"} ${small ? "small" : ""} ${selected ? "selected" : ""} ${highlight ? "highlight" : ""}`;
  const content = card ? (
    <>
      <span className="card-corner">
        <b>{rankLabel(card.rank)}</b>
        <span>{SUITS[card.suit]}</span>
      </span>
      <span className="card-pip" aria-hidden="true">
        {SUITS[card.suit]}
      </span>
      <span className="card-corner bottom" aria-hidden="true">
        <b>{rankLabel(card.rank)}</b>
        <span>{SUITS[card.suit]}</span>
      </span>
      {selected && (
        <span className="card-check" aria-hidden="true">
          ✓
        </span>
      )}
    </>
  ) : (
    <span className="back-diamond" aria-hidden="true">
      ♠
    </span>
  );
  return onClick && card ? (
    <button
      type="button"
      className={className}
      aria-label={cardLabel(card)}
      aria-pressed={selected}
      onClick={onClick}
    >
      {content}
    </button>
  ) : (
    <div
      className={className}
      role="img"
      aria-label={card ? cardLabel(card) : "Hidden card"}
    >
      {content}
    </div>
  );
}
export function CardRow({
  cards,
  selected = [],
  onSelect,
  highlight = [],
  small = false,
}: {
  cards: Card[];
  selected?: string[];
  onSelect?: (id: string) => void;
  highlight?: string[];
  small?: boolean;
}) {
  return (
    <div className="card-row">
      {cards.map((card) => (
        <CardView
          key={card.id}
          card={card}
          small={small}
          selected={selected.includes(card.id)}
          highlight={highlight.includes(card.id)}
          onClick={onSelect ? () => onSelect(card.id) : undefined}
        />
      ))}
    </div>
  );
}
