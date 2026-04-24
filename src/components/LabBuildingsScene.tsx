import { useEffect, useRef, useState } from "react";

let THREE: any = null;

type LabBuildingsSceneProps = {
  progress: number;
  reveal: number;
  detail: number;
  compress: number;
  staticMode?: boolean;
};

type SceneHandles = {
  renderer: any;
  scene: any;
  camera: any;
  root: any;
  facadeMaterials: any[];
  roofGroup: any;
  himBand: any;
  vscBand: any;
  connector: any;
  resizeObserver: ResizeObserver;
  frameId: number;
};

const floorBandColor = 0x9fd5b8;

function clamp01(value: number) {
  return Math.max(0, Math.min(1, value));
}

function mix(from: number, to: number, amount: number) {
  return from + (to - from) * amount;
}

function smoothstep(start: number, end: number, value: number) {
  const x = clamp01((value - start) / (end - start));
  return x * x * (3 - 2 * x);
}

function createBox(
  parent: any,
  geometry: any,
  material: any,
  position: [number, number, number],
  rotation: [number, number, number] = [0, 0, 0]
) {
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(...position);
  mesh.rotation.set(...rotation);
  parent.add(mesh);
  return mesh;
}

function addFacadeGrid(
  parent: any,
  options: {
    x: number;
    z: number;
    width: number;
    depth: number;
    height: number;
    floors: number;
    columns: number;
    material: any;
  }
) {
  const floorHeight = options.height / options.floors;

  for (let index = 1; index < options.floors; index += 1) {
    createBox(
      parent,
      new THREE.BoxGeometry(options.width * 0.96, 0.012, 0.018),
      options.material,
      [
        options.x,
        index * floorHeight + 0.018,
        options.z + options.depth / 2 + 0.018
      ]
    );
  }

  for (let index = 1; index < options.columns; index += 1) {
    const offset = -options.width / 2 + (options.width / options.columns) * index;
    createBox(
      parent,
      new THREE.BoxGeometry(0.014, options.height * 0.9, 0.016),
      options.material,
      [
        options.x + offset,
        options.height * 0.5,
        options.z + options.depth / 2 + 0.022
      ]
    );
  }
}

function addRoofUnits(
  parent: any,
  material: any,
  units: Array<{ x: number; y: number; z: number; width: number; height: number; depth: number }>
) {
  units.forEach((unit) => {
    createBox(
      parent,
      new THREE.BoxGeometry(unit.width, unit.height, unit.depth),
      material,
      [unit.x, unit.y, unit.z]
    );
  });
}

