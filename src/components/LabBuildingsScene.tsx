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
  detailGroup: any;
  himBand: any;
  vscBand: any;
  connector: any;
  connectorCurve: any;
  connectorPointCount: number;
  signalMarker: any;
  facadeMaterials: any[];
  detailMaterials: any[];
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
  material: any,
  size: [number, number, number],
  position: [number, number, number],
  rotation: [number, number, number] = [0, 0, 0]
) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(...size), material);
  mesh.position.set(...position);
  mesh.rotation.set(...rotation);
  parent.add(mesh);
  return mesh;
}

function createCylinder(
  parent: any,
  material: any,
  radius: number,
  height: number,
  position: [number, number, number],
  rotation: [number, number, number] = [0, 0, 0],
  segments = 18
) {
  const mesh = new THREE.Mesh(
    new THREE.CylinderGeometry(radius, radius, height, segments),
    material
  );
  mesh.position.set(...position);
  mesh.rotation.set(...rotation);
  parent.add(mesh);
  return mesh;
}

function addEdges(parent: any, mesh: any, material: any) {
  const edges = new THREE.LineSegments(new THREE.EdgesGeometry(mesh.geometry), material);
  edges.position.copy(mesh.position);
  edges.rotation.copy(mesh.rotation);
  parent.add(edges);
  return edges;
}

function addWindowGrid(
  parent: any,
  options: {
    x: number;
    z: number;
    width: number;
    depth: number;
    height: number;
    floors: number;
    columns: number;
    orientation: "front" | "right";
    windowMaterial: any;
    mullionMaterial: any;
    bayScale?: number;
  }
) {
  const floorHeight = options.height / options.floors;
  const columnWidth = options.width / options.columns;
  const bayScale = options.bayScale ?? 0.58;

  for (let floor = 0; floor < options.floors; floor += 1) {
    const y = floor * floorHeight + floorHeight * 0.48;
    for (let column = 0; column < options.columns; column += 1) {
      const x = options.x - options.width / 2 + columnWidth * (column + 0.5);
      if (options.orientation === "front") {
        createBox(
          parent,
          options.windowMaterial,
          [columnWidth * bayScale, floorHeight * 0.26, 0.018],
          [x, y, options.z + options.depth / 2 + 0.018]
        );
      } else {
        const z = options.z - options.depth / 2 + (options.depth / options.columns) * (column + 0.5);
        createBox(
          parent,
          options.windowMaterial,
          [0.018, floorHeight * 0.26, (options.depth / options.columns) * bayScale],
          [options.x + options.width / 2 + 0.018, y, z]
        );
      }
    }

    if (floor > 0) {
      const lineY = floor * floorHeight;
      if (options.orientation === "front") {
        createBox(
          parent,
          options.mullionMaterial,
          [options.width * 0.96, 0.012, 0.018],
          [options.x, lineY, options.z + options.depth / 2 + 0.025]
        );
      } else {
        createBox(
          parent,
          options.mullionMaterial,
          [0.018, 0.012, options.depth * 0.96],
          [options.x + options.width / 2 + 0.025, lineY, options.z]
        );
      }
    }
  }
}

function addCurtainWall(
  parent: any,
  options: {
    x: number;
    z: number;
    width: number;
    depth: number;
    height: number;
    floors: number;
    columns: number;
    orientation: "front" | "right";
    panelMaterial: any;
    mullionMaterial: any;
  }
) {
  const floorHeight = options.height / options.floors;
  const columnWidth = options.width / options.columns;

  for (let floor = 0; floor < options.floors; floor += 1) {
    const y = floor * floorHeight + floorHeight * 0.48;
    for (let column = 0; column < options.columns; column += 1) {
      if (options.orientation === "front") {
        const x = options.x - options.width / 2 + columnWidth * (column + 0.5);
        createBox(
          parent,
          options.panelMaterial,
          [columnWidth * 0.82, floorHeight * 0.68, 0.014],
          [x, y, options.z + options.depth / 2 + 0.02]
        );
      } else {
        const z = options.z - options.depth / 2 + (options.depth / options.columns) * (column + 0.5);
        createBox(
          parent,
          options.panelMaterial,
          [0.014, floorHeight * 0.68, (options.depth / options.columns) * 0.82],
          [options.x + options.width / 2 + 0.02, y, z]
        );
      }
    }
  }

  for (let index = 1; index < options.floors; index += 1) {
    const y = index * floorHeight;
    if (options.orientation === "front") {
      createBox(
        parent,
        options.mullionMaterial,
        [options.width * 0.98, 0.014, 0.018],
        [options.x, y, options.z + options.depth / 2 + 0.03]
      );
    } else {
      createBox(
        parent,
        options.mullionMaterial,
        [0.018, 0.014, options.depth * 0.98],
        [options.x + options.width / 2 + 0.03, y, options.z]
      );
    }
  }
}

