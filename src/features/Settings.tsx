import { useState } from "react";
import { SlidersHorizontal, ShieldCheck } from "lucide-react";
import type { Settings as Preferences } from "../domain/types";

export default function Settings({
  settings,
  onChange,
  onReset,
}: {
  settings: Preferences;
  onChange: (settings: Preferences) => void;
  onReset: () => void;
}) {
  const [confirming, setConfirming] = useState(false);
  const update = <Key extends keyof Preferences>(
    key: Key,
    value: Preferences[Key],
  ) => onChange({ ...settings, [key]: value });
  return (
    <div className="settings-page">
      <div className="section-heading">
        <div>
          <p className="eyebrow">MAKE YOURSELF AT HOME</p>
          <h1>Your table, your pace.</h1>
          <p className="muted">
            A comfortable place to learn. Changes are saved automatically on
            this device.
          </p>
        </div>
        <SlidersHorizontal size={28} aria-hidden="true" />
      </div>
      <div className="settings-grid">
        <section className="panel">
          <h2>Practice preferences</h2>
          <p className="muted">
            Play has separate session configuration and NPC pacing controls.
            Motion and suit appearance preferences here apply throughout
            PokerLab.
          </p>
          <p className="muted">Opponent changes apply to the next hand.</p>
          <label className="setting-row">
            <span>
              <strong>Opponents</strong>
              <small className="muted">
                Hidden seats around your practice table
              </small>
            </span>
            <select
              className="select-field"
              value={settings.opponents}
              onChange={(event) =>
                update("opponents", Number(event.target.value))
              }
              aria-label="Number of opponents"
            >
              {[1, 2, 3, 4, 5].map((count) => (
                <option key={count} value={count}>
                  {count} {count === 1 ? "opponent" : "opponents"}
                </option>
              ))}
            </select>
          </label>
          <label className="setting-row">
            <span>
              <strong>Exercise difficulty</strong>
              <small className="muted">
                The examples change; the rules stay the same
              </small>
            </span>
            <select
              className="select-field"
              value={settings.difficulty}
              onChange={(event) =>
                update(
                  "difficulty",
                  event.target.value as Preferences["difficulty"],
                )
              }
            >
              <option value="beginner">Beginner</option>
              <option value="standard">Standard</option>
              <option value="challenge">Challenge</option>
            </select>
          </label>
          <label className="setting-row">
            <span>
              <strong>Animation speed</strong>
              <small className="muted">
                Card transitions at a pace you prefer
              </small>
            </span>
            <select
              className="select-field"
              value={settings.animation}
              onChange={(event) =>
                update(
                  "animation",
                  event.target.value as Preferences["animation"],
                )
              }
            >
              <option value="slow">Relaxed</option>
              <option value="normal">Normal</option>
              <option value="fast">Quick</option>
            </select>
          </label>
        </section>
        <section className="panel">
          <h2>Accessibility & appearance</h2>
          <label className="setting-row">
            <span>
              <strong>Reduce motion</strong>
              <small className="muted">
                Disable card animations. Your device preference is also
                respected.
              </small>
            </span>
            <input
              type="checkbox"
              checked={settings.reducedMotion}
              onChange={(event) =>
                update("reducedMotion", event.target.checked)
              }
            />
          </label>
          <label className="setting-row">
            <span>
              <strong>Four-color suits</strong>
              <small className="muted">
                Add green clubs and blue diamonds. Every card keeps its suit
                symbol.
              </small>
            </span>
            <input
              type="checkbox"
              checked={settings.fourColor}
              onChange={(event) => update("fourColor", event.target.checked)}
            />
          </label>
          <p className="muted">
            <ShieldCheck size={17} aria-hidden="true" /> Preferences and
            learning history stay in this browser. No account required.
          </p>
        </section>
        <section className="panel">
          <h2>A fresh start</h2>
          <p className="muted">
            Clear your saved exercise results. Your practice settings will be
            kept.
          </p>
          {confirming ? (
            <div role="group" aria-label="Confirm progress reset">
              <p>Delete all saved learning progress on this device?</p>
              <div className="toolbar">
                <button
                  type="button"
                  className="danger-button"
                  onClick={() => {
                    onReset();
                    setConfirming(false);
                  }}
                >
                  Yes, reset progress
                </button>
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => setConfirming(false)}
                >
                  Keep my progress
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              className="secondary-button"
              onClick={() => setConfirming(true)}
            >
              Reset learning progress
            </button>
          )}
        </section>
      </div>
    </div>
  );
}
