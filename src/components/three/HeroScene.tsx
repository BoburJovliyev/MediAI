import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Float, Environment, Lightformer } from "@react-three/drei";
import { useMemo, useRef, Suspense } from "react";
import * as THREE from "three";

/** Rotating DNA double helix built procedurally from instanced spheres + rungs. */
function Helix() {
  const group = useRef<THREE.Group>(null);
  const COUNT = 26;

  const nodes = useMemo(() => {
    const items: { y: number; angle: number }[] = [];
    for (let i = 0; i < COUNT; i++) {
      items.push({ y: (i - COUNT / 2) * 0.32, angle: i * 0.42 });
    }
    return items;
  }, []);

  useFrame((_, delta) => {
    if (group.current) group.current.rotation.y += delta * 0.35;
  });

  const radius = 1.15;

  return (
    <group ref={group} rotation-z={0.18} position={[2.7, -0.3, -1.2]} scale={0.85}>
      {nodes.map(({ y, angle }, i) => {
        const x = Math.cos(angle) * radius;
        const z = Math.sin(angle) * radius;
        return (
          <group key={i}>
            <mesh position={[x, y, z]} castShadow>
              <sphereGeometry args={[0.11, 20, 20]} />
              <meshStandardMaterial
                color="#3fc6e0"
                roughness={0.15}
                metalness={0.55}
                emissive="#0b6e85"
                emissiveIntensity={0.35}
              />
            </mesh>
            <mesh position={[-x, y, -z]} castShadow>
              <sphereGeometry args={[0.11, 20, 20]} />
              <meshStandardMaterial
                color="#5ee0b0"
                roughness={0.15}
                metalness={0.55}
                emissive="#0d7355"
                emissiveIntensity={0.35}
              />
            </mesh>
            {i % 2 === 0 && (
              <mesh position={[0, y, 0]} rotation={[0, -angle, Math.PI / 2]}>
                <cylinderGeometry args={[0.022, 0.022, radius * 2, 8]} />
                <meshStandardMaterial
                  color="#9fd7e8"
                  transparent
                  opacity={0.5}
                  roughness={0.3}
                />
              </mesh>
            )}
          </group>
        );
      })}
    </group>
  );
}

/** Slow orbiting glass capsules around the helix. */
function Orbiters() {
  const ref = useRef<THREE.Group>(null);
  useFrame((state) => {
    if (ref.current) ref.current.rotation.y = state.clock.elapsedTime * 0.18;
  });
  const items = useMemo(
    () => [
      { r: 2.9, y: 0.9, s: 0.22, c: "#7cc7ff" },
      { r: 3.3, y: -1.1, s: 0.16, c: "#68e0bb" },
      { r: 2.4, y: -1.9, s: 0.13, c: "#b79bff" },
      { r: 3.6, y: 1.8, s: 0.18, c: "#4fb8d8" },
    ],
    []
  );
  return (
    <group ref={ref}>
      {items.map((o, i) => (
        <Float key={i} speed={1.4} rotationIntensity={0.6} floatIntensity={1.1}>
          <mesh position={[Math.cos(i * 1.7) * o.r, o.y, Math.sin(i * 1.7) * o.r]}>
            <icosahedronGeometry args={[o.s, 1]} />
            <meshStandardMaterial
              color={o.c}
              roughness={0.1}
              metalness={0.8}
              emissive={o.c}
              emissiveIntensity={0.25}
            />
          </mesh>
        </Float>
      ))}
    </group>
  );
}

/** Gentle camera parallax that follows the pointer. */
function CameraRig() {
  const { camera, pointer } = useThree();
  useFrame((_, delta) => {
    const k = 1 - Math.exp(-3 * delta);
    camera.position.x += (pointer.x * 1.4 - camera.position.x) * k;
    camera.position.y += (pointer.y * 0.8 + 0.2 - camera.position.y) * k;
    camera.lookAt(0, 0, 0);
  });
  return null;
}

const HeroScene = () => {
  const reduced =
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

  return (
    <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
      <Canvas
        dpr={[1, 1.75]}
        camera={{ position: [0, 0.2, 7], fov: 45 }}
        gl={{ antialias: true, alpha: true }}
      >
        <Suspense fallback={null}>
          <ambientLight intensity={0.6} />
          <directionalLight position={[4, 6, 5]} intensity={1.4} />
          <pointLight position={[-5, -2, -4]} intensity={30} color="#5ee0b0" />
          <Helix />
          <Orbiters />
          {!reduced && <CameraRig />}
          <Environment>
            <Lightformer intensity={2} position={[0, 5, 2]} scale={[10, 10, 1]} />
            <Lightformer
              intensity={1.2}
              color="#7fd9ef"
              position={[-6, 1, -1]}
              rotation-y={Math.PI / 2}
              scale={[20, 2, 1]}
            />
          </Environment>
        </Suspense>
      </Canvas>
    </div>
  );
};

export default HeroScene;
