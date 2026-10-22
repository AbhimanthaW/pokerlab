import { explainAward } from "./format";
import { CardRow } from "../../components/Cards";
import type { HandRecord, PublicAction } from "../../domain/play/types";
export function ActionLog({
  actions,
  names,
}: {
  actions: PublicAction[];
  names: Record<string, string>;
}) {
  return (
    <ol className="play-action-log">
      {actions.map((a) => (
        <li key={a.sequence}>
          <span className="muted">{a.street}</span>
          <strong>{names[a.playerId] ?? a.playerId}</strong>
          <span>
            {a.type.replaceAll("_", " ").toLowerCase()}
            {a.added ? ` ${a.added}` : ""}
            {["BET", "RAISE", "ALL_IN"].includes(a.type)
              ? ` (to ${a.total})`
              : ""}
          </span>
        </li>
      ))}
    </ol>
  );
}
export default function HandHistory({
  history,
  names,
  onReplay,
}: {
  onReplay?: (hand: HandRecord) => void;
  history: HandRecord[];
  names: Record<string, string>;
}) {
  return (
    <section className="panel play-history">
      <h2>Hand history</h2>
      <p className="muted">
        Latest {history.length} of up to 100 hands. Only tabled opponent cards
        appear.
      </p>
      {history.length === 0 ? (
        <p className="muted">Your first completed hand will appear here.</p>
      ) : (
        [...history].reverse().map((h) => (
          <details key={h.number}>
            <summary>
              Hand {h.number} ·{" "}
              {h.reason === "folds" ? "Won by folds" : "Showdown"} ·{" "}
              {h.awards.reduce((n, a) => n + a.amount, 0)} awarded
            </summary>
            {onReplay && <button className="secondary-button" onClick={() => onReplay(h)}>Replay hand {h.number}</button>}
            <p className="muted">
              Dealer: {Object.values(names)[h.dealer]} · Small blind:{" "}
              {Object.values(names)[h.smallBlind]} · Big blind:{" "}
              {Object.values(names)[h.bigBlind]}
            </p>
            <CardRow cards={h.board} small />
            {Object.entries(h.revealed).map(([id, cards]) => (
              <div key={id}>
                <h3>{names[id]}</h3>
                <CardRow cards={cards} small />
              </div>
            ))}
            {h.awards.map((a, i) => (
              <p key={i}>
                {i === 0 ? "Main pot" : `Side pot ${i}`}: {a.amount} →{" "}
                {a.winners.map((id) => names[id]).join(" & ")}.{" "}
                {explainAward(a.explanation, names)}
              </p>
            ))}
            {Object.entries(h.refunds).map(([id, n]) => (
              <p key={id}>
                {names[id]}: {n} uncalled chips returned.
              </p>
            ))}
            <div className="history-stacks">
              {Object.entries(names).map(([id, name], i) => (
                <span key={id}>
                  {name}: {h.initialStacks[i]} → {h.finalStacks[i]}
                </span>
              ))}
            </div>
            <ActionLog actions={h.actions} names={names} />
          </details>
        ))
      )}
    </section>
  );
}
