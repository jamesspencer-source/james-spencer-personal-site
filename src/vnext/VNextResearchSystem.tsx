import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";

type VNextResearchSystemProps = {
  progress: number;
  reducedMotion?: boolean;
  className?: string;
};

type Triple = [number, number, number];

function clamp01(value: number) {
  return Math.max(0, Math.min(1, value));
}

function smoothstep(start: number, end: number, value: number) {
  const x = clamp01((value - start) / (end - start));
  return x * x * (3 - 2 * x);
}

function fadeBetween(value: number, enterStart: number, enterEnd: number, exitStart: number, exitEnd: number) {
  return smoothstep(enterStart, enterEnd, value) * (1 - smoothstep(exitStart, exitEnd, value));
}

function mix(from: number, to: number, amount: number) {
  return from + (to - from) * amount;
}

function Box({
  position,
  scale,
  color,
  opacity = 1,
  emissive = "#000000",
  emissiveIntensity = 0,
  roughness = 0.68,
  metalness = 0.04,
  rotation = [0, 0, 0]
}: {
  position: Triple;
  scale: Triple;
  color: string;
  opacity?: number;
  emissive?: string;
  emissiveIntensity?: number;
  roughness?: number;
  metalness?: number;
  rotation?: Triple;
}) {
  return (
    <mesh position={position} scale={scale} rotation={rotation}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial
        color={color}
        emissive={emissive}
        emissiveIntensity={emissiveIntensity}
        metalness={metalness}
        opacity={opacity}
        roughness={roughness}
        transparent={opacity < 0.995}
      />
    </mesh>
  );
}

function Tube({
  points,
  color,
  opacity = 1,
  radius = 0.025,
  emissiveIntensity = 0.2
}: {
  points: THREE.Vector3[];
  color: string;
  opacity?: number;
  radius?: number;
  emissiveIntensity?: number;
}) {
  const geometry = useMemo(() => {
    const curve = new THREE.CatmullRomCurve3(points);
    return new THREE.TubeGeometry(curve, 96, radius, 10, false);
  }, [points, radius]);

  return (
    <mesh geometry={geometry}>
      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={emissiveIntensity}
        opacity={opacity}
        roughness={0.45}
        transparent={opacity < 0.995}
      />
    </mesh>
  );
}

function FacadeGrid({
  origin,
  cols,
  rows,
  width,
  height,
  color,
  opacity,
  rotation = [0, 0, 0]
}: {
  origin: Triple;
  cols: number;
  rows: number;
  width: number;
  height: number;
  color: string;
  opacity: number;
  rotation?: Triple;
}) {
  const panes = useMemo(() => {
    const result: Array<{ position: Triple; scale: Triple }> = [];
    const paneWidth = width / cols;
    const paneHeight = height / rows;

    for (let row = 0; row < rows; row += 1) {
      for (let col = 0; col < cols; col += 1) {
        result.push({
          position: [
            -width / 2 + paneWidth * (col + 0.5),
            -height / 2 + paneHeight * (row + 0.5),
            0
          ],
          scale: [paneWidth * 0.56, paneHeight * 0.36, 0.018]
        });
      }
    }

    return result;
  }, [cols, height, rows, width]);

  return (
    <group position={origin} rotation={rotation}>
      {panes.map((pane, index) => (
        <Box
          color={color}
          opacity={opacity}
          position={pane.position}
          scale={pane.scale}
          roughness={0.42}
          key={`${pane.position.join("-")}-${index}`}
        />
      ))}
    </group>
  );
}

function RoofMechanical({
  start,
  count,
  opacity,
  color = "#d7d9d2"
}: {
  start: Triple;
  count: number;
  opacity: number;
  color?: string;
}) {
  return (
    <group>
      {Array.from({ length: count }, (_, index) => (
        <Box
          color={color}
          opacity={opacity}
          position={[start[0] + index * 0.16, start[1], start[2] + (index % 2) * 0.24]}
          scale={[0.1, 0.18, 0.1]}
          roughness={0.62}
          key={index}
        />
      ))}
    </group>
  );
}

