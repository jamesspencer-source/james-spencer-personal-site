import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Line, RoundedBox } from "@react-three/drei";
import {
  memo,
  useEffect,
  useMemo,
  useRef,
  useState,
  type MutableRefObject
} from "react";
import * as THREE from "three";
import {
  atlasScenePresets,
  type AtlasStateId
} from "../atlasScenePresets";

type AtlasSceneProps = {
  activeStage: AtlasStateId;
  activeLabel: string;
  reducedMotion: boolean;
  stageProgress: number;
};

type Point3 = [number, number, number];

const COLORS = {
  bg: "#06090a",
  line: "#1f2827",
  shell: "#0f1516",
  shellAlt: "#121a1b",
  labs: "#69d2ad",
  program: "#8fb6ff",
  network: "#d7eb8a",
  text: "#dce3da",
  textMuted: "#8c9791"
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

function ellipsePoints(
  radiusX: number,
  radiusZ: number,
  y: number,
  count: number,
  startAngle = 0
): Point3[] {
  return Array.from({ length: count }, (_, index) => {
    const angle = startAngle + (index / count) * Math.PI * 2;
    return [
      Math.cos(angle) * radiusX,
      y,
      Math.sin(angle) * radiusZ
    ] as Point3;
  });
}

function registerMaterial(
  bucket: MutableRefObject<THREE.MeshStandardMaterial[]>,
  index: number
) {
  return (material: THREE.MeshStandardMaterial | null) => {
    if (material) {
      bucket.current[index] = material;
    }
  };
}

function CameraRig({
  activeStage,
  stageProgress
}: {
  activeStage: AtlasStateId;
  stageProgress: number;
}) {
  const { camera, pointer } = useThree();
  const perspectiveCamera = camera as THREE.PerspectiveCamera;
  const targetRef = useRef(new THREE.Vector3(...atlasScenePresets[activeStage].camera.target));
  const travel =
    activeStage === "opening"
      ? [0, 0.28, -0.5]
      : activeStage === "labs"
        ? [0.55, 0.18, -0.45]
        : activeStage === "program"
          ? [-0.5, 0.16, -0.4]
          : activeStage === "network"
            ? [0.36, 0.22, -0.55]
            : [0, -0.12, -0.25];

  useFrame((_, delta) => {
    const preset = atlasScenePresets[activeStage];
    const drift = preset.motion.drift;
    const targetPosition = preset.camera.position;
    const parallaxX = pointer.x * drift;
    const parallaxY = pointer.y * drift * 0.35;
    const sectionOffset = stageProgress - 0.5;

    perspectiveCamera.position.x = THREE.MathUtils.damp(
      perspectiveCamera.position.x,
      targetPosition[0] + parallaxX + travel[0] * sectionOffset,
      2.8,
      delta
    );
    perspectiveCamera.position.y = THREE.MathUtils.damp(
      perspectiveCamera.position.y,
      targetPosition[1] + parallaxY + travel[1] * sectionOffset,
      2.8,
      delta
    );
    perspectiveCamera.position.z = THREE.MathUtils.damp(
      perspectiveCamera.position.z,
      targetPosition[2] + travel[2] * sectionOffset,
      2.8,
      delta
    );
    perspectiveCamera.fov = THREE.MathUtils.damp(
      perspectiveCamera.fov,
      preset.camera.fov,
      3.4,
      delta
    );
    perspectiveCamera.updateProjectionMatrix();

    targetRef.current.x = THREE.MathUtils.damp(
      targetRef.current.x,
      preset.camera.target[0] + travel[0] * sectionOffset * 0.32,
      3.2,
      delta
    );
    targetRef.current.y = THREE.MathUtils.damp(
      targetRef.current.y,
      preset.camera.target[1] + travel[1] * sectionOffset * 0.28,
      3.2,
      delta
    );
    targetRef.current.z = THREE.MathUtils.damp(
      targetRef.current.z,
      preset.camera.target[2] + travel[2] * sectionOffset * 0.24,
      3.2,
      delta
    );

    perspectiveCamera.lookAt(targetRef.current);
  });

  return null;
}

function AtlasModel({
  activeStage,
  stageProgress
}: {
  activeStage: AtlasStateId;
  stageProgress: number;
}) {
  const rootRef = useRef<THREE.Group>(null);
  const frameRef = useRef<THREE.Group>(null);
  const labsRef = useRef<THREE.Group>(null);
  const programRef = useRef<THREE.Group>(null);
  const networkRef = useRef<THREE.Group>(null);

  const frameMaterials = useRef<THREE.MeshStandardMaterial[]>([]);
  const labMaterials = useRef<THREE.MeshStandardMaterial[]>([]);
  const programMaterials = useRef<THREE.MeshStandardMaterial[]>([]);
  const networkMaterials = useRef<THREE.MeshStandardMaterial[]>([]);

  const current = useRef({
    labs: 0.7,
    program: 0.55,
    network: 0.45,
    pulse: 0.5,
    rotation: 0.3
  });

  const programOrbit = useMemo(() => ellipsePoints(2.15, 1.15, 0.12, 10), []);
  const networkNodes = useMemo(() => ellipsePoints(3.25, 2.25, 0.22, 12, Math.PI / 12), []);

  useFrame((state, delta) => {
    const preset = atlasScenePresets[activeStage];
    const elapsed = state.clock.elapsedTime;
    const sectionOffset = stageProgress - 0.5;

    current.current.labs = THREE.MathUtils.damp(
      current.current.labs,
      preset.emphasis.labs,
      3.2,
      delta
    );
    current.current.program = THREE.MathUtils.damp(
      current.current.program,
      preset.emphasis.program,
      3.2,
      delta
    );
    current.current.network = THREE.MathUtils.damp(
      current.current.network,
      preset.emphasis.network,
      3.2,
      delta
    );
    current.current.pulse = THREE.MathUtils.damp(
      current.current.pulse,
      preset.motion.pulse,
      3,
      delta
    );
    current.current.rotation = THREE.MathUtils.damp(
      current.current.rotation,
      preset.motion.rotation,
      2.7,
      delta
    );

    if (rootRef.current) {
      rootRef.current.rotation.y = THREE.MathUtils.damp(
        rootRef.current.rotation.y,
        current.current.rotation,
        2.6,
        delta
      );
      rootRef.current.rotation.x = THREE.MathUtils.damp(
        rootRef.current.rotation.x,
        -0.14 + current.current.network * 0.08 + sectionOffset * 0.04,
        2.6,
        delta
      );
      rootRef.current.position.y = Math.sin(elapsed * 0.35) * preset.motion.drift * 0.22;
    }

    if (frameRef.current) {
      frameRef.current.rotation.y = THREE.MathUtils.damp(
        frameRef.current.rotation.y,
        current.current.rotation * -0.35,
        2,
        delta
      );
    }

    if (labsRef.current) {
      labsRef.current.position.y = THREE.MathUtils.damp(
        labsRef.current.position.y,
        -0.12 +
          current.current.labs * 0.42 +
          (activeStage === "labs" ? sectionOffset * 0.18 : 0),
        3,
        delta
      );
      labsRef.current.scale.setScalar(
        0.82 +
          current.current.labs * 0.18 +
          (activeStage === "labs" ? stageProgress * 0.04 : 0)
      );
      labsRef.current.rotation.y = THREE.MathUtils.damp(
        labsRef.current.rotation.y,
        0.12 +
          current.current.labs * 0.18 +
          (activeStage === "labs" ? sectionOffset * 0.18 : 0),
        3,
        delta
      );
    }

    if (programRef.current) {
      programRef.current.position.y = THREE.MathUtils.damp(
        programRef.current.position.y,
        -0.1 +
          current.current.program * 0.28 +
          (activeStage === "program" ? sectionOffset * 0.2 : 0),
        3,
        delta
      );
      programRef.current.rotation.y = THREE.MathUtils.damp(
        programRef.current.rotation.y,
        elapsed * 0.18 +
          current.current.program * 0.4 +
          (activeStage === "program" ? sectionOffset * 0.55 : 0),
        2.2,
        delta
      );
      programRef.current.scale.setScalar(
        0.9 +
          current.current.program * 0.14 +
          (activeStage === "program" ? stageProgress * 0.05 : 0)
      );
    }

    if (networkRef.current) {
      networkRef.current.position.y = THREE.MathUtils.damp(
        networkRef.current.position.y,
        -0.16 +
          current.current.network * 0.34 +
          (activeStage === "network" ? sectionOffset * 0.22 : 0),
        3,
        delta
      );
      networkRef.current.rotation.y = THREE.MathUtils.damp(
        networkRef.current.rotation.y,
        -current.current.rotation * 0.78 +
          (activeStage === "network" ? sectionOffset * 0.32 : 0),
        2.2,
        delta
      );
      networkRef.current.scale.setScalar(
        0.88 +
          current.current.network * 0.18 +
          (activeStage === "network" ? stageProgress * 0.06 : 0)
      );
    }

    frameMaterials.current.forEach((material) => {
      material.opacity = 0.12 + current.current.network * 0.1;
      material.emissiveIntensity = 0.08 + current.current.pulse * 0.1;
    });

    labMaterials.current.forEach((material) => {
      material.opacity = 0.14 + current.current.labs * 0.68;
      material.emissiveIntensity = 0.16 + current.current.labs * 0.9;
    });

    programMaterials.current.forEach((material) => {
      material.opacity = 0.14 + current.current.program * 0.7;
      material.emissiveIntensity = 0.16 + current.current.program * 1;
    });

    networkMaterials.current.forEach((material) => {
      material.opacity = 0.12 + current.current.network * 0.74;
      material.emissiveIntensity = 0.14 + current.current.network * 0.95;
    });
  });

  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.55, 0]}>
        <circleGeometry args={[5.8, 72]} />
        <meshBasicMaterial color={COLORS.shell} transparent opacity={0.26} />
      </mesh>

      <group ref={frameRef}>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[1.75, 0.02, 10, 160]} />
          <meshStandardMaterial
            ref={registerMaterial(frameMaterials, 0)}
            color={COLORS.textMuted}
            emissive={COLORS.textMuted}
            transparent
            opacity={0.18}
            roughness={0.6}
            metalness={0.12}
          />
        </mesh>
        <mesh rotation={[Math.PI / 2, 0.2, 0]} scale={1.18}>
          <torusGeometry args={[1.75, 0.012, 10, 160]} />
          <meshStandardMaterial
            ref={registerMaterial(frameMaterials, 1)}
            color={COLORS.textMuted}
            emissive={COLORS.textMuted}
            transparent
            opacity={0.12}
            roughness={0.6}
            metalness={0.12}
          />
        </mesh>
        <mesh position={[0, -0.4, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[2.35, 2.42, 80]} />
          <meshBasicMaterial color={COLORS.line} transparent opacity={0.48} />
        </mesh>
      </group>

      <group ref={rootRef}>
        <group ref={labsRef}>
          <RoundedBox args={[0.74, 1.8, 0.74]} radius={0.05} smoothness={5} position={[-1.18, 0, 0.32]}>
            <meshStandardMaterial
              ref={registerMaterial(labMaterials, 0)}
              color={COLORS.labs}
              emissive={COLORS.labs}
              transparent
              opacity={0.82}
              roughness={0.24}
              metalness={0.08}
            />
          </RoundedBox>
          <RoundedBox args={[0.94, 1.45, 0.62]} radius={0.05} smoothness={5} position={[1.12, 0.35, -0.26]}>
            <meshStandardMaterial
              ref={registerMaterial(labMaterials, 1)}
              color={COLORS.labs}
              emissive={COLORS.labs}
              transparent
              opacity={0.74}
              roughness={0.22}
              metalness={0.08}
            />
          </RoundedBox>
          <mesh position={[0.02, 0.82, 0.04]} rotation={[0, 0, 0.06]}>
            <boxGeometry args={[2.55, 0.05, 0.05]} />
            <meshStandardMaterial
              ref={registerMaterial(labMaterials, 2)}
              color={COLORS.labs}
              emissive={COLORS.labs}
              transparent
              opacity={0.55}
              roughness={0.25}
              metalness={0.06}
            />
          </mesh>
          <Line
            points={[
              [-1.18, 0.95, 0.32],
              [-0.3, 1.15, 0.18],
              [0.46, 1.08, -0.04],
              [1.12, 1.02, -0.26]
            ]}
            color={COLORS.labs}
            transparent
            opacity={0.7}
          />
          {[
            [-1.45, 1.12, 0.58],
            [-0.8, 0.66, -0.18],
            [0.75, 1.42, -0.42],
            [1.45, 0.48, 0.16]
          ].map((position, index) => (
            <mesh key={`lab-node-${index}`} position={position as Point3}>
              <sphereGeometry args={[0.08, 16, 16]} />
              <meshStandardMaterial
                ref={registerMaterial(labMaterials, 3 + index)}
                color={COLORS.labs}
                emissive={COLORS.labs}
                transparent
                opacity={0.72}
                roughness={0.22}
                metalness={0.08}
              />
            </mesh>
          ))}
        </group>

        <group ref={programRef}>
          <Line
            points={[...programOrbit, programOrbit[0]]}
            color={COLORS.program}
            transparent
            opacity={0.65}
          />
          {[[-0.82, -0.1, 0.3], [0.18, 0.12, -0.55], [1.1, -0.05, 0.24]].map(
            (position, index) => (
              <mesh key={`program-column-${index}`} position={position as Point3}>
                <cylinderGeometry args={[0.06, 0.06, 1.15, 18]} />
                <meshStandardMaterial
                  ref={registerMaterial(programMaterials, index)}
                  color={COLORS.program}
                  emissive={COLORS.program}
                  transparent
                  opacity={0.62}
                  roughness={0.18}
                  metalness={0.1}
                />
              </mesh>
            )
          )}
          {programOrbit.map((position, index) => (
            <mesh key={`program-node-${index}`} position={position}>
              <sphereGeometry args={[0.09, 16, 16]} />
              <meshStandardMaterial
                ref={registerMaterial(programMaterials, 3 + index)}
                color={COLORS.program}
                emissive={COLORS.program}
                transparent
                opacity={0.72}
                roughness={0.18}
                metalness={0.1}
              />
            </mesh>
          ))}
        </group>

        <group ref={networkRef}>
          <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0.15, 0]}>
            <torusGeometry args={[3.25, 0.025, 12, 180]} />
            <meshStandardMaterial
              ref={registerMaterial(networkMaterials, 0)}
              color={COLORS.network}
              emissive={COLORS.network}
              transparent
              opacity={0.54}
              roughness={0.28}
              metalness={0.05}
            />
          </mesh>
          {networkNodes.map((position, index) => (
            <mesh key={`network-node-${index}`} position={position}>
              <sphereGeometry args={[0.07, 16, 16]} />
              <meshStandardMaterial
                ref={registerMaterial(networkMaterials, 1 + index)}
                color={COLORS.network}
                emissive={COLORS.network}
                transparent
                opacity={0.72}
                roughness={0.22}
                metalness={0.06}
              />
            </mesh>
          ))}
          {networkNodes.filter((_, index) => index % 2 === 0).map((position, index) => (
            <Line
              key={`network-line-${index}`}
              points={[[0, 0.25, 0], position]}
              color={COLORS.network}
              transparent
              opacity={0.38}
            />
          ))}
        </group>
      </group>
    </group>
  );
}

