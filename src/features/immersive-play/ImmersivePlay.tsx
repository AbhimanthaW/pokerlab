import { Component, Suspense, lazy, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Settings2, Volume2, VolumeX, Maximize2, RotateCcw, BookOpen, SkipForward, History } from "lucide-react";
import { getLegalActions, getPlayView } from "../../domain/play/engine";
import { DEFAULT_CONFIG, type SessionConfig } from "../../domain/play/types";
import { ControlledPlay } from "../play/Play";
import { usePlay } from "../play/usePlay";
import ActionControls from "../play/ActionControls";
import HandHistory, { ActionLog } from "../play/HandHistory";
import { explainAward } from "../play/format";
import { AudioManager } from "./audio/AudioManager";
import { boundLook, DEFAULT_LOOK, projectScene, type Quality } from "./presentation";
import { loadImmersivePreferences, saveImmersivePreferences, type ImmersivePreferences } from "./preferences";
import { toggleFullscreen, useFullscreen, usePageActive, usePresentation, useReducedMotion } from "./hooks";
import Modal from "./Modal";
import { CommunityCards, PrivateCards } from "./VisibleCards";
import "./immersive.css";

const PokerScene = lazy(() => import("./scene/PokerScene"));
class SceneBoundary extends Component<{ children: ReactNode; onFailure: (message: string) => void }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch() { this.props.onFailure("3D rendering could not start. Your hand is preserved in the 2D table."); }
  render() { return this.state.failed ? null : this.props.children; }
}
export default function ImmersivePlay({ onLearn, reducedMotion, fourColor }: {
  onLearn: () => void; reducedMotion: boolean; fourColor: boolean;
}) {
  const [menu, setMenu] = useState(false), [history, setHistory] = useState(false);
  const active = usePageActive();
  const controller = usePlay(menu || history || !active);
  const { session: s } = controller;
  const [preferences, setPreferences] = useState(loadImmersivePreferences);
  const [config, setConfig] = useState<SessionConfig>({ ...DEFAULT_CONFIG });
  const [rendererError, setRendererError] = useState<string>();
  const [notice, setNotice] = useState<string>();
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [skipMotion, setSkipMotion] = useState(false);
  const [look, setLook] = useState(DEFAULT_LOOK);
  const root = useRef<HTMLDivElement>(null);
  const audio = useRef<AudioManager | null>(null);
  const played = useRef(new Set<string>());
  const drag = useRef<{ x: number; y: number } | null>(null);
  const fullscreen = useFullscreen();
  const reduce = useReducedMotion(reducedMotion);
  const motion = !reduce && !skipMotion;
  const snapshot = useMemo(() => s ? projectScene(s) : null, [s]);
  const presentation = usePresentation(snapshot);
  const display2d = preferences.display === "2d" || !!rendererError;
  const failed = useCallback((message: string) => setRendererError(message), []);
  useEffect(() => {
    const oldOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const manager = new AudioManager(loadImmersivePreferences(), setNotice);
    audio.current = manager;
    return () => { manager.dispose(); audio.current = null; document.body.style.overflow = oldOverflow; };
  }, []);
  useEffect(() => {
    const warning = saveImmersivePreferences(preferences);
    // A failed external storage synchronization must be surfaced to the user.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (warning) setNotice(warning);
    audio.current?.update(preferences);
  }, [preferences]);
  useEffect(() => { audio.current?.setInactive(!active || menu || history); }, [active, menu, history]);
  useEffect(() => {
    for (const e of presentation.events) {
      if (played.current.has(e.id)) continue;
      played.current.add(e.id);
      audio.current?.play(e.kind === "COMPLETE" ? "complete" : e.kind === "DEAL" ? "shuffle" : e.kind === "BOARD" || e.kind === "SHOWDOWN" ? "reveal" : e.kind === "AWARD" ? "chips" : e.amount ? "chips" : "ui");
      if (e.kind === "DEAL") audio.current?.play("deal");
    }
    if (played.current.size > 256) played.current = new Set(presentation.events.map((e) => e.id));
  }, [presentation.events]);
  useEffect(() => {
    const escape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !document.fullscreenElement && !history) setMenu((value) => !value);
    };
    window.addEventListener("keydown", escape);
    return () => window.removeEventListener("keydown", escape);
  }, [history]);
  const change = (patch: Partial<ImmersivePreferences>) => setPreferences((p) => ({ ...p, ...patch }));
  const sound = async () => {
    if (!audioEnabled || preferences.muted) {
      change({ muted: false });
      const enabled = await audio.current?.enable(); setAudioEnabled(!!enabled);
    } else change({ muted: true });
  };
  const full = async () => { if (root.current) { const error = await toggleFullscreen(root.current); if (error) setNotice(error); } };
  const learn = () => {
    if (document.fullscreenElement === root.current) void document.exitFullscreen().catch(() => {});
    onLearn();
  };
  const view = s ? getPlayView(s) : null;
  const names = Object.fromEntries(view?.players.map((p) => [p.id, p.name]) ?? []);
  const complete = s?.status === "player_eliminated" || s?.status === "session_complete";
  const last = s?.history.at(-1);
  const modal = menu || history;
  return <div className={`immersive-play ${display2d ? "display-2d" : "display-3d"} ${view && view.pots.length > 1 ? "has-side-pots" : ""}`} ref={root} data-testid="immersive-play">
    <div className="immersive-backdrop" aria-hidden="true" inert={modal}>
      {!display2d && <SceneBoundary onFailure={failed}>
        <Suspense fallback={<div className="scene-loading" role="status">Opening the room…</div>}>
          <PokerScene snapshot={snapshot} events={skipMotion ? [] : presentation.events} quality={preferences.quality}
            motion={motion} cinematic={preferences.cinematic} active={active && !modal} look={look} fourColor={fourColor} onFailure={failed} />
        </Suspense>
      </SceneBoundary>}
    </div>
    <div className="game-interface" inert={modal}>
      <header className="game-topbar">
        <div className="game-wordmark">Poker<span>Lab</span><small>THE NIGHT ROOM</small></div>
        <div className="game-top-tools">
          <button className="hud-button" onClick={() => setHistory(true)} aria-label="Hand history" title="Hand history"><History size={17} /></button>
          <button className="hud-button" onClick={() => void sound()} aria-label={!audioEnabled || preferences.muted ? "Enable audio" : "Mute audio"} title={!audioEnabled || preferences.muted ? "Enable audio" : "Mute audio"}>
            {!audioEnabled || preferences.muted ? <VolumeX size={17} /> : <Volume2 size={17} />}
          </button>
          <button className="hud-button" onClick={() => void full()} aria-label={fullscreen ? "Exit fullscreen" : "Enter fullscreen"} title="Fullscreen"><Maximize2 size={17} /></button>
          <button className="hud-button" onClick={() => setMenu(true)} aria-label="Pause and settings" title="Pause and settings"><Settings2 size={17} /></button>
        </div>
      </header>
      {(notice || controller.warning || controller.error || rendererError) && <div className="game-notice" role="status">
        <span>{controller.error ?? controller.warning ?? notice ?? rendererError}</span>
        {(notice || rendererError) && <button className="hud-button" aria-label="Dismiss notice" onClick={() => { setNotice(undefined); if (rendererError) change({ display: "2d" }); setRendererError(undefined); }}>✕</button>}
      </div>}
      {display2d ? <div className="fallback-table">
        <div className="fallback-toolbar"><span>2D table</span><button className="hud-button" onClick={() => { setRendererError(undefined); change({ display: "3d" }); }}>Try 3D</button></div>
        <ControlledPlay onLearn={learn} controller={controller} />
      </div> : <>
        <div className="camera-surface" aria-hidden="true"
          onPointerDown={(e) => { drag.current = { x: e.clientX, y: e.clientY }; e.currentTarget.setPointerCapture(e.pointerId); }}
          onPointerMove={(e) => {
            if (!drag.current) return;
            const dx = e.clientX - drag.current.x, dy = e.clientY - drag.current.y;
            drag.current = { x: e.clientX, y: e.clientY };
            setLook((p) => boundLook({ ...p, yaw: p.yaw - dx * .0012, pitch: p.pitch + dy * .00065 }));
          }}
          onPointerUp={() => { drag.current = null; }} onPointerCancel={() => { drag.current = null; }}
          onWheel={(e) => setLook((p) => boundLook({ ...p, zoom: p.zoom + e.deltaY * .0003 }))} />
        {s && view && <>
          <div className="table-state" role="status" aria-live="polite" aria-atomic="true">
            <span className="hand-tag">{String(s.handNumber).padStart(3, "0")} / {s.street}</span>
            <strong>{s.status === "hand_in_progress" ? `${names[s.actor!]} to act` : complete ? "Session ended" : "Hand complete"}</strong>
            <div className="hud-pot"><span>{s.status === "hand_in_progress" ? "POT" : "AWARDED"}</span> {(s.status === "hand_in_progress" ? view.pot : last?.awards.reduce((n, a) => n + a.amount, 0) ?? 0).toLocaleString()}</div>
            {view.pots.length > 1 && <div className="hud-side-pots">{view.pots.map((p, i) => <span key={i}>{i ? `Side ${i}` : "Main"}: {p.amount}</span>)}</div>}
          </div>
          <CommunityCards board={view.board} />
          <div className="human-stack">
            <div className="stack-value"><span>YOUR STACK {view.dealer === 0 ? "· D" : ""} {view.smallBlindSeat === 0 ? "· SB" : view.bigBlindSeat === 0 ? "· BB" : ""}</span><strong>{s.players[0].stack.toLocaleString()} <small>chips</small></strong></div>
            <PrivateCards cards={view.players[0].cards} folded={view.players[0].folded} />
          </div>
          <ul className="sr-only" aria-label="Public player stacks">{view.players.map((p) => <li key={p.id}>{p.name}: {p.stack} chips. {p.folded ? "Folded" : ""}</li>)}</ul>
          {!complete && s.status === "hand_in_progress" && s.actor === "you" && <div className="human-actions">
            <ActionControls key={s.revision} legal={getLegalActions(s, "you")} onAction={(a) => { audio.current?.play("ui"); controller.act(a, s.revision); }} />
          </div>}
          {!complete && s.status === "hand_in_progress" && s.actor !== "you" && <div className="waiting-label">{names[s.actor!]} is thinking<span>•••</span></div>}
          {last && s.status === "hand_complete" && <section className="hand-result-overlay" aria-label="Hand result">
            <span className="eyebrow">{last.reason === "folds" ? "WON BY FOLDS" : "SHOWDOWN"}</span>
            {last.awards.map((a, i) => <p key={i}>{explainAward(a.explanation, names)}</p>)}
            {Object.entries(last.refunds).map(([id, n]) => <small key={id}>{names[id]}: {n} uncalled chips returned.</small>)}
            <button className="primary-button" onClick={() => { setSkipMotion(false); controller.next(); }}>Next hand →</button>
          </section>}
          {complete && <section className="session-result-overlay" aria-label="Session outcome">
            <p className="eyebrow">LAST PLAYER STANDING</p>
            <h1>{s.status === "session_complete" ? `${s.winner === "you" ? "You win" : `${names[s.winner!]} wins`} the session` : `You finished #${s.players[0].place}`}</h1>
            <p>{s.handNumber} hands · {Math.max(0, Math.round(((s.finishedAt ?? s.startedAt) - s.startedAt) / 60000))} minutes</p>
            <p>{s.status === "player_eliminated" ? `${s.players.filter((p) => p.stack > 0).length} players remain. Your session ends here.` : `All ${s.supply.toLocaleString()} virtual chips are accounted for.`}</p>
            <ol>{[...s.players].sort((a, b) => (a.place ?? 0) - (b.place ?? 0) || b.stack - a.stack).map((p) => <li key={p.id}>{p.place ? `#${p.place}` : "Still in"} {p.name}<span>{p.stack} chips</span></li>)}</ol>
            <div className="toolbar"><button className="primary-button" onClick={controller.discard}>New session</button><button className="secondary-button" onClick={learn}>Return to Learn</button></div>
          </section>}
        </>}
        {!s && <section className="room-entry" aria-label="New Play session">
          <p className="eyebrow">TAKE YOUR SEAT</p><h1>The night room.</h1><p className="entry-subtitle">A few different minds. One table.</p>
          {controller.invalid ? <><p>The saved hand could not be restored.</p><button className="primary-button" onClick={controller.discard}>Discard invalid Play save</button></> : <>
            <div className="entry-fields"><label>Opponents<select aria-label="Play opponent count" value={config.opponents} onChange={(e) => setConfig({ ...config, opponents: Number(e.target.value) })}>{[1, 2, 3, 4, 5].map((n) => <option key={n}>{n}</option>)}</select></label>
              <label>Difficulty<select aria-label="NPC difficulty" value={config.difficulty} onChange={(e) => setConfig({ ...config, difficulty: e.target.value as SessionConfig["difficulty"] })}>{["beginner", "standard", "challenge"].map((d) => <option key={d}>{d}</option>)}</select></label></div>
            <p className="entry-facts">1,000 chips each · 5 / 10 fixed blinds</p>
            <button className="primary-button" onClick={() => { setSkipMotion(false); controller.start(config); }}>Start session →</button>
          </>}
          <button className="text-button" onClick={learn}>Return to Learn</button>
        </section>}
        <footer className="game-footnote"><span>FICTIONAL CHIPS · NO REAL VALUE</span><button className="hud-button" onClick={() => setLook(DEFAULT_LOOK)} aria-label="Reset camera"><RotateCcw size={13} /></button><button className="hud-button" onClick={() => setSkipMotion((v) => !v)} aria-label={skipMotion ? "Enable animations" : "Skip animations"}><SkipForward size={13} /></button></footer>
      </>}
    </div>
    {menu && <Modal title="At your pace" onClose={() => setMenu(false)}>
      <p className="menu-caption">The table is paused.</p>
      <div className="menu-actions"><button className="primary-button" onClick={() => setMenu(false)}>Resume</button><button className="secondary-button" onClick={() => void full()}>{fullscreen ? "Exit fullscreen" : "Enter fullscreen"}</button><button className="secondary-button" onClick={() => setLook(DEFAULT_LOOK)}>Reset camera</button></div>
      <label className="menu-row">Display<select aria-label="Table display" value={display2d ? "2d" : "3d"} onChange={(e) => { setRendererError(undefined); change({ display: e.target.value as "2d" | "3d" }); }}><option value="3d">3D room</option><option value="2d">2D table</option></select></label>
      <label className="menu-row">Graphics quality<select aria-label="Graphics quality" value={preferences.quality} onChange={(e) => change({ quality: e.target.value as Quality })}>{["auto", "low", "medium", "high"].map((q) => <option key={q}>{q}</option>)}</select></label>
      <label className="menu-row">NPC pace<select aria-label="NPC pace" value={controller.pacing} onChange={(e) => controller.setPacing(e.target.value as "instant" | "normal" | "relaxed")}>{["instant", "normal", "relaxed"].map((p) => <option key={p}>{p}</option>)}</select></label>
      <label className="menu-row">Camera emphasis<input type="checkbox" checked={preferences.cinematic} onChange={(e) => change({ cinematic: e.target.checked })} /></label>
      <div className="camera-menu" aria-label="Camera adjustment"><button className="hud-button" aria-label="Look left" onClick={() => setLook((v) => boundLook({ ...v, yaw: v.yaw - .04 }))}>←</button><button className="hud-button" aria-label="Look right" onClick={() => setLook((v) => boundLook({ ...v, yaw: v.yaw + .04 }))}>→</button><button className="hud-button" aria-label="Look up" onClick={() => setLook((v) => boundLook({ ...v, pitch: v.pitch + .03 }))}>↑</button><button className="hud-button" aria-label="Look down" onClick={() => setLook((v) => boundLook({ ...v, pitch: v.pitch - .03 }))}>↓</button><button className="hud-button" aria-label="Zoom in" onClick={() => setLook((v) => boundLook({ ...v, zoom: v.zoom - .025 }))}>+</button><button className="hud-button" aria-label="Zoom out" onClick={() => setLook((v) => boundLook({ ...v, zoom: v.zoom + .025 }))}>−</button></div>
      <div className="audio-title"><h3>Room audio</h3><button className="hud-button" onClick={() => void sound()}>{!audioEnabled || preferences.muted ? "Enable audio" : "Mute audio"}</button></div>
      {(["master", "music", "effects", "ambient"] as const).map((key) => <label className="menu-row" key={key}>{key}<input aria-label={`${key} volume`} type="range" min="0" max="1" step=".01" value={preferences[key]} onChange={(e) => change({ [key]: Number(e.target.value) })} /><output>{Math.round(preferences[key] * 100)}%</output></label>)}
      <p className="menu-caption">Drag the room to look around. Scroll to zoom. Escape opens this menu. Motion follows your accessibility preferences.</p>
      <button className="secondary-button" onClick={learn}><BookOpen size={16} /> Return to Learn</button>
    </Modal>}
    {history && <Modal title="Hand history" onClose={() => setHistory(false)}>{view ? <><details><summary>Current hand actions</summary><ActionLog actions={view.actions} names={names} /></details><HandHistory history={view.history} names={names} /></> : <p>Your completed hands will appear here.</p>}</Modal>}
  </div>;
}