function LabBuildings({ progress }: { progress: number }) {
  const focus = Math.max(0.32, fadeBetween(progress, 0, 0.08, 0.39, 0.52));
  const detail = smoothstep(0.06, 0.2, progress);
  const blackfanFloor = 0.18 + smoothstep(0.1, 0.22, progress) * 0.62;
  const vscFloor = 0.14 + smoothstep(0.22, 0.34, progress) * 0.66;
  const connector = 0.18 + smoothstep(0.18, 0.34, progress) * 0.68;
  const pulse = Math.sin(progress * Math.PI * 16) * 0.08;
  const connectorCurve = useMemo(
    () => [
      new THREE.Vector3(-0.92, 1.12, 0.9),
      new THREE.Vector3(-0.22, 1.25, 1.08),
      new THREE.Vector3(0.52, 1.02, 0.92)
    ],
    []
  );

  return (
    <group position={[-2.35, -0.46, 0.05]} rotation={[0, -0.22, 0]} scale={0.88}>
      <Box color="#18242b" opacity={0.62 * focus} position={[0, -1.45, 0.42]} scale={[4.7, 0.08, 3.25]} />
      <Box color="#8da19c" opacity={0.34 * focus} position={[0.1, -1.37, 1.9]} scale={[4.5, 0.045, 0.28]} rotation={[0, -0.07, 0]} />
      <Box color="#365049" opacity={0.28 * focus} position={[-1.2, -1.33, 1.54]} scale={[1.25, 0.035, 0.14]} rotation={[0, 0.34, 0]} />

      <Box color="#b8b1a4" opacity={0.92 * focus} position={[-1.05, 0.05, 0.12]} scale={[1.16, 2.75, 1.08]} roughness={0.82} />
      <Box color="#8d897f" opacity={0.74 * focus} position={[-0.47, 0.02, 0.22]} scale={[0.22, 2.66, 1.08]} roughness={0.76} />
      <Box color="#d5d1c7" opacity={0.9 * focus} position={[-1.05, 1.48, 0.12]} scale={[1.28, 0.13, 1.2]} />
      <RoofMechanical start={[-1.42, 1.66, -0.1]} count={8} opacity={detail * focus} />
      <FacadeGrid
        color="#4c5b5d"
        cols={7}
        height={2.28}
        opacity={detail * focus * 0.86}
        origin={[-1.05, 0.07, 0.67]}
        rows={10}
        width={0.92}
      />
      <FacadeGrid
        color="#657071"
        cols={3}
        height={2.18}
        opacity={detail * focus * 0.62}
        origin={[-0.43, 0.04, 0.19]}
        rows={10}
        rotation={[0, Math.PI / 2, 0]}
        width={0.82}
      />

      <Box color="#6f8d94" opacity={0.9 * focus} position={[1.02, 0.05, 0]} scale={[1.56, 2.48, 1.34]} roughness={0.55} />
      <Box color="#4e6970" opacity={0.78 * focus} position={[1.08, -0.86, 0.5]} scale={[2.0, 0.82, 1.82]} roughness={0.6} />
      <Box color="#dce4df" opacity={0.92 * focus} position={[1.02, 1.35, 0]} scale={[1.7, 0.12, 1.48]} />
      <RoofMechanical start={[0.52, 1.54, -0.28]} count={12} opacity={detail * focus} color="#eef1ed" />
      <FacadeGrid
        color="#c8dad7"
        cols={8}
        height={2.08}
        opacity={detail * focus * 0.8}
        origin={[1.02, 0.08, 0.69]}
        rows={10}
        width={1.24}
      />
      <FacadeGrid
        color="#a7bebb"
        cols={4}
        height={2.0}
        opacity={detail * focus * 0.54}
        origin={[1.86, 0.04, 0.08]}
        rows={10}
        rotation={[0, Math.PI / 2, 0]}
        width={1.0}
      />

      <Box color="#638087" opacity={0.76 * focus} position={[0.12, -1.06, 1.12]} scale={[1.1, 0.58, 1.02]} roughness={0.62} />
      <Box color="#4d646c" opacity={0.7 * focus} position={[0.68, -0.95, 1.0]} scale={[0.42, 0.62, 0.72]} roughness={0.62} />

      <Box
        color="#bff1cf"
        emissive="#83d7a5"
        emissiveIntensity={0.75 + pulse}
        opacity={blackfanFloor * focus}
        position={[-1.05, 1.08, 0.13]}
        scale={[1.22, 0.19, 1.16]}
        roughness={0.32}
      />
      <Box
        color="#c4f6d5"
        emissive="#83d7a5"
        emissiveIntensity={0.65 + pulse}
        opacity={vscFloor * focus}
        position={[1.02, 0.9, 0.01]}
        scale={[1.68, 0.19, 1.45]}
        roughness={0.32}
      />

      <Tube color="#bdf1cf" emissiveIntensity={0.8} opacity={connector * focus} points={connectorCurve} radius={0.035} />
      <Tube color="#ecfff1" emissiveIntensity={1.4} opacity={Math.max(0, connector - 0.25) * focus} points={connectorCurve} radius={0.012} />
    </group>
  );
}

