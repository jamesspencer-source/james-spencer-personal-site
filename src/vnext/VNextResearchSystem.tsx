import { Canvas, useFrame, useLoader, useThree } from "@react-three/fiber";
import { Suspense, useMemo, useRef } from "react";
import * as THREE from "three";
import type { VNextAssetId, VNextAssetManifestItem } from "./VNextContent";
import {
  fadeBetween,
  getVNextDocumentaryProgress,
  mix,
  smoothstep,
  vNextSceneTiming
} from "./VNextSceneManifest";

type VNextResearchSystemProps = {
  assets: VNextAssetManifestItem[];
  progress: number;
  reducedMotion?: boolean;
  className?: string;
  mode?: "hero" | "sequence" | "static";
};

type PlateState = {
  opacity: number;
  depthOpacity: number;
  scale: number;
  x: number;
  y: number;
  z: number;
  rotationZ: number;
  brightness: number;
};

function getPlateState(id: VNextAssetId, progress: number, mode: VNextResearchSystemProps["mode"]): PlateState {
  const p = mode === "hero" ? 0.07 : progress;
  const photoFade = getVNextDocumentaryProgress(p);

  if (id === "system-overview") {
    const opening = mode === "hero" ? 1 : fadeBetween(p, 0, 0.02, vNextSceneTiming.opening.end - 0.02, 0.22);
    const support = mode === "hero" ? 0 : 0.14 * (1 - photoFade);
    return {
      opacity: Math.max(opening, support),
      depthOpacity: mode === "hero" ? 0.18 : opening * 0.2,
      scale: mode === "hero" ? 1.02 : mix(1.0, 1.08, smoothstep(0, 0.18, p)),
      x: mode === "hero" ? 0.04 : mix(0.03, -0.16, smoothstep(0.08, 0.22, p)),
      y: mode === "hero" ? -0.01 : mix(0.01, -0.05, smoothstep(0, 0.2, p)),
      z: -0.18,
      rotationZ: mode === "hero" ? -0.003 : -0.01,
      brightness: mode === "hero" ? 1.05 : 0.78
    };
  }

  if (id === "labs-focus") {
    const opacity =
      mode === "static"
        ? Math.abs(p - vNextSceneTiming.labs.hold) < 0.1
          ? 1
          : 0.08
        : fadeBetween(p, 0.1, vNextSceneTiming.labs.start, vNextSceneTiming.labs.end - 0.02, 0.44);
    return {
      opacity: opacity * (1 - photoFade),
      depthOpacity: opacity * 0.24,
      scale: mix(1.08, 0.99, smoothstep(vNextSceneTiming.labs.start, vNextSceneTiming.labs.end, p)),
      x: mix(0.12, -0.07, smoothstep(vNextSceneTiming.labs.start, vNextSceneTiming.labs.end, p)),
      y: mix(-0.04, 0.02, smoothstep(vNextSceneTiming.labs.start, vNextSceneTiming.labs.end, p)),
      z: 0.05,
      rotationZ: mix(0.01, -0.004, smoothstep(vNextSceneTiming.labs.start, vNextSceneTiming.labs.end, p)),
      brightness: 1.06
    };
  }

  if (id === "program-cycle") {
    const opacity =
      mode === "static"
        ? Math.abs(p - vNextSceneTiming.program.hold) < 0.1
          ? 1
          : 0.08
        : fadeBetween(p, 0.32, vNextSceneTiming.program.start, vNextSceneTiming.program.end - 0.02, 0.66);
    return {
      opacity: opacity * (1 - photoFade),
      depthOpacity: opacity * 0.22,
      scale: mix(1.04, 0.98, smoothstep(vNextSceneTiming.program.start, vNextSceneTiming.program.end, p)),
      x: mix(0.08, 0.0, smoothstep(vNextSceneTiming.program.start, vNextSceneTiming.program.end, p)),
      y: mix(0.03, -0.02, smoothstep(vNextSceneTiming.program.start, vNextSceneTiming.program.end, p)),
      z: 0.1,
      rotationZ: mix(-0.008, 0.006, smoothstep(vNextSceneTiming.program.start, vNextSceneTiming.program.end, p)),
      brightness: 1.04
    };
  }

  const opacity =
    mode === "static"
      ? Math.abs(p - vNextSceneTiming.network.hold) < 0.12
        ? 1
        : 0.08
      : fadeBetween(p, 0.54, vNextSceneTiming.network.start, 0.86, 0.98);
  return {
    opacity: opacity * (1 - photoFade * 0.82),
    depthOpacity: opacity * 0.2,
    scale: mix(1.05, 0.99, smoothstep(vNextSceneTiming.network.start, vNextSceneTiming.network.end, p)),
    x: mix(0.14, -0.03, smoothstep(vNextSceneTiming.network.start, vNextSceneTiming.network.end, p)),
    y: mix(0.01, -0.03, smoothstep(vNextSceneTiming.network.start, vNextSceneTiming.network.end, p)),
    z: 0.14,
    rotationZ: mix(0.008, -0.006, smoothstep(vNextSceneTiming.network.start, vNextSceneTiming.network.end, p)),
    brightness: 1.04
  };
}

