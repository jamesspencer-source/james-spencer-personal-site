import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Line, RoundedBox } from "@react-three/drei";
import { memo, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import {
  scenePresets,
  type MapFocus,
  type SceneStageId,
  type Vec3
} from "../campusScenePresets";

type ViewportTier = "mobile" | "tablet" | "desktop";
type SceneVariant = "overview" | "narrative";
type MotionProfile = "teaser" | "steady" | "immersive";

export type AtlasSceneProps = {
  activeStage: SceneStageId;
  focus?: MapFocus;
  reducedMotion?: boolean;
  stageProgress?: number;
  variant?: SceneVariant;
  paused?: boolean;
  motionProfile?: MotionProfile;
};

type RouteDefinition = {
  points: Vec3[];
  focus: MapFocus;
  closed?: boolean;
};

const VIEWPORT_CONFIG: Record<
  ViewportTier,
  {
    dpr: [number, number];
    overviewScale: number;
    narrativeScale: number;
    cameraOffset: Vec3;
    rootOffset: Vec3;
  }
> = {
  mobile: {
    dpr: [1, 1.25],
    overviewScale: 0.94,
    narrativeScale: 0.9,
    cameraOffset: [0.2, 0.14, 0.62],
    rootOffset: [0.18, -0.04, 0]
  },
  tablet: {
    dpr: [1, 1.5],
    overviewScale: 1,
    narrativeScale: 0.96,
    cameraOffset: [0.12, 0.08, 0.32],
    rootOffset: [0.08, -0.02, 0]
  },
  desktop: {
    dpr: [1, 1.75],
    overviewScale: 1.08,
    narrativeScale: 1.02,
    cameraOffset: [0.04, 0.02, 0],
    rootOffset: [0, 0, 0]
  }
};

const COLORS = {
  spine: new THREE.Color("#a8b5ba"),
  structure: new THREE.Color("#73828b"),
  frame: new THREE.Color("#516069"),
  panel: new THREE.Color("#27353d"),
  surface: new THREE.Color("#314048"),
  route: new THREE.Color("#8d9ba2"),
  labs: new THREE.Color("#79cca9"),
  program: new THREE.Color("#8fb4ff"),
  network: new THREE.Color("#d9e68c"),
  backdrop: new THREE.Color("#24343e"),
  shadow: new THREE.Color("#12202a")
} as const;

const ROUTES: RouteDefinition[] = [
  {
    focus: "labs",
    points: [
      [0.18, 1.24, 0.08],
      [-0.48, 1.42, 0.12],
      [-1.28, 1.62, 0.16],
      [-2.34, 1.72, 0.18]
    ]
  },
  {
    focus: "labs",
    points: [
      [0.22, 0.12, 0.04],
      [0.86, 0.26, 0.08],
      [1.56, 0.38, 0.1],
      [2.34, 0.52, 0.12]
    ]
  },
  {
    focus: "program",
    points: [
      [0.16, -1.04, 0.04],
      [0.1, -1.46, 0.06],
      [0.02, -1.94, 0.08],
      [0.08, -2.36, 0.1]
    ]
  },
  {
    focus: "network",
    points: [
      [0.16, 1.88, 0.08],
      [0.46, 2.18, 0.1],
      [0.98, 2.48, 0.14],
      [1.68, 2.74, 0.18]
    ]
  }
];

const PROGRAM_LOOP_POINTS: Vec3[] = [
  [-1.84, 0.24, 0.08],
  [-1.84, -0.46, 0.08],
  [-1.4, -0.92, 0.08],
  [1.22, -0.92, 0.08],
  [1.74, -0.42, 0.08],
  [1.74, 0.26, 0.08],
  [1.22, 0.72, 0.08],
  [-1.36, 0.72, 0.08],
  [-1.84, 0.24, 0.08]
];

function dampScalar(
  current: number,
  target: number,
  lambda: number,
  delta: number
) {
  return THREE.MathUtils.damp(current, target, lambda, delta);
}

function dampVector(
  vector: THREE.Vector3,
  target: THREE.Vector3,
  lambda: number,
  delta: number
) {
  vector.set(
    dampScalar(vector.x, target.x, lambda, delta),
    dampScalar(vector.y, target.y, lambda, delta),
    dampScalar(vector.z, target.z, lambda, delta)
  );
}

function dampEuler(
  euler: THREE.Euler,
  target: THREE.Euler,
  lambda: number,
  delta: number
) {
  euler.set(
    dampScalar(euler.x, target.x, lambda, delta),
    dampScalar(euler.y, target.y, lambda, delta),
    dampScalar(euler.z, target.z, lambda, delta)
  );
}

function vec3(values: Vec3) {
  return new THREE.Vector3(values[0], values[1], values[2]);
}

function colorToCss(color: THREE.Color) {
  return `#${color.getHexString()}`;
}

function mixColor(base: THREE.Color, accent: THREE.Color, amount: number) {
  return colorToCss(base.clone().lerp(accent, THREE.MathUtils.clamp(amount, 0, 1)));
}

function getLayerWeight(
  activeStage: SceneStageId,
  focus: MapFocus | undefined,
  layer: MapFocus
) {
  const preset = scenePresets[activeStage];
  const base = preset.layers[layer];

  if (activeStage !== "labs" || !focus || focus === "labs") {
    return base;
  }

  if (layer === focus) {
    return Math.min(1, base + 0.18);
  }

  if (layer === "labs") {
    return base;
  }

  return Math.max(0, base - 0.06);
}

function useViewportTier() {
  const [tier, setTier] = useState<ViewportTier>(() => {
    if (typeof window === "undefined") {
      return "desktop";
    }
    if (window.innerWidth < 720) {
      return "mobile";
    }
    if (window.innerWidth < 1180) {
      return "tablet";
    }
    return "desktop";
  });

  useEffect(() => {
    const updateTier = () => {
      if (window.innerWidth < 720) {
        setTier("mobile");
      } else if (window.innerWidth < 1180) {
        setTier("tablet");
      } else {
        setTier("desktop");
      }
    };

    updateTier();
    window.addEventListener("resize", updateTier);
    return () => window.removeEventListener("resize", updateTier);
  }, []);

  return tier;
}

function useWebGLSupport() {
  const [hasWebGL, setHasWebGL] = useState(true);

  useEffect(() => {
    try {
      const canvas = document.createElement("canvas");
      const context = canvas.getContext("webgl2") ?? canvas.getContext("webgl");
      setHasWebGL(Boolean(context));
    } catch {
      setHasWebGL(false);
    }
  }, []);

  return hasWebGL;
}

function SceneDirector({
  activeStage,
  tier,
  variant,
  reducedMotion,
  paused,
  motionProfile
}: {
  activeStage: SceneStageId;
  tier: ViewportTier;
  variant: SceneVariant;
  reducedMotion: boolean;
  paused: boolean;
  motionProfile: MotionProfile;
}) {
  const { camera } = useThree();
  const perspectiveCamera = camera as THREE.PerspectiveCamera;
  const lookTarget = useRef(new THREE.Vector3());

  useFrame((state, delta) => {
    const preset = scenePresets[activeStage];
    const config = VIEWPORT_CONFIG[tier];
    const time = state.clock.elapsedTime;
    const driftScale =
      paused || reducedMotion
        ? 0
        : motionProfile === "immersive"
          ? 1
          : motionProfile === "steady"
            ? 0.45
            : 0.28;

    const desiredPosition = vec3(preset.camera.position).add(
      vec3(config.cameraOffset)
    );
    const desiredTarget = vec3(preset.camera.target);

    if (variant === "overview") {
      desiredPosition.x += tier === "desktop" ? 0.68 : 0.24;
      desiredPosition.y += tier === "desktop" ? 0.16 : 0.08;
      desiredPosition.z -= tier === "desktop" ? 0.34 : 0.12;
      desiredTarget.x += 0.34;
      desiredTarget.y += 0.08;
    }

    desiredPosition.x += Math.sin(time * 0.22) * preset.motion.drift * 0.42 * driftScale;
    desiredPosition.y += Math.cos(time * 0.18) * preset.motion.drift * 0.26 * driftScale;
    desiredTarget.x += Math.sin(time * 0.2) * preset.motion.drift * 0.08 * driftScale;

    dampVector(perspectiveCamera.position, desiredPosition, 4.8, delta);
    dampVector(lookTarget.current, desiredTarget, 4.8, delta);

    perspectiveCamera.lookAt(lookTarget.current);
    perspectiveCamera.fov = dampScalar(
      perspectiveCamera.fov,
      preset.camera.fov + (variant === "overview" ? -0.8 : 0),
      4.8,
      delta
    );
    perspectiveCamera.updateProjectionMatrix();
  });

  return null;
}

function SceneLighting({
  activeStage
}: {
  activeStage: SceneStageId;
}) {
  const ambientRef = useRef<THREE.AmbientLight>(null);
  const keyRef = useRef<THREE.DirectionalLight>(null);
  const fillRef = useRef<THREE.PointLight>(null);
  const rimRef = useRef<THREE.PointLight>(null);
  const accentRef = useRef<THREE.PointLight>(null);

  useFrame((_, delta) => {
    const preset = scenePresets[activeStage];

    if (ambientRef.current) {
      ambientRef.current.intensity = dampScalar(
        ambientRef.current.intensity,
        preset.lighting.ambient,
        5.6,
        delta
      );
    }

    if (keyRef.current) {
      keyRef.current.intensity = dampScalar(
        keyRef.current.intensity,
        preset.lighting.key,
        5.6,
        delta
      );
      keyRef.current.position.set(4.8, 5.4, 8.6);
    }

    if (fillRef.current) {
      fillRef.current.intensity = dampScalar(
        fillRef.current.intensity,
        preset.lighting.fill,
        5.6,
        delta
      );
      fillRef.current.position.set(-6.4, -1.6, 7.2);
    }

    if (rimRef.current) {
      rimRef.current.intensity = dampScalar(
        rimRef.current.intensity,
        preset.lighting.rim,
        5.6,
        delta
      );
      rimRef.current.position.set(5.4, 2.4, -2.6);
    }

    if (accentRef.current) {
      accentRef.current.intensity = dampScalar(
        accentRef.current.intensity,
        preset.lighting.accent,
        5.6,
        delta
      );
      accentRef.current.position.set(-1.4, 3.8, 4.6);
    }
  });

  return (
    <>
      <ambientLight ref={ambientRef} color="#f0f3ef" intensity={1.04} />
      <directionalLight ref={keyRef} color="#f5f7fc" intensity={1.18} />
      <pointLight ref={fillRef} color="#8fb8aa" intensity={0.72} distance={18} />
      <pointLight ref={rimRef} color="#bfd3ff" intensity={0.42} distance={16} />
      <pointLight ref={accentRef} color="#d8e68c" intensity={0.28} distance={14} />
    </>
  );
}

function BackdropField({
  activeStage
}: {
  activeStage: SceneStageId;
}) {
  const preset = scenePresets[activeStage];

  return (
    <group position={[0, 0.12, -2.4]}>
      <mesh>
        <planeGeometry args={[18, 14]} />
        <meshBasicMaterial
          color={mixColor(COLORS.shadow, COLORS.backdrop, 0.52)}
          transparent
          opacity={0.12 + preset.atmosphere.background * 0.05}
        />
      </mesh>
      <mesh position={[-2.45, 1.02, 0.08]} rotation={[0, 0, -0.14]}>
        <planeGeometry args={[5.8, 2.2]} />
        <meshBasicMaterial
          color={colorToCss(COLORS.labs)}
          transparent
          opacity={0.03 + preset.layers.labs * 0.04}
        />
      </mesh>
      <mesh position={[0.62, -1.96, 0.08]} rotation={[0, 0, 0.06]}>
        <planeGeometry args={[5.2, 2.05]} />
        <meshBasicMaterial
          color={colorToCss(COLORS.program)}
          transparent
          opacity={0.026 + preset.layers.program * 0.05}
        />
      </mesh>
      <mesh position={[1.32, 2.42, 0.08]} rotation={[0, 0, 0.03]}>
        <planeGeometry args={[4.8, 1.82]} />
        <meshBasicMaterial
          color={colorToCss(COLORS.network)}
          transparent
          opacity={0.022 + preset.layers.network * 0.04}
        />
      </mesh>
    </group>
  );
}

function SignalPulses({
  activeStage,
  focus,
  reducedMotion,
  paused
}: {
  activeStage: SceneStageId;
  focus: MapFocus | undefined;
  reducedMotion: boolean;
  paused: boolean;
}) {
  const pulseRefs = useRef<THREE.Mesh[]>([]);
  const routes = useMemo(
    () =>
      ROUTES.map((route) => ({
        curve: new THREE.CatmullRomCurve3(
          route.points.map((point) => vec3(point)),
          route.closed ?? false
        ),
        focus: route.focus
      })),
    []
  );

  pulseRefs.current = [];

  useFrame((state) => {
    const time = state.clock.elapsedTime;
    const preset = scenePresets[activeStage];
    const speedBase =
      reducedMotion || paused ? 0 : 0.04 + preset.motion.signal * 0.05;

    pulseRefs.current.forEach((mesh, index) => {
      const routeMeta = routes[index % routes.length];
      const strength = getLayerWeight(activeStage, focus, routeMeta.focus);
      const progress = reducedMotion
        ? 0.5
        : (time * (speedBase + strength * 0.035) + index * 0.22) % 1;
      const point = routeMeta.curve.getPointAt(progress);
      const tangent = routeMeta.curve.getTangentAt(progress).normalize();
      const quat = new THREE.Quaternion().setFromUnitVectors(
        new THREE.Vector3(1, 0, 0),
        tangent
      );

      mesh.position.copy(point);
      mesh.quaternion.copy(quat);
      mesh.visible = strength > 0.16;
      mesh.scale.set(
        0.08 + strength * 0.1,
        0.028 + strength * 0.008,
        0.028 + strength * 0.008
      );
    });
  });

  return (
    <group>
      {ROUTES.flatMap((route, routeIndex) =>
        [0, 1].map((offset) => {
          const color =
            route.focus === "labs"
              ? COLORS.labs
              : route.focus === "program"
                ? COLORS.program
                : COLORS.network;

          return (
            <mesh
              key={`${route.focus}-${offset}`}
              ref={(node) => {
                if (node) {
                  pulseRefs.current[routeIndex * 2 + offset] = node;
                }
              }}
            >
              <boxGeometry args={[1, 1, 1]} />
              <meshStandardMaterial
                color={colorToCss(color)}
                emissive={colorToCss(color)}
                emissiveIntensity={0.46}
                roughness={0.62}
                metalness={0.02}
              />
            </mesh>
          );
        })
      )}
    </group>
  );
}

function LabDeck({
  position,
  rotation,
  strength,
  mirror,
  deckColor,
  frameColor,
  moduleColor,
  routeColor
}: {
  position: Vec3;
  rotation: Vec3;
  strength: number;
  mirror?: boolean;
  deckColor: string;
  frameColor: string;
  moduleColor: string;
  routeColor: string;
}) {
  return (
    <group position={position} rotation={rotation}>
      <RoundedBox args={[2.48, 0.16, 1.26]} radius={0.08}>
        <meshStandardMaterial
          color={deckColor}
          roughness={0.92}
          metalness={0.03}
          transparent
          opacity={0.32 + strength * 0.6}
        />
      </RoundedBox>

      <RoundedBox args={[2.06, 0.06, 0.94]} position={[0, 0.14, 0]} radius={0.03}>
        <meshStandardMaterial
          color={moduleColor}
          roughness={0.9}
          metalness={0.02}
          transparent
          opacity={0.16 + strength * 0.32}
        />
      </RoundedBox>

      <RoundedBox
        args={[2.18, 0.05, 0.08]}
        position={[0, 0.2, mirror ? 0.42 : -0.42]}
        radius={0.02}
      >
        <meshStandardMaterial
          color={routeColor}
          roughness={0.74}
          metalness={0.02}
          emissive={routeColor}
          emissiveIntensity={0.06 + strength * 0.12}
          transparent
          opacity={0.18 + strength * 0.44}
        />
      </RoundedBox>

      <RoundedBox
        args={[2.18, 0.05, 0.08]}
        position={[0, 0.2, mirror ? -0.42 : 0.42]}
        radius={0.02}
      >
        <meshStandardMaterial
          color={frameColor}
          roughness={0.86}
          metalness={0.02}
          transparent
          opacity={0.16 + strength * 0.38}
        />
      </RoundedBox>

      {[-0.82, 0, 0.82].map((x) => (
        <RoundedBox
          key={`${position[0]}-${x}`}
          args={[0.44, 0.28, 0.24]}
          position={[x, 0.26, 0]}
          radius={0.05}
        >
          <meshStandardMaterial
            color={moduleColor}
            roughness={0.88}
            metalness={0.02}
            transparent
            opacity={0.24 + strength * 0.42}
          />
        </RoundedBox>
      ))}

      <RoundedBox
        args={[0.72, 0.12, 0.26]}
        position={[mirror ? 1.16 : -1.16, -0.12, 0.18]}
        radius={0.04}
      >
        <meshStandardMaterial
          color={frameColor}
          roughness={0.88}
          metalness={0.02}
          transparent
          opacity={0.18 + strength * 0.4}
        />
      </RoundedBox>

      <Line
        points={[
          [-1.04, 0.22, 0.28],
          [0, 0.22, 0.28],
          [1.04, 0.22, 0.28]
        ]}
        color={routeColor}
        lineWidth={1}
        transparent
        opacity={0.18 + strength * 0.42}
      />
    </group>
  );
}

function OperationsDiagram({
  activeStage,
  focus,
  stageProgress,
  tier,
  variant,
  reducedMotion,
  paused,
  motionProfile
}: {
  activeStage: SceneStageId;
  focus: MapFocus | undefined;
  stageProgress: number;
  tier: ViewportTier;
  variant: SceneVariant;
  reducedMotion: boolean;
  paused: boolean;
  motionProfile: MotionProfile;
}) {
  const rootRef = useRef<THREE.Group>(null);
  const labsRef = useRef<THREE.Group>(null);
  const programRef = useRef<THREE.Group>(null);
  const networkRef = useRef<THREE.Group>(null);
  const connectorsRef = useRef<THREE.Group>(null);

  const preset = scenePresets[activeStage];
  const viewport = VIEWPORT_CONFIG[tier];
  const reveal = reducedMotion
    ? 0.22
    : THREE.MathUtils.smoothstep(stageProgress, 0, 1);

  const labsWeight = getLayerWeight(activeStage, focus, "labs");
  const programWeight = getLayerWeight(activeStage, focus, "program");
  const networkWeight = getLayerWeight(activeStage, focus, "network");
  const connectorsWeight = preset.layers.connectors;

  const sceneScale =
    preset.root.scale *
    (variant === "overview" ? viewport.overviewScale : viewport.narrativeScale);
  const sceneOffset = vec3(preset.root.position).add(vec3(viewport.rootOffset));

  const leftLabPosition = useMemo<Vec3>(
    () => [
      -2.44 * preset.diagram.labSpread,
      1.3 + preset.diagram.labLift,
      0.3 + preset.diagram.labDepth
    ],
    [preset]
  );
  const rightLabPosition = useMemo<Vec3>(
    () => [
      2.46 * preset.diagram.labSpread,
      0.36 + preset.diagram.labLift * 0.54,
      -0.22 - preset.diagram.labDepth * 0.84
    ],
    [preset]
  );

  const spineColor = mixColor(COLORS.structure, COLORS.spine, 0.22 + preset.layers.spine * 0.24);
  const frameColor = mixColor(COLORS.frame, COLORS.structure, 0.3 + connectorsWeight * 0.2);
  const deckColor = mixColor(COLORS.surface, COLORS.spine, 0.14);
  const labColor = mixColor(COLORS.surface, COLORS.labs, 0.18 + labsWeight * 0.38);
  const programColor = mixColor(
    COLORS.surface,
    COLORS.program,
    0.2 + programWeight * 0.42
  );
  const networkColor = mixColor(
    COLORS.surface,
    COLORS.network,
    0.2 + networkWeight * 0.42
  );
  const routeLabs = mixColor(COLORS.route, COLORS.labs, 0.24 + labsWeight * 0.54);
  const routeProgram = mixColor(
    COLORS.route,
    COLORS.program,
    0.24 + programWeight * 0.58
  );
  const routeNetwork = mixColor(
    COLORS.route,
    COLORS.network,
    0.24 + networkWeight * 0.58
  );

  useFrame((state, delta) => {
    const time = state.clock.elapsedTime;
    const driftScale =
      paused || reducedMotion
        ? 0
        : motionProfile === "immersive"
          ? 1
          : motionProfile === "steady"
            ? 0.4
            : 0.24;

    if (rootRef.current) {
      const targetPosition = sceneOffset.clone();
      const targetRotation = new THREE.Euler(
        preset.root.rotation[0],
        preset.root.rotation[1],
        preset.root.rotation[2]
      );

      targetPosition.x += Math.sin(time * 0.2) * preset.motion.drift * 0.18 * driftScale;
      targetPosition.y += Math.cos(time * 0.16) * preset.motion.drift * 0.12 * driftScale;
      targetRotation.z += Math.sin(time * 0.18) * preset.motion.drift * 0.03 * driftScale;

      dampVector(rootRef.current.position, targetPosition, 5.2, delta);
      dampEuler(rootRef.current.rotation, targetRotation, 5.2, delta);

      const nextScale = dampScalar(rootRef.current.scale.x, sceneScale, 5.2, delta);
      rootRef.current.scale.setScalar(nextScale);
    }

    if (labsRef.current) {
      const targetPosition = new THREE.Vector3(0, preset.diagram.labLift * 0.06, 0);
      const targetRotation = new THREE.Euler(0.02, -0.03 - reveal * 0.02, 0.01);
      dampVector(labsRef.current.position, targetPosition, 5.2, delta);
      dampEuler(labsRef.current.rotation, targetRotation, 5.2, delta);
    }

    if (programRef.current) {
      const targetPosition = new THREE.Vector3(0, preset.diagram.programLift, 0);
      const targetRotation = new THREE.Euler(0.04, 0.02, -0.02);
      dampVector(programRef.current.position, targetPosition, 5.2, delta);
      dampEuler(programRef.current.rotation, targetRotation, 5.2, delta);
      const nextX = dampScalar(
        programRef.current.scale.x,
        preset.diagram.programScale,
        5.2,
        delta
      );
      programRef.current.scale.set(nextX, 1, nextX);
    }

    if (networkRef.current) {
      const targetPosition = new THREE.Vector3(0, preset.diagram.networkLift, 0.04);
      const targetRotation = new THREE.Euler(0.01, 0.02, 0.01);
      dampVector(networkRef.current.position, targetPosition, 5.2, delta);
      dampEuler(networkRef.current.rotation, targetRotation, 5.2, delta);
      const nextX = dampScalar(
        networkRef.current.scale.x,
        preset.diagram.networkSpread,
        5.2,
        delta
      );
      networkRef.current.scale.set(nextX, 1, 1);
    }

    if (connectorsRef.current) {
      const targetRotation = new THREE.Euler(0, 0, preset.diagram.connectorLean * 0.18);
      dampEuler(connectorsRef.current.rotation, targetRotation, 5.2, delta);
    }
  });

  return (
    <group ref={rootRef}>
      <BackdropField activeStage={activeStage} />

      <group position={[0.12, 0.06, 0]}>
        <RoundedBox args={[0.62, 5.2, 0.18]} radius={0.08}>
          <meshStandardMaterial color={spineColor} roughness={0.94} metalness={0.03} />
        </RoundedBox>

        <RoundedBox args={[0.18, 5.6, 0.12]} position={[-0.48, 0, 0.08]} radius={0.04}>
          <meshStandardMaterial
            color={frameColor}
            roughness={0.92}
            metalness={0.02}
            transparent
            opacity={0.24 + preset.layers.spine * 0.28}
          />
        </RoundedBox>

        <RoundedBox args={[0.18, 5.6, 0.12]} position={[0.48, 0, 0.08]} radius={0.04}>
          <meshStandardMaterial
            color={frameColor}
            roughness={0.92}
            metalness={0.02}
            transparent
            opacity={0.24 + preset.layers.spine * 0.28}
          />
        </RoundedBox>

        {[
          { y: 1.5, width: 1.38 },
          { y: 0.28, width: 1.22 },
          { y: -1.6, width: 1.04 },
          { y: 2.34, width: 0.84 }
        ].map((hub) => (
          <RoundedBox
            key={hub.y}
            args={[hub.width, 0.1, 0.12]}
            position={[0, hub.y, 0.14]}
            radius={0.03}
          >
            <meshStandardMaterial
              color={frameColor}
              roughness={0.9}
              metalness={0.02}
              transparent
              opacity={0.18 + preset.layers.spine * 0.3}
            />
          </RoundedBox>
        ))}

        {[-1.46, -0.42, 0.78].map((y) => (
          <group key={y} position={[0.9, y, 0.12]}>
            <RoundedBox args={[0.56, 0.22, 0.16]} radius={0.03}>
              <meshStandardMaterial
                color={frameColor}
                roughness={0.9}
                metalness={0.02}
                transparent
                opacity={0.16 + connectorsWeight * 0.3}
              />
            </RoundedBox>
            <RoundedBox args={[0.22, 0.1, 0.1]} position={[0.34, 0, 0.08]} radius={0.02}>
              <meshStandardMaterial
                color={spineColor}
                roughness={0.88}
                metalness={0.02}
                transparent
                opacity={0.14 + connectorsWeight * 0.3}
              />
            </RoundedBox>
          </group>
        ))}
      </group>

      <group ref={connectorsRef}>
        <Line
          points={[
            [0.18, 1.24, 0.08],
            [-0.42, 1.38, 0.12],
            [-1.2, 1.56, 0.16],
            [-2.16, 1.66, 0.18]
          ]}
          color={routeLabs}
          lineWidth={1.4}
          transparent
          opacity={0.16 + connectorsWeight * 0.42}
        />
        <Line
          points={[
            [0.18, 0.14, 0.08],
            [0.8, 0.28, 0.1],
            [1.46, 0.4, 0.12],
            [2.16, 0.52, 0.14]
          ]}
          color={routeLabs}
          lineWidth={1.4}
          transparent
          opacity={0.16 + connectorsWeight * 0.42}
        />
        <Line
          points={[
            [0.14, -1.12, 0.06],
            [0.1, -1.5, 0.08],
            [0.02, -1.9, 0.08],
            [0.08, -2.2, 0.1]
          ]}
          color={routeProgram}
          lineWidth={1.4}
          transparent
          opacity={0.16 + connectorsWeight * 0.42}
        />
        <Line
          points={[
            [0.16, 1.84, 0.08],
            [0.38, 2.12, 0.1],
            [0.92, 2.42, 0.14],
            [1.56, 2.72, 0.18]
          ]}
          color={routeNetwork}
          lineWidth={1.4}
          transparent
          opacity={0.16 + connectorsWeight * 0.42}
        />
      </group>

      <group ref={labsRef}>
        <LabDeck
          position={leftLabPosition}
          rotation={[0.02, 0.08, 0]}
          strength={labsWeight}
          deckColor={deckColor}
          frameColor={labColor}
          moduleColor={mixColor(COLORS.panel, COLORS.labs, 0.16 + labsWeight * 0.18)}
          routeColor={routeLabs}
        />

        <LabDeck
          position={rightLabPosition}
          rotation={[-0.01, -0.08, 0.02]}
          strength={labsWeight}
          mirror
          deckColor={deckColor}
          frameColor={labColor}
          moduleColor={mixColor(COLORS.panel, COLORS.labs, 0.16 + labsWeight * 0.18)}
          routeColor={routeLabs}
        />
      </group>

      <group ref={programRef} position={[0.08, -2.02, 0.08]}>
        <RoundedBox args={[2.4, 0.1, 0.46]} position={[0, -0.1, -0.02]} radius={0.08}>
          <meshStandardMaterial
            color={mixColor(COLORS.panel, COLORS.program, 0.12 + programWeight * 0.2)}
            roughness={0.9}
            metalness={0.02}
            transparent
            opacity={0.14 + programWeight * 0.28}
          />
        </RoundedBox>

        <Line
          points={PROGRAM_LOOP_POINTS}
          color={routeProgram}
          lineWidth={1.5}
          transparent
          opacity={0.2 + programWeight * 0.52}
        />

        {[-1.38, -0.48, 0.46, 1.34].map((x) => (
          <group key={x} position={[x, 0, 0.1]}>
            <RoundedBox args={[0.1, 0.72, 0.12]} position={[-0.08, 0.02, 0]} radius={0.03}>
              <meshStandardMaterial
                color={programColor}
                roughness={0.86}
                metalness={0.02}
                transparent
                opacity={0.18 + programWeight * 0.52}
              />
            </RoundedBox>
            <RoundedBox args={[0.1, 0.72, 0.12]} position={[0.08, 0.02, 0]} radius={0.03}>
              <meshStandardMaterial
                color={programColor}
                roughness={0.86}
                metalness={0.02}
                transparent
                opacity={0.18 + programWeight * 0.52}
              />
            </RoundedBox>
            <RoundedBox args={[0.34, 0.08, 0.12]} position={[0, 0.34, 0]} radius={0.03}>
              <meshStandardMaterial
                color={routeProgram}
                roughness={0.72}
                metalness={0.02}
                emissive={routeProgram}
                emissiveIntensity={0.06 + programWeight * 0.12}
                transparent
                opacity={0.18 + programWeight * 0.42}
              />
            </RoundedBox>
          </group>
        ))}

        {[-1.44, -0.52, 0.38, 1.28].map((x) => (
          <RoundedBox
            key={`marker-${x}`}
            args={[0.26, 0.08, 0.12]}
            position={[x, -0.78, 0.08]}
            radius={0.03}
          >
            <meshStandardMaterial
              color={programColor}
              roughness={0.86}
              metalness={0.02}
              transparent
              opacity={0.18 + programWeight * 0.38}
            />
          </RoundedBox>
        ))}
      </group>

      <group ref={networkRef} position={[0.18, 2.16, 0.12]}>
        <RoundedBox args={[4.32, 0.12, 0.12]} radius={0.03}>
          <meshStandardMaterial
            color={routeNetwork}
            roughness={0.74}
            metalness={0.02}
            emissive={routeNetwork}
            emissiveIntensity={0.06 + networkWeight * 0.14}
            transparent
            opacity={0.18 + networkWeight * 0.5}
          />
        </RoundedBox>

        <RoundedBox args={[3.14, 0.08, 0.12]} position={[0.22, 0.84, 0.1]} radius={0.03}>
          <meshStandardMaterial
            color={networkColor}
            roughness={0.86}
            metalness={0.02}
            transparent
            opacity={0.16 + networkWeight * 0.44}
          />
        </RoundedBox>

        {[-1.5, -0.42, 0.68, 1.82].map((x, index) => (
          <RoundedBox
            key={`bridge-${x}`}
            args={[0.1, 0.88 + index * 0.08, 0.1]}
            position={[x, 0.42 + index * 0.08, 0]}
            radius={0.03}
          >
            <meshStandardMaterial
              color={networkColor}
              roughness={0.86}
              metalness={0.02}
              transparent
              opacity={0.16 + networkWeight * 0.48}
            />
          </RoundedBox>
        ))}

        {[-1.7, -0.68, 0.42, 1.46].map((x) => (
          <group key={`cluster-${x}`} position={[x, 0.88, 0.1]}>
            {[-0.18, 0, 0.18].map((offset) => (
              <RoundedBox
                key={`${x}-${offset}`}
                args={[0.16, 0.16, 0.12]}
                position={[offset, 0, 0]}
                radius={0.03}
              >
                <meshStandardMaterial
                  color={mixColor(COLORS.panel, COLORS.network, 0.14 + networkWeight * 0.18)}
                  roughness={0.84}
                  metalness={0.02}
                  transparent
                  opacity={0.2 + networkWeight * 0.4}
                />
              </RoundedBox>
            ))}
          </group>
        ))}

        <Line
          points={[
            [-1.82, 0.04, 0],
            [-1.02, 0.74, 0.08],
            [0.18, 1.08, 0.12],
            [1.12, 0.82, 0.08],
            [1.86, 0.08, 0]
          ]}
          color={routeNetwork}
          lineWidth={1.15}
          transparent
          opacity={0.18 + networkWeight * 0.42}
        />
      </group>

      <SignalPulses
        activeStage={activeStage}
        focus={focus}
        reducedMotion={reducedMotion}
        paused={paused}
      />
    </group>
  );
}

function AtlasFallback({
  activeStage,
  variant
}: {
  activeStage: SceneStageId;
  variant: SceneVariant;
}) {
  return (
    <div
      className={`atlas-fallback atlas-fallback--${activeStage} atlas-fallback--${variant}`}
      aria-hidden="true"
    >
      <div className="atlas-fallback__map">
        <div className="atlas-fallback__spine" />
        <div className="atlas-fallback__lab atlas-fallback__lab--left" />
        <div className="atlas-fallback__lab atlas-fallback__lab--right" />
        <div className="atlas-fallback__program-loop" />
        <div className="atlas-fallback__program-gate atlas-fallback__program-gate--a" />
        <div className="atlas-fallback__program-gate atlas-fallback__program-gate--b" />
        <div className="atlas-fallback__network-bar" />
        <div className="atlas-fallback__network-node atlas-fallback__network-node--a" />
        <div className="atlas-fallback__network-node atlas-fallback__network-node--b" />
        <div className="atlas-fallback__network-node atlas-fallback__network-node--c" />
        <div className="atlas-fallback__route atlas-fallback__route--labs-a" />
        <div className="atlas-fallback__route atlas-fallback__route--labs-b" />
        <div className="atlas-fallback__route atlas-fallback__route--program" />
        <div className="atlas-fallback__route atlas-fallback__route--network" />
        <div className="atlas-fallback__glow atlas-fallback__glow--labs" />
        <div className="atlas-fallback__glow atlas-fallback__glow--program" />
        <div className="atlas-fallback__glow atlas-fallback__glow--network" />
      </div>
    </div>
  );
}

function SceneContent({
  activeStage,
  focus,
  reducedMotion,
  stageProgress,
  variant,
  paused,
  tier,
  motionProfile
}: {
  activeStage: SceneStageId;
  focus: MapFocus | undefined;
  reducedMotion: boolean;
  stageProgress: number;
  variant: SceneVariant;
  paused: boolean;
  tier: ViewportTier;
  motionProfile: MotionProfile;
}) {
  const preset = scenePresets[activeStage];

  return (
    <>
      <fog
        attach="fog"
        args={[
          preset.atmosphere.fogColor,
          preset.atmosphere.fogNear + (variant === "overview" ? 1.2 : 0),
          preset.atmosphere.fogFar
        ]}
      />
      <SceneLighting activeStage={activeStage} />
      <SceneDirector
        activeStage={activeStage}
        tier={tier}
        variant={variant}
        reducedMotion={reducedMotion}
        paused={paused}
        motionProfile={motionProfile}
      />
      <OperationsDiagram
        activeStage={activeStage}
        focus={focus}
        stageProgress={stageProgress}
        tier={tier}
        variant={variant}
        reducedMotion={reducedMotion}
        paused={paused}
        motionProfile={motionProfile}
      />
    </>
  );
}

export const AtlasScene = memo(function AtlasScene({
  activeStage,
  focus,
  reducedMotion = false,
  stageProgress = 0.5,
  variant = "narrative",
  paused = false,
  motionProfile = "steady"
}: AtlasSceneProps) {
  const tier = useViewportTier();
  const hasWebGL = useWebGLSupport();

  if (!hasWebGL) {
    return <AtlasFallback activeStage={activeStage} variant={variant} />;
  }

  return (
    <div className="atlas-scene">
      <Canvas
        className="atlas-scene__canvas"
        dpr={VIEWPORT_CONFIG[tier].dpr}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
        camera={{ position: [0, 0.8, 9.8], fov: 23, near: 0.1, far: 44 }}
      >
        <SceneContent
          activeStage={activeStage}
          focus={focus}
          reducedMotion={reducedMotion}
          stageProgress={stageProgress}
          variant={variant}
          paused={paused}
          tier={tier}
          motionProfile={motionProfile}
        />
      </Canvas>
    </div>
  );
});