function buildScene(canvas: HTMLCanvasElement, container: HTMLDivElement) {
  const renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: true,
    antialias: true,
    powerPreference: "low-power"
  });
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.08;
  renderer.setClearColor(0x000000, 0);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.7));

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 80);
  const root = new THREE.Group();
  scene.add(root);

  const ambient = new THREE.AmbientLight(0xdce8e2, 1.15);
  scene.add(ambient);

  const keyLight = new THREE.DirectionalLight(0xf4faf7, 2.35);
  keyLight.position.set(4.5, 7, 5);
  scene.add(keyLight);

  const rimLight = new THREE.DirectionalLight(0x9fc8b4, 1.75);
  rimLight.position.set(-5, 4, -4);
  scene.add(rimLight);

  const groundMaterial = new THREE.MeshStandardMaterial({
    color: 0x1c252a,
    roughness: 0.84,
    metalness: 0.05
  });
  const concreteMaterial = new THREE.MeshStandardMaterial({
    color: 0x9a9a93,
    roughness: 0.82,
    metalness: 0.03
  });
  const concreteSideMaterial = new THREE.MeshStandardMaterial({
    color: 0x70736f,
    roughness: 0.86,
    metalness: 0.02
  });
  const glassMaterial = new THREE.MeshStandardMaterial({
    color: 0x6f8ea0,
    roughness: 0.44,
    metalness: 0.08,
    transparent: true,
    opacity: 0.78
  });
  const glassDarkMaterial = new THREE.MeshStandardMaterial({
    color: 0x3f5663,
    roughness: 0.52,
    metalness: 0.05,
    transparent: true,
    opacity: 0.76
  });
  const roofMaterial = new THREE.MeshStandardMaterial({
    color: 0xd8ded8,
    roughness: 0.76,
    metalness: 0.04
  });
  const facadeMaterial = new THREE.MeshStandardMaterial({
    color: 0xd6ebe0,
    emissive: 0x456255,
    emissiveIntensity: 0.08,
    roughness: 0.58,
    metalness: 0.02,
    transparent: true,
    opacity: 0.34
  });
  const roofUnitMaterial = new THREE.MeshStandardMaterial({
    color: 0xb6c0ba,
    roughness: 0.64,
    metalness: 0.05,
    transparent: true,
    opacity: 0.92
  });
  const bandMaterial = new THREE.MeshStandardMaterial({
    color: floorBandColor,
    emissive: floorBandColor,
    emissiveIntensity: 0.7,
    roughness: 0.5,
    metalness: 0,
    transparent: true,
    opacity: 0.62
  });
  const bandMaterialAlt = bandMaterial.clone();

  createBox(root, new THREE.BoxGeometry(8.5, 0.08, 5.6), groundMaterial, [0.42, -0.05, 0.25]);
  createBox(root, new THREE.BoxGeometry(5.6, 0.045, 0.1), groundMaterial, [0.3, 0.015, 2.95]);
  createBox(root, new THREE.BoxGeometry(0.11, 0.045, 4.8), groundMaterial, [-3.75, 0.02, 0.15]);

  // 4 Blackfan / HIM: heavier concrete tower with ten occupant floors.
  createBox(root, new THREE.BoxGeometry(1.25, 3.55, 1.68), concreteMaterial, [-1.85, 1.775, 0.05]);
  createBox(root, new THREE.BoxGeometry(0.2, 3.55, 1.72), concreteSideMaterial, [-2.58, 1.775, 0.0]);
  createBox(root, new THREE.BoxGeometry(1.3, 0.12, 1.72), roofMaterial, [-1.85, 3.61, 0.05]);

  // VSC / former NRB: larger glass tower plus lower four-story podium.
  createBox(root, new THREE.BoxGeometry(2.35, 3.5, 2.05), glassMaterial, [1.42, 1.75, -0.2]);
  createBox(root, new THREE.BoxGeometry(0.23, 3.5, 2.12), glassDarkMaterial, [2.72, 1.75, -0.16]);
  createBox(root, new THREE.BoxGeometry(2.42, 0.11, 2.12), roofMaterial, [1.42, 3.56, -0.2]);
  createBox(root, new THREE.BoxGeometry(2.85, 1.18, 1.32), glassDarkMaterial, [0.98, 0.59, 1.48]);
  createBox(root, new THREE.BoxGeometry(2.92, 0.1, 1.38), roofMaterial, [0.98, 1.22, 1.48]);
  createBox(root, new THREE.BoxGeometry(1.42, 0.55, 0.48), glassDarkMaterial, [-0.28, 0.72, 0.94]);

  addFacadeGrid(root, {
    x: -1.85,
    z: 0.05,
    width: 1.25,
    depth: 1.68,
    height: 3.55,
    floors: 10,
    columns: 5,
    material: facadeMaterial
  });
  addFacadeGrid(root, {
    x: 1.42,
    z: -0.2,
    width: 2.35,
    depth: 2.05,
    height: 3.5,
    floors: 10,
    columns: 9,
    material: facadeMaterial
  });

  const roofGroup = new THREE.Group();
  root.add(roofGroup);
  addRoofUnits(roofGroup, roofUnitMaterial, [
    { x: -2.18, y: 3.78, z: 0.24, width: 0.34, height: 0.16, depth: 0.3 },
    { x: -1.78, y: 3.78, z: 0.24, width: 0.34, height: 0.16, depth: 0.3 },
    { x: -1.38, y: 3.78, z: 0.24, width: 0.34, height: 0.16, depth: 0.3 },
    { x: -1.85, y: 3.8, z: -0.35, width: 0.92, height: 0.13, depth: 0.24 },
    { x: 0.78, y: 3.76, z: -0.54, width: 0.42, height: 0.16, depth: 0.34 },
    { x: 1.32, y: 3.76, z: -0.54, width: 0.42, height: 0.16, depth: 0.34 },
    { x: 1.86, y: 3.76, z: -0.54, width: 0.42, height: 0.16, depth: 0.34 },
    { x: 2.2, y: 3.76, z: 0.32, width: 0.26, height: 0.18, depth: 0.24 },
    { x: 1.78, y: 3.76, z: 0.34, width: 0.26, height: 0.18, depth: 0.24 }
  ]);

  for (let index = 0; index < 10; index += 1) {
    const stack = new THREE.Mesh(
      new THREE.CylinderGeometry(0.035, 0.045, 0.38, 16),
      roofUnitMaterial
    );
    stack.position.set(0.52 + index * 0.18, 3.91, 0.76);
    roofGroup.add(stack);
  }

  const himBand = createBox(
    root,
    new THREE.BoxGeometry(1.32, 0.13, 0.055),
    bandMaterial,
    [-1.85, 3.38, 0.93]
  );
  const vscBand = createBox(
    root,
    new THREE.BoxGeometry(2.44, 0.13, 0.055),
    bandMaterialAlt,
    [1.42, 3.02, 0.86]
  );

  const connectorPoints = [
    new THREE.Vector3(-1.2, 3.38, 0.95),
    new THREE.Vector3(-0.25, 3.32, 1.18),
    new THREE.Vector3(0.45, 3.12, 1.08),
    new THREE.Vector3(0.22, 3.02, 0.86)
  ];
  const connectorGeometry = new THREE.BufferGeometry().setFromPoints(connectorPoints);
  connectorGeometry.setDrawRange(0, 2);
  const connector = new THREE.Line(
    connectorGeometry,
    new THREE.LineBasicMaterial({
      color: floorBandColor,
      transparent: true,
      opacity: 0.72
    })
  );
  root.add(connector);

  const resize = () => {
    const width = Math.max(1, container.clientWidth);
    const height = Math.max(1, container.clientHeight);
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  };

  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(container);
  resize();

  return {
    renderer,
    scene,
    camera,
    root,
    facadeMaterials: [facadeMaterial],
    roofGroup,
    himBand,
    vscBand,
    connector,
    resizeObserver,
    frameId: 0
  };
}

