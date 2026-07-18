import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { SceneMode, CompanionMood } from "@/stores/useCompanionStore";
import { useCompanionStore } from "@/stores/useCompanionStore";

/* ================================================================== */
/*  Enhanced Contextual 3D Scenes                                      */
/*  Rich environments with animated props, particles, lighting         */
/* ================================================================== */

interface SceneManagerProps {
  sceneMode: SceneMode;
  mood: CompanionMood;
}

/* ------------------------------------------------------------------ */
/*  Floating Particle — used across all scenes                         */
/* ------------------------------------------------------------------ */
function FloatingParticle({
  position,
  color,
  speed,
  size,
  glow = 0.4,
}: {
  position: [number, number, number];
  color: string;
  speed: number;
  size: number;
  glow?: number;
}) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (ref.current) {
      ref.current.position.y = position[1] + Math.sin(t * speed) * 0.3;
      ref.current.position.x = position[0] + Math.cos(t * speed * 0.7) * 0.15;
      ref.current.rotation.z = t * speed * 0.5;
      // Pulse opacity
      const mat = ref.current.material as THREE.MeshStandardMaterial;
      mat.opacity = 0.5 + Math.sin(t * speed * 1.5) * 0.25;
    }
  });
  return (
    <mesh ref={ref} position={position}>
      <sphereGeometry args={[size, 8, 8]} />
      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={glow}
        transparent
        opacity={0.7}
        roughness={0.3}
      />
    </mesh>
  );
}

/* ------------------------------------------------------------------ */
/*  Z-Z-Z Sleep particles with letter shapes                           */
/* ------------------------------------------------------------------ */
function SleepParticles() {
  const positions = useMemo(
    () =>
      Array.from({ length: 6 }, (_, i) => ({
        pos: [0.5 + i * 0.18, 1.3 + i * 0.25, -0.5] as [number, number, number],
        size: 0.025 + i * 0.012,
        speed: 0.4 + i * 0.08,
      })),
    [],
  );
  return (
    <group>
      {positions.map((p, i) => (
        <FloatingParticle key={i} position={p.pos} color="#6b88b8" speed={p.speed} size={p.size} glow={0.6} />
      ))}
    </group>
  );
}

/* ------------------------------------------------------------------ */
/*  Sparkle / celebration particles                                    */
/* ------------------------------------------------------------------ */
function HappyParticles() {
  const particles = useMemo(
    () =>
      Array.from({ length: 10 }, (_, i) => ({
        pos: [
          (Math.random() - 0.5) * 2.5,
          0.3 + Math.random() * 2.2,
          -0.5 - Math.random() * 0.5,
        ] as [number, number, number],
        color: ["#ff6b9d", "#ffd93d", "#6bcbff", "#c56bff", "#6bffb8"][i % 5],
        speed: 0.6 + Math.random() * 1.0,
        size: 0.02 + Math.random() * 0.025,
      })),
    [],
  );
  return (
    <group>
      {particles.map((p, i) => (
        <FloatingParticle key={i} position={p.pos} color={p.color} speed={p.speed} size={p.size} glow={0.8} />
      ))}
    </group>
  );
}

/* ------------------------------------------------------------------ */
/*  Exercise / energy particles                                        */
/* ------------------------------------------------------------------ */
function ExerciseParticles() {
  const particles = useMemo(
    () =>
      Array.from({ length: 8 }, (_, i) => ({
        pos: [
          (Math.random() - 0.5) * 2.2,
          0.2 + Math.random() * 1.8,
          -0.3,
        ] as [number, number, number],
        color: ["#ff4444", "#ff8844", "#ffcc00", "#ff6644"][i % 4],
        speed: 1.5 + Math.random() * 1.2,
        size: 0.015 + Math.random() * 0.02,
      })),
    [],
  );
  return (
    <group>
      {particles.map((p, i) => (
        <FloatingParticle key={i} position={p.pos} color={p.color} speed={p.speed} size={p.size} glow={0.7} />
      ))}
    </group>
  );
}

