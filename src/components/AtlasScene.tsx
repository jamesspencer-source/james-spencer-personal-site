import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import {
  Suspense,
  memo,
  useEffect,
  useMemo,
  useRef,
  useState
} from "react";
import * as THREE from "three";
import {
  campusScenePresets,
  type CampusSceneStateId,
  type Vec3
} from "../campusScenePresets";

type ViewportTier = "mobile" | "tablet" | "desktop";
type SceneVariant = "overview" | "narrative";
type MotionProfile = "teaser" | "steady" | "immersive";

export type AtlasSceneProps = {
  activeStage: CampusSceneStateId;
  reducedMotion?: boolean;
  stageProgress?: number;
  variant?: SceneVariant;
  paused?: boolean;
  motionProfile?: MotionProfile;
};

type MaterialSurface = THREE.Material & {
  color?: THREE.Color;
  emissive?: THREE.Color;
  emissiveIntensity?: number;
  metalness?: number;
  roughness?: number;
  opacity?: number;
  transparent?: boolean;
  transmission?: number;
};

const CAMPUS_GLB_URL = `${import.meta.env.BASE_URL}assets/3d/campus/campus.glb`;

const VIEWPORT_CONFIG: Record<
  ViewportTier,
  {
    dpr: [number, number];
    overviewScale: number;
    narrativeScale: number;
    cameraOffset: Vec3;
  }
> = {
  mobile: {
    dpr: [1, 1.2],
    overviewScale: 0.96,
    narrativeScale: 0.88,
    cameraOffset: [0.12, 0.18, 0.86]
  },
  tablet: {
    dpr: [1, 1.5],
    overviewScale: 1.04,
    narrativeScale: 0.96,
    cameraOffset: [0.18, 0.08, 0.28]
  },
  desktop: {
    dpr: [1, 1.75],
    overviewScale: 1.18,
    narrativeScale: 1.08,
    cameraOffset: [0.36, 0.06, -0.18]
  }
};

const ROLE_COLORS = {
  labs: new THREE.Color("#79d0af"),
  program: new THREE.Color("#8eb7ff"),
  network: new THREE.Color("#d5e88f")
} as const;

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

