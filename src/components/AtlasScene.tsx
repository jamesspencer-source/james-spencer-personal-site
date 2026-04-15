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
  atlasScenePresets,
  type AtlasStateId,
  type Vec3
} from "../atlasScenePresets";

type ViewportTier = "mobile" | "tablet" | "desktop";
type SceneVariant = "hero" | "system";

export type AtlasSceneProps = {
  activeStage: AtlasStateId;
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
};

const MONOLITH_GLB_URL = `${import.meta.env.BASE_URL}assets/3d/monolith/monolith.glb`;

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
    heroScale: 0.92,
    systemScale: 0.88,
    cameraOffset: [0, 0.16, 1.15]
  },
  tablet: {
    dpr: [1, 1.5],
    heroScale: 1.03,
    systemScale: 0.98,
    cameraOffset: [0.12, 0.08, 0.7]
  },
  desktop: {
    dpr: [1, 1.75],
    heroScale: 1.12,
    systemScale: 1.08,
    cameraOffset: [0.2, 0, 0]
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

function SceneLighting({
  activeStage,
  stageProgress,
  reducedMotion
}: {
  activeStage: AtlasStateId;
  stageProgress: number;
  reducedMotion: boolean;
}) {
  const ambientRef = useRef<THREE.AmbientLight>(null);
  const keyRef = useRef<THREE.DirectionalLight>(null);
  const fillRef = useRef<THREE.DirectionalLight>(null);
  const rimRef = useRef<THREE.PointLight>(null);
  const accentRef = useRef<THREE.PointLight>(null);

  useFrame((_, delta) => {
    const preset = atlasScenePresets[activeStage];
    const reveal = reducedMotion ? 0.18 : THREE.MathUtils.smoothstep(stageProgress, 0, 1);
    const accentBoost =
      activeStage === "program"
        ? 0.12
        : activeStage === "network"
          ? 0.18
          : 0.08;

    if (ambientRef.current) {
      ambientRef.current.intensity = dampScalar(
        ambientRef.current.intensity,
        0.34 + preset.lighting.fill * 0.22,
        6,
        delta
      );
    }

    if (keyRef.current) {
      keyRef.current.intensity = dampScalar(
        keyRef.current.intensity,
        1.5 + preset.lighting.key * 0.52 + reveal * 0.12,
        6,
        delta
      );
    }

    if (fillRef.current) {
      fillRef.current.intensity = dampScalar(
        fillRef.current.intensity,
        0.46 + preset.lighting.fill * 0.34,
        6,
        delta
      );
    }

    if (rimRef.current) {
      rimRef.current.intensity = dampScalar(
        rimRef.current.intensity,
        0.38 + preset.lighting.rim * 0.48 + reveal * 0.08,
        6,
        delta
      );
    }

    if (accentRef.current) {
      accentRef.current.intensity = dampScalar(
        accentRef.current.intensity,
        0.26 + preset.lighting.accent * 0.56 + accentBoost,
        6,
        delta
      );
    }
  });

  return (
    <>
      <ambientLight ref={ambientRef} color="#dde5dc" intensity={0.48} />
      <directionalLight
        ref={keyRef}
        position={[5.4, 7.4, 8.8]}
        color="#f6f4ef"
        intensity={1.85}
      />
      <directionalLight
        ref={fillRef}
        position={[-5.2, 2.8, 5.8]}
        color="#8ab89d"
        intensity={0.68}
      />
      <pointLight
        ref={rimRef}
        position={[-4.8, 6.4, -5.6]}
        color="#a7bfff"
        intensity={0.72}
        distance={24}
        decay={2}
      />
      <pointLight
        ref={accentRef}
        position={[3.4, -1.8, 4.2]}
        color="#7fd3b1"
        intensity={0.74}
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
  activeStage: AtlasStateId;
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
    const preset = atlasScenePresets[activeStage];
    const tierOffset = VIEWPORT_CONFIG[tier].cameraOffset;
    const reveal =
      variant === "hero"
        ? 0.16
        : THREE.MathUtils.smoothstep(stageProgress, 0.08, 0.96);

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
        ? new THREE.Vector3(1.18, 0.26, -1.1)
        : new THREE.Vector3(-0.18, -0.06, 0.22);

    desiredPosition.current.copy(basePosition);
    desiredPosition.current.add(vec3(tierOffset));
    desiredPosition.current.add(variantOffset);

    lookTarget.current.copy(baseTarget);
    lookTarget.current.add(
      variant === "hero"
        ? new THREE.Vector3(0.58, 0.2, 0.02)
        : new THREE.Vector3(0.08, 0.02, 0)
    );

    if (!reducedMotion && !paused) {
      const drift = preset.motion.drift;
      const time = state.clock.getElapsedTime();
      desiredPosition.current.x += Math.sin(time * 0.28) * drift * 0.36;
      desiredPosition.current.y += Math.cos(time * 0.22) * drift * 0.26;
      lookTarget.current.y += Math.sin(time * 0.16) * drift * 0.12;
    }

    dampVector(perspectiveCamera.position, desiredPosition.current, 5.2, delta);
    perspectiveCamera.fov = dampScalar(
      perspectiveCamera.fov,
      preset.camera.fov + (variant === "hero" ? -1.4 : 0.6),
      5.2,
      delta
    );
    perspectiveCamera.updateProjectionMatrix();
    perspectiveCamera.lookAt(lookTarget.current);
  });

  return null;
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
      ? 0.7
      : 0.62 + Math.sin(time * 2.1 + index * 0.55) * 0.38;
    const scale = 1 + focus * 0.16 * cycle;

    node.scale.setScalar(scale);
    if (material.color) {
      material.color.lerp(color, 0.08);
    }
    if (typeof material.emissiveIntensity === "number") {
      material.emissiveIntensity = 0.34 + focus * 0.74 * cycle;
    }
  });
}

