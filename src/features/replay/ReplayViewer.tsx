import { lazy, Suspense, useMemo, useState, Component, type ReactNode } from "react";
import { CardRow } from "../../components/Cards";
import { replaySnapshot, type ReplayRecord } from "../../domain/replay/timeline";
import { DEFAULT_LOOK, type VisualEvent } from "../immersive-play/presentation";
import type { ImmersivePreferences } from "../immersive-play/preferences";
import { useReplay } from "./useReplay";
const Scene = lazy(() => import("../immersive-play/scene/PokerScene"));
class ReplayBoundary extends Component<{ children: ReactNode; onFailure: () => void }, { failed: boolean }> {
  state = { failed: false }; static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch() { this.props.onFailure(); } render() { return this.state.failed ? null : this.props.children; }
}
export default function ReplayViewer({ record, preferences, motion, fourColor, active, speed, onSpeed, onExit, onLearn }: { record: ReplayRecord; preferences: ImmersivePreferences; motion: boolean; fourColor: boolean; active: boolean; speed: number; onSpeed: (n: number) => void; onExit: () => void; onLearn: () => void }) {
  const [failed, setFailed] = useState(false);
  const playback = useReplay(record.events.length, speed, active);
  const { index, dispatch, playing } = playback;
  const snapshot = useMemo(() => replaySnapshot(record, index), [record, index]);
  const event = record.events[index];
  const events = useMemo<VisualEvent[]>(() => {
    if (!playing) return [];
    const e = record.events[index], kind = e.kind === "deal" ? "DEAL" : e.kind === "board" ? "BOARD" : e.kind === "showdown" ? "SHOWDOWN" : e.kind === "award" ? "AWARD" : e.kind === "action" ? "ACTION" : null;
    if (!kind) return [];
    const winners = e.award === undefined ? [e.action?.playerId] : record.hand.awards[e.award].winners;
    return winners.map((id) => ({ id: `${record.id}:${index}:${id}`, kind, at: playback.at ?? 0, playerId: id, action: e.action?.type }));
  }, [record, index, playing, playback.at]);
  return <div className="immersive-play replay-mode" data-testid="replay-mode">
    {preferences.display === "3d" && !failed && <ReplayBoundary onFailure={() => setFailed(true)}><Suspense fallback={<div className="scene-loading">Opening replay…</div>}><Scene snapshot={snapshot} events={events} quality={preferences.quality} motion={motion && playing} cinematic={preferences.cinematic} active={active} look={DEFAULT_LOOK} fourColor={fourColor} onFailure={() => setFailed(true)} /></Suspense></ReplayBoundary>}
    <header className="replay-heading"><div><span className="eyebrow">REPLAY MODE · READ ONLY</span><h1>Hand {record.hand.number}</h1></div><div className="toolbar"><button className="hud-button" onClick={onLearn}>Return to Learn</button><button className="primary-button" onClick={onExit}>Return to live Play</button></div></header>
    <details className={`replay-details ${failed || preferences.display === "2d" ? "is-fallback" : ""}`} open={failed || preferences.display === "2d" ? true : undefined}><summary>Replay table details · pot {snapshot.pot} chips</summary>
      <p>Street: {snapshot.street} · Pot: {snapshot.pot} chips</p><CardRow cards={snapshot.board} small />
      {snapshot.seats.map((p) => <div key={p.id}><strong>{p.name}: {p.stack} chips {p.folded ? "· Folded" : ""}</strong><CardRow cards={p.cards.filter((c) => c !== null)} small /><span>{p.cards.filter((c) => c === null).length ? "Private cards hidden" : ""}</span></div>)}
    </details>
    <section className="replay-controls" aria-label="Replay controls">
      {record.limited && <p className="muted">Legacy hand: earlier private cards and original personality details are unavailable. No missing cards are invented.</p>}
      <p role="status" aria-live="polite">{index + 1} / {record.events.length} · {event.label}</p>
      <label>Hand timeline<input aria-label="Replay timeline" type="range" min="0" max={record.events.length - 1} step="1" value={index} onChange={(e) => dispatch({ type: "seek", index: Number(e.target.value) })} /></label>
      <div className="toolbar"><button className="secondary-button" onClick={() => dispatch({ type: "restart" })}>Restart</button><button className="secondary-button" disabled={index === 0} onClick={() => dispatch({ type: "seek", index: index - 1 })}>Previous event</button><button className="primary-button" onClick={() => dispatch({ type: "toggle" })}>{playing ? "Pause replay" : "Play replay"}</button><button className="secondary-button" disabled={index === record.events.length - 1} onClick={() => dispatch({ type: "seek", index: index + 1 })}>Next event</button><label>Speed<select aria-label="Replay speed" value={playback.speed} onChange={(e) => { const speed = Number(e.target.value); dispatch({ type: "speed", speed }); onSpeed(speed); }}>{[.5, 1, 2].map((n) => <option value={n} key={n}>{n}×</option>)}</select></label></div>
    </section>
  </div>;
}
