export default function PokerRoom({ high }: { high: boolean }) {
  return <group>
    <color attach="background" args={["#101a24"]} />
    <fog attach="fog" args={["#101a24", 14, 29]} />
    <hemisphereLight args={["#d1d7d3", "#3c2c26", 1.25]} />
    <directionalLight position={[1, 7, 4]} intensity={2.2} color="#ffe1b6" castShadow
      shadow-mapSize={[1024, 1024]} shadow-camera-left={-6} shadow-camera-right={6}
      shadow-camera-top={6} shadow-camera-bottom={-6} shadow-normalBias={.035} />
    <pointLight position={[-4, 2.5, -3]} intensity={30} distance={13} color="#e6ad65" />
    <pointLight position={[4, 2.5, -3]} intensity={30} distance={13} color="#f2c183" />
    <mesh position={[0, -1.35, 0]} receiveShadow><boxGeometry args={[22, .2, 22]} /><meshStandardMaterial color="#292b2c" roughness={.95} /></mesh>
    <mesh position={[0, -1.23, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow><planeGeometry args={[11, 8.5]} /><meshStandardMaterial color="#3c3433" roughness={1} /></mesh>
    {[-5.3, 5.3].map((x) => <mesh key={x} position={[x, -1.22, 0]}><boxGeometry args={[.035, .012, 8.4]} /><meshStandardMaterial color="#8c7654" /></mesh>)}
    <mesh position={[0, 1.9, -6.5]} receiveShadow><boxGeometry args={[20, 6.5, .2]} /><meshStandardMaterial color="#192b35" roughness={.87} /></mesh>
    {[-8, 8].map((x) => <mesh key={x} position={[x, 1.7, 0]}><boxGeometry args={[.2, 6, 14]} /><meshStandardMaterial color="#1b2e36" /></mesh>)}
    <mesh position={[0, -.45, -6.28]}><boxGeometry args={[19, 1.8, .16]} /><meshStandardMaterial color="#40352e" roughness={.67} /></mesh>
    {Array.from({ length: 15 }, (_, i) => <group key={i} position={[-8.4 + i * 1.2, 0, -6.15]}>
      <mesh position={[0, -.4, 0]}><boxGeometry args={[.04, 1.7, .04]} /><meshStandardMaterial color="#8b7149" metalness={.55} roughness={.6} /></mesh>
      <mesh position={[0, .48, 0]}><boxGeometry args={[1.2, .04, .04]} /><meshStandardMaterial color="#8b7149" /></mesh>
    </group>)}
    {[-4.5, 4.5].map((x) => <group key={x} position={[x, 1.7, -6.02]}>
      <mesh><boxGeometry args={[2.1, 2.2, .12]} /><meshStandardMaterial color="#ac8950" metalness={.5} roughness={.45} /></mesh>
      <mesh position={[0, 0, .08]}><boxGeometry args={[1.94, 2.04, .06]} /><meshStandardMaterial color="#1a242d" /></mesh>
      {[0, 1, 2].map((i) => <mesh key={i} position={[(i - 1) * .43, -.1 + i * .2, .13 + i * .012]} rotation={[0, 0, -.3 + i * .25]}>
        <circleGeometry args={[.48 - i * .08, 5]} /><meshStandardMaterial color={["#9e774a", "#345f61", "#c5ab77"][i]} />
      </mesh>)}
    </group>)}
    {[-3.2, 0, 3.2].map((x) => <group key={x} position={[x, 3.5, -.5]}>
      <mesh position={[0, .65, 0]}><cylinderGeometry args={[.017, .017, 1.3, 6]} /><meshStandardMaterial color="#8d754e" metalness={.6} /></mesh>
      <mesh><coneGeometry args={[.62, .4, 12, 1, true]} /><meshStandardMaterial color="#5b6855" side={2} roughness={.8} /></mesh>
      <mesh position={[0, -.14, 0]} rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[.57, .025, 5, 24]} /><meshStandardMaterial color="#cfb277" metalness={.6} /></mesh>
      <mesh position={[0, -.12, 0]}><sphereGeometry args={[.14, 10, 7]} /><meshStandardMaterial emissive="#ffce86" emissiveIntensity={2} color="#ffe8b7" /></mesh>
      <pointLight position={[0, -.2, 0]} intensity={22} distance={8} color="#ffd39b" />
    </group>)}
    {[-6, 6].map((x) => <group key={x} position={[x, -1.2, -4.6]}>
      <mesh position={[0, .25, 0]}><cylinderGeometry args={[.38, .28, .5, 9]} /><meshStandardMaterial color="#745f48" /></mesh>
      {Array.from({ length: high ? 9 : 5 }, (_, i) => <mesh key={i} position={[Math.sin(i * 2) * .28, .85 + (i % 3) * .18, Math.cos(i * 2) * .28]}
        rotation={[.3, i, .4]} scale={[.23, .9, .13]}><octahedronGeometry args={[.65, 0]} /><meshStandardMaterial color={i % 2 ? "#3d6251" : "#254b40"} flatShading /></mesh>)}
    </group>)}
    <mesh position={[0, 4.8, 0]}><boxGeometry args={[20, .15, 18]} /><meshStandardMaterial color="#202a30" /></mesh>
  </group>;
}

export function PokerTable3D({ segments }: { segments: number }) {
  return <group>
    <mesh position={[0, -.16, 0]} scale={[3.65, 1, 2.3]} castShadow receiveShadow>
      <cylinderGeometry args={[1, .97, .3, segments * 3]} /><meshStandardMaterial color="#63452f" roughness={.55} />
    </mesh>
    <mesh position={[0, -.015, 0]} scale={[3.48, 1, 2.14]} receiveShadow>
      <cylinderGeometry args={[1, 1, .045, segments * 3]} /><meshStandardMaterial color="#28664f" roughness={.97} />
    </mesh>
    <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, .025, 0]} scale={[3.6, 2.25, 1]} castShadow>
      <torusGeometry args={[1, .055, 8, segments * 3]} /><meshStandardMaterial color="#372a26" roughness={.54} />
    </mesh>
    <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, .018, 0]} scale={[3.4, 2.08, 1]}>
      <torusGeometry args={[1, .007, 4, segments * 3]} /><meshStandardMaterial color="#bd995b" metalness={.5} roughness={.5} />
    </mesh>
    <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, .013, 0]} scale={[2.9, 1.63, 1]}>
      <torusGeometry args={[1, .002, 4, segments * 3]} /><meshStandardMaterial color="#6c9170" roughness={1} />
    </mesh>
    {[-1.7, 1.7].map((x) => <mesh key={x} position={[x, -.8, 0]} castShadow><cylinderGeometry args={[.27, .5, 1.2, 8]} /><meshStandardMaterial color="#44332c" /></mesh>)}
    {Array.from({ length: 12 }, (_, i) => <mesh key={i} position={[Math.sin(i * Math.PI / 6) * 3.58, .09, Math.cos(i * Math.PI / 6) * 2.23]}
      rotation={[-Math.PI / 2, 0, i * Math.PI / 6]}><circleGeometry args={[.035, 4]} /><meshStandardMaterial color="#cdb17a" /></mesh>)}
    <mesh position={[.65, .08, -1.65]} rotation={[0, -.08, 0]} castShadow><boxGeometry args={[.49, .12, .71]} /><meshStandardMaterial color="#21414a" /></mesh>
  </group>;
}
