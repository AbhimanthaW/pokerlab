import { createContext, useContext, useEffect, useMemo, type ReactNode } from "react";
import { MeshStandardMaterial, type BufferGeometry } from "three";
import { createHandGeometry } from "./handGeometry";
const GeometryContext = createContext<BufferGeometry | null>(null);
export function HandGeometryProvider({ children }: { children: ReactNode }) {
  const geometry = useMemo(() => createHandGeometry(), []);
  useEffect(() => () => geometry.dispose(), [geometry]);
  return <GeometryContext.Provider value={geometry}>{children}</GeometryContext.Provider>;
}
export default function HandModel({ skin, sleeve, side = 1, forearm = true, scale = 1 }: { skin: string; sleeve: string; side?: number; forearm?: boolean; scale?: number }) {
  const geometry = useContext(GeometryContext);
  const materials = useMemo(() => ({ skin: new MeshStandardMaterial({ color: skin, roughness: .88, flatShading: true }), sleeve: new MeshStandardMaterial({ color: sleeve, roughness: 1, flatShading: true }) }), [skin,sleeve]);
  useEffect(() => () => { materials.skin.dispose(); materials.sleeve.dispose(); }, [materials]);
  return <group scale={[side*scale,scale,scale]}>
    {geometry && <mesh geometry={geometry} material={materials.skin} castShadow dispose={null} />}
    {forearm && <><mesh position={[0,-.015,.43]} rotation={[.11,0,0]} material={materials.sleeve} castShadow><boxGeometry args={[.145,.12,.52]} /></mesh><mesh position={[0,-.006,.19]} material={materials.sleeve}><boxGeometry args={[.128,.09,.07]} /></mesh></>}
  </group>;
}