function addScaledVector(base: Vec3, travel: Vec3, scale: number) {
  return new THREE.Vector3(
    base[0] + travel[0] * scale,
    base[1] + travel[1] * scale,
    base[2] + travel[2] * scale
  );
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

function pulseNodes(
  nodes: THREE.Mesh[],
  focus: number,
  color: THREE.Color,
  time: number,
  reducedMotion: boolean
) {
  nodes.forEach((node, index) => {
    const material = node.material as MaterialSurface;
    const cycle = reducedMotion
      ? 0.72
      : 0.58 + Math.sin(time * 2.4 + index * 0.5) * 0.42;
    const scale = 1 + focus * 0.12 * cycle;

    node.scale.setScalar(scale);

    if (material.color) {
      material.color.lerp(color, 0.08);
    }

    if (typeof material.emissiveIntensity === "number") {
      material.emissiveIntensity = 0.24 + focus * 0.68 * cycle;
    }
  });
}

function SceneLighting({
  activeStage,
  stageProgress,
  reducedMotion
}: {
  activeStage: CampusSceneStateId;
  stageProgress: number;
  reducedMotion: boolean;
}) {
  const ambientRef = useRef<THREE.AmbientLight>(null);
  const keyRef = useRef<THREE.DirectionalLight>(null);
  const fillRef = useRef<THREE.DirectionalLight>(null);
  const rimRef = useRef<THREE.PointLight>(null);
  const accentRef = useRef<THREE.PointLight>(null);
  const hazeRef = useRef<THREE.PointLight>(null);

  useFrame((_, delta) => {
    const preset = campusScenePresets[activeStage];
    const reveal = reducedMotion
      ? 0.18
      : THREE.MathUtils.smoothstep(stageProgress, 0, 1);

    if (ambientRef.current) {
      ambientRef.current.intensity = dampScalar(
        ambientRef.current.intensity,
        0.42 + preset.atmosphere.ambientFloor * 0.34 + preset.lighting.fill * 0.18,
        6,
        delta
      );
    }

    if (keyRef.current) {
      keyRef.current.intensity = dampScalar(
        keyRef.current.intensity,
        1.46 +
          preset.lighting.key * 0.5 +
          preset.atmosphere.contrast * 0.2 +
          reveal * 0.1,
        6,
        delta
      );
    }

    if (fillRef.current) {
      fillRef.current.intensity = dampScalar(
        fillRef.current.intensity,
        0.52 +
          preset.lighting.fill * 0.28 +
          preset.atmosphere.backfield * 0.18,
        6,
        delta
      );
    }

    if (rimRef.current) {
      rimRef.current.intensity = dampScalar(
        rimRef.current.intensity,
        0.6 + preset.lighting.rim * 0.48 + preset.atmosphere.contrast * 0.12,
        6,
        delta
      );
    }

    if (accentRef.current) {
      accentRef.current.intensity = dampScalar(
        accentRef.current.intensity,
        0.34 + preset.lighting.accent * 0.52 + preset.atmosphere.glow * 0.22,
        6,
        delta
      );
    }

    if (hazeRef.current) {
      hazeRef.current.intensity = dampScalar(
        hazeRef.current.intensity,
        0.28 +
          preset.lighting.haze * 0.44 +
          preset.atmosphere.backfield * 0.18 +
          preset.atmosphere.glow * 0.1,
        6,
        delta
      );
    }
  });

  return (
    <>
      <ambientLight ref={ambientRef} color="#f1eee4" intensity={0.66} />
      <directionalLight
        ref={keyRef}
        position={[7.2, 8.6, 9.2]}
        color="#f8f3e8"
        intensity={2.08}
      />
      <directionalLight
        ref={fillRef}
        position={[-5.4, 3.4, 5.8]}
        color="#bfd4ca"
        intensity={0.92}
      />
      <pointLight
        ref={rimRef}
        position={[-5.4, 7.8, -6.8]}
        color="#b4c8ff"
        intensity={1.02}
        distance={34}
        decay={2}
      />
      <pointLight
        ref={accentRef}
        position={[4.2, -1.8, 4.6]}
        color="#96dcc0"
        intensity={0.84}
        distance={20}
        decay={2}
      />
      <pointLight
        ref={hazeRef}
        position={[0, 2.4, 1.6]}
        color="#e1ebb2"
        intensity={0.62}
        distance={20}
        decay={2}
      />
    </>
  );
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
  activeStage: CampusSceneStateId;
  stageProgress: number;
  tier: ViewportTier;
  variant: SceneVariant;
  reducedMotion: boolean;
  paused: boolean;
  motionProfile: MotionProfile;
}) {
  const { camera } = useThree();
  const lookTarget = useRef(new THREE.Vector3());
  const desiredPosition = useRef(new THREE.Vector3());

  useFrame((state, delta) => {
    const perspectiveCamera = camera as THREE.PerspectiveCamera;
    const preset = campusScenePresets[activeStage];
    const tierOffset = VIEWPORT_CONFIG[tier].cameraOffset;
    const reveal =
      variant === "overview"
        ? 0.26
        : THREE.MathUtils.smoothstep(stageProgress, 0.08, 0.94);
    const motionScale =
      reducedMotion || paused
        ? 0
        : motionProfile === "immersive"
          ? 1
          : motionProfile === "steady"
            ? 0.42
            : 0.24;

    const basePosition = addScaledVector(
      preset.camera.position,
      preset.camera.travel,
      reducedMotion ? 0.12 : reveal
    );
    const baseTarget = addScaledVector(
      preset.camera.target,
      preset.camera.targetTravel,
      reducedMotion ? 0.08 : reveal
    );

    const variantOffset =
      variant === "overview"
        ? new THREE.Vector3(1.1, 0.22, -1.26)
        : new THREE.Vector3(0.06, 0.08, 0.18);

    desiredPosition.current.copy(basePosition);
    desiredPosition.current.add(vec3(tierOffset));
    desiredPosition.current.add(variantOffset);

    lookTarget.current.copy(baseTarget);
    lookTarget.current.add(
      variant === "overview"
        ? new THREE.Vector3(0.7, 0.18, 0.02)
        : new THREE.Vector3(0.06, 0.04, 0.02)
    );

    if (motionScale > 0) {
      const drift = preset.motion.drift;
      const time = state.clock.getElapsedTime();

      desiredPosition.current.x += Math.sin(time * 0.22) * drift * 0.42 * motionScale;
      desiredPosition.current.y += Math.cos(time * 0.18) * drift * 0.28 * motionScale;
      lookTarget.current.y += Math.sin(time * 0.12) * drift * 0.12 * motionScale;
    }

    dampVector(perspectiveCamera.position, desiredPosition.current, 4.8, delta);
    perspectiveCamera.fov = dampScalar(
      perspectiveCamera.fov,
      preset.camera.fov + (variant === "overview" ? -0.4 : 0.2),
      5.2,
      delta
    );
    perspectiveCamera.updateProjectionMatrix();
    perspectiveCamera.lookAt(lookTarget.current);
  });

  return null;
}

