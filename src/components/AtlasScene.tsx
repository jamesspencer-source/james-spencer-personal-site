import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Line } from "@react-three/drei";
import {
  memo,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type MutableRefObject
} from "react";
import * as THREE from "three";
import {
  atlasScenePresets,
  type AtlasStateId,
  type Vec3
} from "../atlasScenePresets";

type AtlasSceneProps = {
  activeStage: AtlasStateId;
  activeLabel: string;
  reducedMotion: boolean;
  stageProgress: number;
};

type ViewportTier = "mobile" | "tablet" | "desktop";

type Point3 = Vec3;

type InstanceSpec = {
  position: Point3;
  scale?: Point3;
  rotation?: Point3;
};

type TierSettings = {
  dpr: [number, number];
  chamberRows: number;
  chamberCols: number;
  labNodeCount: number;
  stationCount: number;
  checkpointCount: number;
  networkNodeCount: number;
  particleCount: number;
  pulseCount: number;
  pointerInfluence: number;
  glassOpacity: number;
};

const COLORS = {
  bg: "#050809",
  shell: "#0b1012",
  shellEdge: "#1d2828",
  graphite: "#161d1f",
  glass: "#4f5f61",
  steel: "#75847f",
  textMuted: "#8d9791",
  labs: "#63c69d",
  program: "#8ab2ff",
  network: "#d3e98b",
  lineSoft: "rgba(240,240,236,0.14)"
} as const;

const TIER_SETTINGS: Record<ViewportTier, TierSettings> = {
  mobile: {
    dpr: [1, 1.05],
    chamberRows: 3,
    chamberCols: 4,
    labNodeCount: 4,
    stationCount: 4,
    checkpointCount: 5,
    networkNodeCount: 8,
    particleCount: 26,
    pulseCount: 2,
    pointerInfluence: 0,
    glassOpacity: 0.16
  },
  tablet: {
    dpr: [1, 1.22],
    chamberRows: 4,
    chamberCols: 5,
    labNodeCount: 6,
    stationCount: 5,
    checkpointCount: 6,
    networkNodeCount: 10,
    particleCount: 40,
    pulseCount: 3,
    pointerInfluence: 0.3,
    glassOpacity: 0.2
  },
  desktop: {
    dpr: [1, 1.34],
    chamberRows: 5,
    chamberCols: 6,
    labNodeCount: 8,
    stationCount: 7,
    checkpointCount: 8,
    networkNodeCount: 12,
    particleCount: 58,
    pulseCount: 4,
    pointerInfluence: 1,
    glassOpacity: 0.24
  }
};

function webglAvailable() {
  if (typeof document === "undefined") {
    return true;
  }

  try {
    const canvas = document.createElement("canvas");
    return Boolean(
      window.WebGLRenderingContext &&
        (canvas.getContext("webgl") || canvas.getContext("experimental-webgl"))
    );
  } catch {
    return false;
  }
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
        return;
      }

      if (window.innerWidth < 1180) {
        setTier("tablet");
        return;
      }

      setTier("desktop");
    };

    updateTier();
    window.addEventListener("resize", updateTier);

    return () => window.removeEventListener("resize", updateTier);
  }, []);

  return tier;
}

function smoothPhase(value: number) {
  return THREE.MathUtils.smoothstep(value, 0, 1);
}

function pointOnEllipse(radiusX: number, radiusZ: number, angle: number, y: number): Point3 {
  return [Math.cos(angle) * radiusX, y, Math.sin(angle) * radiusZ];
}

function sampleEllipse(
  radiusX: number,
  radiusZ: number,
  y: number,
  count: number,
  startAngle = 0
): Point3[] {
  return Array.from({ length: count }, (_, index) => {
    const angle = startAngle + (index / count) * Math.PI * 2;
    return pointOnEllipse(radiusX, radiusZ, angle, y);
  });
}

function curveFromPoints(points: Point3[], closed = false) {
  return new THREE.CatmullRomCurve3(
    points.map((point) => new THREE.Vector3(...point)),
    closed,
    "catmullrom",
    0.15
  );
}

function sampleCurve(points: Point3[], closed = false, segments = 64): Point3[] {
  return curveFromPoints(points, closed)
    .getPoints(segments)
    .map((point) => [point.x, point.y, point.z] as Point3);
}

function seededRandom(index: number) {
  return Math.sin(index * 127.1 + 91.7) * 43758.5453 % 1;
}

function buildChamberInstances(rows: number, cols: number) {
  const instances: InstanceSpec[] = [];
  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      instances.push({
        position: [
          -0.62 + col * 0.24 + (row % 2 === 0 ? 0.025 : -0.015),
          1.58 - row * 0.3,
          -0.24 + ((col + row) % 2 === 0 ? 0.03 : -0.03)
        ],
        scale: [0.84, 0.88, 0.88]
      });
    }
  }

  return instances;
}

function buildLabNodeInstances(count: number) {
  return Array.from({ length: count }, (_, index) => {
    const step = count === 1 ? 0 : index / (count - 1);
    return {
      position: [
        -1 + step * 1.95,
        1.08 + Math.sin(step * Math.PI * 1.4) * 0.28,
        step < 0.5 ? 0.42 : 0.18
      ] as Point3
    };
  });
}

function buildProgramStations(count: number) {
  return Array.from({ length: count }, (_, index) => {
    const angle = (index / count) * Math.PI * 2 + Math.PI / 8;
    return {
      position: pointOnEllipse(0.82, 0.58, angle, -0.76),
      rotation: [0, -angle, 0] as Point3,
      scale: [0.92, 1, 0.9] as Point3
    };
  });
}

function buildProgramCheckpoints(count: number) {
  return Array.from({ length: count }, (_, index) => {
    const angle = (index / count) * Math.PI * 2;
    return {
      position: pointOnEllipse(1.12, 0.78, angle, -0.78)
    };
  });
}

function buildNetworkNodes(count: number) {
  return Array.from({ length: count }, (_, index) => {
    const angle = (index / count) * Math.PI * 2 + Math.PI / 14;
    return {
      position: pointOnEllipse(1.88, 1.26, angle, 2.14 + Math.sin(angle * 2) * 0.08)
    };
  });
}

