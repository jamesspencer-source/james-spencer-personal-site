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
    narrativeScale: 0.88,
    cameraOffset: [0.22, 0.18, 0.68],
    rootOffset: [0.14, -0.06, 0]
  },
  tablet: {
    dpr: [1, 1.5],
    overviewScale: 1,
    narrativeScale: 0.96,
    cameraOffset: [0.16, 0.08, 0.32],
    rootOffset: [0.08, -0.02, 0]
  },
  desktop: {
    dpr: [1, 1.75],
    overviewScale: 1.08,
    narrativeScale: 1.04,
    cameraOffset: [0.04, 0.02, 0],
    rootOffset: [0, 0, 0]
  }
};

const COLORS = {
  structure: new THREE.Color("#74848b"),
  structureSoft: new THREE.Color("#55646b"),
  spine: new THREE.Color("#90a3a8"),
  panel: new THREE.Color("#25333b"),
  glass: new THREE.Color("#425761"),
  labs: new THREE.Color("#76cca3"),
  program: new THREE.Color("#8eb7ff"),
  network: new THREE.Color("#d6e98e"),
  muted: new THREE.Color("#64737a"),
  backdrop: new THREE.Color("#17313a")
} as const;

const SPINE_MODULES = [-1.84, -1.16, -0.48, 0.22, 0.92, 1.62];
const LAB_BAY_X = [-0.8, 0, 0.8];
const NETWORK_NODE_X = [-2.1, -0.8, 0.6, 2];
const ROUTES: RouteDefinition[] = [
  {
    focus: "labs",
    points: [
      [0.18, 1.22, 0.26],
      [-0.6, 1.22, 0.28],
      [-1.48, 1.22, 0.36],
      [-2.82, 1.16, 0.42]
    ]
  },
  {
    focus: "labs",
    points: [
      [0.16, 0.26, 0.16],
      [0.88, 0.26, 0.24],
      [1.68, 0.26, 0.34],
      [2.86, 0.18, 0.44]
    ]
  },
  {
    focus: "program",
    closed: true,
    points: [
      [-1.68, -1.74, 0.12],
      [1.62, -1.74, 0.16],
      [2.1, -1.18, 0.22],
      [1.52, -0.58, 0.2],
      [-1.42, -0.58, 0.12],
      [-1.92, -1.18, 0.08]
    ]
  },
  {
    focus: "network",
    points: [
      [-2.18, 2.34, 0.24],
      [-0.88, 2.54, 0.32],
      [0.54, 2.62, 0.26],
      [2.18, 2.42, 0.18]
    ]
  }
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

function getLayerStrength(
  activeStage: SceneStageId,
  focus: MapFocus | undefined,
  layer: MapFocus
) {
  const preset = scenePresets[activeStage];
  const base = preset.layers[layer];

  if (activeStage !== "labs" || !focus || focus === layer) {
    return base;
  }

  return layer === focus ? Math.min(1, base + 0.16) : base;
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
      const context =
        canvas.getContext("webgl2") ?? canvas.getContext("webgl");
      setHasWebGL(Boolean(context));
    } catch {
      setHasWebGL(false);
    }
  }, []);

  return hasWebGL;
}

