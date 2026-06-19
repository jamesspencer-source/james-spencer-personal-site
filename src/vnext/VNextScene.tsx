import { useEffect, useRef, useState } from "react";
import * as THREE from "three";

type VNextSceneProps = {
  progress: number;
  reducedMotion?: boolean;
};

type SceneHandles = {
  root: THREE.Group;
  labs: THREE.Group;
  program: THREE.Group;
  network: THREE.Group;
  system: THREE.Group;
  labHighlights: THREE.Mesh[];
  programNodes: THREE.Mesh[];
  networkPins: THREE.Mesh[];
  connector: THREE.Line;
  camera: THREE.PerspectiveCamera;
};

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

function setMaterialOpacity(material: THREE.Material, opacity: number) {
  material.transparent = opacity < 0.995;
  material.opacity = opacity;
}

function setGroupOpacity(group: THREE.Group, opacity: number) {
  group.traverse((object) => {
    const item = object as THREE.Mesh | THREE.Line;
    const material = item.material as THREE.Material | THREE.Material[] | undefined;

    if (!material) {
      return;
    }

    if (Array.isArray(material)) {
      material.forEach((entry) => setMaterialOpacity(entry, opacity));
    } else {
      setMaterialOpacity(material, opacity);
    }
  });
}

function makeBox(
  size: [number, number, number],
  color: string,
  position: [number, number, number],
  opacity = 1,
  roughness = 0.72
) {
  const material = new THREE.MeshStandardMaterial({
    color,
    roughness,
    metalness: 0.04,
    transparent: opacity < 1,
    opacity
  });
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(...size), material);
  mesh.position.set(...position);
  return mesh;
}

function makeLine(points: THREE.Vector3[], color = "#a7d1b8", opacity = 0.8) {
  const geometry = new THREE.BufferGeometry().setFromPoints(points);
  const material = new THREE.LineBasicMaterial({
    color,
    transparent: true,
    opacity
  });
  return new THREE.Line(geometry, material);
}

function makeCurveLine(from: THREE.Vector3, control: THREE.Vector3, to: THREE.Vector3) {
  const curve = new THREE.QuadraticBezierCurve3(from, control, to);
  return makeLine(curve.getPoints(64), "#b6dec6", 0.82);
}

function addFacade(parent: THREE.Group, origin: [number, number, number], cols: number, rows: number, width: number, height: number, color: string) {
  const [x, y, z] = origin;
  const paneWidth = width / cols;
  const paneHeight = height / rows;

  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      const pane = makeBox(
        [paneWidth * 0.48, paneHeight * 0.32, 0.025],
        color,
        [
          x - width / 2 + paneWidth * (col + 0.5),
          y - height / 2 + paneHeight * (row + 0.5),
          z
        ],
        0.72,
        0.55
      );
      parent.add(pane);
    }
  }
}