function buildParticlePositions(count: number) {
  const positions = new Float32Array(count * 3);

  for (let index = 0; index < count; index += 1) {
    const a = seededRandom(index + 3);
    const b = seededRandom(index + 23);
    const c = seededRandom(index + 47);

    positions[index * 3] = (a - 0.5) * 3.4;
    positions[index * 3 + 1] = (b - 0.5) * 5.8;
    positions[index * 3 + 2] = (c - 0.5) * 2.5;
  }

  return positions;
}

function registerMaterial(
  bucket: MutableRefObject<THREE.Material[]>,
  index: number
) {
  return (material: THREE.Material | null) => {
    if (material) {
      bucket.current[index] = material;
    }
  };
}

function InstancedBoxes({
  instances,
  args,
  color,
  emissive,
  opacity,
  roughness,
  metalness,
  materialRef
}: {
  instances: InstanceSpec[];
  args: Point3;
  color: string;
  emissive: string;
  opacity: number;
  roughness: number;
  metalness: number;
  materialRef?: (material: THREE.MeshStandardMaterial | null) => void;
}) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  useLayoutEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) {
      return;
    }

    instances.forEach((instance, index) => {
      dummy.position.set(...instance.position);
      dummy.rotation.set(...(instance.rotation ?? [0, 0, 0]));
      dummy.scale.set(...(instance.scale ?? [1, 1, 1]));
      dummy.updateMatrix();
      mesh.setMatrixAt(index, dummy.matrix);
    });

    mesh.instanceMatrix.needsUpdate = true;
  }, [dummy, instances]);

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, instances.length]}>
      <boxGeometry args={args} />
      <meshStandardMaterial
        ref={materialRef}
        color={color}
        emissive={emissive}
        transparent
        opacity={opacity}
        roughness={roughness}
        metalness={metalness}
      />
    </instancedMesh>
  );
}

function InstancedSpheres({
  instances,
  radius,
  color,
  emissive,
  opacity,
  roughness,
  metalness,
  materialRef
}: {
  instances: InstanceSpec[];
  radius: number;
  color: string;
  emissive: string;
  opacity: number;
  roughness: number;
  metalness: number;
  materialRef?: (material: THREE.MeshStandardMaterial | null) => void;
}) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  useLayoutEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) {
      return;
    }

    instances.forEach((instance, index) => {
      dummy.position.set(...instance.position);
      dummy.rotation.set(...(instance.rotation ?? [0, 0, 0]));
      dummy.scale.set(...(instance.scale ?? [1, 1, 1]));
      dummy.updateMatrix();
      mesh.setMatrixAt(index, dummy.matrix);
    });

    mesh.instanceMatrix.needsUpdate = true;
  }, [dummy, instances]);

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, instances.length]}>
      <sphereGeometry args={[radius, 14, 14]} />
      <meshStandardMaterial
        ref={materialRef}
        color={color}
        emissive={emissive}
        transparent
        opacity={opacity}
        roughness={roughness}
        metalness={metalness}
      />
    </instancedMesh>
  );
}

function MovingPulses({
  curve,
  count,
  radius,
  color,
  speed,
  intensity,
  phase = 0
}: {
  curve: THREE.CatmullRomCurve3;
  count: number;
  radius: number;
  color: string;
  speed: number;
  intensity: number;
  phase?: number;
}) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const materialRef = useRef<THREE.MeshStandardMaterial>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  useFrame((state) => {
    const mesh = meshRef.current;
    if (!mesh || count === 0) {
      return;
    }

    for (let index = 0; index < count; index += 1) {
      const offset = count === 1 ? 0 : index / count;
      const t = (state.clock.elapsedTime * speed + phase + offset) % 1;
      const point = curve.getPointAt(t);
      const scale = radius * (0.7 + intensity * 0.7);

      dummy.position.copy(point);
      dummy.scale.setScalar(scale);
      dummy.updateMatrix();
      mesh.setMatrixAt(index, dummy.matrix);
    }

    mesh.instanceMatrix.needsUpdate = true;

    if (materialRef.current) {
      materialRef.current.opacity = 0.16 + intensity * 0.68;
      materialRef.current.emissiveIntensity = 0.24 + intensity * 1.2;
    }
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
      <sphereGeometry args={[radius, 12, 12]} />
      <meshStandardMaterial
        ref={materialRef}
        color={color}
        emissive={color}
        transparent
        opacity={0.64}
        roughness={0.18}
        metalness={0.08}
      />
    </instancedMesh>
  );
}

function CameraRig({
  activeStage,
  stageProgress,
  tier
}: {
  activeStage: AtlasStateId;
  stageProgress: number;
  tier: ViewportTier;
}) {
  const { camera, pointer } = useThree();
  const perspectiveCamera = camera as THREE.PerspectiveCamera;
  const targetRef = useRef(
    new THREE.Vector3(...atlasScenePresets[activeStage].camera.target)
  );

  useFrame((_, delta) => {
    const preset = atlasScenePresets[activeStage];
    const phase = smoothPhase(stageProgress);
    const pointerInfluence = TIER_SETTINGS[tier].pointerInfluence;
    const pointerX = pointer.x * preset.motion.drift * 0.26 * pointerInfluence;
    const pointerY = pointer.y * preset.motion.drift * 0.12 * pointerInfluence;
    const targetPosition = preset.camera.position;
    const positionTravel = preset.camera.travel;
    const targetTravel = preset.camera.targetTravel;
    const tierPositionOffset =
      tier === "mobile"
        ? ([0.42, 0.2, 1.18] as const)
        : tier === "tablet"
          ? ([0.16, 0.08, 0.46] as const)
          : ([0, 0, 0] as const);
    const tierTargetOffset =
      tier === "mobile"
        ? ([0.1, 0.16, 0] as const)
        : tier === "tablet"
          ? ([0.04, 0.08, 0] as const)
          : ([0, 0, 0] as const);

    perspectiveCamera.position.x = THREE.MathUtils.damp(
      perspectiveCamera.position.x,
      targetPosition[0] + positionTravel[0] * phase + pointerX + tierPositionOffset[0],
      2.8,
      delta
    );
    perspectiveCamera.position.y = THREE.MathUtils.damp(
      perspectiveCamera.position.y,
      targetPosition[1] + positionTravel[1] * phase + pointerY + tierPositionOffset[1],
      2.8,
      delta
    );
    perspectiveCamera.position.z = THREE.MathUtils.damp(
      perspectiveCamera.position.z,
      targetPosition[2] + positionTravel[2] * phase + tierPositionOffset[2],
      2.8,
      delta
    );
    perspectiveCamera.fov = THREE.MathUtils.damp(
      perspectiveCamera.fov,
      preset.camera.fov,
      3,
      delta
    );
    perspectiveCamera.updateProjectionMatrix();

    targetRef.current.x = THREE.MathUtils.damp(
      targetRef.current.x,
      preset.camera.target[0] + targetTravel[0] * phase + tierTargetOffset[0],
      3,
      delta
    );
    targetRef.current.y = THREE.MathUtils.damp(
      targetRef.current.y,
      preset.camera.target[1] + targetTravel[1] * phase + tierTargetOffset[1],
      3,
      delta
    );
    targetRef.current.z = THREE.MathUtils.damp(
      targetRef.current.z,
      preset.camera.target[2] + targetTravel[2] * phase + tierTargetOffset[2],
      3,
      delta
    );

    perspectiveCamera.lookAt(targetRef.current);
  });

  return null;
}

