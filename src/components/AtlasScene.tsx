import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Line, useGLTF } from "@react-three/drei";
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
  scenePresets,
  signalRoutes,
  type MapFocus,
  type SceneLayer,
  type SceneStageId,
  type Vec3,
  type ViewportTier
} from "../campusScenePresets";

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

type ViewportConfig = {
  dpr: [number, number];
  overviewScale: number;
  narrativeScale: number;
  cameraOffset: Vec3;
  rootOffset: Vec3;
};

type LayerCollections = Record<SceneLayer, THREE.Object3D[]>;

type RoutePulseRecord = {
  curve: THREE.CatmullRomCurve3;
  refs: Array<THREE.Mesh | null>;
};

const CROSS_SECTION_URL = `${import.meta.env.BASE_URL}assets/3d/cross-section/cross-section.glb`;

const VIEWPORT_CONFIG: Record<ViewportTier, ViewportConfig> = {
  mobile: {
    dpr: [1, 1.25],
    overviewScale: 0.96,
    narrativeScale: 0.92,
    cameraOffset: [0.06, 0.08, 0.32],
    rootOffset: [0.12, -0.04, 0]
  },
  tablet: {
    dpr: [1, 1.5],
    overviewScale: 1,
    narrativeScale: 0.97,
    cameraOffset: [0.02, 0.04, 0.18],
    rootOffset: [0.05, -0.02, 0]
  },
  desktop: {
    dpr: [1, 1.8],
    overviewScale: 1.08,
    narrativeScale: 1.02,
    cameraOffset: [0, 0.02, 0],
    rootOffset: [0, 0, 0]
  }
};

const LAYER_COLORS: Record<SceneLayer, string> = {
  spine: "#cad6d2",
  labs: "#8fd0b4",
  program: "#9ebee9",
  network: "#d4dfab"
};

