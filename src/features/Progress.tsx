import { ArrowUpRight, Check, Minus, X, Target } from "lucide-react";
import {
  CATEGORIES,
  type ExerciseKind,
  type ExerciseRecord,
} from "../domain/types";
import { HISTORY_LIMIT, summarize, type LifetimeTotals } from "../lib/storage";
const labels: Record<ExerciseKind, string> = {
  recognition: "Hand recognition",
  "best-five": "Best-five selection",
  comparison: "Hand comparison",
  prediction: "Showdown prediction",
};
const percent = (value: number | null) =>
  value === null ? "—" : `${Math.round(value * 100)}%`;
export default function Progress({
  records,
  totals,
  onPractice,
}: {
  records: ExerciseRecord[];
  totals: LifetimeTotals;
  onPractice: () => void;
}) {
  const stats = summarize(records, totals);
  const misses = CATEGORIES.map((category) => ({
    category,
    count: totals.missed[category],
  }))
    .filter((item) => item.count > 0)
    .sort((a, b) => b.count - a.count);
  return (
    <div className="progress-page">
      <div className="section-heading">
        <div>
          <p className="eyebrow">YOUR LEARNING JOURNEY</p>
          <h1>Every hand teaches something.</h1>
          <p className="muted">Look for patterns. Build on what you know.</p>
        </div>
        <button type="button" className="primary-button" onClick={onPractice}>
          Keep practicing <ArrowUpRight size={17} aria-hidden="true" />
        </button>
      </div>
      <div className="stats-grid">
        <div className="stat-card">
          <span className="eyebrow">COMPLETED</span>
          <strong>{stats.completed}</strong>
          <small className="muted">answered exercises</small>
        </div>
        <div className="stat-card">
          <span className="eyebrow">ACCURACY</span>
          <strong>{percent(stats.accuracy)}</strong>
          <small className="muted">skips excluded</small>
        </div>
        <div className="stat-card">
          <span className="eyebrow">CORRECT / INCORRECT</span>
          <strong>
            {stats.correct} <span className="muted">/ {stats.incorrect}</span>
          </strong>
          <small className="muted">feedback to learn from</small>
        </div>
        <div className="stat-card">
          <span className="eyebrow">SKIPPED</span>
          <strong>{stats.skipped}</strong>
          <small className="muted">never marked incorrect</small>
        </div>
      </div>
      <p className="muted">
        Lifetime totals are kept on this device; the most recent {HISTORY_LIMIT}{" "}
        results can be reviewed. Completed means correct plus incorrect.
        Advancing a street skips its unfinished table exercises. Unsubmitted
        trainer exercises are not recorded.
      </p>
      {records.length === 0 ? (
        <section className="panel">
          <Target size={32} aria-hidden="true" />
          <h2>Your first insight is one hand away.</h2>
          <p className="muted">
            Complete or skip an exercise at the table or in the trainer. Your
            progress will appear here.
          </p>
          <button
            type="button"
            className="secondary-button"
            onClick={onPractice}
          >
            Start practicing
          </button>
        </section>
      ) : (
        <>
          <div className="settings-grid">
            <section className="panel">
              <p className="eyebrow">SKILLS AT A GLANCE</p>
              <h2>Accuracy by exercise</h2>
              {(Object.keys(labels) as ExerciseKind[]).map((kind) => {
                const result = stats.byKind[kind];
                return (
                  <div className="skill-row" key={kind}>
                    <div className="setting-row">
                      <span>{labels[kind]}</span>
                      <strong>{percent(result.accuracy)}</strong>
                    </div>
                    <div
                      className="progress-track"
                      role="meter"
                      aria-label={`${labels[kind]} accuracy`}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-valuenow={Math.round((result.accuracy ?? 0) * 100)}
                      aria-valuetext={
                        result.accuracy === null
                          ? "No answered exercises"
                          : percent(result.accuracy)
                      }
                    >
                      <span
                        style={{
                          display: "block",
                          height: "100%",
                          width: percent(result.accuracy ?? 0),
                          background: "var(--gold, #c8ae72)",
                          borderRadius: "inherit",
                        }}
                      />
                    </div>
                    <small className="muted">
                      {result.completed} answered · {result.skipped} skipped
                    </small>
                  </div>
                );
              })}
            </section>
            <section className="panel">
              <p className="eyebrow">WHERE TO FOCUS</p>
              <h2>Frequently missed hands</h2>
              {misses.length ? (
                misses.map((item) => (
                  <div className="setting-row" key={item.category}>
                    <span>{item.category}</span>
                    <span className="muted">
                      {item.count} {item.count === 1 ? "miss" : "misses"}
                    </span>
                  </div>
                ))
              ) : (
                <p className="muted">
                  No hand categories missed yet. Keep practicing a variety of
                  examples.
                </p>
              )}
              <p className="muted">
                Based on the actual best hand in exercises you answered
                incorrectly. Hidden-card predictions are uncertain; they are not
                a measure of strategy.
              </p>
            </section>
          </div>
          <section className="panel">
            <p className="eyebrow">RECENT PRACTICE</p>
            <h2>A little reflection goes a long way.</h2>
            <ol className="history-list">
              {records
                .slice(-20)
                .reverse()
                .map((record) => (
                  <li className="history-item" key={record.id}>
                    <span
                      className={`result-icon ${record.status}`}
                      aria-hidden="true"
                    >
                      {record.status === "correct" ? (
                        <Check size={18} />
                      ) : record.status === "incorrect" ? (
                        <X size={18} />
                      ) : (
                        <Minus size={18} />
                      )}
                    </span>
                    <div>
                      <strong>
                        {labels[record.kind]}{" "}
                        <span className="muted">· {record.status}</span>
                      </strong>
                      <p className="muted">{record.context}</p>
                      <details>
                        <summary>Review explanation</summary>
                        <p>{record.explanation}</p>
                      </details>
                    </div>
                    <time
                      className="muted"
                      dateTime={new Date(record.timestamp).toISOString()}
                    >
                      {new Date(record.timestamp).toLocaleDateString(
                        undefined,
                        { month: "short", day: "numeric" },
                      )}
                    </time>
                  </li>
                ))}
            </ol>
          </section>
        </>
      )}
    </div>
  );
}