function SceneLighting({ activeStage }: { activeStage: AtlasStateId }) {
  const ambientRef = useRef<THREE.AmbientLight>(null);
  const keyRef = useRef<THREE.DirectionalLight>(null);
  const rimRef = useRef<THREE.DirectionalLight>(null);
  const labsRef = useRef<THREE.PointLight>(null);
  const programRef = useRef<THREE.PointLight>(null);
  const networkRef = useRef<THREE.PointLight>(null);

  useFrame((_, delta) => {
    const lighting = atlasScenePresets[activeStage].lighting;

    if (ambientRef.current) {
      ambientRef.current.intensity = THREE.MathUtils.damp(
        ambientRef.current.intensity,
        lighting.fill,
        3,
        delta
      );
    }

    if (keyRef.current) {
      keyRef.current.intensity = THREE.MathUtils.damp(
        keyRef.current.intensity,
        lighting.key,
        3,
        delta
      );
    }

    if (rimRef.current) {
      rimRef.current.intensity = THREE.MathUtils.damp(
        rimRef.current.intensity,
        lighting.rim,
        3,
        delta
      );
    }

    if (labsRef.current) {
      labsRef.current.intensity = THREE.MathUtils.damp(
        labsRef.current.intensity,
        lighting.accent * 0.78,
        3,
        delta
      );
    }

    if (programRef.current) {
      programRef.current.intensity = THREE.MathUtils.damp(
        programRef.current.intensity,
        lighting.accent,
        3,
        delta
      );
    }

    if (networkRef.current) {
      networkRef.current.intensity = THREE.MathUtils.damp(
        networkRef.current.intensity,
        lighting.accent * 1.08,
        3,
        delta
      );
    }
  });

  return (
    <>
      <ambientLight ref={ambientRef} intensity={0.48} color="#adb7b2" />
      <directionalLight
        ref={keyRef}
        position={[5.5, 6.4, 4.6]}
        intensity={1}
        color="#f5f3ec"
      />
      <directionalLight
        ref={rimRef}
        position={[-4.2, 4.4, -5.5]}
        intensity={0.74}
        color="#b4d7c8"
      />
      <pointLight
        ref={labsRef}
        position={[-2.6, 0.4, 3.8]}
        intensity={0.42}
        color={COLORS.labs}
      />
      <pointLight
        ref={programRef}
        position={[0.2, -1.8, 2.6]}
        intensity={0.52}
        color={COLORS.program}
      />
      <pointLight
        ref={networkRef}
        position={[2.8, 2.8, 2.4]}
        intensity={0.62}
        color={COLORS.network}
      />
    </>
  );
}