const MemoAtlasModel = memo(AtlasModel);

function AtlasFallback({ activeStage }: { activeStage: AtlasStateId }) {
  return (
    <div className={`atlas-fallback atlas-fallback--${activeStage}`} aria-hidden="true">
      <div className="atlas-fallback__halo" />
      <div className="atlas-fallback__ring atlas-fallback__ring--inner" />
      <div className="atlas-fallback__ring atlas-fallback__ring--outer" />
      <div className="atlas-fallback__labs">
        <span />
        <span />
      </div>
      <div className="atlas-fallback__program">
        {Array.from({ length: 8 }, (_, index) => (
          <i key={`program-${index}`} />
        ))}
      </div>
      <div className="atlas-fallback__network">
        {Array.from({ length: 10 }, (_, index) => (
          <b key={`network-${index}`} />
        ))}
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

  useEffect(() => {
    setHasWebGL(webglAvailable());
  }, []);

  return (
    <div className="atlas-scene">
      <div className="atlas-scene__hud" aria-hidden="true">
        <p className="atlas-scene__eyebrow">Current stage</p>
        <p className="atlas-scene__label">{activeLabel}</p>
      </div>

      {reducedMotion || !hasWebGL ? (
        <AtlasFallback activeStage={activeStage} />
      ) : (
        <Canvas
          className="atlas-scene__canvas"
          dpr={[1, 1.4]}
          gl={{ antialias: true, alpha: true }}
          camera={{
            position: atlasScenePresets[activeStage].camera.position,
            fov: atlasScenePresets[activeStage].camera.fov
          }}
        >
          <color attach="background" args={[COLORS.bg]} />
          <fog attach="fog" args={[COLORS.bg, 8, 18]} />
          <ambientLight intensity={0.5} color="#b9c5bf" />
          <directionalLight position={[5, 6, 4]} intensity={1.1} color="#d6efe5" />
          <pointLight position={[-4, 2, 5]} intensity={0.85} color="#84b6ff" />
          <pointLight position={[3, -2, -3]} intensity={0.7} color="#cfe68a" />
          <CameraRig activeStage={activeStage} stageProgress={stageProgress} />
          <MemoAtlasModel
            activeStage={activeStage}
            stageProgress={stageProgress}
          />
        </Canvas>
      )}
    </div>
  );
}