function SceneDirector({
  activeStage,
  stageProgress,
  tier,
  variant,
  reducedMotion,
  paused,
  motionProfile
}: {
  activeStage: SceneStageId;
  stageProgress: number;
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
    const reveal = reducedMotion
      ? 0.22
      : THREE.MathUtils.smoothstep(stageProgress, 0, 1);
    const driftScale =
      paused || reducedMotion
        ? 0
        : motionProfile === "immersive"
          ? 1
          : motionProfile === "steady"
            ? 0.45
            : 0.3;
    const time = state.clock.elapsedTime;

    const desiredPosition = vec3(preset.camera.position)
      .add(vec3(config.cameraOffset))
      .add(
        new THREE.Vector3(
          preset.camera.travel[0] * reveal,
          preset.camera.travel[1] * reveal,
          preset.camera.travel[2] * reveal
        )
      );

    const desiredTarget = vec3(preset.camera.target).add(
      new THREE.Vector3(
        preset.camera.targetTravel[0] * reveal,
        preset.camera.targetTravel[1] * reveal,
        preset.camera.targetTravel[2] * reveal
      )
    );

    if (variant === "overview") {
      desiredPosition.x += tier === "desktop" ? 0.48 : 0.22;
      desiredPosition.y += tier === "mobile" ? 0.1 : 0.22;
      desiredPosition.z += tier === "desktop" ? 0.24 : 0.12;
      desiredTarget.x += 0.18;
    }

    desiredPosition.x += Math.sin(time * 0.32) * preset.motion.drift * driftScale;
    desiredPosition.y += Math.cos(time * 0.28) * preset.motion.float * driftScale;
    desiredTarget.x += Math.sin(time * 0.26) * preset.motion.drift * 0.28 * driftScale;

    dampVector(perspectiveCamera.position, desiredPosition, 4.4, delta);
    dampVector(lookTarget.current, desiredTarget, 4.4, delta);

    perspectiveCamera.lookAt(lookTarget.current);
    perspectiveCamera.fov = dampScalar(
      perspectiveCamera.fov,
      preset.camera.fov + (variant === "overview" ? -0.8 : 0),
      4.4,
      delta
    );
    perspectiveCamera.updateProjectionMatrix();
  });

  return null;
}

function SceneLighting({
  activeStage,
  reducedMotion,
  stageProgress
}: {
  activeStage: SceneStageId;
  reducedMotion: boolean;
  stageProgress: number;
}) {
  const ambientRef = useRef<THREE.AmbientLight>(null);
  const keyRef = useRef<THREE.DirectionalLight>(null);
  const fillRef = useRef<THREE.PointLight>(null);
  const rimRef = useRef<THREE.PointLight>(null);
  const hazeRef = useRef<THREE.PointLight>(null);

  useFrame((state, delta) => {
    const preset = scenePresets[activeStage];
    const reveal = reducedMotion
      ? 0.18
      : THREE.MathUtils.smoothstep(stageProgress, 0, 1);

    if (ambientRef.current) {
      ambientRef.current.intensity = dampScalar(
        ambientRef.current.intensity,
        preset.lighting.ambient + reveal * 0.08,
        5.8,
        delta
      );
    }

    if (keyRef.current) {
      keyRef.current.intensity = dampScalar(
        keyRef.current.intensity,
        preset.lighting.key + reveal * 0.1,
        5.8,
        delta
      );
      keyRef.current.position.set(5.2, 5.8, 8.6);
    }

    if (fillRef.current) {
      fillRef.current.intensity = dampScalar(
        fillRef.current.intensity,
        preset.lighting.fill,
        5.8,
        delta
      );
      fillRef.current.position.set(-6.6, -1.2, 7.4);
    }

    if (rimRef.current) {
      rimRef.current.intensity = dampScalar(
        rimRef.current.intensity,
        preset.lighting.rim,
        5.8,
        delta
      );
      rimRef.current.position.set(5.8, 3.2, -3.8);
    }

    if (hazeRef.current) {
      hazeRef.current.intensity = dampScalar(
        hazeRef.current.intensity,
        preset.lighting.haze,
        5.8,
        delta
      );
      hazeRef.current.position.set(0, 1.8, 4.4);
    }
  });

  return (
    <>
      <ambientLight ref={ambientRef} color="#dbe6e3" intensity={0.96} />
      <directionalLight
        ref={keyRef}
        color="#f3f7ff"
        intensity={1.18}
        castShadow={false}
      />
      <pointLight ref={fillRef} color="#7aa59a" intensity={0.72} distance={18} />
      <pointLight ref={rimRef} color="#cfdcf3" intensity={0.72} distance={18} />
      <pointLight ref={hazeRef} color="#9bd4bc" intensity={0.4} distance={16} />
    </>
  );
}