function usePlateTextures(assets: VNextAssetManifestItem[]) {
  const srcs = useMemo(() => assets.map((asset) => asset.src), [assets]);
  const textures = useLoader(THREE.TextureLoader, srcs);

  return useMemo(() => {
    return assets.reduce<Record<VNextAssetId, THREE.Texture>>((lookup, asset, index) => {
      const texture = textures[index];
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.anisotropy = 8;
      texture.needsUpdate = true;
      lookup[asset.id] = texture;
      return lookup;
    }, {} as Record<VNextAssetId, THREE.Texture>);
  }, [assets, textures]);
}

function PlateLayer({
  id,
  texture,
  progress,
  mode,
  renderOrder,
  depth = false
}: {
  id: VNextAssetId;
  texture: THREE.Texture;
  progress: number;
  mode: VNextResearchSystemProps["mode"];
  renderOrder: number;
  depth?: boolean;
}) {
  const state = getPlateState(id, progress, mode);
  const opacity = depth ? state.depthOpacity : state.opacity;
  const visible = opacity > 0.005;

  return (
    <mesh
      position={[state.x + (depth ? 0.05 : 0), state.y + (depth ? 0.035 : 0), state.z + (depth ? 0.16 : 0)]}
      renderOrder={renderOrder}
      rotation={[0, 0, state.rotationZ]}
      scale={[state.scale + (depth ? 0.055 : 0), state.scale + (depth ? 0.055 : 0), 1]}
      visible={visible}
    >
      <planeGeometry args={[9.6, 5.49, 1, 1]} />
      <meshBasicMaterial
        color={new THREE.Color(state.brightness, state.brightness, state.brightness)}
        blending={depth ? THREE.AdditiveBlending : THREE.NormalBlending}
        depthWrite={false}
        map={texture}
        opacity={opacity}
        side={THREE.DoubleSide}
        toneMapped={false}
        transparent
      />
    </mesh>
  );
}

function LightSweep({ progress, mode }: { progress: number; mode: VNextResearchSystemProps["mode"] }) {
  const sweepRef = useRef<THREE.Mesh>(null);
  const railRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    const p = mode === "hero" ? 0.07 : progress;
    const sweep = sweepRef.current;
    const rail = railRef.current;
    const travel = (state.clock.elapsedTime * 0.045 + p * 1.18) % 1;

    if (sweep) {
      sweep.position.x = mix(-4.8, 4.8, travel);
      sweep.position.y = mix(-2.12, 1.8, smoothstep(vNextSceneTiming.labs.start, vNextSceneTiming.network.end, p));
      sweep.rotation.z = -0.4 + smoothstep(vNextSceneTiming.program.start, vNextSceneTiming.network.end, p) * 0.26;
    }

    if (rail) {
      rail.scale.x = 0.24 + smoothstep(vNextSceneTiming.labs.start, vNextSceneTiming.network.end, p) * 0.76;
      rail.position.x = mix(-2.3, 0.75, smoothstep(vNextSceneTiming.labs.start, vNextSceneTiming.network.end, p));
    }
  });

  const emphasis = mode === "hero" ? 0.34 : 0.18 + smoothstep(vNextSceneTiming.labs.start, vNextSceneTiming.network.end, progress) * 0.3;

  return (
    <group renderOrder={12}>
      <mesh ref={sweepRef} position={[-4.8, -1.2, 0.34]} rotation={[0, 0, -0.42]}>
        <planeGeometry args={[2.3, 0.055]} />
        <meshBasicMaterial
          blending={THREE.AdditiveBlending}
          color="#d9fff0"
          depthWrite={false}
          opacity={emphasis}
          toneMapped={false}
          transparent
        />
      </mesh>
      <mesh ref={railRef} position={[-2.2, -2.12, 0.36]}>
        <planeGeometry args={[5.8, 0.018]} />
        <meshBasicMaterial
          blending={THREE.AdditiveBlending}
          color="#a8d3bb"
          depthWrite={false}
          opacity={0.28}
          toneMapped={false}
          transparent
        />
      </mesh>
    </group>
  );
}