function MonolithShell({
  tier,
  shellMaterials,
  glassMaterials,
  leftPanelRef,
  rightPanelRef,
  topCapRef,
  glassPrimaryRef,
  glassSecondaryRef
}: {
  tier: ViewportTier;
  shellMaterials: MutableRefObject<THREE.Material[]>;
  glassMaterials: MutableRefObject<THREE.Material[]>;
  leftPanelRef: MutableRefObject<THREE.Mesh | null>;
  rightPanelRef: MutableRefObject<THREE.Mesh | null>;
  topCapRef: MutableRefObject<THREE.Mesh | null>;
  glassPrimaryRef: MutableRefObject<THREE.Mesh | null>;
  glassSecondaryRef: MutableRefObject<THREE.Mesh | null>;
}) {
  const glassOpacity = TIER_SETTINGS[tier].glassOpacity;

  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2.9, 0]}>
        <circleGeometry args={[4.4, 60]} />
        <meshBasicMaterial color={COLORS.shell} transparent opacity={0.34} />
      </mesh>

      <mesh position={[0.08, 0, -0.88]}>
        <boxGeometry args={[2.72, 5.34, 0.16]} />
        <meshPhysicalMaterial
          ref={registerMaterial(shellMaterials, 0)}
          color={COLORS.shell}
          emissive={COLORS.shellEdge}
          transparent
          opacity={0.96}
          roughness={0.86}
          metalness={0.18}
          clearcoat={0.06}
        />
      </mesh>

      <mesh position={[-1.3, 0.05, -0.02]}>
        <boxGeometry args={[0.2, 5.44, 1.84]} />
        <meshPhysicalMaterial
          ref={registerMaterial(shellMaterials, 1)}
          color={COLORS.shell}
          emissive={COLORS.shellEdge}
          transparent
          opacity={0.92}
          roughness={0.84}
          metalness={0.18}
          clearcoat={0.05}
        />
      </mesh>

      <mesh position={[1.18, -0.04, 0.08]} rotation={[0, -0.04, 0]}>
        <boxGeometry args={[0.22, 5.18, 1.72]} />
        <meshPhysicalMaterial
          ref={registerMaterial(shellMaterials, 2)}
          color={COLORS.graphite}
          emissive={COLORS.shellEdge}
          transparent
          opacity={0.92}
          roughness={0.8}
          metalness={0.2}
          clearcoat={0.06}
        />
      </mesh>

      <mesh ref={topCapRef} position={[0.02, 2.76, -0.04]} rotation={[0.02, 0.03, -0.01]}>
        <boxGeometry args={[2.18, 0.22, 1.4]} />
        <meshPhysicalMaterial
          ref={registerMaterial(shellMaterials, 3)}
          color={COLORS.graphite}
          emissive={COLORS.shellEdge}
          transparent
          opacity={0.94}
          roughness={0.82}
          metalness={0.18}
          clearcoat={0.08}
        />
      </mesh>

      <mesh position={[0.02, -2.78, -0.04]}>
        <boxGeometry args={[2.3, 0.2, 1.48]} />
        <meshPhysicalMaterial
          ref={registerMaterial(shellMaterials, 4)}
          color={COLORS.shell}
          emissive={COLORS.shellEdge}
          transparent
          opacity={0.94}
          roughness={0.84}
          metalness={0.16}
          clearcoat={0.05}
        />
      </mesh>

      <mesh ref={leftPanelRef} position={[-0.6, 0.1, 0.78]} rotation={[0, 0.01, 0]}>
        <boxGeometry args={[0.86, 4.98, 0.1]} />
        <meshPhysicalMaterial
          ref={registerMaterial(shellMaterials, 5)}
          color={COLORS.graphite}
          emissive={COLORS.shellEdge}
          transparent
          opacity={0.9}
          roughness={0.8}
          metalness={0.18}
          clearcoat={0.06}
        />
      </mesh>

      <mesh ref={rightPanelRef} position={[0.58, 0.02, 0.72]} rotation={[0, -0.03, 0]}>
        <boxGeometry args={[0.98, 5.08, 0.1]} />
        <meshPhysicalMaterial
          ref={registerMaterial(shellMaterials, 6)}
          color={COLORS.shell}
          emissive={COLORS.shellEdge}
          transparent
          opacity={0.92}
          roughness={0.82}
          metalness={0.16}
          clearcoat={0.06}
        />
      </mesh>

      <mesh position={[-0.18, 0.04, 0.54]}>
        <boxGeometry args={[0.08, 4.4, 0.44]} />
        <meshPhysicalMaterial
          ref={registerMaterial(shellMaterials, 7)}
          color={COLORS.shell}
          emissive={COLORS.shellEdge}
          transparent
          opacity={0.82}
          roughness={0.86}
          metalness={0.14}
        />
      </mesh>

      <mesh position={[-0.28, 0, -0.16]}>
        <boxGeometry args={[0.06, 5.1, 1.3]} />
        <meshStandardMaterial
          ref={registerMaterial(shellMaterials, 8)}
          color={COLORS.steel}
          emissive={COLORS.shellEdge}
          transparent
          opacity={0.24}
          roughness={0.48}
          metalness={0.42}
        />
      </mesh>

      <mesh position={[0.52, 0.02, -0.1]}>
        <boxGeometry args={[0.05, 4.88, 1.18]} />
        <meshStandardMaterial
          ref={registerMaterial(shellMaterials, 9)}
          color={COLORS.steel}
          emissive={COLORS.shellEdge}
          transparent
          opacity={0.2}
          roughness={0.46}
          metalness={0.42}
        />
      </mesh>

      <mesh ref={glassPrimaryRef} position={[-0.18, 0.04, -0.05]}>
        <boxGeometry args={[0.9, 4.84, 0.03]} />
        <meshPhysicalMaterial
          ref={registerMaterial(glassMaterials, 0)}
          color={COLORS.glass}
          transparent
          opacity={glassOpacity}
          transmission={0.08}
          roughness={0.3}
          metalness={0.04}
          clearcoat={0.08}
        />
      </mesh>

      <mesh ref={glassSecondaryRef} position={[0.48, -0.12, -0.12]} rotation={[0, 0.04, 0]}>
        <boxGeometry args={[0.7, 4.2, 0.028]} />
        <meshPhysicalMaterial
          ref={registerMaterial(glassMaterials, 1)}
          color={COLORS.glass}
          transparent
          opacity={glassOpacity * 0.84}
          transmission={0.06}
          roughness={0.34}
          metalness={0.04}
          clearcoat={0.06}
        />
      </mesh>
    </group>
  );
}

function InfrastructureLayer({
  tier,
  groupRef,
  materials
}: {
  tier: ViewportTier;
  groupRef: MutableRefObject<THREE.Group | null>;
  materials: MutableRefObject<THREE.Material[]>;
}) {
  const settings = TIER_SETTINGS[tier];
  const chambers = useMemo(
    () => buildChamberInstances(settings.chamberRows, settings.chamberCols),
    [settings.chamberCols, settings.chamberRows]
  );
  const supportNodes = useMemo(
    () => buildLabNodeInstances(settings.labNodeCount),
    [settings.labNodeCount]
  );

  const conduitPath = useMemo(
    () =>
      sampleCurve(
        [
          [-1.02, 1.98, 0.24],
          [-0.66, 1.74, 0.12],
          [-0.18, 1.58, 0.18],
          [0.34, 1.52, 0.12],
          [1.02, 1.24, 0.02]
        ],
        false,
        44
      ),
    []
  );

  const secondaryPath = useMemo(
    () =>
      sampleCurve(
        [
          [-0.94, 0.96, 0.44],
          [-0.44, 1.12, 0.3],
          [0.18, 1.06, 0.16],
          [0.86, 0.82, 0.02]
        ],
        false,
        36
      ),
    []
  );

  return (
    <group ref={groupRef}>
      <InstancedBoxes
        instances={chambers}
        args={[0.17, 0.18, 0.14]}
        color={COLORS.steel}
        emissive={COLORS.labs}
        opacity={0.76}
        roughness={0.28}
        metalness={0.16}
        materialRef={registerMaterial(materials, 0)}
      />

      <mesh position={[-0.88, 1.08, -0.18]}>
        <boxGeometry args={[0.48, 1.04, 0.36]} />
        <meshStandardMaterial
          ref={registerMaterial(materials, 1)}
          color={COLORS.graphite}
          emissive={COLORS.labs}
          transparent
          opacity={0.7}
          roughness={0.34}
          metalness={0.18}
        />
      </mesh>

      <mesh position={[0.82, 1.28, -0.12]}>
        <boxGeometry args={[0.62, 1.34, 0.34]} />
        <meshStandardMaterial
          ref={registerMaterial(materials, 2)}
          color={COLORS.graphite}
          emissive={COLORS.labs}
          transparent
          opacity={0.72}
          roughness={0.3}
          metalness={0.16}
        />
      </mesh>

      <mesh position={[-0.08, 1.34, 0.18]}>
        <boxGeometry args={[1.96, 0.06, 0.06]} />
        <meshStandardMaterial
          ref={registerMaterial(materials, 3)}
          color={COLORS.labs}
          emissive={COLORS.labs}
          transparent
          opacity={0.58}
          roughness={0.24}
          metalness={0.08}
        />
      </mesh>

      <mesh position={[0.1, 0.9, 0.14]}>
        <boxGeometry args={[1.44, 0.04, 0.04]} />
        <meshStandardMaterial
          ref={registerMaterial(materials, 4)}
          color={COLORS.steel}
          emissive={COLORS.labs}
          transparent
          opacity={0.34}
          roughness={0.32}
          metalness={0.12}
        />
      </mesh>

      <Line points={conduitPath} color={COLORS.labs} transparent opacity={0.48} />
      <Line points={secondaryPath} color={COLORS.labs} transparent opacity={0.36} />

      <InstancedSpheres
        instances={supportNodes}
        radius={0.08}
        color={COLORS.labs}
        emissive={COLORS.labs}
        opacity={0.76}
        roughness={0.18}
        metalness={0.08}
        materialRef={registerMaterial(materials, 5)}
      />
    </group>
  );
}

