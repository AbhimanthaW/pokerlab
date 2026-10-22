import { useEffect, useRef, type RefObject } from "react";
import { useFrame } from "@react-three/fiber";
import type { Group } from "three";
import { DECK_ANCHOR, type Point } from "../presentation";

interface CardMotion {
  faceKey: string | null; position: Point; folded: boolean; motion: boolean; deal: boolean;
}
/** Placement and reveal rotation have separate owners; React never reapplies an animated Euler. */
export function useCardMotion(placement: RefObject<Group | null>, face: RefObject<Group | null>, options: CardMotion) {
  const { faceKey, position, folded, motion, deal } = options;
  const previousFace = useRef(faceKey);
  useEffect(() => {
    placement.current?.position.set(...(deal && motion ? DECK_ANCHOR : position));
    if (face.current) face.current.rotation.set(0, deal && motion && faceKey !== null ? Math.PI : 0, 0);
    // Mount is a new physical card. Later target changes are handled by the frame loop.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    const reveal = previousFace.current === null && faceKey !== null;
    previousFace.current = faceKey;
    if (reveal && motion && face.current) face.current.rotation.set(0, Math.PI, 0);
  }, [faceKey, motion, face]);
  useFrame((_, delta) => {
    const p = placement.current, f = face.current;
    if (!p || !f) return;
    const target: Point = folded ? [-.55, .19, -1.65] : position;
    const alpha = motion ? 1 - Math.exp(-Math.min(delta, .08) * 10) : 1;
    p.position.set(p.position.x + (target[0] - p.position.x) * alpha,
      p.position.y + (target[1] - p.position.y) * alpha,
      p.position.z + (target[2] - p.position.z) * alpha);
    f.rotation.set(0, f.rotation.y * (1 - alpha), 0);
  });
}
