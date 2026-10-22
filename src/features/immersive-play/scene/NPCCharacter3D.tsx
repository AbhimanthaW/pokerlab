import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { MathUtils, type Mesh, type Group } from "three";
import { activeDealerCue, type Cue } from "../../night-room/choreography";
import DealerArms from "../../night-room/DealerArms";
import { characterPose } from "../../living-npcs/behavior";
import type { Personality } from "../../../domain/play/types";
import type { Gesture, Point } from "../presentation";

const appearances = [
  { skin: "#b97954", shirt: "#295d60", hair: "#201b1b", vest: "#163b3f" },
  { skin: "#dfb68e", shirt: "#a15a45", hair: "#403028", vest: "#503b37" },
  { skin: "#986342", shirt: "#c9b78f", hair: "#16191d", vest: "#343e53" },
  { skin: "#d59c78", shirt: "#5d6584", hair: "#b5a081", vest: "#303748" },
  { skin: "#c69464", shirt: "#6d8064", hair: "#292225", vest: "#333e2d" },
];
function Limb({ start, end, color, radius = .095 }: { start: Point; end: Point; color: string; radius?: number }) {
  const dx = end[0] - start[0], dy = end[1] - start[1], dz = end[2] - start[2];
  const length = Math.hypot(dx, dy, dz);
  return <mesh position={[(start[0] + end[0]) / 2, (start[1] + end[1]) / 2, (start[2] + end[2]) / 2]}
    rotation={[Math.atan2(dz, dy), 0, -Math.atan2(dx, Math.hypot(dy, dz))]} castShadow>
    <cylinderGeometry args={[radius * .85, radius, length, 7]} /><meshStandardMaterial color={color} flatShading />
  </mesh>;
}
export default function NPCCharacter3D({ index, position, yaw, gesture, motion, dealer = false, personality = "analytical", variation = .5, cues = [], gaze = 0, dealerGaze = 0, celebrated = false }: {
  cues?: Cue[]; gaze?: number; dealerGaze?: number; celebrated?: boolean;
  personality?: Personality; variation?: number;
  index: number; position: Point; yaw: number; gesture: Gesture; motion: boolean; dealer?: boolean;
}) {
  const body = useRef<Group>(null), head = useRef<Group>(null), hands = useRef<Group>(null);
  const eyes = useRef<Group>(null), pupils = useRef<Group>(null);
  const brow = useRef<Group>(null), mouth = useRef<Mesh>(null);
  const timing = useRef({ gesture, time: 0 });
  const p = appearances[index % appearances.length];
  useFrame((_, delta) => {
    if (!body.current || !head.current || !hands.current) return;
    if (timing.current.gesture !== gesture) timing.current = { gesture, time: 0 };
    timing.current.time += Math.min(delta, .08);
    const cue = activeDealerCue(cues, performance.now(), motion);
    const watchingDealer = ["PREPARING_DECK", "SHUFFLING", "DEALING_PRIVATE"].includes(cue.pose);
    const pose = characterPose(personality, gesture, timing.current.time, variation, motion, celebrated ? "win" : "none");
    const a = motion ? 1 - Math.exp(-Math.min(delta, .08) * 8) : 1;
    body.current.rotation.x = MathUtils.lerp(body.current.rotation.x, pose.body + (celebrated ? -.025 : 0), a);
    head.current.rotation.x = MathUtils.lerp(head.current.rotation.x, pose.headX, a);
    head.current.rotation.y = MathUtils.lerp(head.current.rotation.y, Math.max(-.42, Math.min(.42, pose.headY + (watchingDealer ? dealerGaze : gaze) * (motion ? .7 : .3))), a);
    hands.current.position.z = MathUtils.lerp(hands.current.position.z, dealer ? 0 : pose.handZ, a);
    hands.current.position.y = MathUtils.lerp(hands.current.position.y, dealer ? 0 : pose.handY, a);
    if (eyes.current) { const cycle = (performance.now()/1000 + variation*7) % (4 + variation*3); const blink = motion && cycle < .13 ? 1-Math.sin(cycle/.13*Math.PI)*.88 : 1; eyes.current.scale.y = MathUtils.lerp(eyes.current.scale.y,blink,a); }
    if (pupils.current) pupils.current.position.x = MathUtils.lerp(pupils.current.position.x,gaze*.018,a);
    if (brow.current) brow.current.position.y = MathUtils.lerp(brow.current.position.y, pose.brow, a);
    if (mouth.current) mouth.current.scale.y = MathUtils.lerp(mouth.current.scale.y, celebrated ? .55 : pose.mouth, a);
  });
  return <group position={position} rotation={[0, yaw, 0]}>
    <mesh position={[0, -.47, -.14]} castShadow><boxGeometry args={[.68, .16, .62]} /><meshStandardMaterial color="#49342d" /></mesh>
    <mesh position={[0, -.05, -.43]} rotation={[-.08, 0, 0]} castShadow><boxGeometry args={[.68, 1.05, .12]} /><meshStandardMaterial color="#56443b" /></mesh>
    {[-.24, .24].map((x) => <Limb key={x} start={[x, -.5, -.1]} end={[x, -1.1, -.12]} color="#211e22" radius={.045} />)}
    <Limb start={[-.18, -.38, .06]} end={[-.2, -.75, .42]} color="#292b35" radius={.13} />
    <Limb start={[.18, -.38, .06]} end={[.2, -.75, .42]} color="#292b35" radius={.13} />
    <group ref={body} position={[0, -.1, 0]}>
      <mesh position={[0, .36, 0]} scale={[1.15, 1, .72]} castShadow>
        <cylinderGeometry args={[.28, .36, .82, 8]} /><meshStandardMaterial color={dealer ? "#e4d9bd" : p.shirt} flatShading />
      </mesh>
      <mesh position={[0, .37, .21]} castShadow><boxGeometry args={[.4, .65, .09]} /><meshStandardMaterial color={dealer ? "#303945" : p.vest} /></mesh>
      {[.14, .3, .46, .62].map((y) => <mesh key={y} position={[0, y, .27]}><sphereGeometry args={[.018, 5, 4]} /><meshStandardMaterial color="#c1a66c" metalness={.5} roughness={.4} /></mesh>)}
      <mesh position={[0, .84, 0]}><cylinderGeometry args={[.105, .12, .2, 7]} /><meshStandardMaterial color={p.skin} /></mesh>
      <group ref={head} position={[0, 1.11, 0]}>
        <mesh scale={[index === 1 ? .95 : 1, 1.18, .88]} castShadow>
          <sphereGeometry args={[.26, 9, 7]} /><meshStandardMaterial color={p.skin} flatShading roughness={.85} />
        </mesh>
        <mesh position={[0, .13, -.035]} scale={[1.05, .68, .95]} castShadow><sphereGeometry args={[.27, 9, 6]} /><meshStandardMaterial color={p.hair} flatShading /></mesh>
        {[-1, 1].map((side) => <group key={side}>
          <mesh position={[side * .25, -.01, 0]}><sphereGeometry args={[.06, 6, 5]} /><meshStandardMaterial color={p.skin} /></mesh>



        </group>)}
        <group ref={eyes} position={[0,.025,.215]}>{[-1,1].map((side) => <mesh key={side} position={[side*.091,0,0]}><sphereGeometry args={[.038,6,5]} /><meshStandardMaterial color="#e8decb" /></mesh>)}<group ref={pupils}>{[-1,1].map((side) => <mesh key={side} position={[side*.091,-.002,.032]}><sphereGeometry args={[.018,6,5]} /><meshStandardMaterial color="#282421" /></mesh>)}</group></group>
        <group ref={brow}>{[-1, 1].map((side) => <mesh key={side} position={[side * .09, .094, .217]} rotation={[0, 0, side * -.08]}><boxGeometry args={[.095, .018, .018]} /><meshStandardMaterial color={p.hair} /></mesh>)}</group>
        <mesh position={[0, -.025, .252]} rotation={[Math.PI / 2, 0, 0]}><coneGeometry args={[.055, .14, 5]} /><meshStandardMaterial color={p.skin} flatShading /></mesh>
        <mesh ref={mouth} position={[0, -.14, .205]}><boxGeometry args={[.11, .017, .012]} /><meshStandardMaterial color="#754837" /></mesh>
        {index === 2 && <mesh position={[0, -.16, .13]} scale={[1, .65, .9]}><sphereGeometry args={[.2, 8, 5]} /><meshStandardMaterial color={p.hair} flatShading /></mesh>}
        {index === 3 && [-.09, .09].map((x) => <mesh key={x} position={[x, .027, .26]}><torusGeometry args={[.06, .012, 4, 12]} /><meshStandardMaterial color="#b19a6a" metalness={.6} /></mesh>)}
        {index === 4 && <mesh position={[0, .21, -.01]}><cylinderGeometry args={[.28, .29, .12, 10]} /><meshStandardMaterial color="#4d4841" /></mesh>}
      </group>
      <group ref={hands}>
        {dealer ? <DealerArms cues={cues} motion={motion} skin={p.skin} /> : [-1, 1].map((side) => <group key={side}>
          <Limb start={[side * .31, .66, 0]} end={[side * .43, .18, .28]} color={dealer ? "#e4d9bd" : p.shirt} />
          <Limb start={[side * .43, .18, .28]} end={[side * .23, .13, .7]} color={p.skin} radius={.074} />
          <mesh position={[side * .21, .13, .74]} rotation={[-.12, 0, side * .2]} castShadow><boxGeometry args={[.15, .09, .22]} /><meshStandardMaterial color={p.skin} flatShading /></mesh>
        </group>)}
      </group>
      {dealer && <mesh position={[0, .7, .26]}><boxGeometry args={[.16, .07, .05]} /><meshStandardMaterial color="#a27b44" /></mesh>}
    </group>
  </group>;
}
