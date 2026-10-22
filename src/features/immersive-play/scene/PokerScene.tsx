import { useEffect, useMemo, useRef, useSyncExternalStore } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import { Group, MathUtils, PerspectiveCamera, Vector3 } from "three";
import type { CameraLook, Point, Quality, SceneSnapshot, VisualEvent } from "../presentation";
import { CAMERA_RIG, POT_ANCHOR, qualityConfig, seatAnchor } from "../presentation";
import PokerRoom, { PokerTable3D } from "./PokerRoom";
import Card3D from "./Card3D";
import ChipStack3D from "./ChipStack3D";
import NPCCharacter3D from "./NPCCharacter3D";

export interface PokerSceneProps {
  snapshot: SceneSnapshot | null; events: VisualEvent[]; quality: Quality; motion: boolean;
  cinematic: boolean; active: boolean; look: CameraLook; fourColor: boolean;
  onFailure: (message: string) => void; onMetrics?: (fps: number, calls: number, triangles: number) => void;
}
function CameraDirector({ look, motion, cinematic, snapshot }: Pick<PokerSceneProps, "look" | "motion" | "cinematic" | "snapshot">) {
  const { size } = useThree();
  const target = useMemo(() => new Vector3(), []);
  useFrame(({ camera }, delta) => {
    if (!(camera instanceof PerspectiveCamera)) return;
    const mobile = size.width < 760 || size.width / size.height < 1.05;
    const emphasis = cinematic && motion && snapshot?.status !== "hand_in_progress" ? -.035 : 0;
    const rig = mobile ? CAMERA_RIG.portrait : CAMERA_RIG.desktop;
    const z = rig.distance * look.zoom;
    const alpha = motion ? 1 - Math.exp(-Math.min(delta, .08) * 7) : 1;
    const y = rig.height;
    camera.position.lerp(target.set(0, y, z), alpha);
    if (camera.fov !== rig.fov) {
      camera.fov = rig.fov;
      camera.updateProjectionMatrix();
    }
    const actor = snapshot?.seats.find((s) => s.id === snapshot.actor);
    const actorX = cinematic && motion && actor && actor.index > 0 ? seatAnchor(actor.index, snapshot!.seats.length - 1)[0] * .035 : 0;
    camera.lookAt(Math.sin(look.yaw) * 4 + actorX, .05 + look.pitch * 7 + emphasis, CAMERA_RIG.lookAtZ);
  });
  return null;
}
function RendererLifecycle({ onFailure, onMetrics }: Pick<PokerSceneProps, "onFailure" | "onMetrics">) {
  const { gl } = useThree();
  const sample = useRef({ elapsed: 0, frames: 0 });
  useEffect(() => {
    const canvas = gl.domElement;
    const lost = (e: Event) => { e.preventDefault(); onFailure("The 3D context was lost. Your hand is preserved in 2D."); };
    canvas.addEventListener("webglcontextlost", lost);
    return () => canvas.removeEventListener("webglcontextlost", lost);
  }, [gl, onFailure]);
  useFrame((_, delta) => {
    const s = sample.current; s.elapsed += delta; s.frames++;
    if (s.elapsed >= 3) { onMetrics?.(s.frames / s.elapsed, gl.info.render.calls, gl.info.render.triangles); s.elapsed = 0; s.frames = 0; }
  });
  return null;
}
function AwardFlight({ event, snapshot, motion }: { event: VisualEvent; snapshot: SceneSnapshot; motion: boolean }) {
  const group = useRef<Group>(null);
  const seat = snapshot.seats.find((s) => s.id === event.playerId);
  const destination = seatAnchor(seat?.index ?? 0, snapshot.seats.length - 1);
  useFrame(() => {
    const g = group.current; if (!g) return;
    const progress = MathUtils.clamp((performance.now() - event.at) / 950, 0, 1);
    g.visible = motion && progress < 1;
    g.position.set(destination[0] * .75 * progress, .22 + Math.sin(progress * Math.PI) * .25, POT_ANCHOR[2] + (destination[2] * .7 - POT_ANCHOR[2]) * progress);
  });
  return <group ref={group}><mesh><cylinderGeometry args={[.13, .13, .13, 12]} /><meshStandardMaterial color="#e4c789" metalness={.2} roughness={.5} /></mesh></group>;
}
function TableContents({ snapshot, events, motion, fourColor }: Pick<PokerSceneProps, "snapshot" | "events" | "motion" | "fourColor">) {
  const { size } = useThree();
  const mobile = size.width < 760 || size.width / size.height < 1.05;
  const opponents = snapshot ? snapshot.seats.length - 1 : 3;
  const fresh = events.some((e) => e.kind === "DEAL");
  const seats = snapshot?.seats ?? Array.from({ length: 4 }, (_, i) => ({
    id: i ? `preview-${i}` : "you", index: i, name: ["You", "Alex", "Morgan", "Sam"][i],
    stack: 1000, committed: 0, cards: [], folded: false, eliminated: false,
    personality: "analytical" as const, variation: .5, gesture: "IDLE" as const, dealer: false, blind: null, lastAction: "",
  }));
  return <group scale={[mobile ? .57 : 1, 1, 1]}>
    <PokerTable3D segments={mobile ? 12 : 24} />
    <NPCCharacter3D index={3} position={[.5, .1, -3.45]} yaw={0} gesture={fresh ? "ACTING" : "IDLE"} motion={motion} dealer />
    <Html center position={[.5, 1.85, -3.45]} zIndexRange={[22, 10]}><span className="dealer-label">POKERLAB · DEALER</span></Html>
    {seats.map((seat) => {
      const anchor = seatAnchor(seat.index, opponents);
      const cardBase: Point = seat.index === 0 ? [0, .22, 1.7] : [anchor[0] * .68, .08, anchor[2] * .66];
      const stack: Point = [anchor[0] * .77 + (seat.index ? .3 : .9), .08, anchor[2] * .72];
      return <group key={seat.id}>
        {seat.index > 0 && <>
          <NPCCharacter3D index={seat.index - 1} position={anchor} yaw={Math.atan2(-anchor[0], -anchor[2])}
            gesture={seat.gesture} personality={seat.personality} variation={seat.variation} motion={motion && !seat.eliminated} />
          <Html center position={[anchor[0] * .84, .78 + (seat.index % 2) * .04, anchor[2] * .98]} zIndexRange={[26, 12]}>
            <div className={`npc-label ${snapshot?.actor === seat.id ? "actor" : ""} ${seat.eliminated ? "out" : ""}`}>
              <strong>{seat.name} {seat.dealer ? "· D" : ""} {seat.blind ? `· ${seat.blind}` : ""}</strong>
              <span>{seat.eliminated ? "Eliminated" : `${seat.stack.toLocaleString()} chips`}</span>
              {seat.folded && !seat.eliminated && <small>Folded</small>}
              {!seat.folded && !seat.eliminated && seat.stack === 0 && <small>All-in</small>}
            </div>
          </Html>
        </>}
        <ChipStack3D amount={seat.stack} position={stack} motion={motion} />
        <ChipStack3D amount={seat.committed} position={[anchor[0] * .48, .08, anchor[2] * .48]}
          from={stack} motion={motion} />
        {seat.dealer && <group position={[anchor[0] * .83 - .35, .1, anchor[2] * .76]}>
          <mesh><cylinderGeometry args={[.13, .13, .04, 16]} /><meshStandardMaterial color="#f4e2b3" /></mesh>
          <Html center position={[0, .05, 0]} zIndexRange={[17, 8]}><span className="button-letter">D</span></Html>
        </group>}
        {seat.cards.map((card, i) => <Card3D key={`${snapshot?.hand}-${i}`} card={card} folded={seat.folded}
          position={[cardBase[0] + (i - .5) * .53, cardBase[1] + i * .004, cardBase[2]]}
          angle={seat.index === 0 ? (i - .5) * -.12 : -Math.atan2(anchor[0], anchor[2])}
          tilt={seat.index === 0 ? .48 : 0} motion={motion} deal={fresh} fourColor={fourColor} />)}
      </group>;
    })}
    {snapshot?.board.map((card, i) => <Card3D key={`${snapshot.hand}-board-${i}`} card={card}
      position={[(i - 2) * .65, .235, .05]} tilt={.5} scale={1.22} motion={motion} deal={events.some((e) => e.kind === "BOARD")}
      fourColor={fourColor} />)}
    <ChipStack3D amount={snapshot ? Math.max(0, snapshot.pot - snapshot.seats.reduce((n, s) => n + s.committed, 0)) : 0} position={POT_ANCHOR} motion={motion} />
    {snapshot && events.filter((e) => e.kind === "AWARD").map((e) => <AwardFlight key={e.id} event={e} snapshot={snapshot} motion={motion} />)}
  </group>;
}
function SceneRoot(props: PokerSceneProps) {
  const { size } = useThree();
  const quality = qualityConfig(props.quality, size.width, navigator.hardwareConcurrency);
  return <>
    <PokerRoom high={quality.detail} />
    <TableContents {...props} />
    <CameraDirector {...props} />
    <RendererLifecycle onFailure={props.onFailure} onMetrics={props.onMetrics} />
  </>;
}
export default function PokerScene(props: PokerSceneProps) {
  const width = useSyncExternalStore(subscribeResize, readWidth);
  const quality = qualityConfig(props.quality, width, navigator.hardwareConcurrency);
  return <Canvas className="poker-canvas" camera={{ position: [0, CAMERA_RIG.desktop.height, CAMERA_RIG.desktop.distance], fov: CAMERA_RIG.desktop.fov, near: CAMERA_RIG.near, far: CAMERA_RIG.far }}
    dpr={quality.dpr} shadows={quality.shadows} frameloop={props.active ? props.motion ? "always" : "demand" : "never"}
    gl={{ antialias: quality.resolved !== "low", alpha: false, powerPreference: "high-performance" }}
    fallback={<p>3D canvas is unavailable. Choose the 2D table from settings to continue.</p>}>
    <SceneRoot {...props} />
  </Canvas>;
}
const readWidth = () => window.innerWidth;
function subscribeResize(listener: () => void) {
  window.addEventListener("resize", listener);
  return () => window.removeEventListener("resize", listener);
}