function ProgramLayer({
  tier,
  groupRef,
  materials
}: {
  tier: ViewportTier;
  groupRef: MutableRefObject<THREE.Group | null>;
  materials: MutableRefObject<THREE.Material[]>;
}) {
  const settings = TIER_SETTINGS[tier];
  const stations = useMemo(
    () => buildProgramStations(settings.stationCount),
    [settings.stationCount]
  );
  const checkpoints = useMemo(
    () => buildProgramCheckpoints(settings.checkpointCount),
    [settings.checkpointCount]
  );

  const outerLoop = useMemo(
    () =>
      sampleCurve(
        [
          [-1.02, -0.82, 0.32],
          [-0.68, -0.42, 0.46],
          [0.04, -0.28, 0.24],
          [0.86, -0.5, -0.04],
          [1.16, -0.96, 0.06],
          [0.66, -1.34, 0.4],
          [-0.1, -1.42, 0.36],
          [-0.86, -1.22, 0.2]
        ],
        true,
        72
      ),
    []
  );

  const innerLoop = useMemo(
    () =>
      sampleCurve(
        [
          [-0.62, -0.88, 0.06],
          [-0.32, -0.58, 0.16],
          [0.22, -0.52, 0.08],
          [0.74, -0.8, -0.02],
          [0.74, -1.12, 0.08],
          [0.2, -1.28, 0.2],
          [-0.4, -1.18, 0.14],
          [-0.74, -0.98, 0.02]
        ],
        true,
        64
      ),
    []
  );

  return (
    <group ref={groupRef}>
      <mesh position={[0, -0.86, -0.1]}>
        <boxGeometry args={[1.82, 0.08, 0.8]} />
        <meshPhysicalMaterial
          ref={registerMaterial(materials, 0)}
          color={COLORS.glass}
          transparent
          opacity={0.16}
          transmission={0.06}
          roughness={0.34}
          metalness={0.04}
        />
      </mesh>

      <Line points={outerLoop} color={COLORS.program} transparent opacity={0.62} />
      <Line points={innerLoop} color={COLORS.program} transparent opacity={0.34} />

      <InstancedBoxes
        instances={stations}
        args={[0.22, 0.08, 0.12]}
        color={COLORS.steel}
        emissive={COLORS.program}
        opacity={0.6}
        roughness={0.24}
        metalness={0.12}
        materialRef={registerMaterial(materials, 1)}
      />

      <InstancedSpheres
        instances={checkpoints}
        radius={0.065}
        color={COLORS.program}
        emissive={COLORS.program}
        opacity={0.74}
        roughness={0.18}
        metalness={0.08}
        materialRef={registerMaterial(materials, 2)}
      />

      <mesh position={[-0.22, -0.64, 0.26]} rotation={[0, 0.22, 0]}>
        <boxGeometry args={[0.06, 1.16, 0.06]} />
        <meshStandardMaterial
          ref={registerMaterial(materials, 3)}
          color={COLORS.program}
          emissive={COLORS.program}
          transparent
          opacity={0.48}
          roughness={0.2}
          metalness={0.12}
        />
      </mesh>

      <mesh position={[0.58, -1.04, 0.08]}>
        <boxGeometry args={[0.05, 0.92, 0.05]} />
        <meshStandardMaterial
          ref={registerMaterial(materials, 4)}
          color={COLORS.program}
          emissive={COLORS.program}
          transparent
          opacity={0.42}
          roughness={0.22}
          metalness={0.12}
        />
      </mesh>
    </group>
  );
}

function NetworkLayer({
  tier,
  groupRef,
  materials
}: {
  tier: ViewportTier;
  groupRef: MutableRefObject<THREE.Group | null>;
  materials: MutableRefObject<THREE.Material[]>;
}) {
  const settings = TIER_SETTINGS[tier];
  const networkNodes = useMemo(
    () => buildNetworkNodes(settings.networkNodeCount),
    [settings.networkNodeCount]
  );

  const outerCrown = useMemo(
    () =>
      sampleCurve(
        sampleEllipse(1.86, 1.24, 2.18, 12, Math.PI / 10),
        true,
        96
      ),
    []
  );

  const innerCrown = useMemo(
    () =>
      sampleCurve(
        sampleEllipse(1.34, 0.92, 2.04, 10, Math.PI / 8),
        true,
        72
      ),
    []
  );

  const bridgePaths = useMemo(
    () =>
      [
        sampleCurve(
          [
            [-1.1, 2.04, 0.32],
            [-1.46, 2.24, 0.08],
            [-1.82, 2.18, -0.08]
          ],
          false,
          20
        ),
        sampleCurve(
          [
            [0.42, 2.1, 0.26],
            [1.14, 2.34, 0.06],
            [1.8, 2.18, -0.04]
          ],
          false,
          22
        ),
        sampleCurve(
          [
            [0.16, 1.92, -0.1],
            [0.42, 2.44, -0.34],
            [0.06, 2.58, -0.42]
          ],
          false,
          22
        )
      ],
    []
  );

  return (
    <group ref={groupRef}>
      <Line points={outerCrown} color={COLORS.network} transparent opacity={0.54} />
      <Line points={innerCrown} color={COLORS.network} transparent opacity={0.28} />
      {bridgePaths.map((points, index) => (
        <Line
          key={`network-bridge-${index}`}
          points={points}
          color={COLORS.network}
          transparent
          opacity={0.32}
        />
      ))}

      <InstancedSpheres
        instances={networkNodes}
        radius={0.07}
        color={COLORS.network}
        emissive={COLORS.network}
        opacity={0.76}
        roughness={0.16}
        metalness={0.08}
        materialRef={registerMaterial(materials, 0)}
      />

      <mesh rotation={[Math.PI / 2, 0.06, 0]} position={[0, 2.1, -0.08]}>
        <torusGeometry args={[1.92, 0.02, 12, 180]} />
        <meshStandardMaterial
          ref={registerMaterial(materials, 1)}
          color={COLORS.network}
          emissive={COLORS.network}
          transparent
          opacity={0.44}
          roughness={0.24}
          metalness={0.1}
        />
      </mesh>

      <mesh rotation={[Math.PI / 2, -0.08, 0]} position={[0.06, 2.32, -0.26]}>
        <torusGeometry args={[1.18, 0.014, 10, 160]} />
        <meshStandardMaterial
          ref={registerMaterial(materials, 2)}
          color={COLORS.steel}
          emissive={COLORS.network}
          transparent
          opacity={0.22}
          roughness={0.26}
          metalness={0.16}
        />
      </mesh>
    </group>
  );
}