/* ------------------------------------------------------------------ */
/*  Steam particles (for kitchen)                                      */
/* ------------------------------------------------------------------ */
function SteamParticles() {
  const particles = useMemo(
    () =>
      Array.from({ length: 5 }, (_, i) => ({
        pos: [
          -0.1 + Math.random() * 0.2,
          0.5 + i * 0.15,
          0.5,
        ] as [number, number, number],
        speed: 0.3 + Math.random() * 0.4,
        size: 0.03 + Math.random() * 0.02,
      })),
    [],
  );
  return (
    <group>
      {particles.map((p, i) => (
        <FloatingParticle key={i} position={p.pos} color="#ffffff" speed={p.speed} size={p.size} glow={0.2} />
      ))}
    </group>
  );
}

/* ================================================================== */
/*  BEDROOM SCENE                                                      */
/* ================================================================== */
function BedroomScene() {
  const alarmRef = useRef<THREE.Group>(null);
  const curtainLeftRef = useRef<THREE.Mesh>(null);
  const curtainRightRef = useRef<THREE.Mesh>(null);
  const alarmActive = useCompanionStore((s) => s.alarmActive);
  const activity = useCompanionStore((s) => s.activity);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();

    // Alarm clock shake when active
    if (alarmRef.current && alarmActive) {
      alarmRef.current.rotation.z = Math.sin(t * 30) * 0.15;
      alarmRef.current.position.y = 0.42 + Math.abs(Math.sin(t * 20)) * 0.02;
    } else if (alarmRef.current) {
      alarmRef.current.rotation.z = 0;
      alarmRef.current.position.y = 0.42;
    }

    // Curtains open when waking up (not sleeping)
    const curtainOpen = activity === "waking_up" ? 0.4 : 0;
    if (curtainLeftRef.current) {
      curtainLeftRef.current.position.x += ((-0.55 - curtainOpen) - curtainLeftRef.current.position.x) * 0.02;
    }
    if (curtainRightRef.current) {
      curtainRightRef.current.position.x += ((-0.55 + curtainOpen) - curtainRightRef.current.position.x) * 0.02;
    }
  });

  const isSleeping = useCompanionStore((s) => s.mood === "sleep" || s.mood === "sleepy");

  return (
    <group position={[0, 0, -1.5]}>
      {/* back wall */}
      <mesh position={[0, 1.2, 0]}>
        <planeGeometry args={[4, 3]} />
        <meshStandardMaterial color={isSleeping ? "#0d0d25" : "#1a1a3e"} roughness={0.9} />
      </mesh>

      {/* floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.3, 0.5]}>
        <planeGeometry args={[4, 2]} />
        <meshStandardMaterial color="#2a2040" roughness={0.95} />
      </mesh>

      {/* window frame */}
      <mesh position={[-0.55, 1.8, 0.01]}>
        <planeGeometry args={[0.7, 0.9]} />
        <meshStandardMaterial
          color={isSleeping ? "#0a1628" : "#3a6090"}
          emissive={isSleeping ? "#0a1628" : "#5a8ac0"}
          emissiveIntensity={isSleeping ? 0.3 : 0.8}
          roughness={0.4}
        />
      </mesh>

      {/* curtains */}
      <mesh ref={curtainLeftRef} position={[-0.55, 1.8, 0.02]}>
        <planeGeometry args={[0.35, 0.95]} />
        <meshStandardMaterial color="#4a3060" roughness={0.8} side={THREE.DoubleSide} />
      </mesh>
      <mesh ref={curtainRightRef} position={[-0.55, 1.8, 0.02]}>
        <planeGeometry args={[0.35, 0.95]} />
        <meshStandardMaterial color="#4a3060" roughness={0.8} side={THREE.DoubleSide} />
      </mesh>

      {/* moon */}
      <mesh position={[-0.45, 2.0, 0.015]}>
        <circleGeometry args={[0.1, 16]} />
        <meshStandardMaterial
          color="#ffeaa7"
          emissive="#ffeaa7"
          emissiveIntensity={isSleeping ? 1.5 : 0.5}
          roughness={0.1}
        />
      </mesh>

      {/* stars */}
      {[[-0.75, 2.1], [-0.35, 1.65], [-0.8, 1.6], [-0.3, 2.15], [-0.6, 1.5]].map(
        ([x, y], i) => (
          <mesh key={i} position={[x, y, 0.015]}>
            <circleGeometry args={[0.012, 6]} />
            <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={1.2} />
          </mesh>
        ),
      )}

      {/* bed */}
      <mesh position={[0.6, 0.15, 0.3]}>
        <boxGeometry args={[1.3, 0.18, 0.7]} />
        <meshStandardMaterial color="#3a2820" roughness={0.85} />
      </mesh>
      {/* bed headboard */}
      <mesh position={[1.2, 0.45, 0.3]}>
        <boxGeometry args={[0.08, 0.5, 0.75]} />
        <meshStandardMaterial color="#4a3828" roughness={0.8} />
      </mesh>
      {/* blanket */}
      <mesh position={[0.5, 0.28, 0.3]}>
        <boxGeometry args={[0.9, 0.06, 0.65]} />
        <meshStandardMaterial color="#5a6fa8" roughness={0.7} />
      </mesh>
      {/* pillow */}
      <mesh position={[1.0, 0.3, 0.3]}>
        <boxGeometry args={[0.25, 0.1, 0.35]} />
        <meshStandardMaterial color="#d4e6f1" roughness={0.7} />
      </mesh>

      {/* nightstand */}
      <mesh position={[-0.15, 0.2, 0.6]}>
        <boxGeometry args={[0.3, 0.35, 0.3]} />
        <meshStandardMaterial color="#3a2820" roughness={0.8} />
      </mesh>

      {/* alarm clock on nightstand */}
      <group ref={alarmRef} position={[-0.15, 0.42, 0.6]}>
        <mesh>
          <boxGeometry args={[0.1, 0.08, 0.06]} />
          <meshStandardMaterial
            color={alarmActive ? "#ff4444" : "#666"}
            emissive={alarmActive ? "#ff2222" : "#000"}
            emissiveIntensity={alarmActive ? 1.5 : 0}
            metalness={0.5}
            roughness={0.3}
          />
        </mesh>
        {/* alarm bell tops */}
        <mesh position={[-0.035, 0.05, 0]}>
          <sphereGeometry args={[0.02, 8, 8]} />
          <meshStandardMaterial color="#888" metalness={0.7} roughness={0.3} />
        </mesh>
        <mesh position={[0.035, 0.05, 0]}>
          <sphereGeometry args={[0.02, 8, 8]} />
          <meshStandardMaterial color="#888" metalness={0.7} roughness={0.3} />
        </mesh>
      </group>

      {/* ambient lighting */}
      <pointLight
        position={[-0.5, 2, 0.5]}
        intensity={isSleeping ? 0.2 : 0.6}
        color={isSleeping ? "#2244aa" : "#6699dd"}
      />
      {alarmActive && (
        <pointLight position={[-0.15, 0.5, 0.6]} intensity={1.5} color="#ff4444" distance={1.5} />
      )}

      <SleepParticles />
    </group>
  );
}