function Atmospherics({
  reducedMotion,
  paused,
  tier,
  motionProfile
}: {
  reducedMotion: boolean;
  paused: boolean;
  tier: ViewportTier;
  motionProfile: MotionProfile;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const count = tier === "mobile" ? 6 : tier === "tablet" ? 8 : 12;

  const positions = useMemo(() => {
    const values = new Float32Array(count * 3);
    for (let i = 0; i < count; i += 1) {
      const angle = (i / count) * Math.PI * 2;
      const radius = 3.6 + (i % 4) * 0.48;
      values[i * 3 + 0] = Math.cos(angle) * radius * 0.92;
      values[i * 3 + 1] = -1.9 + (i % 6) * 0.82;
      values[i * 3 + 2] = -1.4 + ((i * 11) % 7) * 0.42;
    }
    return values;
  }, [count]);

  useFrame((state, delta) => {
    if (!groupRef.current || reducedMotion || paused) {
      return;
    }

    const motionScale =
      motionProfile === "immersive" ? 1 : motionProfile === "steady" ? 0.38 : 0.22;
    const time = state.clock.getElapsedTime();
    groupRef.current.rotation.y = dampScalar(
      groupRef.current.rotation.y,
      Math.sin(time * 0.08) * 0.12 * motionScale,
      3,
      delta
    );
    groupRef.current.position.y = Math.sin(time * 0.18) * 0.08 * motionScale;
  });

  return (
    <group ref={groupRef}>
      <points>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[positions, 3]}
            count={positions.length / 3}
            itemSize={3}
          />
        </bufferGeometry>
        <pointsMaterial
          color="#dde6dd"
          size={tier === "mobile" ? 0.024 : 0.032}
          sizeAttenuation
          transparent
          opacity={0.08}
          depthWrite={false}
        />
      </points>
    </group>
  );
}

