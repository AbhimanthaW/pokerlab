import { explainAward } from "./format";
import { useState } from "react";
import { ArrowRight, CirclePause, RotateCcw, Trophy } from "lucide-react";
import { CardView } from "../../components/Cards";
import { getLegalActions, getPlayView } from "../../domain/play/engine";
import {
  DEFAULT_CONFIG,
  type Pacing,
  type SessionConfig,
} from "../../domain/play/types";
import { usePlay } from "./usePlay";
import ActionControls from "./ActionControls";
import HandHistory, { ActionLog } from "./HandHistory";
import "./play.css";

export default function Play({ onLearn }: { onLearn: () => void }) {
  const controller = usePlay();
  const { session: s } = controller;
  const [config, setConfig] = useState<SessionConfig>({ ...DEFAULT_CONFIG });
  const [confirmEnd, setConfirmEnd] = useState(false);
  const pacing = (
    <label className="play-pacing">
      NPC pace
      <select
        className="select-field"
        value={controller.pacing}
        onChange={(e) => controller.setPacing(e.target.value as Pacing)}
      >
        <option value="instant">Instant</option>
        <option value="normal">Normal</option>
        <option value="relaxed">Relaxed</option>
      </select>
    </label>
  );
  if (!s)
    return (
      <div className="play-page">
        <div className="page-heading">
          <div>
            <p className="eyebrow">PLAY · LAST PLAYER STANDING</p>
            <h1>A seat at the table.</h1>
            <p className="muted">
              Read the room. Make your move. Play a complete game.
            </p>
          </div>
          <span className="session-badge">FICTIONAL CHIPS · NO REAL VALUE</span>
        </div>
        {controller.warning && (
          <div className="storage-warning" role="alert">
            {controller.warning}
          </div>
        )}
        {controller.error && <p role="alert">{controller.error}</p>}
        {controller.invalid ? (
          <button className="primary-button" onClick={controller.discard}>
            Discard invalid Play save
          </button>
        ) : (
          <div className="play-setup-grid">
            <section className="panel play-setup">
              <h2>Your next session</h2>
              <p className="muted">
                Everyone starts equal. One player finishes with all the chips.
              </p>
              <label>
                Computer opponents
                <select
                  aria-label="Play opponent count"
                  className="select-field"
                  value={config.opponents}
                  onChange={(e) =>
                    setConfig({ ...config, opponents: Number(e.target.value) })
                  }
                >
                  {[1, 2, 3, 4, 5].map((n) => (
                    <option key={n} value={n}>
                      {n} {n === 1 ? "opponent" : "opponents"}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                NPC difficulty
                <select
                  className="select-field"
                  value={config.difficulty}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      difficulty: e.target.value as SessionConfig["difficulty"],
                    })
                  }
                >
                  <option value="beginner">Beginner</option>
                  <option value="standard">Standard</option>
                  <option value="challenge">Challenge</option>
                </select>
              </label>
              {pacing}
              <div className="session-facts">
                <div>
                  <strong>1,000</strong>
                  <span>chips each</span>
                </div>
                <div>
                  <strong>5 / 10</strong>
                  <span>fixed blinds</span>
                </div>
                <div>
                  <strong>{config.opponents + 1}</strong>
                  <span>participants</span>
                </div>
              </div>
              <button
                className="primary-button"
                onClick={() => controller.start(config)}
              >
                Start session <ArrowRight size={16} />
              </button>
            </section>
            <aside className="panel">
              <p className="eyebrow">A COMPLETE TABLE</p>
              <h2>Different minds. The same rules.</h2>
              <p className="muted">
                Cautious, aggressive, casual, and analytical opponents bring
                different habits to the table. Their decisions use only their
                own cards and public information.
              </p>
              <p className="muted">
                No rebuys or refills. Fixed blinds. Your session saves on this
                device after each move. Leaving Play pauses the table.
              </p>
              <p className="muted">
                These opponents use approximate rules, not advanced poker
                solvers. The chips cannot be purchased, redeemed, or
                transferred.
              </p>
              <button className="secondary-button" onClick={onLearn}>
                Return to Learn
              </button>
            </aside>
          </div>
        )}
      </div>
    );
  const view = getPlayView(s);
  const names = Object.fromEntries(s.players.map((p) => [p.id, p.name]));
  const complete = ["session_complete", "player_eliminated"].includes(s.status);
  const last = s.history.at(-1);
  const legal = getLegalActions(s, "you");
  const standings = [...s.players].sort(
    (a, b) => (a.place ?? 0) - (b.place ?? 0) || b.stack - a.stack,
  );
  return (
    <div className="play-page">
      <div className="page-heading">
        <div>
          <p className="eyebrow">PLAY · LAST PLAYER STANDING</p>
          <h1>
            {complete
              ? s.status === "session_complete"
                ? "The last seat standing."
                : "Your session, reviewed."
              : "Every decision changes the table."}
          </h1>
          <p className="muted">
            Fictional chips · no real value · fixed blinds 5 / 10
          </p>
        </div>
        {pacing}
      </div>
      {controller.warning && (
        <div className="storage-warning" role="status">
          {controller.warning}
        </div>
      )}
      {controller.error && (
        <div className="storage-warning" role="alert">
          {controller.error}
        </div>
      )}
      {complete && (
        <section className="panel session-outcome" aria-label="Session outcome">
          <Trophy className="gold" size={30} />
          <div>
            <h2>
              {s.status === "session_complete"
                ? `${names[s.winner!]} ${s.winner === "you" ? "win" : "wins"} the session`
                : `You finished ${s.players[0].place}${s.players[0].place === 2 ? "nd" : s.players[0].place === 3 ? "rd" : "th"}`}
            </h2>
            <p className="muted">
              {s.handNumber} {s.handNumber === 1 ? "hand" : "hands"} completed ·{" "}
              {Math.max(
                0,
                Math.round(
                  ((s.finishedAt ?? s.startedAt) - s.startedAt) / 60000,
                ),
              )}{" "}
              minutes elapsed
            </p>
            <p>
              {s.status === "player_eliminated"
                ? `${s.players.filter((p) => p.stack > 0).length} players remain. Your session ends here; no NPC-only continuation is played.`
                : `All ${s.supply.toLocaleString()} virtual chips are accounted for.`}
            </p>
            <p className="muted">
              {
                s.history.filter((h) =>
                  h.awards.some((a) => a.winners.includes("you")),
                ).length
              }{" "}
              hands with a pot award to you in the retained {s.history.length}
              -hand history. Review folds, calls, and tied pots below.
            </p>
          </div>
          <div className="toolbar">
            <button className="primary-button" onClick={controller.discard}>
              New session
            </button>
            <button className="secondary-button" onClick={onLearn}>
              Return to Learn
            </button>
          </div>
          <ol className="standings">
            {standings.map((p) => (
              <li key={p.id}>
                {p.place ? `#${p.place}` : "Still in"} <strong>{p.name}</strong>
                <span>{p.stack} chips</span>
              </li>
            ))}
          </ol>
        </section>
      )}
      <div className="play-live-layout">
        <section className="play-table-panel" aria-label="Play table">
          <div
            className="table-topline"
            role="status"
            aria-live="polite"
            aria-atomic="true"
          >
            <span>
              <span className="status-dot" />{" "}
              {s.status === "hand_in_progress"
                ? `${view.street} · ${names[view.actor!]} to act`
                : complete
                  ? "Session ended"
                  : "Hand complete"}
            </span>
            <span>HAND {String(view.handNumber).padStart(3, "0")}</span>
          </div>
          <div className={`play-felt seats-${view.players.length}`}>
            <div className="play-opponents">
              {view.players.slice(1).map((p, i) => (
                <div
                  key={p.id}
                  data-testid="play-opponent"
                  className={`play-seat ${p.folded ? "is-folded" : ""} ${view.actor === p.id ? "is-acting" : ""} ${p.eliminatedHand !== null ? "is-eliminated" : ""}`}
                >
                  <div className="play-seat-heading">
                    <span className="seat-avatar">{p.name[0]}</span>
                    <div>
                      <strong>{p.name}</strong>
                      <small>{p.personality}</small>
                    </div>
                    <div className="position-markers">
                      {i + 1 === view.dealer && (
                        <span title="Dealer" aria-label="Dealer">
                          D
                        </span>
                      )}
                      {i + 1 === view.smallBlindSeat && (
                        <span aria-label="Small blind">SB</span>
                      )}
                      {i + 1 === view.bigBlindSeat && (
                        <span aria-label="Big blind">BB</span>
                      )}
                    </div>
                  </div>
                  {s.initialStacks[i + 1] > 0 && (
                    <div className="play-hole-cards">
                      <CardView card={p.cards[0]} small />
                      <CardView card={p.cards[1]} small />
                    </div>
                  )}
                  <strong className="virtual-stack">
                    {p.stack.toLocaleString()} <small>chips</small>
                  </strong>
                  <span className="play-seat-status">
                    {p.eliminatedHand !== null
                      ? "Eliminated"
                      : p.folded
                        ? "Folded"
                        : p.stack === 0 && s.status === "hand_in_progress"
                          ? "All-in"
                          : p.lastAction || "In the hand"}
                  </span>
                  {p.streetChips > 0 && (
                    <span className="street-commitment">
                      In front: {p.streetChips}
                    </span>
                  )}
                </div>
              ))}
            </div>
            <div className="play-board">
              <div className="play-pot">
                <span className="eyebrow">
                  {s.status === "hand_in_progress"
                    ? "TOTAL POT"
                    : "AWARDED THIS HAND"}
                </span>
                <strong>
                  {(s.status === "hand_in_progress"
                    ? view.pot
                    : (last?.awards.reduce((n, a) => n + a.amount, 0) ?? 0)
                  ).toLocaleString()}
                </strong>
                <small>virtual chips</small>
              </div>
              <div className="play-community" aria-label="Play community cards">
                {Array.from({ length: 5 }, (_, i) =>
                  view.board[i] ? (
                    <CardView key={view.board[i].id} card={view.board[i]} />
                  ) : (
                    <div key={i} className="card-slot">
                      <span>{i < 3 ? "FLOP" : i === 3 ? "TURN" : "RIVER"}</span>
                    </div>
                  ),
                )}
              </div>
              {view.pots.length > 1 &&
                view.players.some((p) => p.stack === 0 && !p.folded) && (
                  <div className="side-pot-labels">
                    {view.pots.map((pot, i) => (
                      <span key={i}>
                        {i === 0 ? "Main pot" : `Side ${i}`}: {pot.amount}
                      </span>
                    ))}
                  </div>
                )}
            </div>
            <div
              className={`play-human ${view.actor === "you" ? "is-acting" : ""}`}
            >
              <div className="play-hole-cards">
                <CardView card={view.players[0].cards[0]} />
                <CardView card={view.players[0].cards[1]} />
              </div>
              <div>
                <div className="play-human-title">
                  <strong>You</strong>
                  <div className="position-markers">
                    {view.dealer === 0 && <span aria-label="Dealer">D</span>}
                    {view.smallBlindSeat === 0 && (
                      <span aria-label="Small blind">SB</span>
                    )}
                    {view.bigBlindSeat === 0 && (
                      <span aria-label="Big blind">BB</span>
                    )}
                  </div>
                </div>
                <strong className="virtual-stack">
                  {view.players[0].stack.toLocaleString()}{" "}
                  <small>virtual chips</small>
                </strong>
                <p className="play-seat-status">
                  {view.players[0].folded
                    ? "Folded"
                    : view.players[0].stack === 0 &&
                        s.status === "hand_in_progress"
                      ? "All-in"
                      : view.players[0].lastAction || "Your private cards"}
                  {view.players[0].streetChips > 0
                    ? ` · committed ${view.players[0].streetChips} this round`
                    : ""}
                </p>
              </div>
            </div>
          </div>
          <div className="play-table-footer">
            <span>
              {s.players.filter((p) => p.eliminatedHand === null).length}{" "}
              remaining · {s.config.difficulty}
            </span>
            <span>
              {s.supply.toLocaleString()} chips in session · conserved
            </span>
          </div>
        </section>
        {s.status === "hand_in_progress" ? (
          view.actor === "you" ? (
            <ActionControls
              key={s.revision}
              legal={legal}
              onAction={(a) => controller.act(a, s.revision)}
            />
          ) : (
            <div className="npc-wait" role="status">
              <span className="status-dot" />
              {names[view.actor!]} is considering the table…{" "}
              <span className="muted">
                {view.players[0].folded
                  ? "Your hand is folded."
                  : "Your controls appear on your turn."}
              </span>
            </div>
          )
        ) : (
          last && (
            <section className="panel hand-outcome" aria-label="Hand result">
              <div>
                <p className="eyebrow">
                  {last.reason === "folds"
                    ? "ALL OTHER HANDS FOLDED"
                    : "SHOWDOWN"}
                </p>
                <h2>
                  {last.awards.length > 1
                    ? "Every pot, accounted for."
                    : "The hand is settled."}
                </h2>
                {last.awards.map((a, i) => (
                  <p key={i}>
                    <strong>
                      {i === 0 ? "Main pot" : `Side pot ${i}`}: {a.amount}
                    </strong>{" "}
                    → {a.winners.map((id) => names[id]).join(" & ")}
                    <br />
                    <span className="muted">
                      {explainAward(a.explanation, names)}
                    </span>
                  </p>
                ))}
                {Object.entries(last.refunds).map(([id, n]) => (
                  <p key={id}>
                    {names[id]}: {n} uncalled chips returned.
                  </p>
                ))}
              </div>
              {s.status === "hand_complete" && (
                <button className="primary-button" onClick={controller.next}>
                  Next hand <ArrowRight size={16} />
                </button>
              )}
            </section>
          )
        )}
      </div>
      <details className="panel current-action-history">
        <summary>Action history · hand {s.handNumber}</summary>
        <ActionLog actions={view.actions} names={names} />
      </details>
      <HandHistory history={view.history} names={names} />
      {!complete && (
        <div className="play-session-tools">
          {confirmEnd ? (
            <div className="panel">
              <CirclePause size={18} />
              <p>
                End this session and discard its stacks and hand history? Learn
                progress is kept.
              </p>
              <div className="toolbar">
                <button
                  className="secondary-button"
                  onClick={() => setConfirmEnd(false)}
                >
                  Keep playing
                </button>
                <button
                  className="secondary-button"
                  onClick={() => {
                    controller.discard();
                    setConfirmEnd(false);
                  }}
                >
                  End and discard session
                </button>
              </div>
            </div>
          ) : (
            <button className="text-button" onClick={() => setConfirmEnd(true)}>
              <RotateCcw size={14} /> End session
            </button>
          )}
        </div>
      )}
    </div>
  );
}