/* ================================================================== */
/*  KITCHEN / DINING SCENE                                             */
/* ================================================================== */
function KitchenScene() {
  const activity = useCompanionStore((s) => s.activity);

  const isBreakfast = activity === "eating_breakfast";
  const isLunch = activity === "eating_lunch";
  const isDinner = activity === "eating_dinner";

  // Different wall color by meal
  const wallColor = isDinner ? "#2a2035" : isLunch ? "#f5e6c8" : "#fdf0d5";
  const lightColor = isDinner ? "#ff9955" : isLunch ? "#ffdd77" : "#ffcc88";
  const lightIntensity = isDinner ? 0.8 : 1.2;

  return (
    <group position={[0, 0, -1.5]}>
      {/* back wall */}
      <mesh position={[0, 1.2, 0]}>
        <planeGeometry args={[4, 3]} />
        <meshStandardMaterial color={wallColor} roughness={0.9} />
      </mesh>

      {/* floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.3, 0.5]}>
        <planeGeometry args={[4, 2]} />
        <meshStandardMaterial color="#c4a882" roughness={0.9} />
      </mesh>

      {/* table */}
      <mesh position={[0, 0.3, 0.5]}>
        <boxGeometry args={[1.6, 0.06, 0.9]} />
        <meshStandardMaterial color="#8B6914" roughness={0.65} />
      </mesh>
      {/* table legs */}
      {[[-0.65, -0.15, 0.15], [0.65, -0.15, 0.15], [-0.65, -0.15, 0.85], [0.65, -0.15, 0.85]].map(
        ([x, y, z], i) => (
          <mesh key={i} position={[x, y, z]}>
            <cylinderGeometry args={[0.025, 0.03, 0.55, 8]} />
            <meshStandardMaterial color="#6B4914" roughness={0.8} />
          </mesh>
        ),
      )}

      {/* plate */}
      <mesh position={[0, 0.345, 0.5]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.15, 24]} />
        <meshStandardMaterial color="#f8f8f8" roughness={0.2} />
      </mesh>
      {/* plate rim */}
      <mesh position={[0, 0.345, 0.5]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.13, 0.15, 24]} />
        <meshStandardMaterial color="#e8e8e8" roughness={0.3} />
      </mesh>

      {/* food items based on meal */}
      {isBreakfast && (
        <>
          {/* toast */}
          <mesh position={[0, 0.37, 0.48]}>
            <boxGeometry args={[0.08, 0.02, 0.1]} />
            <meshStandardMaterial color="#d4a041" roughness={0.8} />
          </mesh>
          {/* cup */}
          <mesh position={[0.25, 0.37, 0.45]}>
            <cylinderGeometry args={[0.035, 0.03, 0.07, 12]} />
            <meshStandardMaterial color="#ffffff" roughness={0.3} />
          </mesh>
        </>
      )}
      {isLunch && (
        <>
          {/* salad bowl */}
          <mesh position={[0, 0.37, 0.5]}>
            <sphereGeometry args={[0.06, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.5]} />
            <meshStandardMaterial color="#55aa55" roughness={0.6} />
          </mesh>
        </>
      )}
      {isDinner && (
        <>
          {/* candle */}
          <mesh position={[0.3, 0.38, 0.5]}>
            <cylinderGeometry args={[0.01, 0.01, 0.08, 8]} />
            <meshStandardMaterial color="#ffffcc" roughness={0.5} />
          </mesh>
          <pointLight position={[0.3, 0.45, 0.5]} intensity={0.5} color="#ffaa44" distance={0.8} />
        </>
      )}

      {/* glass */}
      <mesh position={[-0.2, 0.36, 0.45]}>
        <cylinderGeometry args={[0.025, 0.02, 0.08, 12]} />
        <meshStandardMaterial color="#aaddff" transparent opacity={0.4} roughness={0.1} />
      </mesh>

      {/* utensils */}
      <mesh position={[0.12, 0.345, 0.38]} rotation={[0, 0, 0.1]}>
        <boxGeometry args={[0.01, 0.12, 0.01]} />
        <meshStandardMaterial color="#cccccc" metalness={0.7} roughness={0.3} />
      </mesh>
      <mesh position={[-0.12, 0.345, 0.38]} rotation={[0, 0, -0.1]}>
        <boxGeometry args={[0.01, 0.12, 0.01]} />
        <meshStandardMaterial color="#cccccc" metalness={0.7} roughness={0.3} />
      </mesh>

      {/* warm overhead light */}
      <pointLight position={[0, 2.5, 0.5]} intensity={lightIntensity} color={lightColor} />

      <SteamParticles />
      <HappyParticles />
    </group>
  );
}