function LabFloorPulse({ progress, mode }: { progress: number; mode: VNextResearchSystemProps["mode"] }) {
  const p = mode === "hero" ? 0.07 : progress;
  const labs = mode === "hero" ? 0.42 : fadeBetween(p, vNextSceneTiming.labs.start, 0.22, 0.36, 0.48);
  const fourBlackfan = smoothstep(0.16, 0.24, p) * (1 - smoothstep(0.43, 0.5, p));
  const vsc = smoothstep(0.24, 0.32, p) * (1 - smoothstep(0.43, 0.5, p));

  return (
    <group renderOrder={18} visible={labs > 0.01}>
      <mesh position={[-0.55, 0.58, 0.42]}>
        <planeGeometry args={[2.1, 0.055]} />
        <meshBasicMaterial
          blending={THREE.AdditiveBlending}
          color="#ffe6b2"
          depthWrite={false}
          opacity={0.18 + fourBlackfan * 0.34}
          toneMapped={false}
          transparent
        />
      </mesh>
      <mesh position={[1.48, 0.28, 0.43]}>
        <planeGeometry args={[2.45, 0.055]} />
        <meshBasicMaterial
          blending={THREE.AdditiveBlending}
          color="#d9fff0"
          depthWrite={false}
          opacity={0.16 + vsc * 0.34}
          toneMapped={false}
          transparent
        />
      </mesh>
      <mesh position={[0.42, 0.42, 0.41]} rotation={[0, 0, -0.12]}>
        <planeGeometry args={[2.2, 0.024]} />
        <meshBasicMaterial
          blending={THREE.AdditiveBlending}
          color="#a8d3bb"
          depthWrite={false}
          opacity={labs * 0.26}
          toneMapped={false}
          transparent
        />
      </mesh>
    </group>
  );
}

function CameraRig({ progress, reducedMotion, mode }: { progress: number; reducedMotion?: boolean; mode: VNextResearchSystemProps["mode"] }) {
  const { camera } = useThree();

  useFrame((_, delta) => {
    const p = reducedMotion ? vNextSceneTiming.labs.hold : mode === "hero" ? 0.07 : progress;
    const photo = getVNextDocumentaryProgress(p);
    const targetX = mix(-0.22, 0.28, smoothstep(vNextSceneTiming.labs.start, vNextSceneTiming.network.end, p));
    const targetY = mix(0.08, -0.06, smoothstep(vNextSceneTiming.program.start, vNextSceneTiming.network.end, p));
    const targetZ = mix(7.35, 6.32, smoothstep(vNextSceneTiming.labs.start, vNextSceneTiming.network.end, p)) + photo * 0.5;
    const target = new THREE.Vector3(targetX, targetY, targetZ);

    camera.position.lerp(target, 1 - Math.pow(0.001, delta));
    camera.lookAt(
      mix(-0.1, 0.16, smoothstep(vNextSceneTiming.labs.start, vNextSceneTiming.network.end, p)),
      mix(0.02, -0.05, photo),
      0
    );
  });

  return null;
}

function ResearchSystemScene({
  assets,
  progress,
  reducedMotion,
  mode
}: {
  assets: VNextAssetManifestItem[];
  progress: number;
  reducedMotion?: boolean;
  mode: VNextResearchSystemProps["mode"];
}) {
  const textures = usePlateTextures(assets);
  const rootRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (!rootRef.current) {
      return;
    }

    const p = reducedMotion ? vNextSceneTiming.labs.hold : mode === "hero" ? 0.07 : progress;
    rootRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.24) * 0.016;
    rootRef.current.rotation.z = mix(-0.008, 0.005, smoothstep(vNextSceneTiming.labs.start, vNextSceneTiming.network.end, p));
  });

  return (
    <>
      <color attach="background" args={["#071014"]} />
      <fog attach="fog" args={["#071014", 8.6, 13]} />
      <CameraRig mode={mode} progress={progress} reducedMotion={reducedMotion} />
      <group ref={rootRef}>
        {assets.map((asset, index) => (
          <PlateLayer
            depth
            id={asset.id}
            key={`${asset.id}-depth`}
            mode={mode}
            progress={progress}
            renderOrder={index + 10}
            texture={textures[asset.id]}
          />
        ))}
        {assets.map((asset, index) => (
          <PlateLayer
            id={asset.id}
            key={asset.id}
            mode={mode}
            progress={progress}
            renderOrder={index + 1}
            texture={textures[asset.id]}
          />
        ))}
        <LightSweep mode={mode} progress={progress} />
        <LabFloorPulse mode={mode} progress={progress} />
      </group>
    </>
  );
}

export function VNextResearchSystem({
  assets,
  progress,
  reducedMotion = false,
  className = "",
  mode = "sequence"
}: VNextResearchSystemProps) {
  return (
    <div className={`vnext-research-system ${className}`} aria-hidden="true">
      <Canvas
        camera={{ position: [0, 0, 7.4], fov: 38, near: 0.1, far: 80 }}
        dpr={[1, 1.6]}
        gl={{
          alpha: false,
          antialias: true,
          powerPreference: "high-performance"
        }}
      >
        <Suspense fallback={null}>
          <ResearchSystemScene assets={assets} mode={mode} progress={progress} reducedMotion={reducedMotion} />
        </Suspense>
      </Canvas>
      <div className="vnext-research-system__shine" />
    </div>
  );
}
