import { useRef } from "react";
import { Group } from "three";
import type { Card } from "../../../domain/types";
import type { Point } from "../presentation";
import { useCardMotion } from "./cardMotion";
import { useCardTexture } from "./cardTexture";

export default function Card3D({ card, position, angle = 0, tilt = 0, folded = false, motion, deal, fourColor, scale = 1 }: {
  card: Card | null; position: Point; angle?: number; tilt?: number; folded?: boolean;
  motion: boolean; deal: boolean; fourColor: boolean; scale?: number;
}) {
  const placement = useRef<Group>(null), face = useRef<Group>(null);
  const texture = useCardTexture(card, folded, fourColor);
  useCardMotion(placement, face, { faceKey: folded ? null : card?.id ?? null, position, folded, motion, deal });
  return <group ref={placement}>
    <group rotation={[-Math.PI / 2 + tilt, 0, angle]} scale={scale}>
      <group ref={face}>
        <mesh castShadow receiveShadow><boxGeometry args={[.47, .68, .016]} /><meshStandardMaterial color="#dfd4b8" roughness={.72} /></mesh>
        <mesh position={[0, 0, .009]}><planeGeometry args={[.458, .668]} /><meshStandardMaterial map={texture} roughness={.8} /></mesh>
        <mesh position={[0, 0, -.009]} rotation={[0, Math.PI, 0]}><planeGeometry args={[.458, .668]} /><meshStandardMaterial color="#18343d" /></mesh>
      </group>
    </group>
  </group>;
}