function ProgramCycle({ progress }: { progress: number }) {
  const focus = Math.max(0.24, fadeBetween(progress, 0.28, 0.42, 0.66, 0.78));
  const sequence = smoothstep(0.36, 0.62, progress);
  const nodeLabels = ["Funding", "Hiring", "Setup", "Biosafety", "Delivery", "Closeout"];

  return (
    <group position={[0.04, -0.62, 0.24]} rotation={[0, 0.02, 0]} scale={0.94}>
      <mesh rotation={[Math.PI / 2.12, 0, 0]}>
        <torusGeometry args={[1.35, 0.07, 22, 160]} />
        <meshStandardMaterial
          color="#a7d4bc"
          emissive="#5da477"
          emissiveIntensity={0.28 + sequence * 0.42}
          opacity={0.28 + focus * 0.68}
          roughness={0.42}
          transparent
        />
      </mesh>
      <mesh rotation={[Math.PI / 2.12, 0, 0]}>
        <torusGeometry args={[1.62, 0.018, 12, 160]} />
        <meshStandardMaterial color="#6b8689" opacity={0.18 + focus * 0.28} transparent />
      </mesh>
      <Box color="#4e666c" opacity={0.22 + focus * 0.24} position={[0, -0.46, 0]} scale={[2.44, 0.05, 1.4]} />

      {nodeLabels.map((label, index) => {
        const angle = (index / nodeLabels.length) * Math.PI * 2 + 0.18;
        const reveal = smoothstep(index / 7, index / 7 + 0.17, sequence);
        const active = reveal * focus;
        return (
          <group
            key={label}
            position={[Math.cos(angle) * 1.35, Math.sin(angle) * 0.43 - 0.04, Math.sin(angle) * 1.02]}
            scale={0.72 + active * 0.46}
          >
            <mesh>
              <sphereGeometry args={[0.095, 24, 18]} />
              <meshStandardMaterial
                color="#e8fff0"
                emissive="#8ed3a8"
                emissiveIntensity={0.18 + active * 1.4}
                opacity={0.42 + active * 0.58}
                transparent
              />
            </mesh>
          </group>
        );
      })}

      <Box color="#bfe7cf" opacity={0.28 + focus * 0.32} position={[1.39, 0.1, -0.04]} scale={[0.18, 0.08, 0.34]} rotation={[0, 0.15, -0.45]} />
    </group>
  );
}

