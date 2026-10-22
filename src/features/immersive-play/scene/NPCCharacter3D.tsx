import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import type { Group } from "three";
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
export default function NPCCharacter3D({ index, position, yaw, gesture, motion, dealer = false }: {
  index: number; position: Point; yaw: number; gesture: Gesture; motion: boolean; dealer?: boolean;
}) {
  const body = useRef<Group>(null), head = useRef<Group>(null), hands = useRef<Group>(null);
  const p = appearances[index % appearances.length];
  useFrame(({ clock }) => {
    if (!body.current || !head.current || !hands.current) return;
    const t = clock.elapsedTime, phase = index * 1.73;
    const active = ["THINKING", "ACTING", "CALLING", "RAISING", "ALL_IN", "CHECKING"].includes(gesture);
    const amplitude = motion ? 1 : 0;
    body.current.rotation.x = (gesture === "ELIMINATED" ? .16 : active ? .07 : .015) + Math.sin(t * .9 + phase) * .012 * amplitude;
    head.current.rotation.y = Math.sin(t * .38 + phase) * .055 * amplitude;
    head.current.rotation.x = (gesture === "THINKING" || gesture === "FOLDING" ? .15 : 0) + Math.sin(t * .6 + phase) * .02 * amplitude;
    hands.current.position.z = active ? Math.sin(t * (gesture === "CHECKING" ? 5 : 1.8) + phase) * .065 * amplitude : 0;
    hands.current.position.y = gesture === "ALL_IN" ? .065 : gesture === "SHOWDOWN" ? .025 : 0;
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
          <mesh position={[side * .091, .025, .215]}><sphereGeometry args={[.038, 6, 5]} /><meshStandardMaterial color="#e8decb" /></mesh>
          <mesh position={[side * .091, .023, .247]}><sphereGeometry args={[.018, 6, 5]} /><meshStandardMaterial color="#282421" /></mesh>
          <mesh position={[side * .09, .094, .217]} rotation={[0, 0, side * -.08]}><boxGeometry args={[.095, .018, .018]} /><meshStandardMaterial color={p.hair} /></mesh>
        </group>)}
        <mesh position={[0, -.025, .252]} rotation={[Math.PI / 2, 0, 0]}><coneGeometry args={[.055, .14, 5]} /><meshStandardMaterial color={p.skin} flatShading /></mesh>
        <mesh position={[0, -.14, .205]}><boxGeometry args={[.11, .017, .012]} /><meshStandardMaterial color="#754837" /></mesh>
        {index === 2 && <mesh position={[0, -.16, .13]} scale={[1, .65, .9]}><sphereGeometry args={[.2, 8, 5]} /><meshStandardMaterial color={p.hair} flatShading /></mesh>}
        {index === 3 && [-.09, .09].map((x) => <mesh key={x} position={[x, .027, .26]}><torusGeometry args={[.06, .012, 4, 12]} /><meshStandardMaterial color="#b19a6a" metalness={.6} /></mesh>)}
        {index === 4 && <mesh position={[0, .21, -.01]}><cylinderGeometry args={[.28, .29, .12, 10]} /><meshStandardMaterial color="#4d4841" /></mesh>}
      </group>
      <group ref={hands}>
        {[-1, 1].map((side) => <group key={side}>
          <Limb start={[side * .31, .66, 0]} end={[side * .43, .18, .28]} color={dealer ? "#e4d9bd" : p.shirt} />
          <Limb start={[side * .43, .18, .28]} end={[side * .23, .13, .7]} color={p.skin} radius={.074} />
          <mesh position={[side * .21, .13, .74]} rotation={[-.12, 0, side * .2]} castShadow><boxGeometry args={[.15, .09, .22]} /><meshStandardMaterial color={p.skin} flatShading /></mesh>
        </group>)}
      </group>
      {dealer && <mesh position={[0, .7, .26]}><boxGeometry args={[.16, .07, .05]} /><meshStandardMaterial color="#a27b44" /></mesh>}
    </group>
  </group>;
}