function dampScalar(current: number, target: number, lambda: number, delta: number) {
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

function withOffset(values: Vec3, offset: Vec3) {
  return [
    values[0] + offset[0],
    values[1] + offset[1],
    values[2] + offset[2]
  ] satisfies Vec3;
}

function layerWeight(activeStage: SceneStageId, focus: MapFocus | undefined, layer: SceneLayer) {
  const base = scenePresets[activeStage].layers[layer];

  if (layer === "spine" || activeStage !== "labs" || !focus || focus === "labs") {
    return base;
  }

  if (layer === focus) {
    return Math.min(1, base + 0.12);
  }

  return Math.max(0.18, base - 0.06);
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

function registerMaterial(node: THREE.Object3D) {
  const mesh = node as THREE.Mesh;
  if (!mesh.isMesh) {
    return;
  }

  const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
  const nextMaterials = materials.map((material) => {
    const clone = material.clone() as THREE.Material;
    clone.transparent = true;
    clone.depthWrite = true;

    if (
      clone instanceof THREE.MeshStandardMaterial ||
      clone instanceof THREE.MeshPhysicalMaterial
    ) {
      clone.emissive = new THREE.Color("#10181d");
      clone.emissiveIntensity = 0;
    }

    return clone;
  });

  mesh.material = Array.isArray(mesh.material) ? nextMaterials : nextMaterials[0];
}

function forEachMaterial(
  material: THREE.Material | THREE.Material[],
  callback: (value: THREE.Material) => void
) {
  const materials = Array.isArray(material) ? material : [material];
  materials.forEach(callback);
}

function SceneDirector({
  activeStage,
  reducedMotion,
  paused,
  rootRef,
  tier,
  variant,
  motionProfile,
  stageProgress
}: {
  activeStage: SceneStageId;
  reducedMotion: boolean;
  paused: boolean;
  rootRef: React.RefObject<THREE.Group | null>;
  tier: ViewportTier;
  variant: SceneVariant;
  motionProfile: MotionProfile;
  stageProgress: number;
}) {
  const { camera, gl, pointer, scene } = useThree();

  useFrame((state, delta) => {
    const perspectiveCamera = camera as THREE.PerspectiveCamera;
    const preset = scenePresets[activeStage];
    const viewport = VIEWPORT_CONFIG[tier];
    const targetCamera = preset.camera[tier];
    const tierScale =
      variant === "overview" ? viewport.overviewScale : viewport.narrativeScale;
    const motionFactor =
      reducedMotion || paused
        ? 0
        : motionProfile === "immersive"
          ? 1
          : motionProfile === "teaser"
            ? 0.6
            : 0.35;

    const desiredCamera = vec3(
      withOffset(targetCamera.position, viewport.cameraOffset)
    );
    const lookTarget = vec3(targetCamera.target);

    perspectiveCamera.fov = dampScalar(
      perspectiveCamera.fov,
      targetCamera.fov,
      5,
      delta
    );
    perspectiveCamera.updateProjectionMatrix();
    dampVector(perspectiveCamera.position, desiredCamera, 5, delta);
    perspectiveCamera.lookAt(lookTarget);

    gl.toneMappingExposure = dampScalar(
      gl.toneMappingExposure,
      preset.atmosphere.backgroundStrength,
      4,
      delta
    );

    if (!(scene.fog instanceof THREE.Fog)) {
      scene.fog = new THREE.Fog(preset.atmosphere.fogColor, 14, 28);
    }

    scene.fog.color.lerp(new THREE.Color(preset.atmosphere.fogColor), 0.12);
    scene.fog.near = dampScalar(scene.fog.near, preset.atmosphere.fogNear, 5, delta);
    scene.fog.far = dampScalar(scene.fog.far, preset.atmosphere.fogFar, 5, delta);

    const root = rootRef.current;
    if (!root) {
      return;
    }

    const basePosition = vec3(
      withOffset(preset.root.position, viewport.rootOffset)
    );
    const drift = preset.motion.drift * motionFactor;
    const pulse = reducedMotion ? 0 : Math.sin(state.clock.elapsedTime * 0.42) * drift;
    const parallax = preset.motion.parallax * motionFactor;
    const progressBias = activeStage === "program" || activeStage === "network"
      ? (stageProgress - 0.5) * 0.08
      : 0;

    const targetPosition = basePosition.clone().add(
      new THREE.Vector3(pointer.x * parallax * 0.65, pulse + progressBias, 0)
    );
    const targetRotation = new THREE.Euler(
      preset.root.rotation[0] + pointer.y * parallax * 0.32,
      preset.root.rotation[1] + pointer.x * parallax * 0.42,
      preset.root.rotation[2]
    );

    dampVector(root.position, targetPosition, 5, delta);
    dampEuler(root.rotation, targetRotation, 5, delta);

    const desiredScale = preset.root.scale * tierScale;
    const scale = dampScalar(root.scale.x, desiredScale, 5, delta);
    root.scale.setScalar(scale);
  });

  return null;
}

function BackgroundField({
  activeStage
}: {
  activeStage: SceneStageId;
}) {
  const haloRef = useRef<THREE.Mesh>(null);
  const veilRef = useRef<THREE.Mesh>(null);

  useFrame((_, delta) => {
    const preset = scenePresets[activeStage];
    const fieldColor = new THREE.Color(preset.atmosphere.fieldColor);
    const glowColor = new THREE.Color(preset.atmosphere.glowColor);

    [haloRef.current, veilRef.current].forEach((mesh) => {
      if (!mesh) {
        return;
      }

      const material = mesh.material as THREE.MeshBasicMaterial;
      const targetColor = mesh === haloRef.current ? glowColor : fieldColor;
      material.color.lerp(targetColor, 0.12);
      material.opacity = dampScalar(
        material.opacity,
        mesh === haloRef.current ? 0.24 : 0.34,
        4,
        delta
      );
    });
  });

  return (
    <group position={[0, 0.2, -3.8]}>
      <mesh ref={veilRef}>
        <planeGeometry args={[18, 12]} />
        <meshBasicMaterial
          color="#314652"
          transparent
          opacity={0.3}
          depthWrite={false}
        />
      </mesh>
      <mesh ref={haloRef} position={[0.2, 0.1, 0.02]}>
        <circleGeometry args={[4.4, 48]} />
        <meshBasicMaterial
          color="#90a8b0"
          transparent
          opacity={0.22}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}

function SceneLighting({
  activeStage
}: {
  activeStage: SceneStageId;
}) {
  const ambientRef = useRef<THREE.AmbientLight>(null);
  const keyRef = useRef<THREE.DirectionalLight>(null);
  const fillRef = useRef<THREE.DirectionalLight>(null);
  const rimRef = useRef<THREE.PointLight>(null);

  useFrame((_, delta) => {
    const preset = scenePresets[activeStage];

    if (ambientRef.current) {
      ambientRef.current.intensity = dampScalar(
        ambientRef.current.intensity,
        preset.lighting.ambient,
        4,
        delta
      );
    }

    if (keyRef.current) {
      keyRef.current.intensity = dampScalar(
        keyRef.current.intensity,
        preset.lighting.key,
        4,
        delta
      );
      keyRef.current.color.lerp(
        new THREE.Color("#f0f6f3"),
        0.08
      );
    }

    if (fillRef.current) {
      fillRef.current.intensity = dampScalar(
        fillRef.current.intensity,
        preset.lighting.fill,
        4,
        delta
      );
      fillRef.current.color.lerp(
        new THREE.Color(preset.atmosphere.fieldColor),
        0.1
      );
    }

    if (rimRef.current) {
      rimRef.current.intensity = dampScalar(
        rimRef.current.intensity,
        preset.lighting.rim,
        4,
        delta
      );
      rimRef.current.color.lerp(
        new THREE.Color(preset.atmosphere.glowColor),
        0.1
      );
    }
  });

  return (
    <>
      <ambientLight ref={ambientRef} intensity={1.12} />
      <directionalLight
        ref={keyRef}
        position={[4.8, 6.2, 6.6]}
        intensity={1.28}
        color="#f3f7f5"
      />
      <directionalLight
        ref={fillRef}
        position={[-5.4, 3.2, 4.8]}
        intensity={0.78}
        color="#6f8893"
      />
      <pointLight
        ref={rimRef}
        position={[0.8, 2.6, 5.4]}
        intensity={0.84}
        distance={18}
        color="#aac2c8"
      />
    </>
  );
}

function CrossSectionAsset({
  activeStage,
  focus,
  reducedMotion,
  rootRef
}: {
  activeStage: SceneStageId;
  focus?: MapFocus;
  reducedMotion: boolean;
  rootRef: React.RefObject<THREE.Group | null>;
}) {
  const gltf = useGLTF(CROSS_SECTION_URL);
  const assetScene = useMemo(() => {
    const clone = gltf.scene.clone(true);
    clone.traverse((node) => registerMaterial(node));
    return clone;
  }, [gltf.scene]);

  const layers = useMemo<LayerCollections>(() => {
    const spine = assetScene.getObjectByName("OperationsSpine");
    const labWest = assetScene.getObjectByName("LabDeckWest");
    const labEast = assetScene.getObjectByName("LabDeckEast");
    const program = assetScene.getObjectByName("ProgramLoop");
    const network = assetScene.getObjectByName("NetworkLayer");

    return {
      spine: spine ? [spine] : [],
      labs: [labWest, labEast].filter(Boolean) as THREE.Object3D[],
      program: program ? [program] : [],
      network: network ? [network] : []
    };
  }, [assetScene]);

  useEffect(() => {
    Object.values(layers).flat().forEach((node) => {
      node.userData.basePosition = node.position.clone();
      node.userData.baseRotation = node.rotation.clone();
    });
  }, [layers]);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) {
      return undefined;
    }

    root.add(assetScene);
    return () => {
      root.remove(assetScene);
    };
  }, [assetScene, rootRef]);

  useFrame((_, delta) => {
    const preset = scenePresets[activeStage];

    const applyLayer = (layer: SceneLayer) => {
      const nodes = layers[layer];
      if (!nodes.length) {
        return;
      }

      const targetWeight = layerWeight(activeStage, focus, layer);

      nodes.forEach((node, index) => {
        const basePosition = node.userData.basePosition as THREE.Vector3;
        const baseRotation = node.userData.baseRotation as THREE.Euler;

        const offset = new THREE.Vector3();
        if (layer === "labs") {
          offset.x += Math.sign(basePosition.x || (index === 0 ? -1 : 1)) * preset.emphasis.cutDepth * 0.24;
          offset.y += preset.emphasis.labsLift;
        }

        if (layer === "program") {
          offset.y += preset.emphasis.programLift;
          offset.z -= preset.emphasis.cutDepth * 0.08;
        }

        if (layer === "network") {
          offset.y += preset.emphasis.networkLift;
          offset.z += preset.emphasis.cutDepth * 0.05;
        }

        if (layer === "spine") {
          offset.z += preset.emphasis.cutDepth * 0.03;
        }

        const targetPosition = basePosition.clone().add(offset);
        dampVector(node.position, targetPosition, 5, delta);
        dampEuler(node.rotation, baseRotation, 5, delta);

        node.visible = targetWeight > 0.03;

        node.traverse((child) => {
          const mesh = child as THREE.Mesh;
          if (!mesh.isMesh) {
            return;
          }

          forEachMaterial(mesh.material, (material) => {
            if (!("opacity" in material)) {
              return;
            }

            material.transparent = true;
            material.depthWrite = targetWeight > 0.62;
            material.opacity = dampScalar(
              material.opacity,
              0.14 + targetWeight * 0.9,
              6,
              delta
            );

            if (
              material instanceof THREE.MeshStandardMaterial ||
              material instanceof THREE.MeshPhysicalMaterial
            ) {
              const emissive = new THREE.Color(LAYER_COLORS[layer]);
              material.emissive.lerp(emissive.multiplyScalar(0.06), 0.08);
              material.emissiveIntensity = dampScalar(
                material.emissiveIntensity,
                reducedMotion ? 0.02 : targetWeight * 0.16,
                5,
                delta
              );
            }
          });
        });
      });
    };

    applyLayer("spine");
    applyLayer("labs");
    applyLayer("program");
    applyLayer("network");
  });

  return null;
}

