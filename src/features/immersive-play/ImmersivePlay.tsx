import { Component, Suspense, lazy, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Settings2, Volume2, VolumeX, Maximize2, RotateCcw, BookOpen, SkipForward, History, Eye } from "lucide-react";
import { getLegalActions, getPlayView } from "../../domain/play/engine";
import { DEFAULT_CONFIG, type HandRecord, type SessionConfig } from "../../domain/play/types";
import { ControlledPlay } from "../play/Play";
import { usePlay } from "../play/usePlay";
import ActionControls from "../play/ActionControls";
import HandHistory, { ActionLog } from "../play/HandHistory";
import { explainAward } from "../play/format";
import { AudioManager } from "./audio/AudioManager";
import { boundLook, DEFAULT_LOOK, projectScene, type Quality } from "./presentation";
import { loadImmersivePreferences, saveImmersivePreferences, type ImmersivePreferences } from "./preferences";
import { toggleFullscreen, useFullscreen, usePageActive, usePresentation, useReducedMotion } from "./hooks";
import { buildReplay, type ReplayRecord } from "../../domain/replay/timeline";
import ReplayViewer from "../replay/ReplayViewer";
import Dialogue from "../living-npcs/Dialogue";
import { loadV4Settings, saveV4Settings, type V4Settings } from "../../lib/v4Storage";
import { loadRoom, saveRoom, type RoomPreferences } from "../night-room/preferences";
import { soundCues, type SoundCue } from "../night-room/soundCues";
import RoomSettings from "../night-room/RoomSettings";
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
  const [details, setDetails] = useState(false);
  const [resumedRevision, setResumedRevision] = useState<number | null>(null);
  const [replay, setReplay] = useState<ReplayRecord | null>(null);
  const [room, setRoom] = useState(loadRoom);
  const [preview, setPreview] = useState<RoomPreferences | null>(null);
  const [inspectFor, setInspectFor] = useState<string | null>(null);
  const [v4, setV4] = useState(loadV4Settings);
  const active = usePageActive();
  const controller = usePlay(menu || history || !!replay || !active);
  const { session: s } = controller;
  const [preferences, setPreferences] = useState(loadImmersivePreferences);
  const [config, setConfig] = useState<SessionConfig>({ ...DEFAULT_CONFIG });
  const [rendererError, setRendererError] = useState<string>();
  const [notice, setNotice] = useState<string>();
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [skipMotion, setSkipMotion] = useState(false);
  const [look, setLook] = useState(DEFAULT_LOOK);
  const [resetAt, setResetAt] = useState<number | null>(null);
  const resetCamera = () => { setLook(DEFAULT_LOOK); setResetAt(s?.revision ?? null); };
  const root = useRef<HTMLDivElement>(null);
  const audio = useRef<AudioManager | null>(null);
  const replaySound = useCallback((cues: SoundCue[], scope: string, playing: boolean) => { if(playing)audio.current?.schedule(cues,scope);else audio.current?.cancelEffects(); }, []);
  const drag = useRef<{ x: number; y: number } | null>(null);
  const fullscreen = useFullscreen();
  const reduce = useReducedMotion(reducedMotion);
  const motion = !reduce && !skipMotion;
  const style = preview ?? room;
  const handId = s ? `${s.id}:${s.handNumber}` : null;
  const inspecting = !!handId && inspectFor === handId && !s?.players[0].folded;
  const closeMenu = () => { setPreview(null); setMenu(false); };
  const applyRoom = (next: RoomPreferences) => { setRoom(next); setPreview(null); const warning = saveRoom(next); if (warning) setNotice(warning); };
  useEffect(() => { if (!inspectFor) return; const timer = window.setTimeout(() => setInspectFor(null), 3500); return () => window.clearTimeout(timer); }, [inspectFor]);
  useEffect(() => {
    const inspectKey = (e: KeyboardEvent) => { if (e.key.toLowerCase() !== "i" || e.ctrlKey || e.metaKey || e.altKey || e.repeat || menu || history || replay || /INPUT|SELECT|TEXTAREA/.test((e.target as HTMLElement)?.tagName)) return; e.preventDefault(); setInspectFor((p) => p === handId ? null : handId); };
    window.addEventListener("keydown", inspectKey); return () => window.removeEventListener("keydown", inspectKey);
  }, [handId, menu, history, replay]);
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
  useEffect(() => { audio.current?.updateRoom(style.room, style.characterAudio); }, [style.room, style.characterAudio]);
  useEffect(() => { if (!motion || style.camera === "instant") audio.current?.cancelEffects(); }, [motion, style.camera]);
  useEffect(() => { audio.current?.setInactive(!active || menu || history); }, [active, menu, history]);
  useEffect(() => { if (!replay) audio.current?.schedule(soundCues(presentation.snapshot, presentation.events, 1, !motion || style.camera === "instant"), `${presentation.snapshot?.id}:${presentation.snapshot?.hand}`); }, [presentation.snapshot, presentation.events, replay, motion, style.camera]);
  useEffect(() => {
    const escape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && inspecting && !menu) { setInspectFor(null); return; }
      if (e.key === "Escape" && !replay && !document.fullscreenElement && !history) setMenu((value) => !value);
    };
    window.addEventListener("keydown", escape);
    return () => window.removeEventListener("keydown", escape);
  }, [history, replay, inspecting, menu]);
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
  const speakers = snapshot?.seats.filter((p) => p.index > 0 && !p.eliminated) ?? [];
  const speaker = speakers[Math.max(0,(s?.handNumber ?? 1)-1)%Math.max(1,speakers.length)];
  const modal = menu || history;
  const changeV4 = (patch: Partial<V4Settings>) => {
    const next = { ...v4, ...patch }; setV4(next); const warning = saveV4Settings(next); if (warning) setNotice(warning);
  };
  const openReplay = (hand: HandRecord) => {
    try { const record = buildReplay(hand, names); setReplay(record); setHistory(false); setMenu(false); }
    catch (e) { setNotice(e instanceof Error ? e.message : "This hand cannot be replayed."); }
  };
  if (replay) return <ReplayViewer record={replay} room={room} onSound={replaySound} preferences={preferences} motion={motion} fourColor={fourColor} active={active} speed={v4.replaySpeed} onSpeed={(replaySpeed) => changeV4({ replaySpeed })} onExit={() => { setResumedRevision(s?.revision ?? null); setReplay(null); }} onLearn={learn} />;
  return <div className={`immersive-play ${display2d ? "display-2d" : "display-3d"} ${view && view.pots.length > 1 ? "has-side-pots" : ""}`} ref={root} data-testid="immersive-play">
    <div className="immersive-backdrop" aria-hidden="true" inert={modal}>
      {!display2d && <SceneBoundary onFailure={failed}>
        <Suspense fallback={<div className="scene-loading" role="status">Opening the room…</div>}>
          <PokerScene snapshot={presentation.snapshot} room={style} inspect={inspecting} events={skipMotion || s?.revision === resumedRevision ? [] : presentation.events} quality={preferences.quality}
            motion={motion && !modal} cinematic={preferences.cinematic && resetAt !== s?.revision} active={active && (!modal || !!preview)} look={look} fourColor={fourColor} onFailure={failed} />
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
          {v4.dialogue && snapshot && <Dialogue key={`${s.id}:${s.handNumber}:${s.status}`} active={active && !modal} context={{ hand: s.handNumber, status: s.status, activePlayers: snapshot.seats.filter((p) => !p.eliminated).length, name: speaker?.name ?? "Dealer", personality: speaker?.personality ?? "analytical" }} />}
          <div className="table-state" role="status" aria-live="polite" aria-atomic="true">
            <span className="hand-tag">{String(s.handNumber).padStart(3, "0")} / {s.street}</span>
            <strong>{s.status === "hand_in_progress" ? `${names[s.actor!]} to act` : complete ? "Session ended" : "Hand complete"}</strong>
            <div className="hud-pot"><span>{s.status === "hand_in_progress" ? "POT" : "AWARDED"}</span> {(s.status === "hand_in_progress" ? view.pot : last?.awards.reduce((n, a) => n + a.amount, 0) ?? 0).toLocaleString()}</div>
            {view.pots.length > 1 && <div className="hud-side-pots">{view.pots.map((p, i) => <span key={i}>{i ? `Side ${i}` : "Main"}: {p.amount}</span>)}</div>}
          </div>
          <div className="sr-only" aria-label="Revealed community cards">{view.board.length ? view.board.map((c) => `${c.rank} of ${c.suit}`).join(", ") : "No community cards dealt"}</div>
          <details className="table-details" open={details} onToggle={(e) => setDetails(e.currentTarget.open)}><summary>Table details</summary>
            <CommunityCards board={view.board} />
            <PrivateCards cards={view.players[0].cards} folded={view.players[0].folded} />
            <ul aria-label="Opponent stacks">{view.players.slice(1).map((p) => <li key={p.id}><strong>{p.name}</strong><span>{p.stack.toLocaleString()} chips · {p.eliminatedHand !== null ? "Eliminated" : p.folded ? "Folded" : p.stack === 0 ? "All-in" : p.lastAction || "Seated"}</span></li>)}</ul>
          </details>
          <div className="human-stack">
            <div className="stack-value"><span>YOUR STACK {view.dealer === 0 ? "· D" : ""} {view.smallBlindSeat === 0 ? "· SB" : view.bigBlindSeat === 0 ? "· BB" : ""}</span><strong>{s.players[0].stack.toLocaleString()} <small>chips</small></strong></div>
            <span className="sr-only">Your hand: {view.players[0].cards.map((c) => `${c.rank} of ${c.suit}`).join(", ")}{view.players[0].folded ? ". Folded" : ""}</span>
          </div>
          <ul className="sr-only" aria-label="Public player stacks">{view.players.map((p) => <li key={p.id}>{p.name}: {p.stack} chips. {p.folded ? "Folded" : ""}</li>)}</ul>
          {!complete && s.status === "hand_in_progress" && s.actor === "you" && <div className="human-actions">
            <ActionControls compact key={s.revision} legal={getLegalActions(s, "you")} onAction={(a) => { audio.current?.play("ui"); setInspectFor(null); controller.act(a, s.revision); }} />
          </div>}
          {!complete && s.status === "hand_in_progress" && s.actor !== "you" && <div className="waiting-label">{names[s.actor!]} is thinking<span>•••</span></div>}
          {last && s.status === "hand_complete" && <section className="hand-result-overlay" aria-label="Hand result">
            <span className="eyebrow">{last.reason === "folds" ? "WON BY FOLDS" : "SHOWDOWN"}</span>
            {last.awards.map((a, i) => <p key={i}>{explainAward(a.explanation, names)}</p>)}
            {Object.entries(last.refunds).map(([id, n]) => <small key={id}>{names[id]}: {n} uncalled chips returned.</small>)}
            <div className="toolbar"><button className="primary-button" onClick={() => { setSkipMotion(false); controller.next(); }}>Next hand →</button><button className="secondary-button" onClick={() => openReplay(last)}>Replay last hand</button></div>
          </section>}
          {complete && <section className="session-result-overlay" aria-label="Session outcome">
            <p className="eyebrow">LAST PLAYER STANDING</p>
            <h1>{s.status === "session_complete" ? `${s.winner === "you" ? "You win" : `${names[s.winner!]} wins`} the session` : `You finished #${s.players[0].place}`}</h1>
            <p>{s.handNumber} hands · {Math.max(0, Math.round(((s.finishedAt ?? s.startedAt) - s.startedAt) / 60000))} minutes</p>
            <p>{s.status === "player_eliminated" ? `${s.players.filter((p) => p.stack > 0).length} players remain. Your session ends here.` : `All ${s.supply.toLocaleString()} virtual chips are accounted for.`}</p>
            <ol>{[...s.players].sort((a, b) => (a.place ?? 0) - (b.place ?? 0) || b.stack - a.stack).map((p) => <li key={p.id}>{p.place ? `#${p.place}` : "Still in"} {p.name}<span>{p.stack} chips</span></li>)}</ol>
            <button className="secondary-button" disabled={!last} onClick={() => last && openReplay(last)}>Replay last hand</button><div className="toolbar"><button className="primary-button" onClick={controller.discard}>New session</button><button className="secondary-button" onClick={learn}>Return to Learn</button></div>
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
        <footer className="game-footnote"><span>FICTIONAL CHIPS · NO REAL VALUE</span><button className="hud-button" disabled={!s || s.players[0].folded || !s.players[0].cards.length} onClick={() => setInspectFor(inspecting ? null : handId)} aria-label="Inspect your cards" aria-pressed={inspecting} title="Inspect your cards (I)"><Eye size={15} /></button><button className="hud-button" onClick={resetCamera} aria-label="Reset camera"><RotateCcw size={13} /></button><button className="hud-button" onClick={() => setSkipMotion((v) => !v)} aria-label={skipMotion ? "Enable animations" : "Skip animations"}><SkipForward size={13} /></button></footer>
      </>}
    </div>
    {menu && <Modal title="At your pace" onClose={closeMenu}>
      <p className="menu-caption">The table is paused.</p>
      <div className="menu-actions"><button className="primary-button" onClick={closeMenu}>Resume</button><button className="secondary-button" onClick={() => void full()}>{fullscreen ? "Exit fullscreen" : "Enter fullscreen"}</button><button className="secondary-button" onClick={resetCamera}>Reset camera</button></div>
      <RoomSettings previewAvailable={!display2d} draft={style} onPreview={setPreview} onApply={applyRoom} onCancel={() => setPreview(null)} />
      <label className="menu-row">Display<select aria-label="Table display" value={display2d ? "2d" : "3d"} onChange={(e) => { setRendererError(undefined); change({ display: e.target.value as "2d" | "3d" }); }}><option value="3d">3D room</option><option value="2d">2D table</option></select></label>
      <label className="menu-row">Graphics quality<select aria-label="Graphics quality" value={preferences.quality} onChange={(e) => change({ quality: e.target.value as Quality })}>{["auto", "low", "medium", "high"].map((q) => <option key={q}>{q}</option>)}</select></label>
      <label className="menu-row">NPC pace<select aria-label="NPC pace" value={controller.pacing} onChange={(e) => controller.setPacing(e.target.value as "instant" | "normal" | "relaxed")}>{["instant", "normal", "relaxed"].map((p) => <option key={p}>{p}</option>)}</select></label>
      <label className="menu-row">Character dialogue<input aria-label="Character dialogue" type="checkbox" checked={v4.dialogue} onChange={(e) => changeV4({ dialogue: e.target.checked })} /></label>
      <label className="menu-row">Camera emphasis<input type="checkbox" checked={preferences.cinematic} onChange={(e) => change({ cinematic: e.target.checked })} /></label>
      <div className="camera-menu" aria-label="Camera adjustment"><button className="hud-button" aria-label="Look left" onClick={() => setLook((v) => boundLook({ ...v, yaw: v.yaw - .04 }))}>←</button><button className="hud-button" aria-label="Look right" onClick={() => setLook((v) => boundLook({ ...v, yaw: v.yaw + .04 }))}>→</button><button className="hud-button" aria-label="Look up" onClick={() => setLook((v) => boundLook({ ...v, pitch: v.pitch + .03 }))}>↑</button><button className="hud-button" aria-label="Look down" onClick={() => setLook((v) => boundLook({ ...v, pitch: v.pitch - .03 }))}>↓</button><button className="hud-button" aria-label="Zoom in" onClick={() => setLook((v) => boundLook({ ...v, zoom: v.zoom - .025 }))}>+</button><button className="hud-button" aria-label="Zoom out" onClick={() => setLook((v) => boundLook({ ...v, zoom: v.zoom + .025 }))}>−</button></div>
      <div className="audio-title"><h3>Room audio</h3><button className="hud-button" onClick={() => void sound()}>{!audioEnabled || preferences.muted ? "Enable audio" : "Mute audio"}</button></div>
      {(["master", "music", "effects", "ambient"] as const).map((key) => <label className="menu-row" key={key}>{key}<input aria-label={`${key} volume`} type="range" min="0" max="1" step=".01" value={preferences[key]} onChange={(e) => change({ [key]: Number(e.target.value) })} /><output>{Math.round(preferences[key] * 100)}%</output></label>)}
      <label className="menu-row">Character audio<input aria-label="Character audio volume" type="range" min="0" max="1" step=".01" value={room.characterAudio} onChange={(e) => applyRoom({ ...room, characterAudio: Number(e.target.value) })} /><output>{Math.round(room.characterAudio * 100)}%</output></label>
      <p className="menu-caption">Drag the room to look around. Scroll to zoom. Escape opens this menu. Motion follows your accessibility preferences.</p>
      <button className="secondary-button" onClick={learn}><BookOpen size={16} /> Return to Learn</button>
    </Modal>}
    {history && <Modal title="Hand history" onClose={() => setHistory(false)}>{view ? <><details><summary>Current hand actions</summary><ActionLog actions={view.actions} names={names} /></details><HandHistory history={view.history} names={names} onReplay={openReplay} /></> : <p>Your completed hands will appear here.</p>}</Modal>}
  </div>;
}