function createSceneGraph(scene: THREE.Scene, camera: THREE.PerspectiveCamera): SceneHandles {
  const root = new THREE.Group();
  const system = new THREE.Group();
  const labs = new THREE.Group();
  const program = new THREE.Group();
  const network = new THREE.Group();

  scene.add(root);
  root.add(system, labs, program, network);

  const labHighlights: THREE.Mesh[] = [];
  const programNodes: THREE.Mesh[] = [];
  const networkPins: THREE.Mesh[] = [];

  const ground = makeBox([8.8, 0.08, 5.2], "#203039", [0, -1.45, 0], 0.72);
  labs.add(ground);

  const avenue = makeBox([8.6, 0.04, 0.34], "#8ea59f", [0, -1.36, 2.45], 0.38);
  avenue.rotation.y = -0.08;
  labs.add(avenue);

  const blackfan = makeBox([1.35, 2.8, 1.25], "#b9b3a7", [-1.55, 0.03, 0.2], 0.96);
  const blackfanSide = makeBox([0.28, 2.72, 1.25], "#85867f", [-0.86, -0.01, 0.34], 0.78);
  const vscTower = makeBox([1.82, 2.5, 1.55], "#6e8992", [1.35, 0.02, 0.05], 0.9);
  const vscPodium = makeBox([2.4, 0.82, 1.86], "#4f6870", [1.44, -0.82, 0.42], 0.88);
  const conference = makeBox([1.24, 0.58, 1.18], "#6a858b", [0.16, -1.03, 1.3], 0.82);
  labs.add(blackfan, blackfanSide, vscTower, vscPodium, conference);

  const blackfanRoof = makeBox([1.48, 0.14, 1.38], "#d5d2ca", [-1.55, 1.5, 0.2], 0.94);
  const vscRoof = makeBox([1.96, 0.12, 1.68], "#dce2dd", [1.35, 1.34, 0.05], 0.94);
  labs.add(blackfanRoof, vscRoof);

  for (let i = 0; i < 8; i += 1) {
    labs.add(makeBox([0.13, 0.16, 0.13], "#d8d4c8", [-2.05 + i * 0.14, 1.68, -0.08 + (i % 2) * 0.28], 0.9));
  }

  for (let i = 0; i < 11; i += 1) {
    labs.add(makeBox([0.1, 0.2, 0.1], "#edf0eb", [0.68 + i * 0.13, 1.52, -0.38 + (i % 2) * 0.34], 0.86));
  }

  addFacade(labs, [-1.56, 0.04, 0.84], 6, 10, 1.05, 2.42, "#515d5e");
  addFacade(labs, [1.36, 0.04, 0.86], 7, 10, 1.48, 2.14, "#c7d4d1");
  addFacade(labs, [1.36, -0.78, 1.38], 8, 4, 1.84, 0.62, "#c4d2cf");

  const blackfanHighlight = makeBox([1.44, 0.18, 1.31], "#bceccf", [-1.55, 1.1, 0.2], 0.28, 0.35);
  const vscHighlight = makeBox([1.92, 0.18, 1.62], "#bceccf", [1.35, 0.92, 0.05], 0.22, 0.35);
  labHighlights.push(blackfanHighlight, vscHighlight);
  labs.add(blackfanHighlight, vscHighlight);

  const connector = makeCurveLine(
    new THREE.Vector3(-0.9, 1.08, 0.78),
    new THREE.Vector3(0.08, 1.24, 1.24),
    new THREE.Vector3(0.55, 0.92, 0.86)
  );
  labs.add(connector);

  const spine = makeBox([0.36, 3.4, 0.36], "#93bdab", [0, 0, 0], 0.62);
  spine.rotation.z = Math.PI / 2;
  const spine2 = makeBox([0.2, 2.4, 0.2], "#6f8f84", [0, -0.36, -0.48], 0.46);
  spine2.rotation.z = Math.PI / 2;
  system.add(spine, spine2);
  system.add(makeBox([1.1, 0.08, 0.52], "#87a5ad", [-2.1, -0.5, 0], 0.5));
  system.add(makeBox([1.1, 0.08, 0.52], "#87a5ad", [2.1, -0.5, 0], 0.5));

  const torus = new THREE.Mesh(
    new THREE.TorusGeometry(1.7, 0.055, 16, 128),
    new THREE.MeshStandardMaterial({
      color: "#a8d3bb",
      emissive: "#274235",
      roughness: 0.44,
      transparent: true,
      opacity: 0.88
    })
  );
  torus.rotation.x = Math.PI / 2.25;
  program.add(torus);

  for (let i = 0; i < 6; i += 1) {
    const angle = (i / 6) * Math.PI * 2 + 0.25;
    const node = new THREE.Mesh(
      new THREE.SphereGeometry(0.13, 24, 16),
      new THREE.MeshStandardMaterial({
        color: "#d9efe3",
        emissive: "#3b6a52",
        roughness: 0.4
      })
    );
    node.position.set(Math.cos(angle) * 1.7, Math.sin(angle) * 0.52 - 0.05, Math.sin(angle) * 1.28);
    programNodes.push(node);
    program.add(node);
  }
  program.add(makeBox([2.3, 0.04, 1.22], "#6d8188", [0, -0.72, 0], 0.34));

  const globe = new THREE.Mesh(
    new THREE.SphereGeometry(1.42, 40, 28),
    new THREE.MeshStandardMaterial({
      color: "#78918d",
      roughness: 0.8,
      metalness: 0,
      wireframe: true,
      transparent: true,
      opacity: 0.36
    })
  );
  network.add(globe);

  const land = makeBox([1.1, 0.05, 0.28], "#b7dfc5", [0.14, 0.1, 1.25], 0.7);
  land.rotation.z = -0.12;
  land.rotation.x = -0.1;
  network.add(land);

  const pinPositions: Array<[number, number, number]> = [
    [0.42, 0.28, 1.3],
    [0.58, 0.38, 1.22],
    [-0.58, 0.18, 1.24],
    [0.72, 0.3, 1.18]
  ];

  pinPositions.forEach((position) => {
    const pin = new THREE.Mesh(
      new THREE.SphereGeometry(0.07, 18, 14),
      new THREE.MeshStandardMaterial({
        color: "#ecfff3",
        emissive: "#83bf9e",
        roughness: 0.34
      })
    );
    pin.position.set(...position);
    networkPins.push(pin);
    network.add(pin);
  });

  network.add(makeCurveLine(new THREE.Vector3(0.42, 0.28, 1.3), new THREE.Vector3(0.12, 0.56, 1.54), new THREE.Vector3(-0.58, 0.18, 1.24)));
  network.add(makeCurveLine(new THREE.Vector3(-0.58, 0.18, 1.24), new THREE.Vector3(0.04, 0.7, 1.66), new THREE.Vector3(0.72, 0.3, 1.18)));
  network.add(makeCurveLine(new THREE.Vector3(0.42, 0.28, 1.3), new THREE.Vector3(0.66, 0.56, 1.42), new THREE.Vector3(0.58, 0.38, 1.22)));

  labs.position.set(-0.5, -0.1, 0);
  program.position.set(0.1, -0.05, 0.15);
  network.position.set(0.15, -0.05, 0.25);
  system.position.set(0, -0.05, 0.1);

  camera.position.set(0, 2.2, 6.6);
  camera.lookAt(0, 0, 0);

  return {
    root,
    labs,
    program,
    network,
    system,
    labHighlights,
    programNodes,
    networkPins,
    connector,
    camera
  };
}