function CampusAsset({
  activeStage,
  stageProgress,
  tier,
  variant,
  reducedMotion,
  paused,
  motionProfile
}: {
  activeStage: CampusSceneStateId;
  stageProgress: number;
  tier: ViewportTier;
  variant: SceneVariant;
  reducedMotion: boolean;
  paused: boolean;
  motionProfile: MotionProfile;
}) {
  const gltf = useGLTF(CAMPUS_GLB_URL) as { scene: THREE.Group };
  const scene = useMemo(() => gltf.scene.clone(true), [gltf.scene]);
  const rootRef = useRef<THREE.Group>(null);

  const shellRef = useRef<THREE.Object3D | null>(null);
  const coreRef = useRef<THREE.Object3D | null>(null);
  const labsRef = useRef<THREE.Object3D | null>(null);
  const programRef = useRef<THREE.Object3D | null>(null);
  const networkRef = useRef<THREE.Object3D | null>(null);
  const conduitRef = useRef<THREE.Object3D | null>(null);
  const glassRef = useRef<THREE.Object3D | null>(null);
  const signalRef = useRef<THREE.Object3D | null>(null);
  const plinthRef = useRef<THREE.Object3D | null>(null);

  const shellMaterials = useRef<MaterialSurface[]>([]);
  const metalMaterials = useRef<MaterialSurface[]>([]);
  const glassMaterials = useRef<MaterialSurface[]>([]);
  const accentMaterials = useRef<MaterialSurface[]>([]);
  const signalMaterials = useRef<MaterialSurface[]>([]);

  const labNodes = useRef<THREE.Mesh[]>([]);
  const programNodes = useRef<THREE.Mesh[]>([]);
  const networkNodes = useRef<THREE.Mesh[]>([]);
  const relayNodes = useRef<THREE.Mesh[]>([]);
  const routeSegments = useRef<THREE.Mesh[]>([]);

  useEffect(() => {
    shellMaterials.current = [];
    metalMaterials.current = [];
    glassMaterials.current = [];
    accentMaterials.current = [];
    signalMaterials.current = [];
    labNodes.current = [];
    programNodes.current = [];
    networkNodes.current = [];
    relayNodes.current = [];
    routeSegments.current = [];

    scene.traverse((object) => {
      if (object.name === "campus-shell") {
        shellRef.current = object;
      } else if (object.name === "service-spine") {
        coreRef.current = object;
      } else if (object.name === "lab-decks") {
        labsRef.current = object;
      } else if (object.name === "program-loop") {
        programRef.current = object;
      } else if (object.name === "network-bridges") {
        networkRef.current = object;
      } else if (object.name === "conduits") {
        conduitRef.current = object;
      } else if (object.name === "glass-volumes") {
        glassRef.current = object;
      } else if (object.name === "signal-paths") {
        signalRef.current = object;
      } else if (object.name === "plinth") {
        plinthRef.current = object;
      }

      const mesh = object as THREE.Mesh;
      if (!mesh.isMesh || !mesh.material) {
        return;
      }

      mesh.geometry = mesh.geometry.clone();
      if (
        mesh.geometry.attributes.uv &&
        !mesh.geometry.attributes.uv2
      ) {
        mesh.geometry.setAttribute(
          "uv2",
          mesh.geometry.attributes.uv.clone()
        );
      }

      const materials = Array.isArray(mesh.material)
        ? mesh.material.map((material) => material.clone())
        : mesh.material.clone();

      mesh.material = materials;
      mesh.castShadow = true;
      mesh.receiveShadow = true;

      const materialList = Array.isArray(materials) ? materials : [materials];
      materialList.forEach((material) => {
        const surface = material as MaterialSurface;
        surface.transparent = true;
        switch (surface.name) {
          case "campus-shell-material":
            shellMaterials.current.push(surface);
            break;
          case "campus-structure-material":
            metalMaterials.current.push(surface);
            break;
          case "campus-glass-material":
            glassMaterials.current.push(surface);
            break;
          case "campus-accent-material":
            accentMaterials.current.push(surface);
            break;
          case "campus-signal-material":
            signalMaterials.current.push(surface);
            break;
          default:
            break;
        }
      });

      if (
        mesh.name.includes("lab-service-rail") ||
        mesh.name.includes("lab-equipment-bay") ||
        mesh.name.includes("lab-checkpoint")
      ) {
        labNodes.current.push(mesh);
      } else if (
        mesh.name.includes("program-checkpoint") &&
        mesh.name.includes("header")
      ) {
        programNodes.current.push(mesh);
      } else if (mesh.name.includes("network-node")) {
        networkNodes.current.push(mesh);
      } else if (mesh.name.includes("signal-node")) {
        relayNodes.current.push(mesh);
      }

      if (
        mesh.name.includes("signal") &&
        !mesh.name.includes("signal-node")
      ) {
        routeSegments.current.push(mesh);
      }
    });
  }, [scene]);

  useFrame((state, delta) => {
    const preset = campusScenePresets[activeStage];
    const viewport = VIEWPORT_CONFIG[tier];
    const reveal =
      variant === "overview"
        ? 0.26
        : THREE.MathUtils.smoothstep(stageProgress, 0.08, 0.96);
    const time = state.clock.getElapsedTime();
    const motionScale =
      reducedMotion || paused
        ? 0
        : motionProfile === "immersive"
          ? 1
          : motionProfile === "steady"
            ? 0.48
            : 0.3;
    const dynamicTime = motionScale === 0 ? 0 : time * motionScale;

    const root = rootRef.current;
    if (!root) {
      return;
    }

    const baseScale =
      variant === "overview"
        ? viewport.overviewScale
        : viewport.narrativeScale;
    const stageScaleFactor =
      variant === "overview"
        ? 1
        : activeStage === "program"
          ? 1.08
          : activeStage === "network"
            ? 1.05
            : activeStage === "labs"
              ? 1.02
              : 0.98;
    const targetScale = new THREE.Vector3(
      baseScale,
      baseScale,
      baseScale
    ).multiplyScalar(stageScaleFactor);

    const targetPosition =
      variant === "overview"
        ? new THREE.Vector3(1.22, -0.48, 0.02)
        : activeStage === "program"
          ? new THREE.Vector3(0.34, -0.9, 0.12)
          : activeStage === "network"
            ? new THREE.Vector3(0.5, -0.34, -0.02)
            : activeStage === "closing"
              ? new THREE.Vector3(0.22, -0.56, 0)
              : new THREE.Vector3(0.26, -0.46, 0.06);

    const targetRotation = new THREE.Euler(
      (variant === "overview"
        ? -0.12
        : activeStage === "program"
          ? -0.04
          : activeStage === "network"
            ? -0.14
            : activeStage === "closing"
              ? -0.1
              : -0.16) +
        Math.sin(dynamicTime * 0.16) * preset.motion.float * 0.04,
      variant === "overview"
        ? -0.74 + preset.motion.rotation * 0.05
        : activeStage === "program"
          ? -0.18 + preset.motion.rotation * 0.08
          : activeStage === "network"
            ? -0.52 + preset.motion.rotation * 0.08
            : activeStage === "closing"
              ? -0.34 + preset.motion.rotation * 0.06
              : -0.42 + preset.motion.rotation * 0.08,
      0.02
    );

    dampVector(root.position, targetPosition, 5.2, delta);
    dampVector(root.scale, targetScale, 5.2, delta);
    dampEuler(root.rotation, targetRotation, 5.2, delta);

    if (shellRef.current) {
      dampVector(
        shellRef.current.position,
        new THREE.Vector3(
          0.22 + preset.shell.split * 0.92,
          0.08 + preset.shell.lift * 0.16,
          -0.12 - preset.shell.cutDepth * 0.46
        ),
        5,
        delta
      );
      dampEuler(
        shellRef.current.rotation,
        new THREE.Euler(
          0.01 + preset.shell.tilt * 0.06,
          0.08 + preset.shell.split * 0.22,
          -0.01
        ),
        5,
        delta
      );
    }

    if (coreRef.current) {
      dampVector(
        coreRef.current.position,
        new THREE.Vector3(
          -0.14 + preset.layers.core * 0.1,
          0.04 + preset.layers.core * 0.18,
          0.06 + preset.layers.core * 0.16
        ),
        5,
        delta
      );
      dampEuler(
        coreRef.current.rotation,
        new THREE.Euler(0.01, -0.04 + preset.layers.core * 0.06, 0),
        5,
        delta
      );
    }

    if (labsRef.current) {
      const emphasis = preset.layers.labs;
      dampVector(
        labsRef.current.position,
        new THREE.Vector3(
          -0.22 + emphasis * 0.68,
          0.18 + emphasis * 0.46,
          -0.04 + emphasis * 0.98
        ),
        5,
        delta
      );
      dampEuler(
        labsRef.current.rotation,
        new THREE.Euler(0.04, -0.12 + emphasis * 0.22, 0.02),
        5,
        delta
      );
      dampVector(
        labsRef.current.scale,
        new THREE.Vector3(
          0.74 + emphasis * 0.34,
          0.74 + emphasis * 0.34,
          0.74 + emphasis * 0.34
        ),
        5,
        delta
      );
    }

    if (programRef.current) {
      const emphasis = preset.layers.program;
      dampVector(
        programRef.current.position,
        new THREE.Vector3(
          0.08 + emphasis * 0.3,
          -0.08 - emphasis * 1.02,
          0.04 + emphasis * 0.98
        ),
        5,
        delta
      );
      dampEuler(
        programRef.current.rotation,
        new THREE.Euler(0.1, -0.16 + emphasis * 0.24, 0.08),
        5,
        delta
      );
      dampVector(
        programRef.current.scale,
        new THREE.Vector3(
          0.68 + emphasis * 0.42,
          0.68 + emphasis * 0.42,
          0.68 + emphasis * 0.42
        ),
        5,
        delta
      );
    }

    if (networkRef.current) {
      const emphasis = preset.layers.network;
      dampVector(
        networkRef.current.position,
        new THREE.Vector3(
          0.08 + emphasis * 0.34,
          0.18 + preset.shell.lift * 1.14 + emphasis * 0.12,
          -0.02 + emphasis * 0.24
        ),
        5,
        delta
      );
      dampEuler(
        networkRef.current.rotation,
        new THREE.Euler(
          0.04,
          0.04 + emphasis * 0.18,
          0.04 + emphasis * 0.14
        ),
        5,
        delta
      );
      dampVector(
        networkRef.current.scale,
        new THREE.Vector3(
          0.72 + emphasis * 0.44,
          0.72 + emphasis * 0.44,
          0.72 + emphasis * 0.44
        ),
        5,
        delta
      );
    }

    if (conduitRef.current) {
      const emphasis = preset.layers.conduits;
      dampVector(
        conduitRef.current.position,
        new THREE.Vector3(0.02, -0.04 + emphasis * 0.08, 0.12 + emphasis * 0.12),
        5,
        delta
      );
      dampEuler(
        conduitRef.current.rotation,
        new THREE.Euler(0.01, emphasis * 0.04, 0),
        5,
        delta
      );
    }

    if (glassRef.current) {
      const emphasis = preset.layers.glass;
      dampVector(
        glassRef.current.position,
        new THREE.Vector3(0.02 + emphasis * 0.06, 0.02, 0.06 + emphasis * 0.08),
        5,
        delta
      );
    }

    if (signalRef.current) {
      dampVector(
        signalRef.current.position,
        new THREE.Vector3(0.02, -0.08 + preset.signal.density * 0.08, 0.1),
        5,
        delta
      );
    }

    if (plinthRef.current) {
      dampVector(
        plinthRef.current.position,
        new THREE.Vector3(0, 0, 0),
        4.8,
        delta
      );
    }

    const signalColor =
      activeStage === "program"
        ? ROLE_COLORS.program
        : activeStage === "network"
          ? ROLE_COLORS.network
          : ROLE_COLORS.labs;

    shellMaterials.current.forEach((material) => {
      if (material.color) {
        material.color.lerp(
          activeStage === "closing"
            ? new THREE.Color("#2f3a3f")
            : activeStage === "opening"
              ? new THREE.Color("#3d4a50")
              : new THREE.Color("#49575e"),
          0.04
        );
      }
      if (typeof material.roughness === "number") {
        material.roughness = dampScalar(
          material.roughness,
          0.62 - preset.shell.aperture * 0.06,
          5,
          delta
        );
      }
      if (typeof material.metalness === "number") {
        material.metalness = dampScalar(
          material.metalness,
          0.22 + preset.layers.core * 0.04,
          5,
          delta
        );
      }
      if (typeof material.emissiveIntensity === "number") {
        material.emissiveIntensity = dampScalar(
          material.emissiveIntensity,
          0.06 + preset.lighting.accent * 0.08 + reveal * 0.04,
          5,
          delta
        );
      }
    });

    metalMaterials.current.forEach((material) => {
      if (material.color) {
        material.color.lerp(
          activeStage === "network"
            ? new THREE.Color("#5b6a71")
            : new THREE.Color("#55626a"),
          0.04
        );
      }
      if (typeof material.roughness === "number") {
        material.roughness = dampScalar(
          material.roughness,
          0.44,
          5,
          delta
        );
      }
      if (typeof material.metalness === "number") {
        material.metalness = dampScalar(
          material.metalness,
          0.68,
          5,
          delta
        );
      }
    });

    glassMaterials.current.forEach((material) => {
      if (typeof material.opacity === "number") {
        material.opacity = dampScalar(
          material.opacity,
          0.44 + preset.layers.glass * 0.16 + reveal * 0.03,
          5,
          delta
        );
      }
      if (typeof material.transmission === "number") {
        material.transmission = dampScalar(
          material.transmission,
          0.22 + preset.layers.glass * 0.1,
          5,
          delta
        );
      }
      if (typeof material.roughness === "number") {
        material.roughness = dampScalar(
          material.roughness,
          0.18 + (1 - preset.layers.glass) * 0.08,
          5,
          delta
        );
      }
      if (typeof material.emissiveIntensity === "number") {
        material.emissiveIntensity = dampScalar(
          material.emissiveIntensity,
          0.02 + preset.signal.program * 0.04,
          5,
          delta
        );
      }
    });

    accentMaterials.current.forEach((material) => {
      if (material.color) {
        material.color.lerp(
          activeStage === "program"
            ? new THREE.Color("#4b6c98")
            : activeStage === "network"
              ? new THREE.Color("#747f4e")
              : new THREE.Color("#356053"),
          0.06
        );
      }
    });

    signalMaterials.current.forEach((material, index) => {
      if (material.emissive) {
        material.emissive.lerp(signalColor, 0.08);
      }
      if (typeof material.emissiveIntensity === "number") {
        const pulse =
          reducedMotion || paused
            ? 0.72
            : 0.52 +
              Math.sin(dynamicTime * (0.8 + preset.signal.speed * 1.8) + index * 0.35) *
                0.48;
        material.emissiveIntensity = dampScalar(
          material.emissiveIntensity,
          0.34 + preset.signal.density * 0.74 * pulse,
          5,
          delta
        );
      }
    });

    routeSegments.current.forEach((mesh, index) => {
      const material = mesh.material as MaterialSurface;
      if (typeof material.emissiveIntensity === "number") {
        const lane = mesh.name.includes("lab")
          ? preset.signal.labs
          : mesh.name.includes("program")
            ? preset.signal.program
            : preset.signal.network;
        const wave =
          reducedMotion || paused
            ? 0.7
            : 0.58 + Math.sin(dynamicTime * (0.9 + preset.signal.speed) + index * 0.44) * 0.42;
        material.emissiveIntensity = dampScalar(
          material.emissiveIntensity,
          0.16 + lane * 0.9 * wave,
          5,
          delta
        );
      }
    });

    pulseNodes(
      labNodes.current,
      preset.signal.labs,
      ROLE_COLORS.labs,
      dynamicTime,
      reducedMotion
    );
    pulseNodes(
      programNodes.current,
      preset.signal.program,
      ROLE_COLORS.program,
      dynamicTime + 0.5,
      reducedMotion
    );
    pulseNodes(
      networkNodes.current,
      preset.signal.network,
      ROLE_COLORS.network,
      dynamicTime + 1.1,
      reducedMotion
    );
    pulseNodes(
      relayNodes.current,
      Math.max(
        preset.signal.labs * 0.42,
        preset.signal.program * 0.5,
        preset.signal.network * 0.46
      ),
      signalColor,
      dynamicTime + 0.8,
      reducedMotion
    );
  });

  return <primitive ref={rootRef} object={scene} />;
}

