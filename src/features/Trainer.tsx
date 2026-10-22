import { useRef, useState } from "react";
import { ArrowRight, Check, SkipForward } from "lucide-react";
import { CardRow } from "../components/Cards";
import { generateExercise, gradeExercise } from "../domain/exercises";
import { CATEGORIES } from "../domain/types";
import type {
  Answer,
  Difficulty,
  EvaluationResult,
  Exercise,
  ExerciseKind,
  ExerciseRecord,
} from "../domain/types";

type TrainerKind = Exclude<ExerciseKind, "prediction">;
const kinds: { kind: TrainerKind; label: string; detail: string }[] = [
  {
    kind: "recognition",
    label: "Hand recognition",
    detail: "Read the cards. Name the hand.",
  },
  {
    kind: "best-five",
    label: "Best five",
    detail: "Seven cards. One strongest combination.",
  },
  {
    kind: "comparison",
    label: "Hand comparison",
    detail: "Look past the category. Find the winner.",
  },
];
export default function Trainer({
  difficulty,
  onRecord,
}: {
  difficulty: Difficulty;
  onRecord: (record: ExerciseRecord) => void;
}) {
  const [kind, setKind] = useState<TrainerKind>("recognition");
  const [exercise, setExercise] = useState<Exercise>(() =>
    generateExercise("recognition", difficulty),
  );
  const [selected, setSelected] = useState<string[]>([]);
  const [answer, setAnswer] = useState<Answer | null>(null);
  const [result, setResult] = useState<EvaluationResult | null>(null);
  const [completed, setCompleted] = useState(0);
  const recorded = useRef(false);
  function next(nextKind: TrainerKind = kind) {
    let fresh = generateExercise(nextKind, difficulty);
    for (
      let tries = 0;
      tries < 8 &&
      fresh.cards
        .map((c) => c.id)
        .sort()
        .join() ===
        exercise.cards
          .map((c) => c.id)
          .sort()
          .join();
      tries++
    )
      fresh = generateExercise(nextKind, difficulty);
    setKind(nextKind);
    setExercise(fresh);
    setSelected([]);
    setAnswer(null);
    setResult(null);
    recorded.current = false;
  }
  function submit(value: Answer) {
    if (recorded.current) return;
    const graded = gradeExercise(exercise, value);
    recorded.current = true;
    setResult(graded);
    setCompleted((count) => count + 1);
    onRecord({
      ...graded,
      id: exercise.id,
      kind: exercise.kind,
      timestamp: Date.now(),
      context: `Hand trainer · ${difficulty}`,
    });
  }
  function selectCard(id: string) {
    if (result) return;
    setSelected((old) =>
      old.includes(id)
        ? old.filter((card) => card !== id)
        : old.length < 5
          ? [...old, id]
          : old,
    );
  }
  return (
    <div className="trainer-workspace">
      <div className="section-heading">
        <div>
          <p className="eyebrow">BUILD YOUR CARD INSTINCT</p>
          <h1>A sharper eye, one hand at a time.</h1>
          <p className="muted">
            Focused exercises. Real rules. Feedback that makes sense.
          </p>
        </div>
      </div>
      <div className="toolbar" role="group" aria-label="Exercise category">
        {kinds.map((item) => (
          <button
            key={item.kind}
            className={`secondary-button ${kind === item.kind ? "active" : ""}`}
            aria-pressed={kind === item.kind}
            onClick={() => next(item.kind)}
          >
            {item.label}
          </button>
        ))}
      </div>
      <section
        className="panel trainer-panel"
        aria-labelledby="trainer-question"
      >
        <div className="toolbar">
          <p className="eyebrow">
            {difficulty} · Exercise {completed + (result ? 0 : 1)}
          </p>
          <span className="muted">
            {kinds.find((item) => item.kind === kind)?.detail}
          </span>
        </div>
        <h2 id="trainer-question" className="section-heading">
          {exercise.prompt}
        </h2>
        {kind === "comparison" && <p className="eyebrow">Hand A</p>}
        <CardRow
          cards={exercise.cards}
          selected={selected}
          onSelect={kind === "best-five" && !result ? selectCard : undefined}
        />
        {exercise.otherCards && (
          <>
            <p className="eyebrow">Hand B</p>
            <CardRow cards={exercise.otherCards} />
          </>
        )}
        {!result && kind === "recognition" && (
          <div className="option-grid" role="group" aria-label="Hand category">
            {CATEGORIES.map((category) => (
              <button
                className={`option-button ${answer?.type === "category" && answer.category === category ? "selected" : ""}`}
                aria-pressed={
                  answer?.type === "category" && answer.category === category
                }
                key={category}
                onClick={() => setAnswer({ type: "category", category })}
              >
                {category}
              </button>
            ))}
          </div>
        )}
        {!result && kind === "comparison" && (
          <div className="option-grid" role="group" aria-label="Stronger hand">
            {(["a", "tie", "b"] as const).map((winner) => (
              <button
                key={winner}
                className={`option-button ${answer?.type === "comparison" && answer.winner === winner ? "selected" : ""}`}
                aria-pressed={
                  answer?.type === "comparison" && answer.winner === winner
                }
                onClick={() => setAnswer({ type: "comparison", winner })}
              >
                {winner === "tie"
                  ? "Exact tie"
                  : `Hand ${winner.toUpperCase()}`}
              </button>
            ))}
          </div>
        )}
        {!result && (
          <>
            <p className="muted" aria-live="polite">
              {kind === "best-five"
                ? `${selected.length} of 5 cards selected. Select a card again to remove it.`
                : "Choose an answer, then check your reasoning."}
            </p>
            <div className="toolbar">
              <button
                className="primary-button"
                disabled={
                  kind === "best-five" ? selected.length !== 5 : !answer
                }
                onClick={() =>
                  submit(
                    kind === "best-five"
                      ? { type: "selection", cardIds: selected }
                      : answer!,
                  )
                }
              >
                <Check size={16} /> Check answer
              </button>
              <button
                className="secondary-button"
                onClick={() => submit({ type: "skip" })}
              >
                <SkipForward size={16} /> Skip exercise
              </button>
            </div>
          </>
        )}
        {result && (
          <div className={`feedback ${result.status}`} role="status">
            <p className="eyebrow">
              {result.status === "correct"
                ? "Well read"
                : result.status === "incorrect"
                  ? "A learning moment"
                  : "Exercise skipped"}
            </p>
            <p>{result.explanation}</p>
            {result.bestFive && kind !== "comparison" && (
              <>
                <p className="eyebrow">One optimal five-card hand</p>
                <CardRow cards={result.bestFive} small />
              </>
            )}
            <button className="primary-button" onClick={() => next()}>
              Next exercise <ArrowRight size={16} />
            </button>
          </div>
        )}
      </section>
      <aside className="panel">
        <p className="eyebrow">A useful habit</p>
        <h3>Category. Ranks. Kickers.</h3>
        <p className="muted">
          Start with the hand category. When categories match, compare the ranks
          that define the hand, then the remaining high cards in order. Your
          sixth and seventh cards never break a tie.
        </p>
        <p className="muted">
          Difficulty changes the examples. The rules always stay the same.
        </p>
      </aside>
    </div>
  );
}
