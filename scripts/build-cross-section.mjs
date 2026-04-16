#!/usr/bin/env node

/**
 * Build the Research Campus Cross-Section asset pack.
 *
 * Outputs:
 * - public/assets/3d/cross-section/cross-section.glb
 * - public/assets/3d/cross-section/manifest.json
 *
 * Run with:
 *   node scripts/build-cross-section.mjs
 */

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import * as THREE from "three";
import { GLTFExporter } from "three/examples/jsm/exporters/GLTFExporter.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");
const outDir = path.join(projectRoot, "public/assets/3d/cross-section");
const assetName = "cross-section.glb";

if (typeof globalThis.FileReader === "undefined") {
  globalThis.FileReader = class FileReaderPolyfill {
    constructor() {
      this.result = null;
      this.error = null;
      this.onload = null;
      this.onloadend = null;
      this.onerror = null;
    }

    async readAsArrayBuffer(blob) {
      try {
        this.result = await blob.arrayBuffer();
        if (typeof this.onload === "function") this.onload({ target: this });
        if (typeof this.onloadend === "function") this.onloadend({ target: this });
      } catch (error) {
        this.error = error;
        if (typeof this.onerror === "function") this.onerror({ target: this, error });
        if (typeof this.onloadend === "function") this.onloadend({ target: this });
      }
    }
  };
}

const MATERIALS = {
  structure: new THREE.MeshStandardMaterial({
    color: "#8f9da5",
    roughness: 0.86,
    metalness: 0.08
  }),
  graphite: new THREE.MeshStandardMaterial({
    color: "#5d6b72",
    roughness: 0.88,
    metalness: 0.12
  }),
  accent: new THREE.MeshStandardMaterial({
    color: "#c4d2cc",
    roughness: 0.72,
    metalness: 0.06
  }),
  spine: new THREE.MeshStandardMaterial({
    color: "#d7dfd9",
    roughness: 0.82,
    metalness: 0.04
  }),
  labs: new THREE.MeshStandardMaterial({
    color: "#a6cfbd",
    roughness: 0.78,
    metalness: 0.04
  }),
  program: new THREE.MeshStandardMaterial({
    color: "#b7cae2",
    roughness: 0.76,
    metalness: 0.04
  }),
  network: new THREE.MeshStandardMaterial({
    color: "#cad6ae",
    roughness: 0.74,
    metalness: 0.05
  }),
  glass: new THREE.MeshPhysicalMaterial({
    color: "#dfe8eb",
    roughness: 0.12,
    metalness: 0,
    transmission: 0.35,
    transparent: true,
    opacity: 0.3,
    thickness: 0.12
  })
};

function mesh(name, geometry, material, position, rotation = [0, 0, 0]) {
  const node = new THREE.Mesh(geometry, material);
  node.name = name;
  node.position.set(...position);
  node.rotation.set(...rotation);
  node.castShadow = true;
  node.receiveShadow = true;
  return node;
}

function group(name) {
  const node = new THREE.Group();
  node.name = name;
  return node;
}

function roundedRectShape(width, height, radius) {
  const halfWidth = width / 2;
  const halfHeight = height / 2;
  const r = Math.min(radius, halfWidth, halfHeight);

  const shape = new THREE.Shape();
  shape.moveTo(-halfWidth + r, -halfHeight);
  shape.lineTo(halfWidth - r, -halfHeight);
  shape.quadraticCurveTo(halfWidth, -halfHeight, halfWidth, -halfHeight + r);
  shape.lineTo(halfWidth, halfHeight - r);
  shape.quadraticCurveTo(halfWidth, halfHeight, halfWidth - r, halfHeight);
  shape.lineTo(-halfWidth + r, halfHeight);
  shape.quadraticCurveTo(-halfWidth, halfHeight, -halfWidth, halfHeight - r);
  shape.lineTo(-halfWidth, -halfHeight + r);
  shape.quadraticCurveTo(-halfWidth, -halfHeight, -halfWidth + r, -halfHeight);

  return shape;
}