function updateScene(
  handles: SceneHandles,
  progress: number,
  reveal: number,
  detail: number,
  compress: number,
  elapsed: number
) {
  const settle = smoothstep(0.22, 0.42, progress);
  const floorSequence = smoothstep(0.32, 0.5, progress);
  const connectorDraw = Math.floor(mix(2, 4, smoothstep(0.38, 0.52, progress)));
  const pulse = 0.5 + Math.sin(elapsed * 0.0028) * 0.5;
  const himEmphasis = smoothstep(0.32, 0.4, progress) * (1 - smoothstep(0.48, 0.56, progress));
  const vscEmphasis = smoothstep(0.4, 0.5, progress) * (1 - smoothstep(0.56, 0.64, progress));

  handles.root.rotation.y = mix(-0.38, -0.26, settle);
  handles.root.rotation.x = mix(0.08, 0.02, settle);
  handles.root.position.y = mix(-0.22, -0.05, reveal);
  handles.root.scale.setScalar(mix(0.88, 1, reveal) * mix(1, 0.94, compress));

  handles.camera.position.set(
    mix(4.8, 4.05, settle),
    mix(4.7, 4.2, settle),
    mix(6.6, 5.45, settle)
  );
  handles.camera.lookAt(0.15, 1.75, 0.25);

  handles.facadeMaterials.forEach((material) => {
    material.opacity = mix(0.18, 0.48, detail);
    material.emissiveIntensity = mix(0.02, 0.11, detail);
  });
  handles.roofGroup.children.forEach((child: any) => {
    child.visible = detail > 0.06;
    child.scale.setScalar(mix(0.92, 1, detail));
  });

  handles.himBand.material.opacity = mix(0.34, 0.86, floorSequence) + himEmphasis * pulse * 0.18;
  handles.himBand.material.emissiveIntensity = mix(0.45, 1.2, himEmphasis + detail * 0.24);
  handles.vscBand.material.opacity = mix(0.3, 0.78, floorSequence) + vscEmphasis * pulse * 0.18;
  handles.vscBand.material.emissiveIntensity = mix(0.4, 1.08, vscEmphasis + detail * 0.22);
  handles.connector.geometry.setDrawRange(0, connectorDraw);
  handles.connector.material.opacity = mix(0.25, 0.82, smoothstep(0.38, 0.52, progress));
}

function disposeScene(handles: SceneHandles) {
  handles.resizeObserver.disconnect();
  window.cancelAnimationFrame(handles.frameId);
  handles.scene.traverse((object: any) => {
    if (object instanceof THREE.Mesh || object instanceof THREE.Line) {
      object.geometry.dispose();
      const materials = Array.isArray(object.material) ? object.material : [object.material];
      materials.forEach((material: any) => material.dispose());
    }
  });
  handles.renderer.dispose();
}

