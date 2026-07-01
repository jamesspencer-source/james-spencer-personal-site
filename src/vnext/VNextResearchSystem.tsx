import { Canvas, useFrame, useLoader, useThree } from "@react-three/fiber";
import { Suspense, useMemo, useRef } from "react";
import * as THREE from "three";
import type { VNextAssetId, VNextAssetManifestItem } from "./VNextContent";

type VNextResearchSystemProps = {
  assets: VNextAssetManifestItem[];
  progress: number;
  reducedMotion?: boolean;
  className?: string;
  mode?: "hero" | "sequence" | "static";
};

type PlateState = {
  opacity: number;
  scale: number;
  x: number;
  y: number;
  z: number;
  rotationZ: number;
  brightness: number;
};

function clamp01(value: number) {
  return Math.max(0, Math.min(1, value));
}

function smoothstep(start: number, end: number, value: number) {
  if (start === end) {
    return value >= end ? 1 : 0;
  }

  const x = clamp01((value - start) / (end - start));
  return x * x * (3 - 2 * x);
}

function fadeBetween(value: number, enterStart: number, enterEnd: number, exitStart: number, exitEnd: number) {
  return smoothstep(enterStart, enterEnd, value) * (1 - smoothstep(exitStart, exitEnd, value));
}

function mix(from: number, to: number, amount: number) {
  return from + (to - from) * amount;
}

function getPlateState(id: VNextAssetId, progress: number, mode: VNextResearchSystemProps["mode"]): PlateState {
  const p = mode === "hero" ? 0.08 : progress;
  const photoFade = smoothstep(0.84, 0.96, p);

  if (id === "system-overview") {
    const opening = mode === "hero" ? 1 : fadeBetween(p, 0, 0.02, 0.13, 0.22);
    const support = mode === "hero" ? 0 : 0.18 * (1 - photoFade);
    return {
      opacity: Math.max(opening, support),
      scale: mode === "hero" ? 1.03 : mix(0.98, 1.08, smoothstep(0, 0.18, p)),
      x: mode === "hero" ? 0.08 : mix(0, -0.18, smoothstep(0.08, 0.22, p)),
      y: mode === "hero" ? -0.02 : mix(0.02, -0.05, smoothstep(0, 0.2, p)),
      z: -0.16,
      rotationZ: mode === "hero" ? -0.004 : -0.012,
      brightness: mode === "hero" ? 1.03 : 0.82
    };
  }

  if (id === "labs-focus") {
    const opacity = mode === "static" ? (Math.abs(p - 0.24) < 0.09 ? 1 : 0.12) : fadeBetween(p, 0.1, 0.16, 0.35, 0.45);
    return {
      opacity: opacity * (1 - photoFade),
      scale: mix(1.12, 1.0, smoothstep(0.16, 0.34, p)),
      x: mix(0.18, -0.08, smoothstep(0.16, 0.34, p)),
      y: mix(-0.06, 0.02, smoothstep(0.16, 0.34, p)),
      z: 0.05,
      rotationZ: mix(0.018, -0.006, smoothstep(0.16, 0.34, p)),
      brightness: 1.04
    };
  }

  if (id === "program-cycle") {
    const opacity = mode === "static" ? (Math.abs(p - 0.48) < 0.09 ? 1 : 0.1) : fadeBetween(p, 0.34, 0.4, 0.6, 0.69);
    return {
      opacity: opacity * (1 - photoFade),
      scale: mix(1.05, 0.98, smoothstep(0.38, 0.58, p)),
      x: mix(0.12, 0.02, smoothstep(0.38, 0.58, p)),
      y: mix(0.04, -0.01, smoothstep(0.38, 0.58, p)),
      z: 0.1,
      rotationZ: mix(-0.012, 0.01, smoothstep(0.38, 0.58, p)),
      brightness: 1.02
    };
  }

  const opacity = mode === "static" ? (Math.abs(p - 0.7) < 0.1 ? 1 : 0.1) : fadeBetween(p, 0.58, 0.64, 0.86, 0.98);
  return {
    opacity: opacity * (1 - photoFade * 0.82),
    scale: mix(1.07, 1.0, smoothstep(0.62, 0.82, p)),
    x: mix(0.22, -0.02, smoothstep(0.62, 0.82, p)),
    y: mix(0.02, -0.02, smoothstep(0.62, 0.82, p)),
    z: 0.14,
    rotationZ: mix(0.012, -0.008, smoothstep(0.62, 0.82, p)),
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
  renderOrder
}: {
  id: VNextAssetId;
  texture: THREE.Texture;
  progress: number;
  mode: VNextResearchSystemProps["mode"];
  renderOrder: number;
}) {
  const state = getPlateState(id, progress, mode);
  const visible = state.opacity > 0.005;

  return (
    <mesh
      position={[state.x, state.y, state.z]}
      renderOrder={renderOrder}
      rotation={[0, 0, state.rotationZ]}
      scale={[state.scale, state.scale, 1]}
      visible={visible}
    >
      <planeGeometry args={[9.6, 5.49, 1, 1]} />
      <meshBasicMaterial
        color={new THREE.Color(state.brightness, state.brightness, state.brightness)}
        depthWrite={false}
        map={texture}
        opacity={state.opacity}
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
    const p = mode === "hero" ? 0.08 : progress;
    const sweep = sweepRef.current;
    const rail = railRef.current;
    const travel = (state.clock.elapsedTime * 0.045 + p * 1.18) % 1;

    if (sweep) {
      sweep.position.x = mix(-4.8, 4.8, travel);
      sweep.position.y = mix(-2.1, 1.85, smoothstep(0.16, 0.82, p));
      sweep.rotation.z = -0.42 + smoothstep(0.5, 0.82, p) * 0.28;
    }

    if (rail) {
      rail.scale.x = 0.26 + smoothstep(0.16, 0.82, p) * 0.74;
      rail.position.x = mix(-2.2, 0.8, smoothstep(0.16, 0.82, p));
    }
  });

  const emphasis = mode === "hero" ? 0.36 : 0.2 + smoothstep(0.16, 0.82, progress) * 0.28;

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

function CameraRig({ progress, reducedMotion, mode }: { progress: number; reducedMotion?: boolean; mode: VNextResearchSystemProps["mode"] }) {
  const { camera } = useThree();

  useFrame((_, delta) => {
    const p = reducedMotion ? 0.24 : mode === "hero" ? 0.08 : progress;
    const photo = smoothstep(0.84, 0.96, p);
    const targetX = mix(-0.18, 0.24, smoothstep(0.16, 0.82, p));
    const targetY = mix(0.08, -0.05, smoothstep(0.38, 0.82, p));
    const targetZ = mix(7.4, 6.48, smoothstep(0.16, 0.82, p)) + photo * 0.36;
    const target = new THREE.Vector3(targetX, targetY, targetZ);

    camera.position.lerp(target, 1 - Math.pow(0.001, delta));
    camera.lookAt(mix(-0.08, 0.12, smoothstep(0.16, 0.82, p)), mix(0.02, -0.04, photo), 0);
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

    const p = reducedMotion ? 0.24 : mode === "hero" ? 0.08 : progress;
    rootRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.28) * 0.018;
    rootRef.current.rotation.z = mix(-0.01, 0.006, smoothstep(0.16, 0.82, p));
  });

  return (
    <>
      <color attach="background" args={["#071014"]} />
      <fog attach="fog" args={["#071014", 8.6, 13]} />
      <CameraRig mode={mode} progress={progress} reducedMotion={reducedMotion} />
      <group ref={rootRef}>
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