function SignalTraffic({
  tier,
  activeStage,
  speed,
  density
}: {
  tier: ViewportTier;
  activeStage: AtlasStateId;
  speed: number;
  density: number;
}) {
  const settings = TIER_SETTINGS[tier];
  const pulseCount = Math.max(1, Math.round(settings.pulseCount * density));
  const labCurve = useMemo(
    () =>
      curveFromPoints([
        [-1.06, 2.02, 0.24],
        [-0.58, 1.72, 0.16],
        [-0.02, 1.5, 0.22],
        [0.72, 1.28, 0.06],
        [1.08, 1.04, -0.04]
      ]),
    []
  );
  const programCurve = useMemo(
    () =>
      curveFromPoints(
        [
          [-1.02, -0.82, 0.32],
          [-0.68, -0.42, 0.46],
          [0.04, -0.28, 0.24],
          [0.86, -0.5, -0.04],
          [1.16, -0.96, 0.06],
          [0.66, -1.34, 0.4],
          [-0.1, -1.42, 0.36],
          [-0.86, -1.22, 0.2]
        ],
        true
      ),
    []
  );
  const networkCurve = useMemo(
    () =>
      curveFromPoints(sampleEllipse(1.86, 1.24, 2.18, 12, Math.PI / 10), true),
    []
  );

  return (
    <group>
      <MovingPulses
        curve={labCurve}
        count={activeStage === "opening" ? 1 : pulseCount}
        radius={0.04}
        color={COLORS.labs}
        speed={speed * 0.38}
        intensity={activeStage === "labs" ? 1 : 0.42}
        phase={0.08}
      />
      <MovingPulses
        curve={programCurve}
        count={Math.max(1, pulseCount + (activeStage === "program" ? 1 : 0))}
        radius={0.035}
        color={COLORS.program}
        speed={speed * 0.44}
        intensity={activeStage === "program" ? 1 : 0.4}
        phase={0.22}
      />
      <MovingPulses
        curve={networkCurve}
        count={Math.max(1, pulseCount)}
        radius={0.032}
        color={COLORS.network}
        speed={speed * 0.28}
        intensity={activeStage === "network" ? 1 : 0.36}
        phase={0.42}
      />
    </group>
  );
}

function Atmospherics({
  tier,
  activeStage
}: {
  tier: ViewportTier;
  activeStage: AtlasStateId;
}) {
  const groupRef = useRef<THREE.Points>(null);
  const materialRef = useRef<THREE.PointsMaterial>(null);
  const positions = useMemo(
    () => buildParticlePositions(TIER_SETTINGS[tier].particleCount),
    [tier]
  );

  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.035;
      groupRef.current.rotation.x = THREE.MathUtils.damp(
        groupRef.current.rotation.x,
        activeStage === "program" ? 0.08 : activeStage === "network" ? -0.06 : 0,
        2,
        delta
      );
    }

    if (materialRef.current) {
      materialRef.current.opacity = THREE.MathUtils.damp(
        materialRef.current.opacity,
        activeStage === "closing" ? 0.08 : 0.14,
        2,
        delta
      );
    }
  });

  return (
    <points ref={groupRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        ref={materialRef}
        color={COLORS.textMuted}
        size={tier === "mobile" ? 0.028 : 0.036}
        sizeAttenuation
        transparent
        opacity={0.14}
      />
    </points>
  );
}