function GlobeNetwork({ progress }: { progress: number }) {
  const focus = Math.max(0.18, fadeBetween(progress, 0.58, 0.7, 0.92, 1.04));
  const sequence = smoothstep(0.66, 0.84, progress);
  const globeRef = useRef<THREE.Group>(null);
  const arcOne = useMemo(
    () => [
      new THREE.Vector3(0.45, 0.18, 1.18),
      new THREE.Vector3(-0.2, 0.72, 1.55),
      new THREE.Vector3(-0.82, 0.08, 1.05)
    ],
    []
  );
  const arcTwo = useMemo(
    () => [
      new THREE.Vector3(-0.82, 0.08, 1.05),
      new THREE.Vector3(0.12, 0.82, 1.62),
      new THREE.Vector3(0.78, 0.24, 1.06)
    ],
    []
  );
  const arcThree = useMemo(
    () => [
      new THREE.Vector3(0.45, 0.18, 1.18),
      new THREE.Vector3(0.72, 0.62, 1.34),
      new THREE.Vector3(0.68, 0.36, 1.12)
    ],
    []
  );
  const pins: Triple[] = [
    [0.45, 0.18, 1.18],
    [0.68, 0.36, 1.12],
    [-0.82, 0.08, 1.05],
    [0.78, 0.24, 1.06]
  ];

  useFrame((state) => {
    if (!globeRef.current) {
      return;
    }

    globeRef.current.rotation.y = -0.22 + Math.sin(state.clock.elapsedTime * 0.22) * 0.035;
  });

  return (
    <group position={[2.42, 0.16, 0.1]} scale={1.05}>
      <group ref={globeRef}>
        <mesh>
          <sphereGeometry args={[1.28, 52, 32]} />
          <meshStandardMaterial
            color="#9fb3ad"
            metalness={0}
            opacity={0.1 + focus * 0.18}
            roughness={0.86}
            transparent
            wireframe
          />
        </mesh>
        <mesh>
          <sphereGeometry args={[1.255, 32, 22]} />
          <meshStandardMaterial color="#9bb2ac" opacity={0.07 + focus * 0.11} roughness={0.9} transparent />
        </mesh>

        <Box color="#bde4c8" opacity={0.28 + focus * 0.42} position={[0.12, 0.22, 1.16]} scale={[0.74, 0.07, 0.28]} rotation={[0.08, 0.02, -0.18]} />
        <Box color="#bde4c8" opacity={0.22 + focus * 0.34} position={[0.48, 0.05, 1.19]} scale={[0.52, 0.06, 0.18]} rotation={[0.08, 0.02, -0.02]} />
        <Box color="#bde4c8" opacity={0.2 + focus * 0.3} position={[0.28, -0.14, 1.15]} scale={[0.34, 0.055, 0.16]} rotation={[0.08, 0.02, -0.38]} />

        <Tube color="#c9f5d6" opacity={(0.14 + sequence * 0.55) * focus} points={arcOne} radius={0.015} />
        <Tube color="#c9f5d6" opacity={(0.12 + sequence * 0.46) * focus} points={arcTwo} radius={0.014} />
        <Tube color="#eaffef" opacity={(0.12 + sequence * 0.42) * focus} points={arcThree} radius={0.012} />

        {pins.map((pin, index) => {
          const reveal = smoothstep(index / 5, index / 5 + 0.22, sequence);
          return (
            <mesh position={pin} scale={0.45 + reveal * 0.9} key={pin.join("-")}>
              <sphereGeometry args={[0.055, 20, 16]} />
              <meshStandardMaterial
                color="#ecfff2"
                emissive="#98e2af"
                emissiveIntensity={0.2 + reveal * 1.7}
                opacity={(0.14 + reveal * 0.86) * focus}
                transparent
              />
            </mesh>
          );
        })}
      </group>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1.62, 0.018, 10, 160]} />
        <meshStandardMaterial color="#8eb7a7" opacity={0.08 + focus * 0.18} transparent />
      </mesh>
    </group>
  );
}

function SystemConnectors({ progress }: { progress: number }) {
  const show = 0.18 + smoothstep(0.04, 0.18, progress) * 0.42;
  const labsToProgram = useMemo(
    () => [
      new THREE.Vector3(-1.38, -0.83, 0.86),
      new THREE.Vector3(-0.62, -0.84, 0.76),
      new THREE.Vector3(-0.28, -0.58, 0.56)
    ],
    []
  );
  const programToNetwork = useMemo(
    () => [
      new THREE.Vector3(1.24, -0.28, 0.56),
      new THREE.Vector3(1.88, 0.02, 0.86),
      new THREE.Vector3(2.42, 0.38, 0.94)
    ],
    []
  );

  return (
    <group>
      <Tube color="#9ac6b1" opacity={show} points={labsToProgram} radius={0.028} />
      <Tube color="#9ac6b1" opacity={show * smoothstep(0.42, 0.72, progress)} points={programToNetwork} radius={0.026} />
      <Box color="#213038" opacity={0.48} position={[0.08, -1.72, 0.34]} scale={[6.7, 0.08, 3.9]} rotation={[0, -0.08, 0]} />
    </group>
  );
}