function Backfield({
  activeStage
}: {
  activeStage: SceneStageId;
}) {
  const preset = scenePresets[activeStage];
  const labStrength = preset.layers.labs;
  const programStrength = preset.layers.program;
  const networkStrength = preset.layers.network;

  return (
    <group position={[0, 0.25, -2.4]}>
      <mesh>
        <planeGeometry args={[18, 14]} />
        <meshBasicMaterial
          color={mixColor(COLORS.backdrop, COLORS.structure, 0.12)}
          transparent
          opacity={0.14 + preset.atmosphere.background * 0.05}
        />
      </mesh>
      <mesh position={[-2.4, 0.8, 0.08]}>
        <circleGeometry args={[2.1, 40]} />
        <meshBasicMaterial
          color={colorToCss(COLORS.labs)}
          transparent
          opacity={0.03 + labStrength * 0.05}
        />
      </mesh>
      <mesh position={[1.3, -1.48, 0.08]}>
        <circleGeometry args={[1.85, 40]} />
        <meshBasicMaterial
          color={colorToCss(COLORS.program)}
          transparent
          opacity={0.02 + programStrength * 0.06}
        />
      </mesh>
      <mesh position={[1.8, 2.16, 0.06]}>
        <circleGeometry args={[1.5, 40]} />
        <meshBasicMaterial
          color={colorToCss(COLORS.network)}
          transparent
          opacity={0.018 + networkStrength * 0.05}
        />
      </mesh>
    </group>
  );
}

function SignalPulses({
  activeStage,
  reducedMotion,
  paused
}: {
  activeStage: SceneStageId;
  reducedMotion: boolean;
  paused: boolean;
}) {
  const pulseRefs = useRef<THREE.Mesh[]>([]);
  const routes = useMemo(
    () =>
      ROUTES.map((route) => ({
        curve: new THREE.CatmullRomCurve3(route.points.map((point) => vec3(point)), route.closed),
        focus: route.focus
      })),
    []
  );

  pulseRefs.current = [];

  useFrame((state) => {
    const time = state.clock.elapsedTime;
    const preset = scenePresets[activeStage];
    const speedBase = reducedMotion || paused ? 0 : 0.045 + preset.motion.pulse * 0.06;

    pulseRefs.current.forEach((mesh, index) => {
      const routeMeta = routes[index % routes.length];
      const strength = getLayerStrength(activeStage, undefined, routeMeta.focus);
      const progress = reducedMotion
        ? 0.5
        : (time * (speedBase + strength * 0.035) + index * 0.19) % 1;
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
        0.12 + strength * 0.12,
        0.035 + strength * 0.012,
        0.035 + strength * 0.012
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
                emissiveIntensity={0.8}
                roughness={0.28}
                metalness={0.08}
              />
            </mesh>
          );
        })
      )}
    </group>
  );
}