function MonolithScene({
  activeStage,
  stageProgress,
  tier
}: {
  activeStage: AtlasStateId;
  stageProgress: number;
  tier: ViewportTier;
}) {
  const rootRef = useRef<THREE.Group>(null);
  const shellMaterials = useRef<THREE.Material[]>([]);
  const glassMaterials = useRef<THREE.Material[]>([]);
  const labsMaterials = useRef<THREE.Material[]>([]);
  const programMaterials = useRef<THREE.Material[]>([]);
  const networkMaterials = useRef<THREE.Material[]>([]);

  const leftPanelRef = useRef<THREE.Mesh>(null);
  const rightPanelRef = useRef<THREE.Mesh>(null);
  const topCapRef = useRef<THREE.Mesh>(null);
  const glassPrimaryRef = useRef<THREE.Mesh>(null);
  const glassSecondaryRef = useRef<THREE.Mesh>(null);

  const labsRef = useRef<THREE.Group>(null);
  const programRef = useRef<THREE.Group>(null);
  const networkRef = useRef<THREE.Group>(null);

  const current = useRef({
    exposure: 0.08,
    split: 0.04,
    cutDepth: 0.06,
    crown: 0.14,
    labs: 0.28,
    program: 0.18,
    network: 0.16,
    signalDensity: 0.28,
    signalSpeed: 0.34,
    float: 0.2,
    rotation: 0.08
  });

  useFrame((state, delta) => {
    const preset = atlasScenePresets[activeStage];
    const phase = smoothPhase(stageProgress);
    const elapsed = state.clock.elapsedTime;
    const revealBoost =
      activeStage === "program" ? 0.12 : activeStage === "labs" ? 0.08 : 0.04;
    const splitBoost =
      activeStage === "program" ? 0.22 : activeStage === "network" ? 0.18 : 0.12;
    const cutBoost =
      activeStage === "program" ? 0.18 : activeStage === "labs" ? 0.1 : 0.08;

    current.current.exposure = THREE.MathUtils.damp(
      current.current.exposure,
      preset.shell.exposure + revealBoost * phase,
      3.2,
      delta
    );
    current.current.split = THREE.MathUtils.damp(
      current.current.split,
      preset.shell.split + splitBoost * phase,
      3.2,
      delta
    );
    current.current.cutDepth = THREE.MathUtils.damp(
      current.current.cutDepth,
      preset.shell.cutDepth + cutBoost * phase,
      3.2,
      delta
    );
    current.current.crown = THREE.MathUtils.damp(
      current.current.crown,
      preset.shell.crown + (activeStage === "network" ? 0.16 * phase : 0.05 * phase),
      3.2,
      delta
    );
    current.current.labs = THREE.MathUtils.damp(
      current.current.labs,
      preset.layers.labs,
      3,
      delta
    );
    current.current.program = THREE.MathUtils.damp(
      current.current.program,
      preset.layers.program,
      3,
      delta
    );
    current.current.network = THREE.MathUtils.damp(
      current.current.network,
      preset.layers.network,
      3,
      delta
    );
    current.current.signalDensity = THREE.MathUtils.damp(
      current.current.signalDensity,
      preset.signal.density,
      3,
      delta
    );
    current.current.signalSpeed = THREE.MathUtils.damp(
      current.current.signalSpeed,
      preset.signal.speed,
      3,
      delta
    );
    current.current.float = THREE.MathUtils.damp(
      current.current.float,
      preset.motion.float,
      3,
      delta
    );
    current.current.rotation = THREE.MathUtils.damp(
      current.current.rotation,
      preset.motion.rotation,
      3,
      delta
    );

    if (rootRef.current) {
      rootRef.current.position.y =
        Math.sin(elapsed * 0.42) * current.current.float * 0.16;
      rootRef.current.rotation.y = THREE.MathUtils.damp(
        rootRef.current.rotation.y,
        current.current.rotation + (phase - 0.5) * 0.08,
        2.4,
        delta
      );
      rootRef.current.rotation.x = THREE.MathUtils.damp(
        rootRef.current.rotation.x,
        activeStage === "program"
          ? -0.02
          : activeStage === "network"
            ? -0.05
            : -0.1 + current.current.network * 0.02,
        2.4,
        delta
      );
    }

    if (leftPanelRef.current) {
      leftPanelRef.current.position.x = THREE.MathUtils.damp(
        leftPanelRef.current.position.x,
        -0.58 - current.current.split * 0.92,
        3,
        delta
      );
      leftPanelRef.current.position.z = THREE.MathUtils.damp(
        leftPanelRef.current.position.z,
        0.8 + current.current.exposure * 0.42,
        3,
        delta
      );
      leftPanelRef.current.rotation.y = THREE.MathUtils.damp(
        leftPanelRef.current.rotation.y,
        0.12 + current.current.split * 0.46,
        3,
        delta
      );
    }

    if (rightPanelRef.current) {
      rightPanelRef.current.position.x = THREE.MathUtils.damp(
        rightPanelRef.current.position.x,
        0.58 + current.current.split * 1,
        3,
        delta
      );
      rightPanelRef.current.position.z = THREE.MathUtils.damp(
        rightPanelRef.current.position.z,
        0.74 + current.current.exposure * 0.44,
        3,
        delta
      );
      rightPanelRef.current.rotation.y = THREE.MathUtils.damp(
        rightPanelRef.current.rotation.y,
        -0.14 - current.current.split * 0.52,
        3,
        delta
      );
    }

    if (topCapRef.current) {
      topCapRef.current.position.y = THREE.MathUtils.damp(
        topCapRef.current.position.y,
        2.74 + current.current.exposure * 0.46 + current.current.crown * 0.34,
        3,
        delta
      );
      topCapRef.current.rotation.z = THREE.MathUtils.damp(
        topCapRef.current.rotation.z,
        -0.02 - current.current.exposure * 0.12,
        3,
        delta
      );
    }

    if (glassPrimaryRef.current) {
      glassPrimaryRef.current.position.x = THREE.MathUtils.damp(
        glassPrimaryRef.current.position.x,
        -0.14 - current.current.cutDepth * 0.32,
        3,
        delta
      );
      glassPrimaryRef.current.position.y = THREE.MathUtils.damp(
        glassPrimaryRef.current.position.y,
        current.current.program * -0.08 + current.current.network * 0.05,
        3,
        delta
      );
      glassPrimaryRef.current.position.z = THREE.MathUtils.damp(
        glassPrimaryRef.current.position.z,
        -0.06 + current.current.exposure * 0.22,
        3,
        delta
      );
    }

    if (glassSecondaryRef.current) {
      glassSecondaryRef.current.position.x = THREE.MathUtils.damp(
        glassSecondaryRef.current.position.x,
        0.48 + current.current.cutDepth * 0.2,
        3,
        delta
      );
      glassSecondaryRef.current.position.y = THREE.MathUtils.damp(
        glassSecondaryRef.current.position.y,
        current.current.program * -0.14,
        3,
        delta
      );
      glassSecondaryRef.current.position.z = THREE.MathUtils.damp(
        glassSecondaryRef.current.position.z,
        -0.12 + current.current.cutDepth * 0.16,
        3,
        delta
      );
    }

    if (labsRef.current) {
      labsRef.current.position.y = THREE.MathUtils.damp(
        labsRef.current.position.y,
        0.1 + current.current.labs * 0.22,
        3,
        delta
      );
      labsRef.current.position.z = THREE.MathUtils.damp(
        labsRef.current.position.z,
        current.current.cutDepth * 0.24,
        3,
        delta
      );
      labsRef.current.scale.setScalar(0.72 + current.current.labs * 0.34);
      labsRef.current.rotation.y = THREE.MathUtils.damp(
        labsRef.current.rotation.y,
        0.08 + current.current.labs * 0.22,
        3,
        delta
      );
    }

    if (programRef.current) {
      programRef.current.position.z = THREE.MathUtils.damp(
        programRef.current.position.z,
        current.current.cutDepth * 0.38,
        3,
        delta
      );
      programRef.current.position.y = THREE.MathUtils.damp(
        programRef.current.position.y,
        -0.18 - current.current.program * 0.06,
        3,
        delta
      );
      programRef.current.scale.setScalar(0.74 + current.current.program * 0.34);
      programRef.current.rotation.y = THREE.MathUtils.damp(
        programRef.current.rotation.y,
        -0.16 - current.current.program * 0.24,
        3,
        delta
      );
    }

    if (networkRef.current) {
      networkRef.current.position.y = THREE.MathUtils.damp(
        networkRef.current.position.y,
        0.04 + current.current.crown * 0.34,
        3,
        delta
      );
      networkRef.current.position.z = THREE.MathUtils.damp(
        networkRef.current.position.z,
        current.current.network * 0.18,
        3,
        delta
      );
      networkRef.current.scale.setScalar(0.76 + current.current.network * 0.36);
      networkRef.current.rotation.y = THREE.MathUtils.damp(
        networkRef.current.rotation.y,
        current.current.network * 0.22,
        3,
        delta
      );
    }

    shellMaterials.current.forEach((material) => {
      const shellMaterial = material as THREE.MeshPhysicalMaterial | THREE.MeshStandardMaterial;
      shellMaterial.opacity = 0.72 + (1 - current.current.exposure) * 0.22;
      shellMaterial.emissiveIntensity = 0.04 + current.current.exposure * 0.12;
    });

    glassMaterials.current.forEach((material) => {
      const glassMaterial = material as THREE.MeshPhysicalMaterial;
      glassMaterial.opacity =
        TIER_SETTINGS[tier].glassOpacity + current.current.exposure * 0.06;
    });

    labsMaterials.current.forEach((material) => {
      const layerMaterial = material as THREE.MeshStandardMaterial;
      layerMaterial.opacity = 0.12 + current.current.labs * 0.76;
      layerMaterial.emissiveIntensity = 0.12 + current.current.labs * 0.84;
    });

    programMaterials.current.forEach((material) => {
      const layerMaterial = material as THREE.MeshStandardMaterial | THREE.MeshPhysicalMaterial;
      layerMaterial.opacity = 0.12 + current.current.program * 0.76;
      layerMaterial.emissiveIntensity = 0.12 + current.current.program * 0.9;
    });

    networkMaterials.current.forEach((material) => {
      const layerMaterial = material as THREE.MeshStandardMaterial;
      layerMaterial.opacity = 0.1 + current.current.network * 0.8;
      layerMaterial.emissiveIntensity = 0.12 + current.current.network * 0.9;
    });
  });

  return (
    <group ref={rootRef}>
      <MonolithShell
        tier={tier}
        shellMaterials={shellMaterials}
        glassMaterials={glassMaterials}
        leftPanelRef={leftPanelRef}
        rightPanelRef={rightPanelRef}
        topCapRef={topCapRef}
        glassPrimaryRef={glassPrimaryRef}
        glassSecondaryRef={glassSecondaryRef}
      />
      <InfrastructureLayer tier={tier} groupRef={labsRef} materials={labsMaterials} />
      <ProgramLayer tier={tier} groupRef={programRef} materials={programMaterials} />
      <NetworkLayer tier={tier} groupRef={networkRef} materials={networkMaterials} />
      <SignalTraffic
        tier={tier}
        activeStage={activeStage}
        speed={current.current.signalSpeed}
        density={current.current.signalDensity}
      />
      <Atmospherics tier={tier} activeStage={activeStage} />
    </group>
  );
}