export default function VNextScene({ progress, reducedMotion = false }: VNextSceneProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const progressRef = useRef(progress);
  const reducedRef = useRef(reducedMotion);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    progressRef.current = progress;
  }, [progress]);

  useEffect(() => {
    reducedRef.current = reducedMotion;
  }, [reducedMotion]);

  useEffect(() => {
    const canvas = canvasRef.current;

    if (!canvas) {
      return;
    }

    let renderer: THREE.WebGLRenderer;

    try {
      renderer = new THREE.WebGLRenderer({
        canvas,
        antialias: true,
        alpha: true,
        powerPreference: "high-performance"
      });
    } catch {
      setFailed(true);
      return;
    }

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
    const handles = createSceneGraph(scene, camera);
    const clock = new THREE.Clock();

    scene.add(new THREE.AmbientLight("#e7f3ec", 0.72));
    const key = new THREE.DirectionalLight("#ffffff", 1.25);
    key.position.set(2.5, 4, 4.5);
    scene.add(key);
    const rim = new THREE.DirectionalLight("#9bc3ad", 0.8);
    rim.position.set(-3, 2.5, -2);
    scene.add(rim);

    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.8));
    renderer.setClearColor(0x000000, 0);

    const resize = () => {
      const { clientWidth, clientHeight } = canvas;
      renderer.setSize(clientWidth, clientHeight, false);
      camera.aspect = clientWidth / Math.max(clientHeight, 1);
      camera.updateProjectionMatrix();
    };

    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    resize();

    let animationFrame = 0;

    const render = () => {
      const elapsed = clock.getElapsedTime();
      const p = reducedRef.current ? 0.58 : progressRef.current;
      const labFocus = fadeBetween(p, 0.08, 0.18, 0.39, 0.48);
      const programFocus = fadeBetween(p, 0.34, 0.44, 0.62, 0.72);
      const networkFocus = fadeBetween(p, 0.58, 0.68, 0.96, 1.08);
      const overview = 1 - smoothstep(0.04, 0.18, p);
      const photo = smoothstep(0.82, 0.92, p);

      setGroupOpacity(handles.system, Math.max(0.14, overview * 0.82 + 0.16 * (1 - photo)));
      setGroupOpacity(handles.labs, Math.max(0.14, labFocus * 0.96 + overview * 0.28) * (1 - photo * 0.54));
      setGroupOpacity(handles.program, Math.max(0.12, programFocus * 0.96 + overview * 0.22) * (1 - photo * 0.5));
      setGroupOpacity(handles.network, Math.max(0.14, networkFocus * 0.98 + overview * 0.18) * (1 - photo * 0.32));

      const labSequence = smoothstep(0.15, 0.36, p);
      handles.labHighlights.forEach((highlight, index) => {
        const material = highlight.material as THREE.MeshStandardMaterial;
        const reveal = index === 0
          ? smoothstep(0.16, 0.25, p)
          : smoothstep(0.27, 0.36, p);
        const pulse = 0.16 + Math.sin(elapsed * 3.8 + index * 1.4) * 0.045;
        material.opacity = (0.18 + reveal * 0.5 + pulse * labFocus) * (1 - photo * 0.42);
        material.emissive.set("#6ca77f");
        material.emissiveIntensity = reveal * (0.6 + pulse);
      });

      const connectorMaterial = handles.connector.material as THREE.LineBasicMaterial;
      connectorMaterial.opacity = (0.18 + labSequence * 0.72) * labFocus;

      const programSequence = smoothstep(0.39, 0.6, p);
      handles.program.rotation.z = elapsed * 0.05 + programFocus * 0.18;
      handles.programNodes.forEach((node, index) => {
        const material = node.material as THREE.MeshStandardMaterial;
        const nodeReveal = smoothstep(index / 7, index / 7 + 0.16, programSequence);
        const nodePulse = 0.72 + Math.sin(elapsed * 4 + index) * 0.2;
        node.scale.setScalar(0.78 + nodeReveal * 0.58 + programFocus * nodePulse * 0.12);
        material.emissiveIntensity = nodeReveal * programFocus * 1.2;
      });

      const networkSequence = smoothstep(0.63, 0.82, p);
      handles.network.rotation.y = -0.34 + networkFocus * 0.28 + elapsed * 0.025;
      handles.networkPins.forEach((pin, index) => {
        const reveal = smoothstep(index / 5, index / 5 + 0.18, networkSequence);
        const pulse = 1 + Math.sin(elapsed * 3.2 + index * 0.9) * 0.12;
        pin.scale.setScalar((0.3 + reveal * 1.1) * pulse);
      });

      handles.root.rotation.y = mix(-0.18, 0.18, smoothstep(0.1, 0.72, p)) + Math.sin(elapsed * 0.2) * 0.012;
      handles.root.position.y = Math.sin(elapsed * 0.35) * 0.035;

      const cameraX = mix(-0.35, 0.48, smoothstep(0.2, 0.72, p));
      const cameraY = mix(2.35, 1.88, smoothstep(0.18, 0.66, p));
      const cameraZ = mix(6.8, 5.7, smoothstep(0.12, 0.84, p));
      camera.position.set(cameraX, cameraY, cameraZ);
      camera.lookAt(mix(-0.12, 0.22, p), mix(0.02, -0.08, p), 0);

      renderer.render(scene, camera);
      animationFrame = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrame);
      observer.disconnect();
      renderer.dispose();
      scene.traverse((object) => {
        const mesh = object as THREE.Mesh;
        if (mesh.geometry) {
          mesh.geometry.dispose();
        }

        const material = mesh.material as THREE.Material | THREE.Material[] | undefined;
        if (Array.isArray(material)) {
          material.forEach((entry) => entry.dispose());
        } else if (material) {
          material.dispose();
        }
      });
    };
  }, []);

  return (
    <div className="vnext-scene" aria-hidden="true">
      <canvas ref={canvasRef} className="vnext-scene__canvas" />
      {failed ? (
        <div className="vnext-scene__fallback">
          <span />
          <span />
          <span />
        </div>
      ) : null}
    </div>
  );
}
