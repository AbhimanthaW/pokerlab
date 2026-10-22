import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Object3D, type InstancedMesh, type Group, type Texture } from "three";
import { activeDealerCue, type Cue } from "./choreography";
import { DECK_ANCHOR } from "../immersive-play/presentation";
export function RainWindow({ count, motion }: { count: number; motion: boolean }) {
  const drops = useRef<InstancedMesh>(null), dummy = useMemo(() => new Object3D(), []);
  const place = (time: number) => {
    if (!drops.current) return;
    for (let i=0;i<count;i++) { const x=((i*0.61803398875)%1)*2.75-1.375, y=.94-((i*.371+time*(.26+i%3*.035))%1)*1.88; dummy.position.set(x,y,.09); dummy.rotation.set(0,0,-.13); dummy.scale.set(1,.7+i%3*.2,1); dummy.updateMatrix(); drops.current.setMatrixAt(i,dummy.matrix); }
    drops.current.instanceMatrix.needsUpdate=true;
  };
  useEffect(() => { place(0); });
  useFrame(({ clock }) => { if (motion) place(clock.elapsedTime); });
  return <group position={[0,1.7,-6.2]}><mesh><boxGeometry args={[3.1,2.35,.1]} /><meshStandardMaterial color="#7b6647" /></mesh><mesh position={[0,0,.065]}><planeGeometry args={[2.85,2.1]} /><meshBasicMaterial color="#14283e" /></mesh><instancedMesh ref={drops} args={[undefined,undefined,count]}><planeGeometry args={[.008,.19]} /><meshBasicMaterial color="#8baac0" transparent opacity={.32} depthWrite={false} /></instancedMesh>{[-.48,.48].map((x)=><mesh key={x} position={[x,0,.11]}><boxGeometry args={[.04,2.15,.035]} /><meshStandardMaterial color="#6e604c" /></mesh>)}</group>;
}
export function BurnCards({ cues, motion, boardCount, back }: { cues: Cue[]; motion: boolean; boardCount: number; back: Texture }) {
  const flying = useRef<Group>(null), packets = useRef<Group>(null);
  useFrame(() => { const shuffle=packets.current; if(shuffle){const c=activeDealerCue(cues,performance.now(),motion);shuffle.visible=c.pose==="SHUFFLING";shuffle.position.set(DECK_ANCHOR[0],.2+Math.sin(c.progress*Math.PI)*.06,DECK_ANCHOR[2]);shuffle.rotation.y=Math.sin(c.progress*Math.PI*6)*.16;} const g=flying.current; if(!g)return; const cue=activeDealerCue(cues,performance.now(),motion); g.visible=cue.pose==="BURNING_CARD"; if(g.visible) { const p=cue.progress; g.position.set(DECK_ANCHOR[0]+(-.55-DECK_ANCHOR[0])*p,.19+Math.sin(p*Math.PI)*.08,DECK_ANCHOR[2]); } });
  const count=boardCount>=5?3:boardCount>=4?2:boardCount>=3?1:0;
  return <group><group ref={packets} visible={false}>{[-1,1].map((side)=><group key={side} position={[side*.12,0,0]} rotation={[0,side*.12,0]}><mesh><boxGeometry args={[.23,.04,.66]} /><meshStandardMaterial color="#d6c7a9" /></mesh><mesh position={[0,.023,0]} rotation={[-Math.PI/2,0,0]}><planeGeometry args={[.23,.66]} /><meshStandardMaterial map={back} /></mesh></group>)}</group><group ref={flying} visible={false}><mesh rotation={[-Math.PI/2,0,0]}><planeGeometry args={[.46,.66]} /><meshStandardMaterial map={back} /></mesh></group>{Array.from({length:count},(_,i)=><mesh key={i} position={[-.55,.08+i*.006,-1.65]} rotation={[-Math.PI/2,0,i*.06]}><planeGeometry args={[.46,.66]} /><meshStandardMaterial map={back} /></mesh>)}</group>;
}