function createFloorBand(
  parent: any,
  material: any,
  options: {
    x: number;
    z: number;
    width: number;
    depth: number;
    height: number;
    floor: number;
  }
) {
  const group = new THREE.Group();
  const y = ((options.floor - 0.52) / 10) * options.height;
  createBox(
    group,
    material,
    [options.width * 1.02, 0.12, 0.045],
    [options.x, y, options.z + options.depth / 2 + 0.05]
  );
  createBox(
    group,
    material,
    [0.045, 0.12, options.depth * 1.02],
    [options.x + options.width / 2 + 0.05, y, options.z]
  );
  parent.add(group);
  return group;
}

function setGroupMaterial(group: any, opacity: number, emissiveIntensity: number) {
  group.children.forEach((child: any) => {
    child.material.opacity = opacity;
    child.material.emissiveIntensity = emissiveIntensity;
  });
}

function addRoofArray(parent: any, material: any, x: number, y: number, z: number) {
  for (let row = 0; row < 3; row += 1) {
    for (let column = 0; column < 5; column += 1) {
      createBox(
        parent,
        material,
        [0.18, 0.04, 0.16],
        [x + column * 0.22, y, z + row * 0.2]
      );
    }
  }
}

function addTree(parent: any, trunkMaterial: any, canopyMaterial: any, x: number, z: number, scale: number) {
  createCylinder(parent, trunkMaterial, 0.025 * scale, 0.22 * scale, [x, 0.13 * scale, z]);
  const canopy = new THREE.Mesh(
    new THREE.DodecahedronGeometry(0.18 * scale, 0),
    canopyMaterial
  );
  canopy.position.set(x, 0.32 * scale, z);
  parent.add(canopy);
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
  renderer.toneMappingExposure = 1.16;
  renderer.setClearColor(0x000000, 0);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.6));

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 90);
  const root = new THREE.Group();
  const detailGroup = new THREE.Group();
  scene.add(root);
  root.add(detailGroup);

  const ambient = new THREE.AmbientLight(0xe3eee9, 1.28);
  scene.add(ambient);

  const keyLight = new THREE.DirectionalLight(0xf8fbf6, 2.55);
  keyLight.position.set(4.5, 7.2, 5.4);
  scene.add(keyLight);

  const fillLight = new THREE.DirectionalLight(0xb8d2c4, 1.15);
  fillLight.position.set(-3.5, 3.8, 3.6);
  scene.add(fillLight);

  const rimLight = new THREE.DirectionalLight(0x88b9a5, 1.55);
  rimLight.position.set(-5.2, 4.2, -4.8);
  scene.add(rimLight);

  const edgeMaterial = new THREE.LineBasicMaterial({
    color: 0xe7f0eb,
    transparent: true,
    opacity: 0.16
  });
  const groundMaterial = new THREE.MeshStandardMaterial({
    color: 0x1a2328,
    roughness: 0.88,
    metalness: 0.02
  });
  const streetMaterial = new THREE.MeshStandardMaterial({
    color: 0x263238,
    roughness: 0.9,
    metalness: 0.02
  });
  const sidewalkMaterial = new THREE.MeshStandardMaterial({
    color: 0x59635f,
    roughness: 0.82,
    metalness: 0.02,
    transparent: true,
    opacity: 0.58
  });
  const contextBuildingMaterial = new THREE.MeshStandardMaterial({
    color: 0x435057,
    roughness: 0.88,
    metalness: 0.02,
    transparent: true,
    opacity: 0.42
  });
  const concreteMaterial = new THREE.MeshStandardMaterial({
    color: 0xb6b1a6,
    roughness: 0.86,
    metalness: 0.02
  });
  const concreteSideMaterial = new THREE.MeshStandardMaterial({
    color: 0x817f77,
    roughness: 0.9,
    metalness: 0.02
  });
  const concreteWindowMaterial = new THREE.MeshStandardMaterial({
    color: 0x27343a,
    roughness: 0.58,
    metalness: 0.04,
    transparent: true,
    opacity: 0.72
  });
  const concreteMullionMaterial = new THREE.MeshStandardMaterial({
    color: 0xe0ddd3,
    roughness: 0.82,
    metalness: 0.02,
    transparent: true,
    opacity: 0.54
  });
  const glassMaterial = new THREE.MeshStandardMaterial({
    color: 0x6f909b,
    roughness: 0.4,
    metalness: 0.06,
    transparent: true,
    opacity: 0.76
  });
  const glassDarkMaterial = new THREE.MeshStandardMaterial({
    color: 0x344a54,
    roughness: 0.58,
    metalness: 0.03,
    transparent: true,
    opacity: 0.76
  });
  const bridgeMaterial = new THREE.MeshStandardMaterial({
    color: 0x8fb2b2,
    roughness: 0.5,
    metalness: 0.04,
    transparent: true,
    opacity: 0.62
  });
  const glassPanelMaterial = new THREE.MeshStandardMaterial({
    color: 0xa8c9ca,
    emissive: 0x314d4d,
    emissiveIntensity: 0.05,
    roughness: 0.42,
    metalness: 0.04,
    transparent: true,
    opacity: 0.38
  });
  const vscMullionMaterial = new THREE.MeshStandardMaterial({
    color: 0xd8ebe6,
    roughness: 0.64,
    metalness: 0.04,
    transparent: true,
    opacity: 0.38
  });
  const roofMaterial = new THREE.MeshStandardMaterial({
    color: 0xe7ece5,
    roughness: 0.8,
    metalness: 0.03
  });
  const darkRoofMaterial = new THREE.MeshStandardMaterial({
    color: 0x4e5554,
    roughness: 0.88,
    metalness: 0.03
  });
  const roofUnitMaterial = new THREE.MeshStandardMaterial({
    color: 0xc0c6bf,
    roughness: 0.68,
    metalness: 0.05,
    transparent: true,
    opacity: 0.92
  });
  const roofPanelMaterial = new THREE.MeshStandardMaterial({
    color: 0x273137,
    roughness: 0.72,
    metalness: 0.08,
    transparent: true,
    opacity: 0.72
  });
  const treeTrunkMaterial = new THREE.MeshStandardMaterial({
    color: 0x4a3d32,
    roughness: 0.88,
    metalness: 0
  });
  const treeCanopyMaterial = new THREE.MeshStandardMaterial({
    color: 0x577563,
    roughness: 0.92,
    metalness: 0,
    transparent: true,
    opacity: 0.78
  });
  const bandMaterial = new THREE.MeshStandardMaterial({
    color: floorBandColor,
    emissive: floorBandColor,
    emissiveIntensity: 0.7,
    roughness: 0.48,
    metalness: 0,
    transparent: true,
    opacity: 0.62
  });
  const bandMaterialAlt = bandMaterial.clone();
  const signalMaterial = new THREE.MeshBasicMaterial({
    color: 0xd9f7e7,
    transparent: true,
    opacity: 0
  });

  const ground = createBox(root, groundMaterial, [10.6, 0.08, 7.2], [0.08, -0.06, 0.12]);
  addEdges(root, ground, edgeMaterial);

  createBox(root, streetMaterial, [9.4, 0.045, 0.52], [0.12, 0.015, 3.08], [0, -0.1, 0]);
  createBox(root, streetMaterial, [0.48, 0.045, 5.7], [3.98, 0.018, 0.34], [0, 0.04, 0]);
  createBox(root, streetMaterial, [5.4, 0.04, 0.34], [-2.82, 0.012, -2.58], [0, 0.06, 0]);
  createBox(root, sidewalkMaterial, [8.9, 0.035, 0.13], [0.04, 0.045, 2.72], [0, -0.1, 0]);
  createBox(root, sidewalkMaterial, [0.13, 0.035, 5.35], [3.58, 0.045, 0.3], [0, 0.04, 0]);
  createBox(root, sidewalkMaterial, [5.1, 0.032, 0.1], [-2.72, 0.042, -2.34], [0, 0.06, 0]);

  [
    { size: [1.25, 0.55, 0.92], position: [-3.8, 0.28, 1.5] },
    { size: [1.55, 0.72, 1.1], position: [-3.52, 0.36, -1.75] },
    { size: [1.25, 0.44, 0.85], position: [3.42, 0.22, -1.95] },
    { size: [1.65, 0.5, 0.88], position: [2.96, 0.25, 2.2] }
  ].forEach((block) => {
    const mesh = createBox(
      root,
      contextBuildingMaterial,
      block.size as [number, number, number],
      block.position as [number, number, number]
    );
    addEdges(root, mesh, edgeMaterial);
  });

  // 4 Blackfan Circle: beige ten-floor tower with heavier concrete massing.
  const himTower = createBox(root, concreteMaterial, [1.55, 3.66, 1.58], [-1.85, 1.83, -0.5]);
  addEdges(root, himTower, edgeMaterial);
  createBox(root, concreteSideMaterial, [0.18, 3.66, 1.62], [-2.72, 1.83, -0.5]);
  createBox(root, roofMaterial, [1.62, 0.12, 1.64], [-1.85, 3.72, -0.5]);
  createBox(root, concreteMaterial, [1.0, 0.34, 0.55], [-1.85, 3.95, -0.92]);
  createBox(root, darkRoofMaterial, [1.25, 0.06, 1.2], [-1.85, 3.8, -0.45]);

  // Veritas Science Center: glass research tower with lower podium facing Avenue Louis Pasteur.
  const vscTower = createBox(root, glassMaterial, [2.45, 3.58, 2.02], [1.78, 1.79, -0.32]);
  addEdges(root, vscTower, edgeMaterial);
  createBox(root, glassDarkMaterial, [0.22, 3.58, 2.08], [3.12, 1.79, -0.32]);
  createBox(root, roofMaterial, [2.55, 0.12, 2.12], [1.78, 3.65, -0.32]);
  createBox(root, glassDarkMaterial, [1.32, 0.52, 1.0], [1.88, 3.96, -0.48]);
  createBox(root, roofMaterial, [1.38, 0.08, 1.06], [1.88, 4.25, -0.48]);

  const vscPodium = createBox(root, glassDarkMaterial, [2.35, 1.05, 1.3], [1.54, 0.53, 1.34]);
  addEdges(root, vscPodium, edgeMaterial);
  createBox(root, roofMaterial, [2.42, 0.1, 1.36], [1.54, 1.1, 1.34]);
  createBox(root, glassDarkMaterial, [0.62, 0.78, 0.48], [0.25, 0.7, 0.78]);
  const conferenceCenter = createBox(root, glassDarkMaterial, [1.18, 0.58, 0.92], [0.2, 0.29, 1.9]);
  addEdges(root, conferenceCenter, edgeMaterial);
  const conferenceRoof = createCylinder(
    root,
    roofMaterial,
    0.32,
    0.1,
    [0.2, 0.66, 1.9],
    [0, 0, 0],
    36
  );
  conferenceRoof.scale.set(1.42, 1, 0.58);
  const skyBridge = createBox(root, bridgeMaterial, [1.18, 0.16, 0.24], [-0.72, 1.18, 0.42]);
  addEdges(root, skyBridge, edgeMaterial);

  addWindowGrid(detailGroup, {
    x: -1.85,
    z: -0.5,
    width: 1.55,
    depth: 1.58,
    height: 3.66,
    floors: 10,
    columns: 5,
    orientation: "front",
    windowMaterial: concreteWindowMaterial,
    mullionMaterial: concreteMullionMaterial
  });
  addWindowGrid(detailGroup, {
    x: -1.85,
    z: -0.5,
    width: 1.55,
    depth: 1.58,
    height: 3.66,
    floors: 10,
    columns: 4,
    orientation: "right",
    windowMaterial: concreteWindowMaterial,
    mullionMaterial: concreteMullionMaterial
  });
  addCurtainWall(detailGroup, {
    x: 1.78,
    z: -0.32,
    width: 2.45,
    depth: 2.02,
    height: 3.58,
    floors: 10,
    columns: 10,
    orientation: "front",
    panelMaterial: glassPanelMaterial,
    mullionMaterial: vscMullionMaterial
  });
  addCurtainWall(detailGroup, {
    x: 1.78,
    z: -0.32,
    width: 2.45,
    depth: 2.02,
    height: 3.58,
    floors: 10,
    columns: 8,
    orientation: "right",
    panelMaterial: glassPanelMaterial,
    mullionMaterial: vscMullionMaterial
  });

  addRoofArray(detailGroup, roofPanelMaterial, -2.39, 3.86, -0.3);
  addRoofArray(detailGroup, roofPanelMaterial, 0.84, 1.17, 1.12);
  addRoofArray(detailGroup, roofPanelMaterial, 1.54, 1.17, 1.12);

  [
    [-2.3, 3.98, -0.14],
    [-1.95, 3.98, -0.14],
    [-1.6, 3.98, -0.14],
    [-2.18, 3.98, -0.74],
    [-1.79, 3.98, -0.74],
    [1.04, 4.35, -0.4],
    [1.38, 4.35, -0.4],
    [1.72, 4.35, -0.4],
    [2.06, 4.35, -0.4],
    [2.4, 4.35, -0.4],
    [2.74, 4.35, -0.4]
  ].forEach(([x, y, z]) => {
    createCylinder(detailGroup, roofUnitMaterial, 0.055, 0.34, [x, y, z]);
  });
  createBox(detailGroup, roofUnitMaterial, [0.96, 0.12, 0.25], [-1.83, 4.08, -1.22]);
  createBox(detailGroup, roofUnitMaterial, [0.78, 0.12, 0.22], [1.86, 4.36, -0.96]);

  [
    [-4.15, 2.76],
    [-3.48, 2.86],
    [-2.6, 2.88],
    [-0.9, 2.8],
    [0.4, 2.74],
    [1.55, 2.66],
    [2.5, 2.58],
    [3.18, 1.68],
    [3.3, 0.86],
    [3.18, 0.1],
    [-3.74, -2.28],
    [2.98, -2.22]
  ].forEach(([x, z], index) => {
    addTree(detailGroup, treeTrunkMaterial, treeCanopyMaterial, x, z, index % 3 === 0 ? 1.08 : 0.9);
  });

  const himBand = createFloorBand(root, bandMaterial, {
    x: -1.85,
    z: -0.5,
    width: 1.55,
    depth: 1.58,
    height: 3.66,
    floor: 10
  });
  const vscBand = createFloorBand(root, bandMaterialAlt, {
    x: 1.78,
    z: -0.32,
    width: 2.45,
    depth: 2.02,
    height: 3.58,
    floor: 9
  });

  const connectorCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-1.02, 3.48, 0.36),
    new THREE.Vector3(-0.28, 3.44, 0.68),
    new THREE.Vector3(0.72, 3.25, 0.74),
    new THREE.Vector3(1.54, 3.02, 0.74)
  ]);
  const connectorPoints = connectorCurve.getPoints(40);
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

  const signalMarker = new THREE.Mesh(
    new THREE.SphereGeometry(0.075, 24, 16),
    signalMaterial
  );
  signalMarker.visible = false;
  root.add(signalMarker);

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
    detailGroup,
    himBand,
    vscBand,
    connector,
    connectorCurve,
    connectorPointCount: connectorPoints.length,
    signalMarker,
    facadeMaterials: [
      concreteWindowMaterial,
      concreteMullionMaterial,
      glassPanelMaterial,
      vscMullionMaterial
    ],
    detailMaterials: [
      roofUnitMaterial,
      roofPanelMaterial,
      treeCanopyMaterial,
      sidewalkMaterial
    ],
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
  const settle = smoothstep(0.0, 0.2, progress);
  const detailReveal = smoothstep(0.2, 0.45, progress) * detail;
  const himEmphasis = smoothstep(0.36, 0.44, progress) * (1 - smoothstep(0.6, 0.68, progress));
  const vscEmphasis = smoothstep(0.58, 0.68, progress) * (1 - smoothstep(0.82, 0.9, progress));
  const floorSequence = Math.max(
    smoothstep(0.36, 0.58, progress),
    smoothstep(0.58, 0.78, progress) * 0.95
  );
  const connectorDraw = Math.floor(
    mix(2, handles.connectorPointCount, smoothstep(0.48, 0.68, progress))
  );
  const pulse = 0.5 + Math.sin(elapsed * 0.0025) * 0.5;

  handles.root.rotation.y = mix(0.52, 0.34, settle);
  handles.root.rotation.x = mix(0.17, 0.06, settle);
  handles.root.position.set(
    mix(0.14, 0.02, settle),
    mix(-0.48, -0.24, reveal),
    mix(0.04, 0, settle)
  );
  handles.root.scale.setScalar(mix(0.68, 0.86, reveal) * mix(1, 0.95, compress));

  handles.camera.position.set(
    mix(-6.8, -5.75, settle),
    mix(6.6, 5.4, settle),
    mix(9.1, 7.6, settle)
  );
  handles.camera.lookAt(0.02, 1.62, 0.2);

  handles.detailGroup.visible = detailReveal > 0.02;
  handles.detailMaterials.forEach((material) => {
    material.opacity = mix(0.18, 0.92, detailReveal);
  });
  handles.facadeMaterials.forEach((material) => {
    material.opacity = mix(0.12, material === handles.facadeMaterials[2] ? 0.42 : 0.62, detailReveal);
    if ("emissiveIntensity" in material) {
      material.emissiveIntensity = mix(0.01, 0.08, detailReveal);
    }
  });

  setGroupMaterial(
    handles.himBand,
    mix(0.18, 0.72, floorSequence) + himEmphasis * pulse * 0.2,
    mix(0.35, 1.22, himEmphasis + detailReveal * 0.24)
  );
  setGroupMaterial(
    handles.vscBand,
    mix(0.14, 0.68, floorSequence) + vscEmphasis * pulse * 0.2,
    mix(0.28, 1.12, vscEmphasis + detailReveal * 0.22)
  );
  handles.connector.geometry.setDrawRange(0, connectorDraw);
  handles.connector.material.opacity = mix(0.12, 0.78, smoothstep(0.48, 0.68, progress));

  const markerTravel = smoothstep(0.48, 0.68, progress);
  const markerVisible = progress > 0.46 && progress < 0.9;
  const markerPosition = handles.connectorCurve.getPoint(markerTravel);
  handles.signalMarker.position.copy(markerPosition);
  handles.signalMarker.scale.setScalar(mix(0.72, 1.2, pulse));
  handles.signalMarker.visible = markerVisible;
  handles.signalMarker.material.opacity = markerVisible
    ? mix(0.35, 0.95, smoothstep(0.48, 0.56, progress)) * (1 - smoothstep(0.84, 0.92, progress) * 0.25)
    : 0;
}