function roundedRectRing({
  outerWidth,
  outerHeight,
  innerWidth,
  innerHeight,
  outerRadius,
  innerRadius,
  depth
}) {
  const shape = roundedRectShape(outerWidth, outerHeight, outerRadius);
  const hole = new THREE.Path();
  const inner = roundedRectShape(innerWidth, innerHeight, innerRadius);
  hole.copy(inner);
  shape.holes.push(hole);

  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: false,
    curveSegments: 24
  });

  geometry.center();
  geometry.rotateX(Math.PI / 2);

  return geometry;
}

function cloneMaterial(material) {
  return material.clone();
}

function buildLabDeck(name, x, zFlip = 1) {
  const deck = group(name);

  deck.add(
    mesh(
      `${name}_Platform`,
      new THREE.BoxGeometry(3.3, 0.22, 2.2),
      cloneMaterial(MATERIALS.spine),
      [x, 1.46, 0]
    )
  );

  deck.add(
    mesh(
      `${name}_AccessBridge`,
      new THREE.BoxGeometry(1.05, 0.12, 0.8),
      cloneMaterial(MATERIALS.structure),
      [x * 0.58, 1.46, 0]
    )
  );

  deck.add(
    mesh(
      `${name}_RearFrame`,
      new THREE.BoxGeometry(3.3, 1.02, 0.12),
      cloneMaterial(MATERIALS.graphite),
      [x, 1.98, -0.96 * zFlip]
    )
  );

  deck.add(
    mesh(
      `${name}_GlassCanopy`,
      new THREE.BoxGeometry(2.76, 0.54, 1.84),
      cloneMaterial(MATERIALS.glass),
      [x, 1.9, 0]
    )
  );

  const serviceBayOffsets = [-0.92, 0, 0.92];
  serviceBayOffsets.forEach((offset, index) => {
    deck.add(
      mesh(
        `${name}_ServiceBay_${index + 1}`,
        new THREE.BoxGeometry(0.54, 0.52, 0.64),
        cloneMaterial(MATERIALS.labs),
        [x + offset, 1.8, 0.38 * zFlip]
      )
    );
  });

  [-1.18, -0.38, 0.42, 1.2].forEach((offset, index) => {
    deck.add(
      mesh(
        `${name}_Bench_${index + 1}`,
        new THREE.BoxGeometry(0.44, 0.24, 1.3),
        cloneMaterial(MATERIALS.structure),
        [x + offset, 1.62, -0.08]
      )
    );
  });

  [-1.1, -0.3, 0.5, 1.28].forEach((offset, index) => {
    deck.add(
      mesh(
        `${name}_Module_${index + 1}`,
        new THREE.BoxGeometry(0.24, 0.42, 0.42),
        cloneMaterial(MATERIALS.graphite),
        [x + offset, 2.2, -0.76 * zFlip]
      )
    );
  });

  [-1.42, -0.4, 0.62, 1.46].forEach((offset, index) => {
    deck.add(
      mesh(
        `${name}_UtilityRail_${index + 1}`,
        new THREE.CylinderGeometry(0.05, 0.05, 2.02, 12),
        cloneMaterial(MATERIALS.graphite),
        [x + offset, 1.98, 0.84],
        [Math.PI / 2, 0, 0]
      )
    );
  });

  return deck;
}

