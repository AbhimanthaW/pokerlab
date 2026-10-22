import { useRef, useState } from "react";
import type { Action, LegalActions } from "../../domain/play/types";
export default function ActionControls({
  legal,
  onAction,
  compact = false,
}: {
  compact?: boolean;
  legal: LegalActions;
  onAction: (a: Action) => void;
}) {
  const [expanded, setExpanded] = useState(!compact);
  const sending = useRef(false);
  const wagerButton = useRef<HTMLButtonElement>(null);
  const cancel = () => { setExpanded(false); wagerButton.current?.focus(); };
  const submit = (action: Action) => {
    if (sending.current) return;
    sending.current = true;
    try { onAction(action); } finally { queueMicrotask(() => { sending.current = false; }); }
  };
  const [amount, setAmount] = useState(String(legal.minTo));
  const total = Number(amount);
  const valid =
    amount !== "" &&
    Number.isSafeInteger(total) &&
    total >= legal.minTo &&
    total <= legal.maxTo;
  const command = (type: "FOLD" | "CHECK" | "CALL" | "ALL_IN") =>
    submit({ type, playerId: legal.playerId });
  return (
    <section className={`play-controls ${compact ? "compact-controls" : ""} ${expanded ? "wager-open" : ""}`} aria-label="Your available actions">
      <div className="play-controls-title">
        <strong>Your turn</strong>
        <span className="muted">
          {legal.amountToMatch
            ? `${legal.call} to call${legal.callAllIn ? " · all-in call" : ""}`
            : "No chips needed to check"}
        </span>
      </div>
      {(legal.bet || legal.raise) && expanded && (
        <div className="amount-control" onKeyDown={(e) => { if (compact && e.key === "Escape") { e.stopPropagation(); cancel(); } }}>
          <label htmlFor="play-total">
            {legal.bet ? "Bet total" : "Raise to"}{" "}
            <span className="muted">· final total this round</span>
          </label>
          <div className="amount-fields">
            <input
              autoFocus={compact}
              id="play-total"
              aria-label="Total commitment"
              type="number"
              inputMode="numeric"
              min={legal.minTo}
              max={legal.maxTo}
              step="1"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
            <input
              aria-label="Total commitment slider"
              type="range"
              min={legal.minTo}
              max={legal.maxTo}
              step="1"
              value={valid ? total : legal.minTo}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>
          <small className="muted">
            Minimum {legal.minTo} · maximum {legal.maxTo} virtual chips
          </small>
          {compact && <div className="wager-confirm"><button className="primary-button" disabled={!valid} onClick={() => submit({ type: legal.bet ? "BET" : "RAISE", playerId: legal.playerId, to: total })}>Confirm {legal.bet ? "bet" : "raise"} to {valid ? total : "…"}</button><button className="secondary-button" onClick={cancel}>Cancel</button></div>}
          {!valid && (
            <span className="amount-error" role="status">
              Enter a whole number within the displayed range.
            </span>
          )}
        </div>
      )}
      <div className="action-buttons">
        {legal.fold && (
          <button
            className="secondary-button fold-action"
            onClick={() => command("FOLD")}
          >
            Fold
          </button>
        )}
        {legal.check ? (
          <button className="primary-button" onClick={() => command("CHECK")}>
            Check
          </button>
        ) : (
          legal.call > 0 && (
            <button className="primary-button" onClick={() => command("CALL")}>
              Call {legal.call}
              {legal.callAllIn ? " · all-in" : ""}
            </button>
          )
        )}
        {(legal.bet || legal.raise) && (
          <button
            className="primary-button"
            disabled={!compact && !valid}
            ref={wagerButton}
            aria-expanded={compact ? expanded : undefined}
            onClick={() => compact ? setExpanded((open) => !open) :
              submit({
                type: legal.bet ? "BET" : "RAISE",
                playerId: legal.playerId,
                to: total,
              })
            }
          >
            {compact ? (legal.bet ? "Bet" : "Raise") : `${legal.bet ? "Bet" : "Raise to"} ${valid ? total : "…"}`}
          </button>
        )}
        {legal.allIn && (
          <button
            className="secondary-button allin-action"
            onClick={() => command("ALL_IN")}
          >
            All-in <span>{legal.maxTo}</span>
          </button>
        )}
      </div>
      {legal.allInKind === "short-raise" && (
        <small className="muted">
          Your all-in is below a full raise and may not reopen action.
        </small>
      )}
    </section>
  );
}