function disposeScene(handles: SceneHandles) {
  handles.resizeObserver.disconnect();
  window.cancelAnimationFrame(handles.frameId);
  handles.scene.traverse((object: any) => {
    if (object instanceof THREE.Mesh || object instanceof THREE.Line || object instanceof THREE.LineSegments) {
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
          <stop offset="0%" stopColor="#a7c2c4" />
          <stop offset="100%" stopColor="#384e59" />
        </linearGradient>
        <linearGradient id="fallback-blackfan" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#c6c1b5" />
          <stop offset="100%" stopColor="#706f69" />
        </linearGradient>
      </defs>
      <ellipse className="lab-buildings-scene__fallback-shadow" cx="490" cy="604" rx="328" ry="68" />
      <polygon className="lab-buildings-scene__fallback-ground" points="96,558 812,558 914,612 200,628" />
      <polygon className="lab-buildings-scene__fallback-street" points="92,590 864,574 930,612 164,646" />
      <polygon className="lab-buildings-scene__fallback-context" points="116,438 196,430 238,458 158,468" />
      <polygon className="lab-buildings-scene__fallback-context" points="762,404 866,392 906,420 802,436" />
      <polygon className="lab-buildings-scene__fallback-context" points="136,226 236,216 288,246 188,258" />

      <polygon className="lab-buildings-scene__fallback-blackfan-roof" points="170,136 338,130 400,174 232,184" />
      <polygon className="lab-buildings-scene__fallback-blackfan-side" points="170,136 232,184 232,530 170,486" />
      <polygon className="lab-buildings-scene__fallback-blackfan-front" points="232,184 400,174 400,548 232,530" />
      <polygon className="lab-buildings-scene__fallback-blackfan-penthouse" points="240,120 342,118 380,144 278,150" />

      <polygon className="lab-buildings-scene__fallback-vsc-roof" points="554,110 818,92 914,152 652,176" />
      <polygon className="lab-buildings-scene__fallback-vsc-front" points="652,176 914,152 914,520 652,542" />
      <polygon className="lab-buildings-scene__fallback-vsc-side" points="914,152 940,192 940,560 914,520" />
      <polygon className="lab-buildings-scene__fallback-podium" points="512,360 770,346 850,396 592,412 592,540 770,530 850,580 592,594 512,536" />
      <polygon className="lab-buildings-scene__fallback-conference" points="404,472 518,460 568,492 454,506 454,564 518,556 568,588 454,604 404,568" />
      <ellipse className="lab-buildings-scene__fallback-conference-roof" cx="478" cy="462" rx="52" ry="18" />
      <polygon className="lab-buildings-scene__fallback-skybridge" points="360,390 482,378 496,394 374,408" />

      {Array.from({ length: 10 }).map((_, index) => {
        const blackfanY = 210 + index * 31;
        const vscY = 204 + index * 31;
        return (
          <g key={index}>
            <path className="lab-buildings-scene__fallback-floor" d={`M 248 ${blackfanY} L 388 ${blackfanY - 8}`} />
            <path className="lab-buildings-scene__fallback-floor" d={`M 668 ${vscY} L 900 ${vscY - 18}`} />
          </g>
        );
      })}
      {Array.from({ length: 5 }).map((_, index) => (
        <path
          key={`blackfan-column-${index}`}
          className="lab-buildings-scene__fallback-floor"
          d={`M ${260 + index * 28} 192 L ${260 + index * 28} 526`}
        />
      ))}
      {Array.from({ length: 9 }).map((_, index) => (
        <path
          key={`vsc-column-${index}`}
          className="lab-buildings-scene__fallback-floor"
          d={`M ${682 + index * 25} 176 L ${682 + index * 25} 532`}
        />
      ))}
      <polygon className="lab-buildings-scene__fallback-band" points="232,204 400,194 400,212 232,222" />
      <polygon className="lab-buildings-scene__fallback-band" points="652,252 914,228 914,248 652,272" />
      <path className="lab-buildings-scene__fallback-link" d="M 402 203 C 488 214 568 244 650 262" />
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