function OperationsMap({
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
  const routesRef = useRef<THREE.Group>(null);

  const preset = scenePresets[activeStage];
  const viewport = VIEWPORT_CONFIG[tier];
  const reveal = reducedMotion
    ? 0.18
    : THREE.MathUtils.smoothstep(stageProgress, 0, 1);
  const stageLabStrength = getLayerStrength(activeStage, focus, "labs");
  const stageProgramStrength = getLayerStrength(activeStage, focus, "program");
  const stageNetworkStrength = getLayerStrength(activeStage, focus, "network");
  const sceneScale =
    preset.root.scale *
    (variant === "overview" ? viewport.overviewScale : viewport.narrativeScale);
  const sceneOffset = vec3(preset.root.position).add(vec3(viewport.rootOffset));

  const labDeckOffset = 2.34 * preset.structure.labSpread;
  const labDepth = 0.24 + preset.structure.labDepth;
  const programY = -1.9 + preset.structure.programRise;
  const networkY = 2.12 + preset.structure.networkLift;
  const networkSpan = 0.86 + preset.structure.networkSpan * 0.28;

  const structureColor = mixColor(
    COLORS.structureSoft,
    COLORS.spine,
    0.18 + preset.layers.spine * 0.22
  );
  const spineColor = mixColor(COLORS.structure, COLORS.labs, 0.12 + preset.layers.spine * 0.12);
  const labColor = mixColor(COLORS.structureSoft, COLORS.labs, 0.14 + stageLabStrength * 0.42);
  const labFrameColor = mixColor(COLORS.spine, COLORS.labs, 0.18 + stageLabStrength * 0.46);
  const programColor = mixColor(
    COLORS.structureSoft,
    COLORS.program,
    0.18 + stageProgramStrength * 0.48
  );
  const programGlass = mixColor(COLORS.panel, COLORS.program, 0.16 + stageProgramStrength * 0.28);
  const networkColor = mixColor(
    COLORS.structureSoft,
    COLORS.network,
    0.16 + stageNetworkStrength * 0.48
  );
  const routeLabs = mixColor(COLORS.muted, COLORS.labs, 0.18 + stageLabStrength * 0.54);
  const routeProgram = mixColor(COLORS.muted, COLORS.program, 0.18 + stageProgramStrength * 0.54);
  const routeNetwork = mixColor(COLORS.muted, COLORS.network, 0.18 + stageNetworkStrength * 0.54);

  useFrame((state, delta) => {
    const driftScale =
      paused || reducedMotion
        ? 0
        : motionProfile === "immersive"
          ? 1
          : motionProfile === "steady"
            ? 0.45
            : 0.3;
    const time = state.clock.elapsedTime;

    if (rootRef.current) {
      const targetPosition = sceneOffset.clone();
      const targetRotation = new THREE.Euler(
        preset.root.rotation[0],
        preset.root.rotation[1],
        preset.root.rotation[2]
      );

      targetPosition.x += Math.sin(time * 0.28) * preset.motion.drift * 0.16 * driftScale;
      targetPosition.y += Math.cos(time * 0.22) * preset.motion.float * 0.18 * driftScale;
      targetRotation.z += Math.sin(time * 0.26) * preset.motion.drift * 0.04 * driftScale;

      dampVector(rootRef.current.position, targetPosition, 5.2, delta);
      dampEuler(rootRef.current.rotation, targetRotation, 5.2, delta);

      const nextScale = dampScalar(
        rootRef.current.scale.x,
        sceneScale,
        5.2,
        delta
      );
      rootRef.current.scale.setScalar(nextScale);
    }

    if (labsRef.current) {
      const targetRotation = new THREE.Euler(
        0.04,
        -0.04 - reveal * 0.03,
        0.02
      );

      dampEuler(labsRef.current.rotation, targetRotation, 5.2, delta);
    }

    if (programRef.current) {
      const targetRotation = new THREE.Euler(
        0.06 + reveal * 0.02,
        0.04,
        -0.04
      );

      dampEuler(programRef.current.rotation, targetRotation, 5.2, delta);
    }

    if (networkRef.current) {
      const targetRotation = new THREE.Euler(
        -0.02 + preset.structure.networkTilt * 0.12,
        0.06,
        preset.structure.networkTilt * 0.08
      );

      dampEuler(networkRef.current.rotation, targetRotation, 5.2, delta);
    }

    if (routesRef.current) {
      const targetRotation = new THREE.Euler(0.02, 0.02, 0);
      dampEuler(routesRef.current.rotation, targetRotation, 5.2, delta);
    }
  });

  return (
    <group ref={rootRef}>
      <Backfield activeStage={activeStage} />

      <group position={[0, preset.structure.spineLift, 0]}>
        <RoundedBox args={[0.64, 5.5, 0.38]} radius={0.08} smoothness={4}>
          <meshStandardMaterial
            color={spineColor}
            roughness={0.88}
            metalness={0.12}
          />
        </RoundedBox>

        <RoundedBox args={[0.18, 5.96, 0.18]} position={[-0.54, 0, 0.12]} radius={0.04}>
          <meshStandardMaterial
            color={structureColor}
            roughness={0.9}
            metalness={0.1}
          />
        </RoundedBox>
        <RoundedBox args={[0.18, 5.96, 0.18]} position={[0.54, 0, 0.12]} radius={0.04}>
          <meshStandardMaterial
            color={structureColor}
            roughness={0.9}
            metalness={0.1}
          />
        </RoundedBox>

        <Line
          points={[
            [-0.74, 2.66, 0.22],
            [0.74, 2.66, 0.22],
            [0.74, -2.66, 0.22],
            [-0.74, -2.66, 0.22],
            [-0.74, 2.66, 0.22]
          ]}
          color={mixColor(COLORS.muted, COLORS.spine, 0.22 + preset.layers.spine * 0.2)}
          lineWidth={0.9}
          transparent
          opacity={0.16 + preset.layers.spine * 0.22}
        />

        {SPINE_MODULES.map((y) => (
          <group key={y}>
            <RoundedBox
              args={[1.36, 0.16, 0.12]}
              position={[0, y, 0.2]}
              radius={0.03}
            >
              <meshStandardMaterial
                color={structureColor}
                roughness={0.88}
                metalness={0.12}
              />
            </RoundedBox>
            <RoundedBox
              args={[0.88, 0.42, 0.22]}
              position={[0, y + 0.06, 0.04]}
              radius={0.05}
            >
              <meshPhysicalMaterial
                color={mixColor(COLORS.panel, COLORS.structure, 0.16)}
                roughness={0.4}
                metalness={0.08}
                transmission={0.18}
                transparent
                opacity={0.84}
              />
            </RoundedBox>
          </group>
        ))}
      </group>

      <group ref={labsRef}>
        <group position={[-labDeckOffset, 1.12, 0.34 + labDepth]} rotation={[0.03, 0.22, -0.04]}>
          <RoundedBox args={[2.7, 0.2, 1.26]} radius={0.07}>
            <meshStandardMaterial
              color={labColor}
              roughness={0.84}
              metalness={0.12}
              transparent
              opacity={0.32 + stageLabStrength * 0.62}
            />
          </RoundedBox>
          <RoundedBox args={[2.4, 0.08, 0.18]} position={[0, 0.18, 0.46]} radius={0.02}>
            <meshStandardMaterial
              color={routeLabs}
              roughness={0.44}
              metalness={0.08}
              emissive={routeLabs}
              emissiveIntensity={0.08 + stageLabStrength * 0.16}
            />
          </RoundedBox>
          {LAB_BAY_X.map((x) => (
            <RoundedBox
              key={`left-${x}`}
              args={[0.42, 0.28, 0.3]}
              position={[x, 0.24, -0.1]}
              radius={0.05}
            >
              <meshPhysicalMaterial
                color={mixColor(COLORS.panel, COLORS.labs, 0.14 + stageLabStrength * 0.12)}
                roughness={0.34}
                metalness={0.08}
                transmission={0.22}
                transparent
                opacity={0.72}
              />
            </RoundedBox>
          ))}
          <RoundedBox args={[2.18, 0.1, 0.12]} position={[0, -0.18, -0.46]} radius={0.02}>
            <meshStandardMaterial
              color={labFrameColor}
              roughness={0.8}
              metalness={0.1}
              transparent
              opacity={0.22 + stageLabStrength * 0.44}
            />
          </RoundedBox>
        </group>

        <group position={[labDeckOffset, 0.08, -0.2 - labDepth]} rotation={[-0.02, -0.2, 0.05]}>
          <RoundedBox args={[2.78, 0.2, 1.18]} radius={0.07}>
            <meshStandardMaterial
              color={labColor}
              roughness={0.84}
              metalness={0.12}
              transparent
              opacity={0.3 + stageLabStrength * 0.64}
            />
          </RoundedBox>
          <RoundedBox args={[2.36, 0.08, 0.18]} position={[0, 0.18, -0.42]} radius={0.02}>
            <meshStandardMaterial
              color={routeLabs}
              roughness={0.44}
              metalness={0.08}
              emissive={routeLabs}
              emissiveIntensity={0.08 + stageLabStrength * 0.16}
            />
          </RoundedBox>
          {LAB_BAY_X.map((x) => (
            <RoundedBox
              key={`right-${x}`}
              args={[0.46, 0.3, 0.32]}
              position={[x, 0.24, 0.08]}
              radius={0.05}
            >
              <meshPhysicalMaterial
                color={mixColor(COLORS.panel, COLORS.labs, 0.14 + stageLabStrength * 0.12)}
                roughness={0.34}
                metalness={0.08}
                transmission={0.22}
                transparent
                opacity={0.72}
              />
            </RoundedBox>
          ))}
          <RoundedBox args={[2.26, 0.1, 0.12]} position={[0, -0.18, 0.44]} radius={0.02}>
            <meshStandardMaterial
              color={labFrameColor}
              roughness={0.8}
              metalness={0.1}
              transparent
              opacity={0.22 + stageLabStrength * 0.44}
            />
          </RoundedBox>
        </group>
      </group>

      <group ref={programRef} position={[0.28, programY, 0.1]}>
        <RoundedBox args={[3.64, 0.1, 0.12]} position={[0, 0.66, 0]} radius={0.03}>
          <meshStandardMaterial
            color={routeProgram}
            roughness={0.5}
            metalness={0.08}
            emissive={routeProgram}
            emissiveIntensity={0.06 + stageProgramStrength * 0.14}
            transparent
            opacity={0.22 + stageProgramStrength * 0.48}
          />
        </RoundedBox>
        <RoundedBox args={[3.64, 0.1, 0.12]} position={[0, -0.66, 0]} radius={0.03}>
          <meshStandardMaterial
            color={routeProgram}
            roughness={0.5}
            metalness={0.08}
            emissive={routeProgram}
            emissiveIntensity={0.06 + stageProgramStrength * 0.14}
            transparent
            opacity={0.22 + stageProgramStrength * 0.48}
          />
        </RoundedBox>
        <RoundedBox args={[0.12, 1.44, 0.12]} position={[-1.82, 0, 0]} radius={0.03}>
          <meshStandardMaterial
            color={routeProgram}
            roughness={0.5}
            metalness={0.08}
            emissive={routeProgram}
            emissiveIntensity={0.06 + stageProgramStrength * 0.14}
            transparent
            opacity={0.22 + stageProgramStrength * 0.48}
          />
        </RoundedBox>
        <RoundedBox args={[0.12, 1.44, 0.12]} position={[1.82, 0, 0]} radius={0.03}>
          <meshStandardMaterial
            color={routeProgram}
            roughness={0.5}
            metalness={0.08}
            emissive={routeProgram}
            emissiveIntensity={0.06 + stageProgramStrength * 0.14}
            transparent
            opacity={0.22 + stageProgramStrength * 0.48}
          />
        </RoundedBox>

        <RoundedBox
          args={[2.74, 1.02, 0.18]}
          position={[0, 0, -0.08]}
          radius={0.14}
          smoothness={3}
        >
          <meshPhysicalMaterial
            color={programGlass}
            roughness={0.22}
            metalness={0.06}
            transmission={0.32}
            transparent
            opacity={0.26 + stageProgramStrength * 0.42}
          />
        </RoundedBox>

        {[-1.04, -0.2, 0.64, 1.42].map((x) => (
          <RoundedBox
            key={`gate-${x}`}
            args={[0.18, 0.74, 0.18]}
            position={[x, 0.22, 0.14]}
            radius={0.04}
          >
            <meshStandardMaterial
              color={programColor}
              roughness={0.78}
              metalness={0.08}
              transparent
              opacity={0.26 + stageProgramStrength * 0.54}
            />
          </RoundedBox>
        ))}

        {[-1.34, 1.34].map((x) => (
          <RoundedBox
            key={`program-bay-${x}`}
            args={[0.7, 0.22, 0.3]}
            position={[x, -0.92, 0.1]}
            radius={0.05}
          >
            <meshStandardMaterial
              color={programColor}
              roughness={0.82}
              metalness={0.08}
              transparent
              opacity={0.24 + stageProgramStrength * 0.52}
            />
          </RoundedBox>
        ))}
      </group>

      <group
        ref={networkRef}
        position={[0.22, networkY, 0.18]}
        scale={[networkSpan, 1, 1]}
      >
        <RoundedBox args={[4.86, 0.12, 0.12]} position={[0, 0, 0]} radius={0.03}>
          <meshStandardMaterial
            color={routeNetwork}
            roughness={0.46}
            metalness={0.08}
            emissive={routeNetwork}
            emissiveIntensity={0.08 + stageNetworkStrength * 0.18}
            transparent
            opacity={0.22 + stageNetworkStrength * 0.56}
          />
        </RoundedBox>

        {[-1.66, -0.42, 0.88, 2].map((x, index) => (
          <RoundedBox
            key={`bridge-${x}`}
            args={[0.12, 0.8 + index * 0.08, 0.12]}
            position={[x, 0.42 + index * 0.06, 0]}
            radius={0.03}
          >
            <meshStandardMaterial
              color={networkColor}
              roughness={0.8}
              metalness={0.1}
              transparent
              opacity={0.22 + stageNetworkStrength * 0.58}
            />
          </RoundedBox>
        ))}

        <RoundedBox args={[3.48, 0.1, 0.12]} position={[0.2, 0.92, 0.18]} radius={0.03}>
          <meshStandardMaterial
            color={networkColor}
            roughness={0.8}
            metalness={0.1}
            transparent
            opacity={0.2 + stageNetworkStrength * 0.5}
          />
        </RoundedBox>

        {NETWORK_NODE_X.map((x, index) => (
          <RoundedBox
            key={`node-${x}`}
            args={[0.48, 0.26, 0.24]}
            position={[x, 0.9 + (index % 2) * 0.18, 0.18]}
            radius={0.06}
          >
            <meshPhysicalMaterial
              color={mixColor(COLORS.panel, COLORS.network, 0.16 + stageNetworkStrength * 0.16)}
              roughness={0.28}
              metalness={0.06}
              transmission={0.24}
              transparent
              opacity={0.32 + stageNetworkStrength * 0.4}
            />
          </RoundedBox>
        ))}

        <Line
          points={[
            [-2.06, 0.06, 0],
            [-1.02, 0.9, 0.18],
            [0.18, 1.12, 0.2],
            [1.28, 0.94, 0.18],
            [2.08, 0.18, 0]
          ]}
          color={routeNetwork}
          lineWidth={1.2}
          transparent
          opacity={0.18 + stageNetworkStrength * 0.46}
        />
      </group>

      <group ref={routesRef}>
        <Line
          points={[
            [0.16, 1.18, 0.18],
            [-0.48, 1.18, 0.26],
            [-1.2, 1.18, 0.36],
            [-1.96, 1.16, 0.42]
          ]}
          color={routeLabs}
          lineWidth={1.2}
          transparent
          opacity={0.14 + stageLabStrength * 0.48}
        />
        <Line
          points={[
            [0.16, 0.22, 0.14],
            [0.66, 0.22, 0.22],
            [1.34, 0.2, 0.34],
            [2.08, 0.16, 0.42]
          ]}
          color={routeLabs}
          lineWidth={1.2}
          transparent
          opacity={0.14 + stageLabStrength * 0.48}
        />
        <Line
          points={[
            [0.04, -0.68, 0.06],
            [0.12, -1.08, 0.08],
            [0.22, -1.48, 0.1],
            [0.3, -1.9, 0.1]
          ]}
          color={routeProgram}
          lineWidth={1.2}
          transparent
          opacity={0.12 + stageProgramStrength * 0.52}
        />
        <Line
          points={[
            [0.08, 1.76, 0.08],
            [0.12, 2.06, 0.1],
            [0.2, 2.34, 0.12],
            [0.26, 2.56, 0.16]
          ]}
          color={routeNetwork}
          lineWidth={1.2}
          transparent
          opacity={0.12 + stageNetworkStrength * 0.52}
        />
      </group>

      <SignalPulses
        activeStage={activeStage}
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
          preset.atmosphere.fogNear + (variant === "overview" ? 1.5 : 0),
          preset.atmosphere.fogFar
        ]}
      />
      <SceneLighting
        activeStage={activeStage}
        reducedMotion={reducedMotion}
        stageProgress={stageProgress}
      />
      <SceneDirector
        activeStage={activeStage}
        stageProgress={stageProgress}
        tier={tier}
        variant={variant}
        reducedMotion={reducedMotion}
        paused={paused}
        motionProfile={motionProfile}
      />
      <OperationsMap
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