function buildProgramLoop() {
  const loop = group("ProgramLoop");
  const loopGeometry = roundedRectRing({
    outerWidth: 6.2,
    outerHeight: 2.68,
    innerWidth: 4.88,
    innerHeight: 1.42,
    outerRadius: 0.72,
    innerRadius: 0.48,
    depth: 0.28
  });

  loop.add(
    mesh("ProgramLoop_Track", loopGeometry, cloneMaterial(MATERIALS.program), [0, -1.72, 0])
  );

  loop.add(
    mesh(
      "ProgramLoop_CenterDeck",
      new THREE.BoxGeometry(2.54, 0.18, 0.94),
      cloneMaterial(MATERIALS.structure),
      [0, -1.58, 0]
    )
  );

  [-2.28, -0.92, 0.92, 2.28].forEach((x, index) => {
    loop.add(
      mesh(
        `ProgramLoop_Gate_${index + 1}`,
        new THREE.BoxGeometry(0.22, 0.92, 0.58),
        cloneMaterial(MATERIALS.graphite),
        [x, -1.18, x === -2.28 || x === 2.28 ? 0 : 0.74]
      )
    );
  });

  [
    [-2.48, -1.5, 0.74],
    [-1.18, -2.08, -0.54],
    [1.18, -2.08, 0.54],
    [2.48, -1.5, -0.74]
  ].forEach((position, index) => {
    loop.add(
      mesh(
        `ProgramLoop_Station_${index + 1}`,
        new THREE.BoxGeometry(0.7, 0.34, 0.66),
        cloneMaterial(MATERIALS.program),
        position
      )
    );
  });

  [
    [-2.1, -1.08, -0.62],
    [-0.78, -2.3, 0.1],
    [0.82, -2.3, -0.1],
    [2.12, -1.08, 0.62]
  ].forEach((position, index) => {
    loop.add(
      mesh(
        `ProgramLoop_Checkpoint_${index + 1}`,
        new THREE.CylinderGeometry(0.12, 0.12, 0.52, 16),
        cloneMaterial(MATERIALS.accent),
        position
      )
    );
  });

  return loop;
}

function buildNetworkLayer() {
  const network = group("NetworkLayer");

  network.add(
    mesh(
      "NetworkLayer_MainBridge",
      new THREE.BoxGeometry(4.8, 0.12, 0.42),
      cloneMaterial(MATERIALS.network),
      [0, 3.1, 0]
    )
  );

  [-1.8, 1.8].forEach((x, index) => {
    network.add(
      mesh(
        `NetworkLayer_NodeDeck_${index + 1}`,
        new THREE.BoxGeometry(1.56, 0.14, 1.02),
        cloneMaterial(MATERIALS.structure),
        [x, 3.1, 0]
      )
    );

    network.add(
      mesh(
        `NetworkLayer_Enclosure_${index + 1}`,
        new THREE.BoxGeometry(1.34, 0.64, 0.84),
        cloneMaterial(MATERIALS.glass),
        [x, 3.48, 0]
      )
    );
  });

  [
    [-2.64, 3.16, 0.22],
    [-0.68, 3.16, -0.18],
    [0.68, 3.16, 0.18],
    [2.64, 3.16, -0.22]
  ].forEach((position, index) => {
    network.add(
      mesh(
        `NetworkLayer_Node_${index + 1}`,
        new THREE.BoxGeometry(0.42, 0.42, 0.42),
        cloneMaterial(MATERIALS.network),
        position
      )
    );
  });

  [
    [-2.42, 2.58, 0, 0, 0, Math.PI / 8],
    [-1.04, 2.58, 0, 0, 0, -Math.PI / 8],
    [1.04, 2.58, 0, 0, 0, Math.PI / 8],
    [2.42, 2.58, 0, 0, 0, -Math.PI / 8]
  ].forEach(([x, y, z, rx, ry, rz], index) => {
    network.add(
      mesh(
        `NetworkLayer_Span_${index + 1}`,
        new THREE.BoxGeometry(0.14, 1.2, 0.14),
        cloneMaterial(MATERIALS.graphite),
        [x, y, z],
        [rx, ry, rz]
      )
    );
  });

  [-2.86, 2.86].forEach((x, index) => {
    network.add(
      mesh(
        `NetworkLayer_Reach_${index + 1}`,
        new THREE.BoxGeometry(1.02, 0.08, 0.18),
        cloneMaterial(MATERIALS.graphite),
        [x, 3.46, 0]
      )
    );
  });

  return network;
}