function AtlasFallback({
  activeStage,
  variant
}: {
  activeStage: CampusSceneStateId;
  variant: SceneVariant;
}) {
  return (
    <div
      className={`atlas-fallback atlas-fallback--${activeStage} atlas-fallback--${variant}`}
      aria-hidden="true"
    >
      <div className="atlas-fallback__campus">
        <div className="atlas-fallback__spine" />
        <div className="atlas-fallback__shell atlas-fallback__shell--rear" />
        <div className="atlas-fallback__shell atlas-fallback__shell--front" />
        <div className="atlas-fallback__deck atlas-fallback__deck--a" />
        <div className="atlas-fallback__deck atlas-fallback__deck--b" />
        <div className="atlas-fallback__deck atlas-fallback__deck--c" />
        <div className="atlas-fallback__loop" />
        <div className="atlas-fallback__bridge atlas-fallback__bridge--a" />
        <div className="atlas-fallback__bridge atlas-fallback__bridge--b" />
        <div className="atlas-fallback__conduit atlas-fallback__conduit--a" />
        <div className="atlas-fallback__conduit atlas-fallback__conduit--b" />
        <div className="atlas-fallback__conduit atlas-fallback__conduit--c" />
        <div className="atlas-fallback__node atlas-fallback__node--labs" />
        <div className="atlas-fallback__node atlas-fallback__node--program" />
        <div className="atlas-fallback__node atlas-fallback__node--network" />
        <div className="atlas-fallback__glow" />
      </div>
    </div>
  );
}

