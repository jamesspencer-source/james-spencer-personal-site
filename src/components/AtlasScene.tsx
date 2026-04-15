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
  switchyardScenePresets,
  type SwitchyardStateId,
  type Vec3
} from "../switchyardScenePresets";

type ViewportTier = "mobile" | "tablet" | "desktop";
type SceneVariant = "hero" | "system";

export type AtlasSceneProps = {
  activeStage: SwitchyardStateId;
  reducedMotion?: boolean;
  stageProgress?: number;
  variant?: SceneVariant;
  paused?: boolean;
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

const SWITCHYARD_GLB_URL = `${import.meta.env.BASE_URL}assets/3d/switchyard/switchyard.glb`;

const VIEWPORT_CONFIG: Record<
  ViewportTier,
  {
    dpr: [number, number];
    heroScale: number;
    systemScale: number;
    cameraOffset: Vec3;
  }
> = {
  mobile: {
    dpr: [1, 1.2],
    heroScale: 1.06,
    systemScale: 0.94,
    cameraOffset: [0.14, 0.18, 0.92]
  },
  tablet: {
    dpr: [1, 1.5],
    heroScale: 1.12,
    systemScale: 1.02,
    cameraOffset: [0.26, 0.1, 0.42]
  },
  desktop: {
    dpr: [1, 1.75],
    heroScale: 1.22,
    systemScale: 1.1,
    cameraOffset: [0.46, 0.04, -0.36]
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
    const scale = 1 + focus * 0.18 * cycle;

    node.scale.setScalar(scale);

    if (material.color) {
      material.color.lerp(color, 0.08);
    }

    if (typeof material.emissiveIntensity === "number") {
      material.emissiveIntensity = 0.26 + focus * 0.82 * cycle;
    }
  });
}