function LabBuildingsFallback() {
  return (
    <svg className="lab-buildings-scene__fallback" viewBox="0 0 960 720" role="presentation">
      <defs>
        <linearGradient id="fallback-vsc" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#8da7b4" />
          <stop offset="100%" stopColor="#33424b" />
        </linearGradient>
        <linearGradient id="fallback-him" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#b7b5aa" />
          <stop offset="100%" stopColor="#5d605d" />
        </linearGradient>
      </defs>
      <ellipse className="lab-buildings-scene__fallback-shadow" cx="490" cy="588" rx="300" ry="64" />
      <polygon className="lab-buildings-scene__fallback-ground" points="142,560 838,560 900,596 202,596" />
      <polygon className="lab-buildings-scene__fallback-him-roof" points="236,142 380,142 428,176 284,176" />
      <polygon className="lab-buildings-scene__fallback-him-side" points="236,142 284,176 284,526 236,492" />
      <polygon className="lab-buildings-scene__fallback-him-front" points="284,176 428,176 428,552 284,526" />
      <polygon className="lab-buildings-scene__fallback-vsc-roof" points="496,112 748,112 834,170 582,170" />
      <polygon className="lab-buildings-scene__fallback-vsc-front" points="582,170 834,170 834,522 582,522" />
      <polygon className="lab-buildings-scene__fallback-vsc-side" points="834,170 890,212 890,562 834,522" />
      <polygon className="lab-buildings-scene__fallback-podium" points="410,352 728,352 810,404 492,404 492,532 728,532 810,578 492,578 410,526" />
      {Array.from({ length: 10 }).map((_, index) => {
        const himY = 206 + index * 32;
        const vscY = 202 + index * 32;
        return (
          <g key={index}>
            <path className="lab-buildings-scene__fallback-floor" d={`M 298 ${himY} L 418 ${himY}`} />
            <path className="lab-buildings-scene__fallback-floor" d={`M 596 ${vscY} L 820 ${vscY}`} />
          </g>
        );
      })}
      <polygon className="lab-buildings-scene__fallback-band" points="284,214 428,214 428,230 284,230" />
      <polygon className="lab-buildings-scene__fallback-band" points="582,250 834,250 834,266 582,266" />
      <path className="lab-buildings-scene__fallback-link" d="M 430 222 C 488 238 522 258 580 258" />
    </svg>
  );
}

function LabBuildingsScene({
  progress,
  reveal,
  detail,
  compress,
  staticMode = false
}: LabBuildingsSceneProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const handlesRef = useRef<SceneHandles | null>(null);
  const latestRef = useRef({ progress, reveal, detail, compress });
  const [fallback, setFallback] = useState(false);

  latestRef.current = { progress, reveal, detail, compress };

  useEffect(() => {
    if (staticMode || !containerRef.current || !canvasRef.current) {
      return;
    }

    let disposed = false;
    let handles: SceneHandles | null = null;

    const startScene = async () => {
      try {
        THREE = await import("three");
      } catch {
        if (!disposed) {
          setFallback(true);
        }
        return;
      }

      if (disposed || !containerRef.current || !canvasRef.current) {
        return;
      }

      try {
        handles = buildScene(canvasRef.current, containerRef.current);
      } catch {
        if (!disposed) {
          setFallback(true);
        }
        return;
      }

      handlesRef.current = handles;

      const animate = (elapsed: number) => {
        if (!handles) {
          return;
        }

        const latest = latestRef.current;
        updateScene(
          handles,
          latest.progress,
          latest.reveal,
          latest.detail,
          latest.compress,
          elapsed
        );
        handles.renderer.render(handles.scene, handles.camera);
        handles.frameId = window.requestAnimationFrame(animate);
      };

      handles.frameId = window.requestAnimationFrame(animate);
    };

    void startScene();

    return () => {
      disposed = true;
      handlesRef.current = null;
      if (handles) {
        disposeScene(handles);
      }
    };
  }, [staticMode]);

  return (
    <div className="lab-buildings-scene" ref={containerRef}>
      {staticMode || fallback ? <LabBuildingsFallback /> : null}
      {!staticMode && !fallback ? (
        <canvas
          ref={canvasRef}
          className="lab-buildings-scene__canvas"
          aria-hidden="true"
        />
      ) : null}
    </div>
  );
}

export default LabBuildingsScene;
