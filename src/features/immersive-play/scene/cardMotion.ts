import { useEffect, useRef, type RefObject } from "react";
import { useFrame } from "@react-three/fiber";
import type { Group } from "three";
import type { CardFlight, Cue } from "../../night-room/choreography";
import { DECK_ANCHOR, type Point } from "../presentation";

interface CardMotion {
  surface?: RefObject<Group | null>; tilt?: number; angle?: number;
  flight?: CardFlight; collect?: Cue; priority?: boolean;
  faceKey: string | null; position: Point; folded: boolean; motion: boolean; deal: boolean;
}
function setVisible(group: Group, visible: boolean) { group.visible = visible; }

/** Placement and reveal rotation have separate owners; React never reapplies an animated Euler. */
export function useCardMotion(placement: RefObject<Group | null>, face: RefObject<Group | null>, options: CardMotion) {
  const { faceKey, position, folded, motion, deal } = options;
  const previousFace = useRef(faceKey);
  const flight = useRef(options.flight);
  useEffect(() => {
    options.surface?.current?.rotation.set(-Math.PI/2+(options.tilt??0),0,options.angle??0);
    if (!motion || options.priority) flight.current = undefined;
    placement.current?.position.set(...(deal && motion && !options.priority ? DECK_ANCHOR : position));
    if (face.current) face.current.rotation.set(0, deal && motion && !options.priority && faceKey !== null ? Math.PI : 0, 0);
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
    const surface=options.surface?.current, orientationAlpha=motion?1-Math.exp(-Math.min(delta,.08)*10):1;
    if(surface)surface.rotation.set(surface.rotation.x+(-Math.PI/2+(options.tilt??0)-surface.rotation.x)*orientationAlpha,0,surface.rotation.z+((options.angle??0)-surface.rotation.z)*orientationAlpha);
    if (!motion) flight.current = undefined;
    if (options.priority && flight.current) { flight.current = undefined; p.position.set(...position); f.rotation.set(0,0,0); }
    const trip = flight.current;
    const age = trip ? (performance.now() - trip.at) / 1000 - trip.delay : Infinity;
    setVisible(p, !motion || age >= 0);
    const gathering = options.collect && motion ? (performance.now() - options.collect.at) / (options.collect.duration * 1000) : -1;
    if (gathering >= 1) { setVisible(p, false); return; }
    if (trip && motion && age < trip.duration && !folded && gathering < 0) {
      const u = Math.max(0, Math.min(1, age / trip.duration)), ease = u * u * (3 - 2 * u);
      p.position.set(trip.from[0] + (position[0] - trip.from[0]) * ease, trip.from[1] + (position[1] - trip.from[1]) * ease + Math.sin(u * Math.PI) * .1, trip.from[2] + (position[2] - trip.from[2]) * ease);
      f.rotation.set(0, faceKey ? Math.PI * (1 - ease) : 0, 0); return;
    }
    const target: Point = gathering >= 0 ? [-.55, .19, -1.65] : folded ? [-.55, .19, -1.65] : position;
    if (!motion) { p.position.set(...target); f.rotation.set(0,0,0); return; }
    const alpha = 1 - Math.exp(-Math.min(delta, .08) * 10);
    p.position.set(p.position.x + (target[0] - p.position.x) * alpha,
      p.position.y + (target[1] - p.position.y) * alpha,
      p.position.z + (target[2] - p.position.z) * alpha);
    f.rotation.set(0, f.rotation.y * (1 - alpha), 0);
  });
}