function SignalTraffic({
  activeStage,
  focus,
  reducedMotion,
  rootRef
}: {
  activeStage: SceneStageId;
  focus?: MapFocus;
  reducedMotion: boolean;
  rootRef: React.RefObject<THREE.Group | null>;
}) {
  const preset = scenePresets[activeStage];
  const routeRecords = useMemo<RoutePulseRecord[]>(() => {
    return signalRoutes.map((route) => ({
      curve: new THREE.CatmullRomCurve3(route.points.map((point) => vec3(point))),
      refs: []
    }));
  }, []);

  useFrame((state, delta) => {
    const root = rootRef.current;
    if (!root) {
      return;
    }

    routeRecords.forEach((record, index) => {
      const route = signalRoutes[index];
      const baseWeight = route.focus === activeStage
        ? 1
        : activeStage === "opening"
          ? 0.56
          : activeStage === "closing"
            ? 0.34
            : route.focus === "labs" && activeStage === "labs"
              ? 1
              : 0.22;
      const focusLift =
        activeStage === "labs" && focus && focus === route.focus ? 0.1 : 0;
      const activity = reducedMotion
        ? 0
        : (baseWeight + focusLift) * preset.motion.signal;

      record.refs.forEach((meshRef, pulseIndex) => {
        if (!meshRef) {
          return;
        }

        meshRef.visible = baseWeight > 0.1;

        const time = state.clock.elapsedTime * (0.08 + activity * 0.18);
        const progress = (time + pulseIndex * 0.28) % 1;
        const point = record.curve.getPointAt(progress);
        const tangent = record.curve.getTangentAt(progress);

        meshRef.position.copy(point);
        meshRef.lookAt(point.clone().add(tangent));

        const material = meshRef.material as THREE.MeshStandardMaterial;
        material.opacity = dampScalar(
          material.opacity,
          0.18 + baseWeight * 0.62,
          6,
          delta
        );
      });
    });
  });

  return (
    <group>
      {signalRoutes.map((route, routeIndex) => {
        const routeColor = LAYER_COLORS[route.focus];
        const stageWeight = route.focus === activeStage
          ? 0.92
          : activeStage === "opening"
            ? 0.54
            : activeStage === "closing"
              ? 0.32
              : 0.18;

        return (
          <group key={route.id}>
            <Line
              points={route.points}
              color={routeColor}
              lineWidth={1.35}
              transparent
              opacity={stageWeight}
            />

            {[0, 1].map((pulseIndex) => (
              <mesh
                key={`${route.id}-${pulseIndex}`}
                ref={(value) => {
                  routeRecords[routeIndex].refs[pulseIndex] = value;
                }}
              >
                <boxGeometry args={[0.12, 0.05, 0.05]} />
                <meshStandardMaterial
                  color={routeColor}
                  emissive={routeColor}
                  emissiveIntensity={0.38}
                  transparent
                  opacity={0.5}
                />
              </mesh>
            ))}
          </group>
        );
      })}
    </group>
  );
}

