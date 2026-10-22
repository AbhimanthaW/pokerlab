import { useEffect, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Color, Group, InstancedMesh, Object3D } from "three";
import type { Point } from "../presentation";
import type { RoomPreferences } from "../../night-room/preferences";
const palettes = { classic: ["#e6d8b2","#913f44","#377078","#b1904f"], ivory: ["#f0e3c3","#516b7b","#8d644d","#aaa58b"], slate: ["#97a7bc","#5c445f","#31645d","#ba9860"] };
const denominations = [{ value: 100, color: "#e6d8b2" }, { value: 25, color: "#913f44" },
  { value: 5, color: "#377078" }, { value: 1, color: "#b1904f" }];
/** Bounded representative stacks, exact authoritative totals are always in the HTML HUD. */
export default function ChipStack3D({ amount, position, from, motion, style = "classic" }: {
  style?: RoomPreferences["chips"];
  amount: number; position: Point; from?: Point; motion: boolean;
}) {
  const mesh = useRef<InstancedMesh>(null), group = useRef<Group>(null);
  useEffect(() => {
    const m = mesh.current; if (!m) return;
    const dummy = new Object3D(); let rest = amount, index = 0;
    for (const [column, denomination] of denominations.entries()) {
      const count = Math.floor(rest / denomination.value); rest %= denomination.value;
      for (let chip = 0; chip < Math.min(count, 7); chip++) {
        dummy.position.set(column * .23 - .25, chip * .038, 0);
        dummy.rotation.y = chip * .3; dummy.updateMatrix();
        m.setMatrixAt(index, dummy.matrix); m.setColorAt(index, new Color(palettes[style][column])); index++;
      }
    }
    m.count = index; m.instanceMatrix.needsUpdate = true;
    if (m.instanceColor) m.instanceColor.needsUpdate = true;
    m.computeBoundingSphere();
    if (group.current && motion && from) group.current.position.set(...from);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [amount, motion, style]);
  useFrame((_, delta) => {
    const g = group.current; if (!g) return;
    const a = motion ? 1 - Math.exp(-Math.min(delta, .08) * 9) : 1;
    g.position.x += (position[0] - g.position.x) * a;
    g.position.y += (position[1] - g.position.y) * a;
    g.position.z += (position[2] - g.position.z) * a;
  });
  return <group ref={group} position={position}>
    <instancedMesh ref={mesh} args={[undefined, undefined, 28]} castShadow receiveShadow>
      <cylinderGeometry args={[.1, .1, .033, 12]} />
      <meshStandardMaterial color="white" roughness={.58} metalness={.15} />
    </instancedMesh>
  </group>;
}