/* ================================================================== */
/*  GYM / WORKOUT SCENE                                                */
/* ================================================================== */
function GymScene() {
  const dumbbellLeftRef = useRef<THREE.Group>(null);
  const dumbbellRightRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    // Subtle float for dumbbells
    if (dumbbellLeftRef.current) {
      dumbbellLeftRef.current.rotation.z = Math.sin(t * 0.5) * 0.05;
    }
    if (dumbbellRightRef.current) {
      dumbbellRightRef.current.rotation.z = Math.sin(t * 0.5 + 1) * 0.05;
    }
  });

  return (
    <group position={[0, 0, -1.5]}>
      {/* back wall */}
      <mesh position={[0, 1.2, 0]}>
        <planeGeometry args={[4, 3]} />
        <meshStandardMaterial color="#1a1a30" roughness={0.9} />
      </mesh>

      {/* floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.3, 0.5]}>
        <planeGeometry args={[4, 2]} />
        <meshStandardMaterial color="#2a2a3a" roughness={0.8} />
      </mesh>

      {/* gym mirror */}
      <mesh position={[0, 1.3, 0.01]}>
        <planeGeometry args={[1.5, 1.2]} />
        <meshStandardMaterial
          color="#aabbcc"
          metalness={0.9}
          roughness={0.1}
          transparent
          opacity={0.3}
        />
      </mesh>

      {/* dumbbell left */}
      <group ref={dumbbellLeftRef} position={[-1.0, 0.15, 0.5]}>
        <mesh>
          <cylinderGeometry args={[0.02, 0.02, 0.4, 8]} />
          <meshStandardMaterial color="#888" metalness={0.6} roughness={0.3} />
        </mesh>
        <mesh position={[0, 0.18, 0]}>
          <cylinderGeometry args={[0.06, 0.06, 0.08, 8]} />
          <meshStandardMaterial color="#333" metalness={0.7} roughness={0.3} />
        </mesh>
        <mesh position={[0, -0.18, 0]}>
          <cylinderGeometry args={[0.06, 0.06, 0.08, 8]} />
          <meshStandardMaterial color="#333" metalness={0.7} roughness={0.3} />
        </mesh>
      </group>

      {/* dumbbell right */}
      <group ref={dumbbellRightRef} position={[1.0, 0.15, 0.5]}>
        <mesh>
          <cylinderGeometry args={[0.02, 0.02, 0.4, 8]} />
          <meshStandardMaterial color="#888" metalness={0.6} roughness={0.3} />
        </mesh>
        <mesh position={[0, 0.18, 0]}>
          <cylinderGeometry args={[0.06, 0.06, 0.08, 8]} />
          <meshStandardMaterial color="#333" metalness={0.7} roughness={0.3} />
        </mesh>
        <mesh position={[0, -0.18, 0]}>
          <cylinderGeometry args={[0.06, 0.06, 0.08, 8]} />
          <meshStandardMaterial color="#333" metalness={0.7} roughness={0.3} />
        </mesh>
      </group>

      {/* yoga mat */}
      <mesh position={[0, -0.28, 0.8]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.6, 1.2]} />
        <meshStandardMaterial color="#6655aa" roughness={0.7} />
      </mesh>

      {/* energy lights */}
      <pointLight position={[0, 2.5, 0.5]} intensity={1.5} color="#ff6b6b" />
      <pointLight position={[-1.5, 1.5, 0.5]} intensity={0.4} color="#44aaff" />
      <pointLight position={[1.5, 1.5, 0.5]} intensity={0.4} color="#ff44aa" />

      <ExerciseParticles />
    </group>
  );
}