function AuthoredMonolith({
  activeStage,
  stageProgress,
  tier,
  variant,
  reducedMotion,
  paused
}: {
  activeStage: AtlasStateId;
  stageProgress: number;
  tier: ViewportTier;
  variant: SceneVariant;
  reducedMotion: boolean;
  paused: boolean;
}) {
  const gltf = useGLTF(MONOLITH_GLB_URL) as { scene: THREE.Group };
  const scene = useMemo(() => gltf.scene.clone(true), [gltf.scene]);
  const rootRef = useRef<THREE.Group>(null);

  const shellRef = useRef<THREE.Object3D | null>(null);
  const labsRef = useRef<THREE.Object3D | null>(null);
  const programRef = useRef<THREE.Object3D | null>(null);
  const networkRef = useRef<THREE.Object3D | null>(null);
  const signalRef = useRef<THREE.Object3D | null>(null);
  const plinthRef = useRef<THREE.Object3D | null>(null);

  const shellMaterials = useRef<MaterialSurface[]>([]);
  const reinforceMaterials = useRef<MaterialSurface[]>([]);
  const panelMaterials = useRef<MaterialSurface[]>([]);
  const interiorMaterials = useRef<MaterialSurface[]>([]);
  const signalMaterials = useRef<MaterialSurface[]>([]);

  const labNodes = useRef<THREE.Mesh[]>([]);
  const programNodes = useRef<THREE.Mesh[]>([]);
  const networkNodes = useRef<THREE.Mesh[]>([]);
  const trafficNodes = useRef<THREE.Mesh[]>([]);

  useEffect(() => {
    shellMaterials.current = [];
    reinforceMaterials.current = [];
    panelMaterials.current = [];
    interiorMaterials.current = [];
    signalMaterials.current = [];
    labNodes.current = [];
    programNodes.current = [];
    networkNodes.current = [];
    trafficNodes.current = [];

    scene.traverse((object) => {
      if (object.name === "shell") {
        shellRef.current = object;
      } else if (object.name === "lab-core") {
        labsRef.current = object;
      } else if (object.name === "program-core") {
        programRef.current = object;
      } else if (object.name === "network-crown") {
        networkRef.current = object;
      } else if (object.name === "signal-traffic") {
        signalRef.current = object;
      } else if (object.name === "plinth") {
        plinthRef.current = object;
      }

      const mesh = object as THREE.Mesh;
      if (!mesh.isMesh || !mesh.material) {
        return;
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
          case "shell-material":
            shellMaterials.current.push(surface);
            break;
          case "reinforce-material":
            reinforceMaterials.current.push(surface);
            break;
          case "panel-material":
            panelMaterials.current.push(surface);
            break;
          case "interior-material":
            interiorMaterials.current.push(surface);
            break;
          case "signal-material":
            signalMaterials.current.push(surface);
            break;
          default:
            break;
        }
      });

      if (mesh.name.includes("chamber-node")) {
        labNodes.current.push(mesh);
      } else if (mesh.name.includes("program-gate")) {
        programNodes.current.push(mesh);
      } else if (mesh.name.includes("crown-node")) {
        networkNodes.current.push(mesh);
      } else if (mesh.name.includes("pulse")) {
        trafficNodes.current.push(mesh);
      }
    });
  }, [scene]);

  useFrame((state, delta) => {
    const preset = atlasScenePresets[activeStage];
    const viewport = VIEWPORT_CONFIG[tier];
    const reveal =
      variant === "hero"
        ? 0.18
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
    ).multiplyScalar(activeStage === "network" ? 1.04 : 1);

    const targetPosition =
      variant === "hero"
        ? new THREE.Vector3(1.16, -0.36, 0)
        : new THREE.Vector3(0.02, -0.44, 0);

    const targetRotation = new THREE.Euler(
      -0.1 + Math.sin(dynamicTime * 0.18) * preset.motion.float * 0.02,
      variant === "hero"
        ? -0.92 + preset.motion.rotation * 0.05
        : -0.56 + preset.motion.rotation * 0.08,
      0.02
    );

    dampVector(root.position, targetPosition, 5.4, delta);
    dampVector(root.scale, targetScale, 5.4, delta);
    dampEuler(root.rotation, targetRotation, 5.2, delta);

    if (shellRef.current) {
      const shellTarget = new THREE.Vector3(
        0.16 + preset.shell.split * 0.68,
        0.06 * preset.shell.exposure,
        -0.18 - preset.shell.cutDepth * 0.34
      );
      const shellRotation = new THREE.Euler(
        0.01,
        0.08 + preset.shell.split * 0.16,
        -0.01
      );
      dampVector(shellRef.current.position, shellTarget, 5.2, delta);
      dampEuler(shellRef.current.rotation, shellRotation, 5.2, delta);
    }

    if (labsRef.current) {
      const emphasis = preset.layers.labs;
      const target = new THREE.Vector3(
        -0.08 + emphasis * 0.32,
        0.08 + emphasis * 0.22,
        0.04 + emphasis * 0.44
      );
      dampVector(labsRef.current.position, target, 5.2, delta);
      dampEuler(
        labsRef.current.rotation,
        new THREE.Euler(0, -0.04 + emphasis * 0.12, 0.02),
        5.2,
        delta
      );
      dampVector(
        labsRef.current.scale,
        new THREE.Vector3(
          0.92 + emphasis * 0.18,
          0.92 + emphasis * 0.18,
          0.92 + emphasis * 0.18
        ),
        5.2,
        delta
      );
    }

    if (programRef.current) {
      const emphasis = preset.layers.program;
      const target = new THREE.Vector3(
        0.16 + emphasis * 0.18,
        -0.16 - emphasis * 0.62,
        0.1 + emphasis * 0.5
      );
      dampVector(programRef.current.position, target, 5.2, delta);
      dampEuler(
        programRef.current.rotation,
        new THREE.Euler(0.04, -0.1 + emphasis * 0.14, 0.04),
        5.2,
        delta
      );
      dampVector(
        programRef.current.scale,
        new THREE.Vector3(
          0.9 + emphasis * 0.2,
          0.9 + emphasis * 0.2,
          0.9 + emphasis * 0.2
        ),
        5.2,
        delta
      );
    }

    if (networkRef.current) {
      const emphasis = preset.layers.network;
      const crown = preset.shell.crown;
      const target = new THREE.Vector3(
        0.12 + emphasis * 0.26,
        0.34 + crown * 0.86,
        0.06 + emphasis * 0.22
      );
      dampVector(networkRef.current.position, target, 5.2, delta);
      dampEuler(
        networkRef.current.rotation,
        new THREE.Euler(
          0.02,
          0.06 + emphasis * 0.12,
          0.04 + emphasis * 0.08
        ),
        5.2,
        delta
      );
      dampVector(
        networkRef.current.scale,
        new THREE.Vector3(
          0.88 + emphasis * 0.26,
          0.88 + emphasis * 0.26,
          0.88 + emphasis * 0.26
        ),
        5.2,
        delta
      );
    }

    if (signalRef.current) {
      const target = new THREE.Vector3(
        0.02,
        -0.06 + preset.layers.program * 0.08 + preset.layers.network * 0.08,
        0.08 + preset.signal.density * 0.16
      );
      dampVector(signalRef.current.position, target, 5.2, delta);
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
        material.color.lerp(new THREE.Color("#1b1e21"), 0.04);
      }
      if (typeof material.roughness === "number") {
        material.roughness = dampScalar(
          material.roughness,
          0.64 - preset.shell.exposure * 0.12,
          5.2,
          delta
        );
      }
      if (typeof material.metalness === "number") {
        material.metalness = dampScalar(
          material.metalness,
          0.42 + preset.shell.cutDepth * 0.08,
          5.2,
          delta
        );
      }
      if (typeof material.emissiveIntensity === "number") {
        material.emissiveIntensity = dampScalar(
          material.emissiveIntensity,
          0.18 + preset.lighting.accent * 0.26 + reveal * 0.08,
          5.2,
          delta
        );
      }
    });

    reinforceMaterials.current.forEach((material) => {
      if (material.color) {
        material.color.lerp(new THREE.Color("#262c31"), 0.03);
      }
      if (typeof material.emissiveIntensity === "number") {
        material.emissiveIntensity = dampScalar(
          material.emissiveIntensity,
          0.04 + preset.lighting.rim * 0.08,
          5.2,
          delta
        );
      }
    });

    panelMaterials.current.forEach((material) => {
      if (typeof material.opacity === "number") {
        material.opacity = dampScalar(
          material.opacity,
          0.56 + reveal * 0.12,
          5.2,
          delta
        );
      }
      if (typeof material.roughness === "number") {
        material.roughness = dampScalar(
          material.roughness,
          0.28,
          5.2,
          delta
        );
      }
    });

    interiorMaterials.current.forEach((material) => {
      if (typeof material.opacity === "number") {
        material.opacity = dampScalar(
          material.opacity,
          0.84 + reveal * 0.08,
          5.2,
          delta
        );
      }
      if (typeof material.emissiveIntensity === "number") {
        material.emissiveIntensity = dampScalar(
          material.emissiveIntensity,
          0.08 + preset.lighting.fill * 0.08,
          5.2,
          delta
        );
      }
    });

    signalMaterials.current.forEach((material) => {
      if (material.emissive) {
        material.emissive.lerp(signalColor, 0.08);
      }
      if (material.color) {
        material.color.lerp(new THREE.Color("#1d2624"), 0.02);
      }
      if (typeof material.emissiveIntensity === "number") {
        material.emissiveIntensity = dampScalar(
          material.emissiveIntensity,
          0.44 + preset.signal.density * 0.72,
          5.2,
          delta
        );
      }
    });

    pulseNodes(
      labNodes.current,
      preset.layers.labs,
      ROLE_COLORS.labs,
      dynamicTime,
      reducedMotion
    );
    pulseNodes(
      programNodes.current,
      preset.layers.program,
      ROLE_COLORS.program,
      dynamicTime + 0.6,
      reducedMotion
    );
    pulseNodes(
      networkNodes.current,
      preset.layers.network,
      ROLE_COLORS.network,
      dynamicTime + 1.2,
      reducedMotion
    );
    pulseNodes(
      trafficNodes.current,
      Math.max(
        preset.layers.labs * 0.42,
        preset.layers.program * 0.54,
        preset.layers.network * 0.48
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
  activeStage: AtlasStateId;
  variant: SceneVariant;
}) {
  return (
    <div
      className={`atlas-fallback atlas-fallback--${activeStage} atlas-fallback--${variant}`}
      aria-hidden="true"
    >
      <div className="atlas-fallback__core">
        <div className="atlas-fallback__plinth" />
        <div className="atlas-fallback__shell atlas-fallback__shell--back" />
        <div className="atlas-fallback__shell atlas-fallback__shell--front" />
        <div className="atlas-fallback__cutaway" />
        <div className="atlas-fallback__labs">
          <span />
          <span />
          <span />
        </div>
        <div className="atlas-fallback__program">
          <i />
          <i />
          <i />
          <i />
        </div>
        <div className="atlas-fallback__crown">
          <b />
          <b />
          <b />
          <b />
        </div>
        <div className="atlas-fallback__signal" />
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
  activeStage: AtlasStateId;
  reducedMotion: boolean;
  stageProgress: number;
  variant: SceneVariant;
  paused: boolean;
  tier: ViewportTier;
}) {
  return (
    <>
      <fog attach="fog" args={["#040607", 11, 25]} />
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
      <AuthoredMonolith
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
        camera={{ position: [0, 0.8, 8.4], fov: 28, near: 0.1, far: 40 }}
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

useGLTF.preload(MONOLITH_GLB_URL);