const MemoMonolithScene = memo(MonolithScene);

function AtlasFallback({ activeStage }: { activeStage: AtlasStateId }) {
  return (
    <div className={`atlas-fallback atlas-fallback--${activeStage}`} aria-hidden="true">
      <div className="atlas-fallback__halo" />
      <div className="atlas-fallback__monolith">
        <div className="atlas-fallback__shell atlas-fallback__shell--back" />
        <div className="atlas-fallback__shell atlas-fallback__shell--left" />
        <div className="atlas-fallback__shell atlas-fallback__shell--right" />
        <div className="atlas-fallback__shell atlas-fallback__shell--top" />
        <div className="atlas-fallback__shell atlas-fallback__shell--left-door" />
        <div className="atlas-fallback__shell atlas-fallback__shell--right-door" />
        <div className="atlas-fallback__glass atlas-fallback__glass--primary" />
        <div className="atlas-fallback__glass atlas-fallback__glass--secondary" />

        <div className="atlas-fallback__layer atlas-fallback__layer--labs">
          <span />
          <span />
          <span />
          <span />
          <span />
        </div>

        <div className="atlas-fallback__layer atlas-fallback__layer--program">
          <i />
          <i />
          <i />
          <i />
        </div>

        <div className="atlas-fallback__layer atlas-fallback__layer--network">
          <b />
          <b />
          <b />
          <b />
          <b />
          <b />
        </div>
      </div>
    </div>
  );
}

export function AtlasScene({
  activeStage,
  activeLabel,
  reducedMotion,
  stageProgress
}: AtlasSceneProps) {
  const [hasWebGL, setHasWebGL] = useState(() => webglAvailable());
  const tier = useViewportTier();

  useEffect(() => {
    setHasWebGL(webglAvailable());
  }, []);

  return (
    <div className="atlas-scene">
      {reducedMotion || !hasWebGL ? (
        <AtlasFallback activeStage={activeStage} />
      ) : (
        <Canvas
          className="atlas-scene__canvas"
          dpr={TIER_SETTINGS[tier].dpr}
          gl={{
            antialias: tier !== "mobile",
            alpha: true,
            powerPreference: "high-performance"
          }}
          performance={{ min: tier === "mobile" ? 0.7 : 0.85 }}
          camera={{
            position: atlasScenePresets[activeStage].camera.position,
            fov: atlasScenePresets[activeStage].camera.fov
          }}
        >
          <color attach="background" args={[COLORS.bg]} />
          <fog attach="fog" args={[COLORS.bg, 7, 18]} />
          <SceneLighting activeStage={activeStage} />
          <CameraRig
            activeStage={activeStage}
            stageProgress={stageProgress}
            tier={tier}
          />
          <MemoMonolithScene
            activeStage={activeStage}
            stageProgress={stageProgress}
            tier={tier}
          />
        </Canvas>
      )}
    </div>
  );
}
