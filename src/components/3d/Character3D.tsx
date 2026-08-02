import { useRef, useMemo, useCallback } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { CharacterType, CompanionMood } from "@/stores/useCompanionStore";
import { useCompanionStore } from "@/stores/useCompanionStore";
import { getEmotionFace, type EmotionFace } from "@/hooks/useEmotionController";

/* ================================================================== */
/*  Procedural "Pixar chibi" character — AAA animation upgrade         */
/*  Big head, small body, round proportions — stylised & appealing     */
/*                                                                     */
/*  PRESERVED: Face, Clothes, Hair, Shape, Colors (per spec)           */
/*  UPGRADED:  15-emotion facial system, blink, IK, lip-sync,         */
/*             secondary motion, breathing, anticipation               */
/* ================================================================== */

interface Character3DProps {
  character: CharacterType;
  mood: CompanionMood;
  isSpeaking: boolean;
  lookTarget: { x: number; y: number };
  audioLevel: number;
}

/* ------------------------------------------------------------------ */
/*  Colour palettes per character — UNCHANGED from original            */
/* ------------------------------------------------------------------ */
const PALETTES = {
  boy: {
    skin: "#f3cdaa",
    hair: "#1c1310",
    shirt: "#f7f7f5",      // white polo
    shirtDark: "#dcdcd8",  // polo collar
    pants: "#26364f",      // dark blue jeans
    shoes: "#141418",      // black shoes
    eye: "#3b2415",
    cheek: "#ff9f8a",
    mouth: "#c8465c",
    doppi: "#14141c",      // black doppi
    doppiPattern: "#f4f4f4",
  },
  girl: {
    skin: "#f7d3b8",
    hair: "#1e1512",
    shirt: "#d63a7a",      // pink dress
    shirtDark: "#b32a63",
    pants: "#d63a7a",      // dress skirt
    shoes: "#c62f6b",      // pink shoes
    eye: "#3b2415",
    cheek: "#ffa3ae",
    mouth: "#d94a68",
    doppi: "#f6f2ea",      // white embroidered doppi
    doppiPattern: "#d1332f",
  },
} as const;


/* ------------------------------------------------------------------ */
/*  Blink system state                                                 */
/* ------------------------------------------------------------------ */
interface BlinkState {
  nextBlinkTime: number;
  isBlinking: boolean;
  blinkProgress: number; // 0→1→0
  isDoubleBlink: boolean;
  doubleBlinkPhase: number;
}

function initBlinkState(): BlinkState {
  return {
    nextBlinkTime: 2 + Math.random() * 3,
    isBlinking: false,
    blinkProgress: 0,
    isDoubleBlink: false,
    doubleBlinkPhase: 0,
  };
}

/* ------------------------------------------------------------------ */
/*  Animation damping helper                                           */
/* ------------------------------------------------------------------ */
function damp(current: number, target: number, speed: number, dt: number): number {
  return current + (target - current) * (1 - Math.exp(-speed * dt));
}

/* ================================================================== */
/*  MAIN COMPONENT                                                     */
/* ================================================================== */