function SceneLighting({
  activeStage,
  stageProgress,
  reducedMotion
}: {
  activeStage: SwitchyardStateId;
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
    const preset = switchyardScenePresets[activeStage];
    const reveal = reducedMotion
      ? 0.18
      : THREE.MathUtils.smoothstep(stageProgress, 0, 1);

    if (ambientRef.current) {
      ambientRef.current.intensity = dampScalar(
        ambientRef.current.intensity,
        0.26 + preset.lighting.fill * 0.22,
        6,
        delta
      );
    }

    if (keyRef.current) {
      keyRef.current.intensity = dampScalar(
        keyRef.current.intensity,
        1.28 + preset.lighting.key * 0.58 + reveal * 0.08,
        6,
        delta
      );
    }

    if (fillRef.current) {
      fillRef.current.intensity = dampScalar(
        fillRef.current.intensity,
        0.34 + preset.lighting.fill * 0.3,
        6,
        delta
      );
    }

    if (rimRef.current) {
      rimRef.current.intensity = dampScalar(
        rimRef.current.intensity,
        0.44 + preset.lighting.rim * 0.52,
        6,
        delta
      );
    }

    if (accentRef.current) {
      accentRef.current.intensity = dampScalar(
        accentRef.current.intensity,
        0.24 + preset.lighting.accent * 0.66,
        6,
        delta
      );
    }

    if (hazeRef.current) {
      hazeRef.current.intensity = dampScalar(
        hazeRef.current.intensity,
        0.2 + preset.lighting.haze * 0.54,
        6,
        delta
      );
    }
  });

  return (
    <>
      <ambientLight ref={ambientRef} color="#d8dfda" intensity={0.34} />
      <directionalLight
        ref={keyRef}
        position={[7.2, 8.6, 9.2]}
        color="#f4f3ee"
        intensity={1.68}
      />
      <directionalLight
        ref={fillRef}
        position={[-5.4, 3.4, 5.8]}
        color="#88b49b"
        intensity={0.56}
      />
      <pointLight
        ref={rimRef}
        position={[-5.4, 7.8, -6.8]}
        color="#9ab8ff"
        intensity={0.78}
        distance={30}
        decay={2}
      />
      <pointLight
        ref={accentRef}
        position={[4.2, -1.8, 4.6]}
        color="#7fd3b1"
        intensity={0.72}
        distance={18}
        decay={2}
      />
      <pointLight
        ref={hazeRef}
        position={[0, 2.4, 1.6]}
        color="#d5e88f"
        intensity={0.42}
        distance={16}
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
  paused
}: {
  activeStage: SwitchyardStateId;
  stageProgress: number;
  tier: ViewportTier;
  variant: SceneVariant;
  reducedMotion: boolean;
  paused: boolean;
}) {
  const { camera } = useThree();
  const lookTarget = useRef(new THREE.Vector3());
  const desiredPosition = useRef(new THREE.Vector3());

  useFrame((state, delta) => {
    const perspectiveCamera = camera as THREE.PerspectiveCamera;
    const preset = switchyardScenePresets[activeStage];
    const tierOffset = VIEWPORT_CONFIG[tier].cameraOffset;
    const reveal =
      variant === "hero"
        ? 0.26
        : THREE.MathUtils.smoothstep(stageProgress, 0.08, 0.94);

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
      variant === "hero"
        ? new THREE.Vector3(1.92, 0.16, -2.18)
        : new THREE.Vector3(-0.08, 0.06, 0.32);

    desiredPosition.current.copy(basePosition);
    desiredPosition.current.add(vec3(tierOffset));
    desiredPosition.current.add(variantOffset);

    lookTarget.current.copy(baseTarget);
    lookTarget.current.add(
      variant === "hero"
        ? new THREE.Vector3(1.16, 0.14, -0.04)
        : new THREE.Vector3(0.12, 0.02, 0)
    );

    if (!reducedMotion && !paused) {
      const drift = preset.motion.drift;
      const time = state.clock.getElapsedTime();

      desiredPosition.current.x += Math.sin(time * 0.22) * drift * 0.42;
      desiredPosition.current.y += Math.cos(time * 0.18) * drift * 0.28;
      lookTarget.current.y += Math.sin(time * 0.12) * drift * 0.12;
    }

    dampVector(perspectiveCamera.position, desiredPosition.current, 4.8, delta);
    perspectiveCamera.fov = dampScalar(
      perspectiveCamera.fov,
      preset.camera.fov + (variant === "hero" ? -1.8 : 0.6),
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
  tier
}: {
  reducedMotion: boolean;
  paused: boolean;
  tier: ViewportTier;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const count = tier === "mobile" ? 12 : tier === "tablet" ? 18 : 26;

  const positions = useMemo(() => {
    const values = new Float32Array(count * 3);
    for (let i = 0; i < count; i += 1) {
      const angle = (i / count) * Math.PI * 2;
      const radius = 2.8 + (i % 5) * 0.34;
      values[i * 3 + 0] = Math.cos(angle) * radius * 0.82;
      values[i * 3 + 1] = -1.4 + (i % 7) * 0.68;
      values[i * 3 + 2] = -0.8 + ((i * 13) % 9) * 0.32;
    }
    return values;
  }, [count]);

  useFrame((state, delta) => {
    if (!groupRef.current || reducedMotion || paused) {
      return;
    }

    const time = state.clock.getElapsedTime();
    groupRef.current.rotation.y = dampScalar(
      groupRef.current.rotation.y,
      Math.sin(time * 0.08) * 0.12,
      3,
      delta
    );
    groupRef.current.position.y = Math.sin(time * 0.18) * 0.08;
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
          size={tier === "mobile" ? 0.03 : 0.04}
          sizeAttenuation
          transparent
          opacity={0.16}
          depthWrite={false}
        />
      </points>
    </group>
  );
}

function SwitchyardAsset({
  activeStage,
  stageProgress,
  tier,
  variant,
  reducedMotion,
  paused
}: {
  activeStage: SwitchyardStateId;
  stageProgress: number;
  tier: ViewportTier;
  variant: SceneVariant;
  reducedMotion: boolean;
  paused: boolean;
}) {
  const gltf = useGLTF(SWITCHYARD_GLB_URL) as { scene: THREE.Group };
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
      if (object.name === "shell") {
        shellRef.current = object;
      } else if (object.name === "core-spine") {
        coreRef.current = object;
      } else if (object.name === "lab-decks") {
        labsRef.current = object;
      } else if (object.name === "program-loop") {
        programRef.current = object;
      } else if (object.name === "network-bridges") {
        networkRef.current = object;
      } else if (object.name === "service-conduits") {
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
          case "switchyard-shell-material":
            shellMaterials.current.push(surface);
            break;
          case "switchyard-structure-material":
            metalMaterials.current.push(surface);
            break;
          case "switchyard-glass-material":
            glassMaterials.current.push(surface);
            break;
          case "switchyard-accent-material":
            accentMaterials.current.push(surface);
            break;
          case "switchyard-signal-material":
            signalMaterials.current.push(surface);
            break;
          default:
            break;
        }
      });

      if (
        mesh.name.includes("lab-service-rail") ||
        mesh.name.includes("lab-equipment-bay") ||
        mesh.name === "core-seam-plate"
      ) {
        labNodes.current.push(mesh);
      } else if (mesh.name.includes("program-gate") && mesh.name.includes("header")) {
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
    const preset = switchyardScenePresets[activeStage];
    const viewport = VIEWPORT_CONFIG[tier];
    const reveal =
      variant === "hero"
        ? 0.26
        : THREE.MathUtils.smoothstep(stageProgress, 0.08, 0.96);
    const time = state.clock.getElapsedTime();
    const dynamicTime = reducedMotion || paused ? 0 : time;

    const root = rootRef.current;
    if (!root) {
      return;
    }

    const baseScale =
      variant === "hero" ? viewport.heroScale : viewport.systemScale;
    const targetScale = new THREE.Vector3(
      baseScale,
      baseScale,
      baseScale
    ).multiplyScalar(activeStage === "network" ? 1.06 : 1);

    const targetPosition =
      variant === "hero"
        ? new THREE.Vector3(2.2, -0.94, 0)
        : new THREE.Vector3(0.58, -0.78, 0);

    const targetRotation = new THREE.Euler(
      -0.16 + Math.sin(dynamicTime * 0.16) * preset.motion.float * 0.04,
      variant === "hero"
        ? -1.08 + preset.motion.rotation * 0.05
        : -0.48 + preset.motion.rotation * 0.08,
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
          -0.14 + emphasis * 0.48,
          0.24 + emphasis * 0.34,
          0.12 + emphasis * 0.54
        ),
        5,
        delta
      );
      dampEuler(
        labsRef.current.rotation,
        new THREE.Euler(0.04, -0.08 + emphasis * 0.16, 0.02),
        5,
        delta
      );
      dampVector(
        labsRef.current.scale,
        new THREE.Vector3(
          0.92 + emphasis * 0.18,
          0.92 + emphasis * 0.18,
          0.92 + emphasis * 0.18
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
          0.14 + emphasis * 0.22,
          -0.22 - emphasis * 0.74,
          0.18 + emphasis * 0.62
        ),
        5,
        delta
      );
      dampEuler(
        programRef.current.rotation,
        new THREE.Euler(0.08, -0.14 + emphasis * 0.18, 0.06),
        5,
        delta
      );
      dampVector(
        programRef.current.scale,
        new THREE.Vector3(
          0.9 + emphasis * 0.22,
          0.9 + emphasis * 0.22,
          0.9 + emphasis * 0.22
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
          0.12 + emphasis * 0.22,
          0.42 + preset.shell.lift * 1.02,
          0.08 + emphasis * 0.18
        ),
        5,
        delta
      );
      dampEuler(
        networkRef.current.rotation,
        new THREE.Euler(
          0.04,
          0.08 + emphasis * 0.14,
          0.06 + emphasis * 0.1
        ),
        5,
        delta
      );
      dampVector(
        networkRef.current.scale,
        new THREE.Vector3(
          0.9 + emphasis * 0.28,
          0.9 + emphasis * 0.28,
          0.9 + emphasis * 0.28
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
        material.color.lerp(new THREE.Color("#171b1f"), 0.04);
      }
      if (typeof material.roughness === "number") {
        material.roughness = dampScalar(
          material.roughness,
          0.56 - preset.shell.aperture * 0.08,
          5,
          delta
        );
      }
      if (typeof material.metalness === "number") {
        material.metalness = dampScalar(
          material.metalness,
          0.48 + preset.layers.core * 0.08,
          5,
          delta
        );
      }
      if (typeof material.emissiveIntensity === "number") {
        material.emissiveIntensity = dampScalar(
          material.emissiveIntensity,
          0.12 + preset.lighting.accent * 0.16 + reveal * 0.08,
          5,
          delta
        );
      }
    });

    metalMaterials.current.forEach((material) => {
      if (material.color) {
        material.color.lerp(new THREE.Color("#2a3237"), 0.04);
      }
      if (typeof material.roughness === "number") {
        material.roughness = dampScalar(
          material.roughness,
          0.38,
          5,
          delta
        );
      }
      if (typeof material.metalness === "number") {
        material.metalness = dampScalar(
          material.metalness,
          0.78,
          5,
          delta
        );
      }
    });

    glassMaterials.current.forEach((material) => {
      if (typeof material.opacity === "number") {
        material.opacity = dampScalar(
          material.opacity,
          0.36 + preset.layers.glass * 0.26 + reveal * 0.04,
          5,
          delta
        );
      }
      if (typeof material.transmission === "number") {
        material.transmission = dampScalar(
          material.transmission,
          0.24 + preset.layers.glass * 0.24,
          5,
          delta
        );
      }
      if (typeof material.roughness === "number") {
        material.roughness = dampScalar(
          material.roughness,
          0.18 + (1 - preset.layers.glass) * 0.1,
          5,
          delta
        );
      }
      if (typeof material.emissiveIntensity === "number") {
        material.emissiveIntensity = dampScalar(
          material.emissiveIntensity,
          0.04 + preset.signal.program * 0.06,
          5,
          delta
        );
      }
    });

    accentMaterials.current.forEach((material) => {
      if (material.color) {
        material.color.lerp(
          activeStage === "program"
            ? new THREE.Color("#36527d")
            : activeStage === "network"
              ? new THREE.Color("#5a6540")
              : new THREE.Color("#27473d"),
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
  activeStage: SwitchyardStateId;
  variant: SceneVariant;
}) {
  return (
    <div
      className={`atlas-fallback atlas-fallback--${activeStage} atlas-fallback--${variant}`}
      aria-hidden="true"
    >
      <div className="atlas-fallback__switchyard">
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
  tier
}: {
  activeStage: SwitchyardStateId;
  reducedMotion: boolean;
  stageProgress: number;
  variant: SceneVariant;
  paused: boolean;
  tier: ViewportTier;
}) {
  const fogFar = variant === "hero" ? 28 : 34;

  return (
    <>
      <fog attach="fog" args={["#040608", 10, fogFar]} />
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
      />
      <Atmospherics reducedMotion={reducedMotion} paused={paused} tier={tier} />
      <SwitchyardAsset
        activeStage={activeStage}
        stageProgress={stageProgress}
        tier={tier}
        variant={variant}
        reducedMotion={reducedMotion}
        paused={paused}
      />
    </>
  );
}

export const AtlasScene = memo(function AtlasScene({
  activeStage,
  reducedMotion = false,
  stageProgress = 0.5,
  variant = "system",
  paused = false
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
        camera={{ position: [0, 0.9, 9.6], fov: 24, near: 0.1, far: 48 }}
      >
        <Suspense fallback={null}>
          <SceneContent
            activeStage={activeStage}
            reducedMotion={reducedMotion}
            stageProgress={stageProgress}
            variant={variant}
            paused={paused}
            tier={tier}
          />
        </Suspense>
      </Canvas>
    </div>
  );
});

useGLTF.preload(SWITCHYARD_GLB_URL);