/* ================================================================== */
/*  WELCOME SCENE                                                      */
/* ================================================================== */
function WelcomeScene() {
  const spotlightRef = useRef<THREE.SpotLight>(null);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (spotlightRef.current) {
      spotlightRef.current.intensity = 1.5 + Math.sin(t * 2) * 0.3;
    }
  });

  return (
    <group position={[0, 0, -1.5]}>
      {/* spotlight effect */}
      <spotLight
        ref={spotlightRef}
        position={[0, 3, 1]}
        angle={0.4}
        penumbra={1}
        intensity={1.5}
        color="#ffd700"
        castShadow
      />

      {/* ground glow */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.29, 0.5]}>
        <circleGeometry args={[1.5, 32]} />
        <meshStandardMaterial
          color="#2a1a40"
          emissive="#4a2a70"
          emissiveIntensity={0.3}
          roughness={0.8}
        />
      </mesh>

      <HappyParticles />
    </group>
  );
}

/* ================================================================== */
/*  SCENE MANAGER                                                      */
/* ================================================================== */
function SceneManager({ sceneMode, mood }: SceneManagerProps) {
  return (
    <group>
      {sceneMode === "bedroom" && <BedroomScene />}
      {sceneMode === "kitchen" && <KitchenScene />}
      {sceneMode === "gym" && <GymScene />}
      {sceneMode === "welcome" && <WelcomeScene />}
      {sceneMode === "none" && mood === "happy" && <HappyParticles />}
      {sceneMode === "none" && mood === "celebrating" && <HappyParticles />}
      {sceneMode === "none" && mood === "excited" && <HappyParticles />}
      {sceneMode === "none" && (mood === "sleep" || mood === "sleepy") && <SleepParticles />}
      {sceneMode === "none" && mood === "exercise" && <ExerciseParticles />}
    </group>
  );
}

export default SceneManager;