function SceneContent({
  activeStage,
  reducedMotion,
  stageProgress,
  variant,
  paused,
  tier,
  motionProfile
}: {
  activeStage: CampusSceneStateId;
  reducedMotion: boolean;
  stageProgress: number;
  variant: SceneVariant;
  paused: boolean;
  tier: ViewportTier;
  motionProfile: MotionProfile;
}) {
  const preset = campusScenePresets[activeStage];
  const fogNear =
    preset.atmosphere.fogNear + (variant === "overview" ? 1.5 : 0);
  const fogFar =
    preset.atmosphere.fogFar + (variant === "overview" ? -1.5 : 0);

  return (
    <>
      <fog attach="fog" args={[preset.atmosphere.fogColor, fogNear, fogFar]} />
      <SceneLighting
        activeStage={activeStage}
        stageProgress={stageProgress}
        reducedMotion={reducedMotion}
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
      <Atmospherics
        reducedMotion={reducedMotion}
        paused={paused}
        tier={tier}
        motionProfile={motionProfile}
      />
      <CampusAsset
        activeStage={activeStage}
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
        camera={{ position: [0, 0.9, 9.6], fov: 24, near: 0.1, far: 56 }}
      >
        <Suspense fallback={null}>
          <SceneContent
            activeStage={activeStage}
            reducedMotion={reducedMotion}
            stageProgress={stageProgress}
            variant={variant}
            paused={paused}
            tier={tier}
            motionProfile={motionProfile}
          />
        </Suspense>
      </Canvas>
    </div>
  );
});

useGLTF.preload(CAMPUS_GLB_URL);