function buildSpine() {
  const spine = group("OperationsSpine");

  spine.add(
    mesh(
      "OperationsSpine_MainDeck",
      new THREE.BoxGeometry(5.2, 0.3, 1.58),
      cloneMaterial(MATERIALS.spine),
      [0, 0.32, 0]
    )
  );

  spine.add(
    mesh(
      "OperationsSpine_Core",
      new THREE.BoxGeometry(0.84, 2.88, 1.24),
      cloneMaterial(MATERIALS.graphite),
      [0, 1.18, 0]
    )
  );

  spine.add(
    mesh(
      "OperationsSpine_BackWall",
      new THREE.BoxGeometry(5.08, 1.16, 0.14),
      cloneMaterial(MATERIALS.structure),
      [0, 0.82, -0.74]
    )
  );

  [-2.08, -0.82, 0.82, 2.08].forEach((x, index) => {
    spine.add(
      mesh(
        `OperationsSpine_Support_${index + 1}`,
        new THREE.BoxGeometry(0.18, 2.74, 0.22),
        cloneMaterial(MATERIALS.graphite),
        [x, 0.88, 0.52]
      )
    );
  });

  [-1.72, -0.58, 0.58, 1.72].forEach((x, index) => {
    spine.add(
      mesh(
        `OperationsSpine_ServiceBay_${index + 1}`,
        new THREE.BoxGeometry(0.82, 0.54, 0.62),
        cloneMaterial(MATERIALS.structure),
        [x, 0.86, 0.44]
      )
    );
  });

  [-1.84, -0.64, 0.64, 1.84].forEach((x, index) => {
    spine.add(
      mesh(
        `OperationsSpine_Conduit_${index + 1}`,
        new THREE.CylinderGeometry(0.07, 0.07, 3.62, 16),
        cloneMaterial(MATERIALS.accent),
        [x, 0.98, -0.14]
      )
    );
  });

  spine.add(
    mesh(
      "OperationsSpine_GlassPlane",
      new THREE.BoxGeometry(4.52, 0.82, 1.06),
      cloneMaterial(MATERIALS.glass),
      [0, 0.74, 0]
    )
  );

  return spine;
}

function buildCrossSectionScene() {
  const scene = new THREE.Scene();
  scene.name = "ResearchCampusCrossSection";

  const root = group("CrossSectionRoot");
  root.rotation.set(0.08, 0, 0);

  const undercarriage = group("SupportFrame");
  undercarriage.add(
    mesh(
      "SupportFrame_BaseRail",
      new THREE.BoxGeometry(6.82, 0.18, 0.42),
      cloneMaterial(MATERIALS.graphite),
      [0, -2.72, 0]
    )
  );

  [-2.72, 0, 2.72].forEach((x, index) => {
    undercarriage.add(
      mesh(
        `SupportFrame_Pier_${index + 1}`,
        new THREE.BoxGeometry(0.26, 1.28, 0.26),
        cloneMaterial(MATERIALS.graphite),
        [x, -2.08, 0]
      )
    );
  });

  root.add(undercarriage);
  root.add(buildSpine());
  root.add(buildLabDeck("LabDeckWest", -2.46, -1));
  root.add(buildLabDeck("LabDeckEast", 2.46, 1));
  root.add(buildProgramLoop());
  root.add(buildNetworkLayer());

  scene.add(root);
  return scene;
}

async function exportAsset() {
  await mkdir(outDir, { recursive: true });

  const scene = buildCrossSectionScene();
  const exporter = new GLTFExporter();

  const arrayBuffer = await new Promise((resolve, reject) => {
    exporter.parse(
      scene,
      (value) => resolve(value),
      (error) => reject(error),
      {
        binary: true,
        includeCustomExtensions: false,
        onlyVisible: true
      }
    );
  });

  await writeFile(path.join(outDir, assetName), Buffer.from(arrayBuffer));

  const manifest = {
    version: 1,
    name: "Research Campus Cross-Section",
    asset: assetName,
    root: "CrossSectionRoot",
    layers: {
      spine: "OperationsSpine",
      labs: ["LabDeckWest", "LabDeckEast"],
      program: "ProgramLoop",
      network: "NetworkLayer"
    },
    notes: [
      "Authored base asset for the persistent cross-section scene.",
      "Runtime adds signal routing, chapter emphasis, camera choreography, and fallback rendering."
    ]
  };

  await writeFile(
    path.join(outDir, "manifest.json"),
    `${JSON.stringify(manifest, null, 2)}\n`
  );

  console.log(`Wrote ${path.join("public/assets/3d/cross-section", assetName)}`);
  console.log(`Wrote ${path.join("public/assets/3d/cross-section", "manifest.json")}`);
}

await exportAsset();