function CameraRig({ progress, reducedMotion }: { progress: number; reducedMotion?: boolean }) {
  const { camera } = useThree();
  const target = useMemo(() => new THREE.Vector3(), []);
  const cameraTarget = useMemo(() => new THREE.Vector3(), []);

  useFrame((_, delta) => {
    const p = reducedMotion ? 0.42 : progress;
    const labs = smoothstep(0.06, 0.24, p) * (1 - smoothstep(0.36, 0.48, p));
    const program = fadeBetween(p, 0.34, 0.46, 0.64, 0.76);
    const network = smoothstep(0.62, 0.86, p);
    const photo = smoothstep(0.88, 0.98, p);

    const x = mix(-0.62, 0.55, smoothstep(0.34, 0.82, p)) + network * 0.34;
    const y = mix(3.6, 2.66, smoothstep(0.12, 0.76, p)) + photo * 0.28;
    const z = mix(6.9, 5.45, smoothstep(0.1, 0.74, p));

    cameraTarget.set(x, y, z);
    camera.position.lerp(cameraTarget, 1 - Math.pow(0.001, delta));
    target.set(
      -0.86 * labs + 0.14 * program + 0.72 * network,
      mix(-0.22, 0.1, network),
      mix(0.36, 0.2, smoothstep(0.22, 0.76, p))
    );
    camera.lookAt(target);
  });

  return null;
}

function ResearchSystemScene({ progress, reducedMotion }: { progress: number; reducedMotion?: boolean }) {
  const rootRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (!rootRef.current) {
      return;
    }

    const p = reducedMotion ? 0.42 : progress;
    rootRef.current.rotation.y = -0.23 + smoothstep(0.18, 0.82, p) * 0.18 + Math.sin(state.clock.elapsedTime * 0.18) * 0.008;
    rootRef.current.rotation.x = -0.08 + smoothstep(0.44, 0.82, p) * 0.06;
    rootRef.current.position.y = -0.1 + Math.sin(state.clock.elapsedTime * 0.28) * 0.018;
  });

  return (
    <>
      <color attach="background" args={["#071014"]} />
      <fog attach="fog" args={["#071014", 6.2, 13]} />
      <ambientLight color="#dfeee8" intensity={0.58} />
      <directionalLight color="#ffffff" intensity={1.5} position={[2.6, 4.4, 4.8]} />
      <directionalLight color="#93c5ad" intensity={0.8} position={[-3.4, 2.6, -2.4]} />
      <pointLight color="#bdf0ca" intensity={0.85} position={[0.2, 1.5, 2.7]} distance={7} />
      <CameraRig progress={progress} reducedMotion={reducedMotion} />
      <group ref={rootRef}>
        <SystemConnectors progress={progress} />
        <LabBuildings progress={progress} />
        <ProgramCycle progress={progress} />
        <GlobeNetwork progress={progress} />
      </group>
    </>
  );
}

export function VNextResearchSystem({ progress, reducedMotion = false, className = "" }: VNextResearchSystemProps) {
  return (
    <div className={`vnext-research-system ${className}`} aria-hidden="true">
      <Canvas
        camera={{ position: [0, 3.6, 6.9], fov: 36, near: 0.1, far: 80 }}
        dpr={[1, 1.6]}
        gl={{
          alpha: false,
          antialias: true,
          powerPreference: "high-performance"
        }}
      >
        <ResearchSystemScene progress={progress} reducedMotion={reducedMotion} />
      </Canvas>
      <div className="vnext-research-system__shine" />
    </div>
  );
}