function Character3D({
  character,
  mood,
  isSpeaking,
  lookTarget,
  audioLevel,
}: Character3DProps) {
  // Refs
  const groupRef = useRef<THREE.Group>(null);
  const headGroupRef = useRef<THREE.Group>(null);
  const leftArmRef = useRef<THREE.Group>(null);
  const rightArmRef = useRef<THREE.Group>(null);
  const leftLegRef = useRef<THREE.Group>(null);
  const rightLegRef = useRef<THREE.Group>(null);
  const mouthRef = useRef<THREE.Mesh>(null);
  const leftEyeRef = useRef<THREE.Group>(null);
  const rightEyeRef = useRef<THREE.Group>(null);
  const leftEyeWhiteRef = useRef<THREE.Mesh>(null);
  const rightEyeWhiteRef = useRef<THREE.Mesh>(null);
  const leftCheekRef = useRef<THREE.Mesh>(null);
  const rightCheekRef = useRef<THREE.Mesh>(null);
  const leftEyebrowRef = useRef<THREE.Mesh>(null);
  const rightEyebrowRef = useRef<THREE.Mesh>(null);

  // Animation state refs (persist across frames)
  const blinkRef = useRef<BlinkState>(initBlinkState());
  const smoothFaceRef = useRef<EmotionFace | null>(null);
  const smoothLookRef = useRef({ x: 0, y: 0 });
  const smoothBodyYRef = useRef(0);
  const smoothBodyRotYRef = useRef(0);
  const smoothBodyRotZRef = useRef(0);

  const pal = PALETTES[character];

  // Get transition state from store
  const previousMood = useCompanionStore((s) => s.previousMood);
  const transitionProgress = useCompanionStore((s) => s.moodTransitionProgress);

  /* ---------------------------------------------------------------- */
  /*  Materials — memoised                                             */
  /* ---------------------------------------------------------------- */
  const mats = useMemo(
    () => ({
      skin: new THREE.MeshStandardMaterial({ color: pal.skin, roughness: 0.55, metalness: 0.0 }),
      hair: new THREE.MeshStandardMaterial({ color: pal.hair, roughness: 0.8 }),
      shirt: new THREE.MeshStandardMaterial({ color: pal.shirt, roughness: 0.5 }),
      shirtDark: new THREE.MeshStandardMaterial({ color: pal.shirtDark, roughness: 0.5 }),
      pants: new THREE.MeshStandardMaterial({ color: pal.pants, roughness: 0.6 }),
      shoes: new THREE.MeshStandardMaterial({ color: pal.shoes, roughness: 0.7 }),
      eye: new THREE.MeshStandardMaterial({ color: pal.eye, roughness: 0.3 }),
      eyeWhite: new THREE.MeshStandardMaterial({ color: "#ffffff", roughness: 0.3 }),
      cheek: new THREE.MeshStandardMaterial({
        color: pal.cheek, roughness: 0.6, transparent: true, opacity: 0.5,
      }),
      mouth: new THREE.MeshStandardMaterial({ color: pal.mouth, roughness: 0.4 }),
      eyeShine: new THREE.MeshStandardMaterial({
        color: "#ffffff", emissive: "#ffffff", emissiveIntensity: 0.8, roughness: 0.1,
      }),
      eyebrow: new THREE.MeshStandardMaterial({ color: pal.hair, roughness: 0.7 }),
    }),
    [pal],
  );

  /* ================================================================ */
  /*  PER-FRAME ANIMATION                                              */
  /* ================================================================ */
  useFrame(({ clock }, delta) => {
    const t = clock.getElapsedTime();
    const g = groupRef.current;
    if (!g) return;

    // Clamp delta for tab-switch jumps
    const dt = Math.min(delta, 0.1);

    /* ---- Get interpolated emotion face ---- */
    const targetFace = getEmotionFace(mood, previousMood, transitionProgress);

    // Smooth the face parameters for extra organic feel
    if (!smoothFaceRef.current) smoothFaceRef.current = { ...targetFace };
    const sf = smoothFaceRef.current;
    const faceSmooth = 8; // higher = faster response
    sf.eyeOpen = damp(sf.eyeOpen, targetFace.eyeOpen, faceSmooth, dt);
    sf.pupilScale = damp(sf.pupilScale, targetFace.pupilScale, faceSmooth, dt);
    sf.eyebrowY = damp(sf.eyebrowY, targetFace.eyebrowY, faceSmooth, dt);
    sf.eyebrowAngle = damp(sf.eyebrowAngle, targetFace.eyebrowAngle, faceSmooth, dt);
    sf.mouthOpen = damp(sf.mouthOpen, targetFace.mouthOpen, faceSmooth, dt);
    sf.mouthWidth = damp(sf.mouthWidth, targetFace.mouthWidth, faceSmooth, dt);
    sf.mouthCurve = damp(sf.mouthCurve, targetFace.mouthCurve, faceSmooth, dt);
    sf.cheekIntensity = damp(sf.cheekIntensity, targetFace.cheekIntensity, faceSmooth, dt);
    sf.bodyLean = damp(sf.bodyLean, targetFace.bodyLean, 4, dt);
    sf.headTilt = damp(sf.headTilt, targetFace.headTilt, 5, dt);
    sf.breathRate = damp(sf.breathRate, targetFace.breathRate, 3, dt);
    sf.bounceIntensity = damp(sf.bounceIntensity, targetFace.bounceIntensity, 5, dt);
    sf.armActivity = damp(sf.armActivity, targetFace.armActivity, 5, dt);

    /* ================================================================ */
    /*  BLINK SYSTEM                                                     */
    /* ================================================================ */
    const blink = blinkRef.current;
    let blinkMult = 1; // 1 = eyes open, 0 = eyes closed

    if (!blink.isBlinking) {
      blink.nextBlinkTime -= dt;
      if (blink.nextBlinkTime <= 0) {
        blink.isBlinking = true;
        blink.blinkProgress = 0;
        blink.isDoubleBlink = Math.random() < 0.2; // 20% chance double blink
        blink.doubleBlinkPhase = 0;
        blink.nextBlinkTime = 2.5 + Math.random() * 4;
      }
    }

    if (blink.isBlinking) {
      const blinkSpeed = 12; // full blink in ~0.15s
      blink.blinkProgress += dt * blinkSpeed;

      if (blink.blinkProgress <= 1) {
        // Closing
        blinkMult = 1 - blink.blinkProgress;
      } else if (blink.blinkProgress <= 2) {
        // Opening
        blinkMult = blink.blinkProgress - 1;
      } else {
        if (blink.isDoubleBlink && blink.doubleBlinkPhase === 0) {
          blink.doubleBlinkPhase = 1;
          blink.blinkProgress = 0;
        } else {
          blink.isBlinking = false;
          blink.blinkProgress = 0;
          blinkMult = 1;
        }
      }
    }

    // Sleep overrides blink (eyes always closed)
    if (mood === "sleep") blinkMult = 0;

    /* ================================================================ */
    /*  BREATHING                                                        */
    /* ================================================================ */
    const breathCycle = Math.sin(t * 2 * sf.breathRate);
    const breathScale = 1 + breathCycle * 0.012;

    /* ================================================================ */
    /*  BODY MOTION                                                      */
    /* ================================================================ */
    let targetY = 0;
    let targetRotY = 0;
    let targetRotZ = 0;

    // Mood-specific body
    if (mood === "exercise") {
      targetY = Math.abs(Math.sin(t * 6)) * 0.12;
      targetRotY = Math.sin(t * 3) * 0.15;
    } else if (mood === "sleep") {
      targetRotZ = Math.sin(t * 0.5) * 0.04;
      targetY = Math.sin(t * 0.8) * 0.015;
    } else if (mood === "happy" || mood === "celebrating") {
      targetY = Math.abs(Math.sin(t * 4)) * sf.bounceIntensity;
      targetRotY = Math.sin(t * 2) * 0.12;
    } else if (mood === "excited") {
      targetY = Math.abs(Math.sin(t * 5)) * sf.bounceIntensity;
      targetRotY = Math.sin(t * 3) * 0.15;
    } else if (mood === "laughing") {
      targetY = Math.abs(Math.sin(t * 7)) * 0.06;
      targetRotZ = Math.sin(t * 8) * 0.03;
    } else if (mood === "surprised") {
      targetY = 0.05; // jump back slightly
    } else if (mood === "sad") {
      targetY = Math.sin(t * 0.8) * 0.01;
      targetRotZ = sf.headTilt;
    } else if (mood === "yawning") {
      targetY = Math.sin(t * 0.8) * 0.01;
    } else if (mood === "stretching") {
      targetY = Math.sin(t * 1.5) * 0.03 + 0.02;
    } else {
      // Idle: gentle organic sway
      targetRotY = Math.sin(t * 0.6) * 0.08;
      targetY = Math.sin(t * 1.2) * 0.02;
    }

    // Lean from emotion
    targetRotZ += sf.bodyLean;

    // Smooth body motion
    smoothBodyYRef.current = damp(smoothBodyYRef.current, targetY, 6, dt);
    smoothBodyRotYRef.current = damp(smoothBodyRotYRef.current, targetRotY, 5, dt);
    smoothBodyRotZRef.current = damp(smoothBodyRotZRef.current, targetRotZ, 5, dt);

    g.position.y = smoothBodyYRef.current;
    g.rotation.y = smoothBodyRotYRef.current;
    g.rotation.z = smoothBodyRotZRef.current;
    g.scale.set(breathScale, breathScale, breathScale);

    /* ================================================================ */
    /*  HEAD — IK look-at + emotion tilt                                 */
    /* ================================================================ */
    if (headGroupRef.current) {
      const head = headGroupRef.current;

      // Smooth look target
      smoothLookRef.current.x = damp(smoothLookRef.current.x, lookTarget.x, 4, dt);
      smoothLookRef.current.y = damp(smoothLookRef.current.y, lookTarget.y, 4, dt);

      const lookX = smoothLookRef.current.x * 0.3;
      const lookY = smoothLookRef.current.y * 0.15;

      let headTargetY = lookX;
      let headTargetX = -lookY;
      let headTargetZ = sf.headTilt;

      // Speaking head motion
      if (isSpeaking) {
        headTargetX += Math.sin(t * 8) * 0.025;
        headTargetZ += Math.sin(t * 6) * 0.02;
        headTargetY += Math.sin(t * 5) * 0.015;
      }

      // Thinking tilt
      if (mood === "thinking") {
        headTargetZ += Math.sin(t * 0.8) * 0.05;
        headTargetY += 0.15; // Look slightly to the side
      }

      // Embarrassed look away
      if (mood === "embarrassed") {
        headTargetY += 0.25;
        headTargetZ -= 0.1;
      }

      head.rotation.y = damp(head.rotation.y, headTargetY, 5, dt);
      head.rotation.x = damp(head.rotation.x, headTargetX, 5, dt);
      head.rotation.z = damp(head.rotation.z, headTargetZ, 5, dt);
    }

    /* ================================================================ */
    /*  EYES — pupil position tracks cursor, scale for emotion           */
    /* ================================================================ */
    const eyeOffsetX = smoothLookRef.current.x * 0.018;
    const eyeOffsetY = smoothLookRef.current.y * 0.012;

    // Eye white scale for emotion (squint/wide)
    const eyeScaleY = sf.eyeOpen * blinkMult;
    const eyeScaleX = 1 + (sf.eyeOpen - 1) * 0.3; // Wider eyes stretch slightly

    if (leftEyeWhiteRef.current) {
      leftEyeWhiteRef.current.scale.set(eyeScaleX, Math.max(0.05, eyeScaleY), 1);
    }
    if (rightEyeWhiteRef.current) {
      rightEyeWhiteRef.current.scale.set(eyeScaleX, Math.max(0.05, eyeScaleY), 1);
    }

    // Pupil position + scale
    const pScale = sf.pupilScale;
    if (leftEyeRef.current) {
      leftEyeRef.current.position.x = -0.15 + eyeOffsetX;
      leftEyeRef.current.position.y = 0.08 + eyeOffsetY;
      leftEyeRef.current.scale.set(pScale, pScale * Math.max(0.05, blinkMult), pScale);
    }
    if (rightEyeRef.current) {
      rightEyeRef.current.position.x = 0.15 + eyeOffsetX;
      rightEyeRef.current.position.y = 0.08 + eyeOffsetY;
      rightEyeRef.current.scale.set(pScale, pScale * Math.max(0.05, blinkMult), pScale);
    }

    /* ================================================================ */
    /*  EYEBROWS                                                         */
    /* ================================================================ */
    if (leftEyebrowRef.current) {
      leftEyebrowRef.current.position.y = 0.25 + sf.eyebrowY * 0.05;
      leftEyebrowRef.current.rotation.z = sf.eyebrowAngle * 0.15;
    }
    if (rightEyebrowRef.current) {
      rightEyebrowRef.current.position.y = 0.25 + sf.eyebrowY * 0.05;
      rightEyebrowRef.current.rotation.z = -sf.eyebrowAngle * 0.15;
    }

    /* ================================================================ */
    /*  MOUTH — lip-sync + emotion shape                                 */
    /* ================================================================ */
    if (mouthRef.current) {
      let mouthScaleY = sf.mouthOpen;
      let mouthScaleX = sf.mouthWidth;

      // Lip sync overlay when speaking
      if (isSpeaking) {
        // Map audioLevel to 5 viseme-like states
        const vis = audioLevel;
        mouthScaleY = sf.mouthOpen + vis * 1.2 + Math.sin(t * 14) * 0.1;
        mouthScaleX = sf.mouthWidth + vis * 0.3;
      }

      // Yawning mouth
      if (mood === "yawning") {
        const yawnCycle = Math.sin(t * 0.8);
        mouthScaleY = 1.2 + yawnCycle * 0.4;
        mouthScaleX = 1.1 + yawnCycle * 0.2;
      }

      // Clamp
      mouthScaleY = Math.max(0.1, Math.min(2, mouthScaleY));
      mouthScaleX = Math.max(0.5, Math.min(2, mouthScaleX));

      mouthRef.current.scale.set(mouthScaleX, mouthScaleY, 1);

      // Mouth curve — shift position slightly for smile/frown
      mouthRef.current.position.y = -0.13 + sf.mouthCurve * 0.015;
    }

    /* ================================================================ */
    /*  CHEEKS — blush intensity from emotion                            */
    /* ================================================================ */
    if (leftCheekRef.current) {
      (leftCheekRef.current.material as THREE.MeshStandardMaterial).opacity =
        sf.cheekIntensity * 0.6;
    }
    if (rightCheekRef.current) {
      (rightCheekRef.current.material as THREE.MeshStandardMaterial).opacity =
        sf.cheekIntensity * 0.6;
    }

    /* ================================================================ */
    /*  ARMS — emotion-driven + secondary motion                         */
    /* ================================================================ */
    let leftArmTargetX = 0;
    let rightArmTargetX = 0;
    let leftArmTargetZ = 0;
    let rightArmTargetZ = 0;

    if (isSpeaking) {
      // Natural gesticulation
      leftArmTargetX = Math.sin(t * 4) * 0.4 * sf.armActivity;
      rightArmTargetX = Math.sin(t * 4 + 1.5) * 0.4 * sf.armActivity;
      leftArmTargetZ = Math.sin(t * 3) * 0.1;
      rightArmTargetZ = -Math.sin(t * 3) * 0.1;
    } else if (mood === "exercise") {
      leftArmTargetX = Math.sin(t * 4) * 1.0;
      rightArmTargetX = -Math.sin(t * 4) * 1.0;
    } else if (mood === "celebrating") {
      // Arms up celebration
      leftArmTargetX = -2.5 + Math.sin(t * 6) * 0.3;
      rightArmTargetX = -2.5 + Math.sin(t * 6 + 1) * 0.3;
      leftArmTargetZ = Math.sin(t * 4) * 0.2;
      rightArmTargetZ = -Math.sin(t * 4) * 0.2;
    } else if (mood === "stretching") {
      leftArmTargetX = -2.8 + Math.sin(t * 1) * 0.2;
      rightArmTargetX = -2.8 + Math.sin(t * 1 + 0.5) * 0.2;
    } else if (mood === "yawning") {
      // One arm up to cover mouth
      rightArmTargetX = -1.2;
      rightArmTargetZ = -0.3;
    } else if (mood === "thinking") {
      // Hand on chin
      rightArmTargetX = -0.8;
      rightArmTargetZ = -0.4;
    } else if (mood === "embarrassed") {
      // Hand behind head
      rightArmTargetX = -1.5;
      rightArmTargetZ = 0.3;
    } else if (mood === "proud") {
      // Hands on hips
      leftArmTargetZ = 0.6;
      rightArmTargetZ = -0.6;
      leftArmTargetX = 0.3;
      rightArmTargetX = 0.3;
    } else if (mood === "surprised") {
      leftArmTargetX = -0.5;
      rightArmTargetX = -0.5;
      leftArmTargetZ = 0.4;
      rightArmTargetZ = -0.4;
    } else if (mood === "hungry") {
      // Hand on stomach
      rightArmTargetX = 0.4;
      rightArmTargetZ = -0.5;
    } else if (mood === "eating") {
      leftArmTargetX = -0.4 + Math.sin(t * 3) * 0.3;
      rightArmTargetX = -0.4 + Math.sin(t * 3 + 1) * 0.3;
    } else {
      // Idle gentle arm sway
      leftArmTargetX = Math.sin(t * 1.5) * 0.1;
      rightArmTargetX = -Math.sin(t * 1.5) * 0.1;
    }

    if (leftArmRef.current) {
      leftArmRef.current.rotation.x = damp(leftArmRef.current.rotation.x, leftArmTargetX, 6, dt);
      leftArmRef.current.rotation.z = damp(leftArmRef.current.rotation.z, leftArmTargetZ, 6, dt);
    }
    if (rightArmRef.current) {
      rightArmRef.current.rotation.x = damp(rightArmRef.current.rotation.x, rightArmTargetX, 6, dt);
      rightArmRef.current.rotation.z = damp(rightArmRef.current.rotation.z, rightArmTargetZ, 6, dt);
    }

    /* ================================================================ */
    /*  LEGS                                                             */
    /* ================================================================ */
    let leftLegTarget = 0;
    let rightLegTarget = 0;

    if (mood === "exercise") {
      leftLegTarget = Math.sin(t * 6) * 0.4;
      rightLegTarget = -Math.sin(t * 6) * 0.4;
    } else if (mood === "celebrating" || mood === "excited") {
      leftLegTarget = Math.sin(t * 5) * 0.2;
      rightLegTarget = -Math.sin(t * 5) * 0.2;
    } else if (mood === "sleep") {
      leftLegTarget = 0;
      rightLegTarget = 0;
    } else {
      leftLegTarget = Math.sin(t * 1.2) * 0.05;
      rightLegTarget = -Math.sin(t * 1.2) * 0.05;
    }

    if (leftLegRef.current) {
      leftLegRef.current.rotation.x = damp(leftLegRef.current.rotation.x, leftLegTarget, 6, dt);
    }
    if (rightLegRef.current) {
      rightLegRef.current.rotation.x = damp(rightLegRef.current.rotation.x, rightLegTarget, 6, dt);
    }
  });

  /* ================================================================== */
  /*  RENDER                                                             */
  /* ================================================================== */
  return (
    <group ref={groupRef}>
      {/* ---- BODY (torso) ---- */}
      <mesh position={[0, 0.55, 0]} material={mats.shirt} castShadow>
        <capsuleGeometry args={[0.28, 0.35, 8, 16]} />
      </mesh>

      {/* collar / shirt detail */}
      <mesh position={[0, 0.78, 0.12]} material={mats.shirtDark}>
        <sphereGeometry args={[0.12, 12, 8]} />
      </mesh>

      {/* ---- HEAD GROUP ---- */}
      <group ref={headGroupRef} position={[0, 1.15, 0]}>
        {/* head sphere */}
        <mesh material={mats.skin} castShadow>
          <sphereGeometry args={[0.38, 24, 24]} />
        </mesh>

        {/* hair */}
        <mesh position={[0, 0.15, -0.02]} material={mats.hair}>
          <sphereGeometry args={[0.4, 24, 24, 0, Math.PI * 2, 0, Math.PI * 0.55]} />
        </mesh>
        {/* fringe / bangs */}
        <mesh position={[0, 0.2, 0.2]} material={mats.hair}>
          <boxGeometry args={[0.55, 0.12, 0.2]} />
        </mesh>
        {character === "girl" && (
          <>
            {/* pigtails */}
            <mesh position={[-0.38, 0.08, -0.05]} material={mats.hair}>
              <sphereGeometry args={[0.14, 12, 12]} />
            </mesh>
            <mesh position={[0.38, 0.08, -0.05]} material={mats.hair}>
              <sphereGeometry args={[0.14, 12, 12]} />
            </mesh>
            {/* hair ribbons */}
            <mesh position={[-0.35, 0.2, -0.02]}>
              <sphereGeometry args={[0.06, 8, 8]} />
              <meshStandardMaterial color="#ff6b9d" roughness={0.4} />
            </mesh>
            <mesh position={[0.35, 0.2, -0.02]}>
              <sphereGeometry args={[0.06, 8, 8]} />
              <meshStandardMaterial color="#ff6b9d" roughness={0.4} />
            </mesh>
          </>
        )}

        {/* ---- EYEBROWS ---- */}
        <mesh ref={leftEyebrowRef} position={[-0.15, 0.25, 0.34]} material={mats.eyebrow}>
          <boxGeometry args={[0.12, 0.025, 0.02]} />
        </mesh>
        <mesh ref={rightEyebrowRef} position={[0.15, 0.25, 0.34]} material={mats.eyebrow}>
          <boxGeometry args={[0.12, 0.025, 0.02]} />
        </mesh>

        {/* ---- EYES ---- */}
        {/* left eye white */}
        <mesh ref={leftEyeWhiteRef} position={[-0.15, 0.08, 0.32]} material={mats.eyeWhite}>
          <sphereGeometry args={[0.09, 16, 16]} />
        </mesh>
        {/* left eye pupil group */}
        <group ref={leftEyeRef} position={[-0.15, 0.08, 0.38]}>
          <mesh material={mats.eye}>
            <sphereGeometry args={[0.055, 12, 12]} />
          </mesh>
          {/* eye shine */}
          <mesh position={[0.02, 0.025, 0.03]} material={mats.eyeShine}>
            <sphereGeometry args={[0.018, 8, 8]} />
          </mesh>
        </group>

        {/* right eye white */}
        <mesh ref={rightEyeWhiteRef} position={[0.15, 0.08, 0.32]} material={mats.eyeWhite}>
          <sphereGeometry args={[0.09, 16, 16]} />
        </mesh>
        {/* right eye pupil group */}
        <group ref={rightEyeRef} position={[0.15, 0.08, 0.38]}>
          <mesh material={mats.eye}>
            <sphereGeometry args={[0.055, 12, 12]} />
          </mesh>
          <mesh position={[0.02, 0.025, 0.03]} material={mats.eyeShine}>
            <sphereGeometry args={[0.018, 8, 8]} />
          </mesh>
        </group>

        {/* ---- CHEEKS ---- */}
        <mesh ref={leftCheekRef} position={[-0.22, -0.04, 0.3]} material={mats.cheek}>
          <sphereGeometry args={[0.06, 12, 12]} />
        </mesh>
        <mesh ref={rightCheekRef} position={[0.22, -0.04, 0.3]} material={mats.cheek}>
          <sphereGeometry args={[0.06, 12, 12]} />
        </mesh>

        {/* nose */}
        <mesh position={[0, -0.02, 0.38]} material={mats.skin}>
          <sphereGeometry args={[0.035, 10, 10]} />
        </mesh>

        {/* ---- MOUTH ---- */}
        <mesh ref={mouthRef} position={[0, -0.13, 0.34]} material={mats.mouth}>
          <sphereGeometry args={[0.05, 12, 8]} />
        </mesh>

        {/* ears */}
        <mesh position={[-0.36, 0.0, 0.05]} material={mats.skin}>
          <sphereGeometry args={[0.07, 10, 10]} />
        </mesh>
        <mesh position={[0.36, 0.0, 0.05]} material={mats.skin}>
          <sphereGeometry args={[0.07, 10, 10]} />
        </mesh>
      </group>

      {/* ---- ARMS ---- */}
      <group ref={leftArmRef} position={[-0.38, 0.68, 0]}>
        <mesh position={[0, -0.2, 0]} material={mats.shirt} castShadow>
          <capsuleGeometry args={[0.08, 0.22, 6, 12]} />
        </mesh>
        <mesh position={[0, -0.42, 0]} material={mats.skin}>
          <sphereGeometry args={[0.07, 10, 10]} />
        </mesh>
      </group>
      <group ref={rightArmRef} position={[0.38, 0.68, 0]}>
        <mesh position={[0, -0.2, 0]} material={mats.shirt} castShadow>
          <capsuleGeometry args={[0.08, 0.22, 6, 12]} />
        </mesh>
        <mesh position={[0, -0.42, 0]} material={mats.skin}>
          <sphereGeometry args={[0.07, 10, 10]} />
        </mesh>
      </group>

      {/* ---- LEGS ---- */}
      <group ref={leftLegRef} position={[-0.14, 0.2, 0]}>
        <mesh position={[0, -0.12, 0]} material={mats.pants} castShadow>
          <capsuleGeometry args={[0.1, 0.2, 6, 12]} />
        </mesh>
        <mesh position={[0, -0.32, 0.04]} material={mats.shoes}>
          <boxGeometry args={[0.14, 0.08, 0.2]} />
        </mesh>
      </group>
      <group ref={rightLegRef} position={[0.14, 0.2, 0]}>
        <mesh position={[0, -0.12, 0]} material={mats.pants} castShadow>
          <capsuleGeometry args={[0.1, 0.2, 6, 12]} />
        </mesh>
        <mesh position={[0, -0.32, 0.04]} material={mats.shoes}>
          <boxGeometry args={[0.14, 0.08, 0.2]} />
        </mesh>
      </group>
    </group>
  );
}

export default Character3D;
