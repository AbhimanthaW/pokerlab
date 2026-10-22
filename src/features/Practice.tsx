import { useState } from "react";
import {
  ArrowRight,
  Check,
  CircleHelp,
  Eye,
  Layers3,
  RotateCcw,
  Sparkles,
  Trophy,
} from "lucide-react";
import type {
  Answer,
  ExerciseRecord,
  GameAction,
  GameState,
  EvaluationResult,
  Settings,
} from "../domain/types";
import { CATEGORIES } from "../domain/types";
import { evaluate } from "../domain/evaluation";
import { getVisiblePlayers } from "../domain/game";
import { gradeExercise } from "../domain/exercises";
import { gradePrediction } from "../domain/prediction";
import { nextAceProbability } from "../domain/probability";
import { CardRow, CardView } from "../components/Cards";

type Props = {
  game: GameState;
  dispatch: (action: GameAction) => void;
  settings: Settings;
  onRecord: (r: ExerciseRecord) => void;
  onReference: () => void;
};
const phaseLabels = {
  idle: "Ready to begin",
  private: "Private cards",
  flop: "The flop",
  turn: "The turn",
  river: "The river",
  showdown: "Showdown",
  review: "Hand review",
};
const phaseSteps = ["private", "flop", "turn", "river", "showdown"];
const nextLabels = {
  idle: "Start hand",
  private: "Reveal flop",
  flop: "Reveal turn",
  turn: "Reveal river",
  river: "Reveal showdown",
  showdown: "Review hand",
  review: "Next hand",
};
export default function Practice({
  game,
  dispatch,
  settings,
  onRecord,
  onReference,
}: Props) {
  const [sessionId] = useState(() => crypto.randomUUID());
  const [answers, setAnswers] = useState<Record<string, EvaluationResult>>({});
  const [selected, setSelected] = useState<string[]>([]);
  const [mode, setMode] = useState<"recognition" | "best-five">("recognition");
  const [prediction, setPrediction] = useState("");
  const [sessionReview, setSessionReview] = useState<ExerciseRecord[]>([]);
  const isRevealed = game.phase === "showdown" || game.phase === "review";
  const canExercise = ["flop", "turn", "river"].includes(game.phase);
  const known = [...(game.players[0]?.cards ?? []), ...game.community];
  const currentKey = `${game.handNumber}-${game.phase}`;
  const result = answers[`${currentKey}-${mode}`];
  const selectionResult = answers[`${currentKey}-best-five`];
  const predictionResult = answers[`${game.handNumber}-river-prediction`];
  const best = isRevealed && known.length === 7 ? evaluate(known) : undefined;
  function commit(
    kind: "recognition" | "best-five" | "prediction",
    answer: Answer,
  ) {
    const id = `${currentKey}-${kind}`;
    if (answers[id]) return;
    let graded: EvaluationResult;
    if (kind === "prediction") graded = gradePrediction(game, answer);
    else
      graded = gradeExercise(
        {
          id,
          kind,
          cards: known,
          prompt: "Identify your strongest current hand.",
        },
        answer,
      );
    // Event-only grading captures the submission time; never called during rendering.
    const record: ExerciseRecord = {
      ...graded,
      id: `table-${sessionId}-${id}`,
      kind,
      // Event handler timestamp, not render-time data.
      // eslint-disable-next-line react-hooks/purity
      timestamp: Date.now(),
      context: `Hand ${game.handNumber} · ${phaseLabels[game.phase]}`,
    };
    setAnswers((prev) => ({ ...prev, [id]: graded }));
    onRecord(record);
    setSessionReview((prev) => [...prev, record]);
  }
  function advance() {
    if (canExercise) {
      for (const kind of ["recognition", "best-five"] as const)
        if (!answers[`${currentKey}-${kind}`]) commit(kind, { type: "skip" });
    }
    if (game.phase === "river" && !answers[`${currentKey}-prediction`])
      commit(
        "prediction",
        prediction
          ? { type: "prediction", winner: prediction }
          : { type: "skip" },
      );
    if (game.phase === "idle" || game.phase === "review") {
      dispatch({ type: "START", opponents: settings.opponents });
      setAnswers({});
      setSessionReview([]);
    } else dispatch({ type: "ADVANCE" });
    setSelected([]);
    setPrediction("");
  }
  const visiblePlayers = getVisiblePlayers(game);
  const placeholders =
    game.phase === "idle"
      ? Array.from({ length: settings.opponents }, (_, i) => ({
          id: `placeholder-${i}`,
          name: ["Alex", "Morgan", "Sam", "Robin", "Casey"][i],
          cards: [],
        }))
      : visiblePlayers.slice(1);
  const winningNames = game.players
    .filter((p) => game.winners.includes(p.id))
    .map((p) => p.name)
    .join(" & ");
  const { aces: unseenAces, unseen, percent } = nextAceProbability(known);
  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">THE LEARNING TABLE</p>
          <h1>
            A little practice.
            <br className="mobile-break" /> A better hand.
          </h1>
          <p className="muted">
            Read the cards. Find your five. Learn something every hand.
          </p>
        </div>
        <span className="session-badge">
          <span className="status-dot" /> FREE PLAY · NO WAGERING
        </span>
      </div>
      <div className="practice-layout">
        <section
          className="table-panel"
          aria-label="Texas Hold'em practice table"
        >
          <div className="table-topline">
            <span>
              <span className="status-dot" /> {phaseLabels[game.phase]}
            </span>
            <span>HAND {String(game.handNumber || 1).padStart(3, "0")}</span>
          </div>
          <div className={`felt-table opponents-${placeholders.length}`}>
            <div className="opponent-row">
              {placeholders.map((p, i) => (
                <div
                  className={`opponent-seat ${game.winners.includes(p.id) ? "winner-seat" : ""}`}
                  key={p.id}
                  data-testid="opponent-seat"
                >
                  <div className="seat-avatar">{p.name.slice(0, 1)}</div>
                  <div className="opponent-cards">
                    {[0, 1].map((n) => (
                      <CardView
                        key={isRevealed ? (p.cards[n]?.id ?? n) : n}
                        card={isRevealed ? p.cards[n] : undefined}
                        small
                      />
                    ))}
                  </div>
                  <span className="seat-name">
                    {p.name}
                    {isRevealed && game.winners.includes(p.id) && (
                      <Trophy size={12} />
                    )}
                  </span>
                  <span className="seat-status">
                    {isRevealed
                      ? game.results.find((r) => r.playerId === p.id)?.hand
                          .category
                      : `SEAT ${String(i + 1).padStart(2, "0")}`}
                  </span>
                </div>
              ))}
            </div>
            <div className="community-area">
              <div className="table-watermark">
                <span className="watermark-suits">♣ ♦ ♠ ♥</span>
                <span>POKERLAB</span>
              </div>
              <div className="community-cards" aria-label="Community cards">
                {Array.from({ length: 5 }, (_, i) =>
                  game.community[i] ? (
                    <CardView
                      key={i}
                      card={game.community[i]}
                      highlight={best?.bestFive.some(
                        (c) => c.id === game.community[i].id,
                      )}
                    />
                  ) : (
                    <div className="card-slot" key={i}>
                      <span>{i < 3 ? "FLOP" : i === 3 ? "TURN" : "RIVER"}</span>
                    </div>
                  ),
                )}
              </div>
              <p className="community-caption">
                {game.phase === "idle"
                  ? "YOUR NEXT GOOD HABIT STARTS HERE"
                  : game.phase === "private"
                    ? "Five shared cards. One strongest hand."
                    : isRevealed
                      ? "HIGHLIGHTED CARDS FORM YOUR BEST FIVE"
                      : `${game.community.length} COMMUNITY CARDS · SHARED BY EVERYONE`}
              </p>
            </div>
            <div className="human-seat">
              <div className="your-cards" aria-label="Your private cards">
                {[0, 1].map((n) => (
                  <CardView
                    key={game.players[0]?.cards[n]?.id ?? n}
                    card={game.players[0]?.cards[n]}
                    highlight={best?.bestFive.some(
                      (c) => c.id === game.players[0]?.cards[n]?.id,
                    )}
                  />
                ))}
              </div>
              <div className="human-label">
                <span className="you-avatar">Y</span>
                <div>
                  <strong>You</strong>
                  <span>
                    {isRevealed ? best?.category : "YOUR PRIVATE CARDS"}
                  </span>
                </div>
                {game.winners.includes("you") && (
                  <Trophy size={18} className="gold" />
                )}
              </div>
            </div>
          </div>
          <div className="table-bottomline">
            <span>
              <Layers3 size={14} />{" "}
              {game.players.length || settings.opponents + 1} players · Texas
              Hold’em
            </span>
            <span>52 cards. Endless possibilities.</span>
          </div>
          <div className="phase-timeline" aria-label="Dealing progress">
            {phaseSteps.map((phase, i) => (
              <div
                key={phase}
                className={
                  phaseSteps.indexOf(game.phase) >= i || game.phase === "review"
                    ? "step active"
                    : "step"
                }
              >
                <span>
                  {isRevealed || phaseSteps.indexOf(game.phase) > i ? (
                    <Check size={12} />
                  ) : (
                    i + 1
                  )}
                </span>
                <b>{["Private", "Flop", "Turn", "River", "Showdown"][i]}</b>
              </div>
            ))}
          </div>
          <div className="table-controls">
            <div>
              <strong>
                {isRevealed
                  ? game.winners.length > 1
                    ? "A shared victory."
                    : `${winningNames} ${winningNames === "You" ? "take" : "takes"} this hand.`
                  : game.phase === "idle"
                    ? "Take a seat. Make sense of the cards."
                    : game.phase === "private"
                      ? "Your two cards are just the beginning."
                      : "Ready for the next reveal?"}
              </strong>
              <p className="muted">
                {canExercise
                  ? "Continuing skips unfinished exercises on this street."
                  : isRevealed
                    ? "Study the result, then take what you learned to the next hand."
                    : "No timer. No stakes. Learn at your own pace."}
              </p>
            </div>
            <button className="primary-button" onClick={advance}>
              {game.phase === "review" ? (
                <RotateCcw size={16} />
              ) : isRevealed ? (
                <Eye size={16} />
              ) : null}
              {nextLabels[game.phase]}
              <ArrowRight size={16} />
            </button>
          </div>
        </section>
        <aside className="learning-column">
          <section className="panel exercise-panel">
            <div className="panel-heading">
              <span className="icon-tile">
                <Sparkles size={18} />
              </span>
              <div>
                <p className="eyebrow">LEARN BY DOING</p>
                <h2>
                  {isRevealed
                    ? "The hand, explained."
                    : canExercise
                      ? "What do you see?"
                      : "Every card tells a story."}
                </h2>
              </div>
              <span className="mini-tag">
                {canExercise ? "YOUR TURN" : "PRACTICE"}
              </span>
            </div>
            {canExercise ? (
              <>
                <div className="exercise-tabs" aria-label="Table exercise">
                  <button
                    className={mode === "recognition" ? "active" : ""}
                    onClick={() => setMode("recognition")}
                  >
                    Identify hand
                  </button>
                  <button
                    className={mode === "best-five" ? "active" : ""}
                    onClick={() => setMode("best-five")}
                  >
                    Find best five
                  </button>
                </div>
                <p className="question">
                  {mode === "recognition"
                    ? "What is your strongest current hand?"
                    : "Which five cards make your strongest hand?"}
                </p>
                <p className="muted small-copy">
                  Use your private cards and the {game.community.length}{" "}
                  community cards.
                </p>
                {mode === "recognition" ? (
                  <div className="option-grid">
                    {CATEGORIES.map((category, i) => (
                      <button
                        className="option-button"
                        disabled={!!result}
                        key={category}
                        onClick={() =>
                          commit("recognition", { type: "category", category })
                        }
                      >
                        <span>{String(i + 1).padStart(2, "0")}</span>
                        {category}
                      </button>
                    ))}
                  </div>
                ) : (
                  <>
                    <CardRow
                      cards={known}
                      selected={selected}
                      onSelect={
                        result
                          ? undefined
                          : (id) =>
                              setSelected((prev) =>
                                prev.includes(id)
                                  ? prev.filter((c) => c !== id)
                                  : prev.length < 5
                                    ? [...prev, id]
                                    : prev,
                              )
                      }
                      small
                    />
                    <p className="muted" aria-live="polite">
                      {selected.length} of 5 selected
                    </p>
                    <button
                      className="secondary-button"
                      disabled={selected.length !== 5 || !!result}
                      onClick={() =>
                        commit("best-five", {
                          type: "selection",
                          cardIds: selected,
                        })
                      }
                    >
                      Check selection
                    </button>
                  </>
                )}
                {result ? (
                  <div className={`feedback ${result.status}`} role="status">
                    <strong>
                      {result.status === "correct"
                        ? "Nicely read."
                        : result.status === "skipped"
                          ? "Exercise skipped."
                          : "A chance to learn."}
                    </strong>
                    <p>{result.explanation}</p>
                    {result.bestFive && (
                      <CardRow cards={result.bestFive} small />
                    )}
                  </div>
                ) : (
                  <button
                    className="text-button skip-button"
                    onClick={() => commit(mode, { type: "skip" })}
                  >
                    Skip this exercise <ArrowRight size={13} />
                  </button>
                )}
                {game.phase === "river" && (
                  <div className="prediction-panel">
                    <h3>One last prediction</h3>
                    <p className="muted small-copy">
                      Who has the strongest hand? Opponents are hidden, so this
                      is a guess rather than a strategy test.
                    </p>
                    <label htmlFor="prediction">Predict the showdown</label>
                    <select
                      id="prediction"
                      className="select-field"
                      value={prediction}
                      onChange={(e) => setPrediction(e.target.value)}
                    >
                      <option value="">Skip prediction</option>
                      {game.players.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                      <option value="tie">A tie for strongest hand</option>
                    </select>
                    <p className="small-copy muted">
                      Revealing showdown submits your prediction.
                    </p>
                  </div>
                )}
              </>
            ) : isRevealed ? (
              <div className="showdown-summary">
                <div className="result-banner">
                  <Trophy size={24} />
                  <h3>
                    {winningNames}
                    {game.winners.length > 1
                      ? " tie"
                      : winningNames === "You"
                        ? " win"
                        : " wins"}
                  </h3>
                </div>
                {predictionResult && (
                  <div
                    className={`feedback ${predictionResult.status}`}
                    role="status"
                  >
                    <strong>
                      Showdown prediction · {predictionResult.status}
                    </strong>
                    <p>{predictionResult.explanation}</p>
                  </div>
                )}
                {game.results.map((r) => (
                  <div className="player-result" key={r.playerId}>
                    <strong>
                      {game.players.find((p) => p.id === r.playerId)?.name}
                      {game.winners.includes(r.playerId) && " · WINNER"}
                    </strong>
                    <p>{r.hand.description}</p>
                    <CardRow cards={r.hand.bestFive} small />
                  </div>
                ))}
                <p className="muted small-copy">
                  Only the best five cards count. Equal ranking tuples tie;
                  suits never break a tie.
                </p>
                {game.phase === "review" && (
                  <div className="hand-review">
                    <h3>Your learning this hand</h3>
                    {sessionReview.map((r) => (
                      <div key={r.id}>
                        <span className={`result-dot ${r.status}`} />
                        <span>
                          {r.context} · {r.kind.replace("-", " ")}: {r.status}
                        </span>
                      </div>
                    ))}
                    {sessionReview.length === 0 && (
                      <p>No exercises attempted in this hand.</p>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="intro-exercise">
                <div className="mini-card-illustration">
                  <span>?</span>
                  <span>♠</span>
                </div>
                <h3>
                  {game.phase === "idle"
                    ? "Your table. Your pace."
                    : "Let’s see what develops."}
                </h3>
                <p className="muted">
                  {game.phase === "idle"
                    ? "Practice reading real hands, choosing the strongest five cards, and comparing results."
                    : "Reveal the flop to start identifying your best hand. You need at least five available cards."}
                </p>
                <div className="intro-check">
                  <Check size={14} /> Instant, card-specific explanations
                </div>
                <div className="intro-check">
                  <Check size={14} /> A fresh, shuffled deck every hand
                </div>
                <div className="intro-check">
                  <Check size={14} /> Your progress stays on this device
                </div>
              </div>
            )}
          </section>
          <section className="insight-card">
            <CircleHelp size={20} />
            <div>
              <p className="eyebrow">
                {canExercise ? "A LITTLE PROBABILITY" : "A GOOD THING TO KNOW"}
              </p>
              <h3>
                {canExercise
                  ? "What are the chances?"
                  : "Your best five can come from anywhere."}
              </h3>
              <p>
                {canExercise
                  ? `Based only on your visible cards, ${unseenAces} aces remain among ${unseen} unseen cards. Chance the next unknown card is an ace: ${percent.toFixed(1)}%. Hidden hands and burns remain unknown.`
                  : "Use both, one, or neither of your private cards. If the board makes the best hand for everyone, everyone ties."}
              </p>
              <button className="text-button" onClick={onReference}>
                Explore hand rankings <ArrowRight size={14} />
              </button>
            </div>
          </section>
        </aside>
      </div>
      {selectionResult && mode === "recognition" && (
        <span className="sr-only">
          Best-five exercise {selectionResult.status}
        </span>
      )}
      <footer className="page-footer">
        <span>Built for curiosity, played for understanding.</span>
        <span>
          LOCAL & PRIVATE <span className="status-dot" />
        </span>
      </footer>
    </>
  );
}
