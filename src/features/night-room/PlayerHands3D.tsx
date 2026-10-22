import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { MathUtils, type Group } from "three";
import type { VisualEvent } from "../immersive-play/presentation";
import { playerPose } from "./choreography";
import HandModel from "./HandModel";
import { SKINS, SLEEVES, type RoomPreferences } from "./preferences";
const SIDES = [-1,1] as const;
export default function PlayerHands3D({ preferences, events, motion, inspect }: { preferences: RoomPreferences; events: VisualEvent[]; motion: boolean; inspect: boolean }) {
  const left = useRef<Group>(null), right = useRef<Group>(null);
  useFrame((_, delta) => {
    const now = performance.now(), state = playerPose(events, now, inspect, motion), a = motion ? 1 - Math.exp(-Math.min(delta,.08) * 12) : 1;
    for (const side of SIDES) {
      const g = side < 0 ? left.current : right.current; if (!g) continue;
      const performing = side === 1 || state.pose === "ALL_IN" || state.pose === "CHECK_CARDS";
      const n = performing ? state.amount : 0;
      let x = side * .72, y = .19, z = 2.02;
      if (state.pose === "CHECK_CARDS") { x = side * .4; y += .32; z -= .24; }
      else if (["CALL","BET","RAISE","ALL_IN"].includes(state.pose)) { x += side * .08 * n; z -= (state.pose === "ALL_IN" ? .55 : .28) * n; y += .07 * n; }
      else if (state.pose === "FOLD" || state.pose === "SHOWDOWN") { x -= side * .3 * n; z -= .38 * n; y += .08 * n; }
      else if (state.pose === "CHECK") y += .055 * n;
      const idle = motion ? Math.sin(now * .00065 + side * 2.4) * .0025 : 0;
      g.position.set(MathUtils.lerp(g.position.x,x,a),MathUtils.lerp(g.position.y,y + idle,a),MathUtils.lerp(g.position.z,z,a));
      g.rotation.set(.025 + (state.pose === "CHECK_CARDS" ? -.15 : .04 * n),side * -.12,side * -.025);
    }
  });
  if (!preferences.hands) return null;
  return <group><group ref={left} position={[-.72,.19,2.02]}><HandModel scale={1.4} skin={SKINS[preferences.skin]} sleeve={SLEEVES[preferences.sleeve]} side={-1} /></group><group ref={right} position={[.72,.19,2.02]}><HandModel scale={1.4} skin={SKINS[preferences.skin]} sleeve={SLEEVES[preferences.sleeve]} /></group></group>;
}