function SceneContent({
  activeStage,
  focus,
  reducedMotion,
  stageProgress,
  tier,
  variant,
  paused,
  motionProfile
}: Required<
  Pick<
    AtlasSceneProps,
    "activeStage" | "reducedMotion" | "stageProgress" | "variant" | "paused" | "motionProfile"
  >
> & { focus?: MapFocus; tier: ViewportTier }) {
  const rootRef = useRef<THREE.Group>(null);

  return (
    <>
      <BackgroundField activeStage={activeStage} />
      <SceneLighting activeStage={activeStage} />
      <group ref={rootRef}>
        <CrossSectionAsset
          activeStage={activeStage}
          focus={focus}
          reducedMotion={reducedMotion}
          rootRef={rootRef}
        />
        <SignalTraffic
          activeStage={activeStage}
          focus={focus}
          reducedMotion={reducedMotion}
          rootRef={rootRef}
        />
      </group>
      <SceneDirector
        activeStage={activeStage}
        reducedMotion={reducedMotion}
        paused={paused}
        rootRef={rootRef}
        tier={tier}
        variant={variant}
        motionProfile={motionProfile}
        stageProgress={stageProgress}
      />
    </>
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
      className={`atlas-fallback atlas-fallback--${activeStage}${
        variant === "overview" ? " atlas-fallback--overview" : ""
      }`}
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

export const AtlasScene = memo(function AtlasScene({
  activeStage,
  focus,
  reducedMotion = false,
  stageProgress = 0.4,
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
        gl={{ antialias: true, alpha: true }}
        camera={{ position: [0.6, 1, 11.2], fov: 24, near: 0.1, far: 48 }}
      >
        <Suspense fallback={null}>
          <SceneContent
            activeStage={activeStage}
            focus={focus}
            reducedMotion={reducedMotion}
            stageProgress={stageProgress}
            tier={tier}
            variant={variant}
            paused={paused}
            motionProfile={motionProfile}
          />
        </Suspense>
      </Canvas>
    </div>
  );
});

useGLTF.preload(CROSS_SECTION_URL);
