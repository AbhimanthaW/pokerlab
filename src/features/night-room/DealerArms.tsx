import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { MathUtils, Vector3, type Group, type Mesh } from "three";
import { activeDealerCue, type Cue } from "./choreography";
import HandModel from "./HandModel";
function Arm({ side, cues, motion, skin }: { side: number; cues: Cue[]; motion: boolean; skin: string }) {
  const upper = useRef<Mesh>(null), lower = useRef<Mesh>(null), hand = useRef<Group>(null);
  const vectors = useMemo(() => ({ shoulder: new Vector3(side*.31,.66,0), elbow: new Vector3(), wrist: new Vector3(), direction: new Vector3(), up: new Vector3(0,1,0) }), [side]);
  useFrame((_, delta) => {
    const cue = activeDealerCue(cues, performance.now(), motion), wave = Math.sin(cue.progress * Math.PI);
    let x = side * .22, y = .18, z = .86;
    if (cue.pose === "SHUFFLING") { x = side * (.1 + Math.sin(cue.progress * Math.PI * 6) * .045); y = .32; z = .77; }
    else if (["DEALING_PRIVATE","DEALING_FLOP","DEALING_TURN","DEALING_RIVER"].includes(cue.pose)) { x = side === 1 ? .15 + Math.sin(cue.progress * Math.PI * 8) * .1 : -.04; z = side === 1 ? 1 + wave * .07 : .83; y = .18 + wave * .025; }
    else if (cue.pose === "BURNING_CARD") { x = side === 1 ? .15 - .35 * wave : -.22; z = side === 1 ? .96 : .86; }
    else if (cue.pose === "AWARDING_POT") { x = side * (.22 + wave * .22); y += .12 * wave; z += .12 * wave; }
    else if (cue.pose === "COLLECTING_CARDS") { x = side * (.22 + wave * .25); z += .18 * wave; }
    else if (cue.pose === "SHOWDOWN_PRESENTATION" || cue.pose === "SESSION_COMPLETE") { y += .18 * wave; x += side * .1 * wave; }
    const { shoulder, elbow, wrist, direction, up } = vectors;
    if (!hand.current) return;
    const a = motion ? 1 - Math.exp(-Math.min(delta,.08)*18) : 1;
    hand.current.position.set(MathUtils.lerp(hand.current.position.x,x,a),MathUtils.lerp(hand.current.position.y,y,a),MathUtils.lerp(hand.current.position.z,z,a));
    wrist.copy(hand.current.position); elbow.set(side*.43,Math.max(.28,wrist.y+.1),wrist.z*.45);
    for (const [mesh, start, end] of [[upper.current,shoulder,elbow],[lower.current,elbow,wrist]] as const) if (mesh) { direction.subVectors(end,start); mesh.position.copy(start).addScaledVector(direction,.5); mesh.scale.set(.13,direction.length(),.13); mesh.quaternion.setFromUnitVectors(up,direction.normalize()); }
  });
  return <group><mesh ref={upper} castShadow><boxGeometry /><meshStandardMaterial color="#e4d9bd" roughness={1} /></mesh><mesh ref={lower} castShadow><boxGeometry /><meshStandardMaterial color={skin} roughness={.88} /></mesh><group ref={hand} position={[side*.22,.18,.86]} rotation={[0,Math.PI,0]}><HandModel skin={skin} sleeve="#e4d9bd" side={side} forearm={false} /></group></group>;
}
export default function DealerArms(props: { cues: Cue[]; motion: boolean; skin: string }) { return <group><Arm side={-1} {...props} /><Arm side={1} {...props} /></group>; }
