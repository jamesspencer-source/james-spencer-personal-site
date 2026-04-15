#!/usr/bin/env node

/**
 * Build the authored monolith asset pack.
 *
 * Outputs:
 * - public/assets/3d/monolith/monolith.glb
 * - public/assets/3d/monolith/monolith-shell-roughness.png
 * - public/assets/3d/monolith/monolith-shell-emissive.png
 * - public/assets/3d/monolith/monolith-glass-mask.png
 *
 * Run with:
 *   node scripts/build-monolith.mjs
 */

import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import zlib from 'node:zlib';
import { fileURLToPath } from 'node:url';

import * as THREE from 'three';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const outDir = path.join(projectRoot, 'public/assets/3d/monolith');

const width = 512;
const height = 1024;

const signatures = {
  roughness: 'monolith-shell-roughness.png',
  emissive: 'monolith-shell-emissive.png',
  glassMask: 'monolith-glass-mask.png',
  glb: 'monolith.glb',
};

class ImageDataPolyfill {
  constructor(data, width, height) {
    this.data = data;
    this.width = width;
    this.height = height;
  }
}

class Mini2DContext {
  constructor(canvas) {
    this.canvas = canvas;
    this.fillStyle = '#000000';
  }

  save() {}

  restore() {}

  translate() {}

  scale() {}

  beginPath() {}

  rect() {}

  fill() {}

  clearRect(x, y, width, height) {
    this.fillRect(x, y, width, height, [0, 0, 0, 0]);
  }

  fillRect(x, y, width, height) {
    const color = parseColor(this.fillStyle);
    const canvasWidth = this.canvas._width;
    const canvasHeight = this.canvas._height;
    const startX = clamp(Math.floor(x), 0, canvasWidth);
    const startY = clamp(Math.floor(y), 0, canvasHeight);
    const endX = clamp(Math.ceil(x + width), 0, canvasWidth);
    const endY = clamp(Math.ceil(y + height), 0, canvasHeight);

    for (let py = startY; py < endY; py += 1) {
      for (let px = startX; px < endX; px += 1) {
        const index = (py * canvasWidth + px) * 4;
        this.canvas._pixels[index + 0] = color[0];
        this.canvas._pixels[index + 1] = color[1];
        this.canvas._pixels[index + 2] = color[2];
        this.canvas._pixels[index + 3] = color[3];
      }
    }
  }

  getImageData(x, y, width, height) {
    const result = new Uint8ClampedArray(width * height * 4);
    const canvasWidth = this.canvas._width;

    for (let py = 0; py < height; py += 1) {
      for (let px = 0; px < width; px += 1) {
        const sourceX = clamp(x + px, 0, canvasWidth - 1);
        const sourceY = clamp(y + py, 0, this.canvas._height - 1);
        const sourceIndex = (sourceY * canvasWidth + sourceX) * 4;
        const targetIndex = (py * width + px) * 4;
        result[targetIndex + 0] = this.canvas._pixels[sourceIndex + 0];
        result[targetIndex + 1] = this.canvas._pixels[sourceIndex + 1];
        result[targetIndex + 2] = this.canvas._pixels[sourceIndex + 2];
        result[targetIndex + 3] = this.canvas._pixels[sourceIndex + 3];
      }
    }

    return new ImageDataPolyfill(result, width, height);
  }

  putImageData(imageData) {
    this.canvas._pixels = new Uint8ClampedArray(imageData.data);
    this.canvas._width = imageData.width;
    this.canvas._height = imageData.height;
  }

  drawImage(image, x = 0, y = 0, width = image.width, height = image.height) {
    const source = image instanceof MiniOffscreenCanvas ? image : image;

    if (source && source.data !== undefined) {
      const srcWidth = source.width;
      const srcHeight = source.height;
      const srcData = source.data;
      const targetWidth = this.canvas._width;
      const targetHeight = this.canvas._height;

      for (let py = 0; py < height; py += 1) {
        const v = py / Math.max(1, height - 1);
        const sourceY = clamp(Math.round(v * (srcHeight - 1)), 0, srcHeight - 1);
        for (let px = 0; px < width; px += 1) {
          const u = px / Math.max(1, width - 1);
          const sourceX = clamp(Math.round(u * (srcWidth - 1)), 0, srcWidth - 1);
          const sourceIndex = (sourceY * srcWidth + sourceX) * 4;
          const destX = clamp(Math.floor(x + px), 0, targetWidth - 1);
          const destY = clamp(Math.floor(y + py), 0, targetHeight - 1);
          const targetIndex = (destY * targetWidth + destX) * 4;
          this.canvas._pixels[targetIndex + 0] = srcData[sourceIndex + 0];
          this.canvas._pixels[targetIndex + 1] = srcData[sourceIndex + 1];
          this.canvas._pixels[targetIndex + 2] = srcData[sourceIndex + 2];
          this.canvas._pixels[targetIndex + 3] = srcData[sourceIndex + 3];
        }
      }
      return;
    }

    if (source instanceof MiniOffscreenCanvas && source._pixels) {
      this.canvas._pixels = new Uint8ClampedArray(source._pixels);
      this.canvas._width = source.width;
      this.canvas._height = source.height;
    }
  }
}

class MiniOffscreenCanvas {
  constructor(width, height) {
    this._width = width;
    this._height = height;
    this._pixels = new Uint8ClampedArray(width * height * 4);
    this._context = new Mini2DContext(this);
  }

  get width() {
    return this._width;
  }

  set width(value) {
    this._width = value;
    this._pixels = new Uint8ClampedArray(this._width * this._height * 4);
  }

  get height() {
    return this._height;
  }

  set height(value) {
    this._height = value;
    this._pixels = new Uint8ClampedArray(this._width * this._height * 4);
  }

  getContext(type) {
    if (type !== '2d') {
      return null;
    }

    return this._context;
  }

  convertToBlob({ type = 'image/png' } = {}) {
    return Promise.resolve(new Blob([encodePng(this._width, this._height, this._pixels)], { type }));
  }
}

if (typeof globalThis.ImageData === 'undefined') {
  globalThis.ImageData = ImageDataPolyfill;
}

if (typeof globalThis.OffscreenCanvas === 'undefined') {
  globalThis.OffscreenCanvas = MiniOffscreenCanvas;
}

if (typeof globalThis.FileReader === 'undefined') {
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
        if (typeof this.onload === 'function') {
          this.onload({ target: this });
        }
        if (typeof this.onloadend === 'function') {
          this.onloadend({ target: this });
        }
      } catch (error) {
        this.error = error;
        if (typeof this.onerror === 'function') {
          this.onerror({ target: this, error });
        }
        if (typeof this.onloadend === 'function') {
          this.onloadend({ target: this });
        }
      }
    }
  };
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function smoothstep(edge0, edge1, x) {
  const t = clamp((x - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
}

function hash2D(x, y, seed = 0) {
  let n = x * 374761393 + y * 668265263 + seed * 1442695041;
  n = (n ^ (n >> 13)) >>> 0;
  n = Math.imul(n, 1274126177);
  return ((n ^ (n >> 16)) >>> 0) / 4294967295;
}

function valueNoise(x, y, seed = 0) {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const xf = x - xi;
  const yf = y - yi;

  const a = hash2D(xi, yi, seed);
  const b = hash2D(xi + 1, yi, seed);
  const c = hash2D(xi, yi + 1, seed);
  const d = hash2D(xi + 1, yi + 1, seed);

  const u = xf * xf * (3 - 2 * xf);
  const v = yf * yf * (3 - 2 * yf);

  return lerp(lerp(a, b, u), lerp(c, d, u), v);
}

function fbm(x, y, seed = 0, octaves = 4) {
  let value = 0;
  let amplitude = 0.5;
  let frequency = 1;
  let total = 0;

  for (let i = 0; i < octaves; i += 1) {
    value += amplitude * valueNoise(x * frequency, y * frequency, seed + i * 101);
    total += amplitude;
    amplitude *= 0.5;
    frequency *= 2;
  }

  return value / total;
}

function rgba(r, g, b, a = 255) {
  return [r, g, b, a];
}

function parseColor(value) {
  if (typeof value !== 'string') {
    return [0, 0, 0, 255];
  }

  const hex = value.trim();
  if (hex.startsWith('#')) {
    const normalized = hex.slice(1);
    if (normalized.length === 3) {
      const r = parseInt(normalized[0] + normalized[0], 16);
      const g = parseInt(normalized[1] + normalized[1], 16);
      const b = parseInt(normalized[2] + normalized[2], 16);
      return [r, g, b, 255];
    }

    if (normalized.length === 6) {
      const r = parseInt(normalized.slice(0, 2), 16);
      const g = parseInt(normalized.slice(2, 4), 16);
      const b = parseInt(normalized.slice(4, 6), 16);
      return [r, g, b, 255];
    }
  }

  return [0, 0, 0, 255];
}

function setPixel(buffer, width, x, y, color) {
  const index = (y * width + x) * 4;
  buffer[index + 0] = color[0];
  buffer[index + 1] = color[1];
  buffer[index + 2] = color[2];
  buffer[index + 3] = color[3];
}

function encodePng(width, height, pixels) {
  const rowSize = width * 4 + 1;
  const raw = Buffer.alloc(rowSize * height);

  for (let y = 0; y < height; y += 1) {
    const rawOffset = y * rowSize;
    const srcOffset = y * width * 4;
    raw[rawOffset] = 0;
    pixels.subarray(srcOffset, srcOffset + width * 4).forEach((value, i) => {
      raw[rawOffset + 1 + i] = value;
    });
  }

  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  const crcTable = new Uint32Array(256);
  for (let n = 0; n < 256; n += 1) {
    let c = n;
    for (let k = 0; k < 8; k += 1) {
      c = (c & 1) ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    crcTable[n] = c >>> 0;
  }

  function crc32(buffer) {
    let c = 0xffffffff;
    for (let i = 0; i < buffer.length; i += 1) {
      c = crcTable[(c ^ buffer[i]) & 0xff] ^ (c >>> 8);
    }
    return (c ^ 0xffffffff) >>> 0;
  }

  function chunk(type, data) {
    const typeBuffer = Buffer.from(type);
    const length = Buffer.alloc(4);
    length.writeUInt32BE(data.length, 0);
    const crcInput = Buffer.concat([typeBuffer, data]);
    const crc = Buffer.alloc(4);
    crc.writeUInt32BE(crc32(crcInput), 0);
    return Buffer.concat([length, typeBuffer, data, crc]);
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const idat = zlib.deflateSync(raw, { level: 9 });
  const png = Buffer.concat([
    signature,
    chunk('IHDR', ihdr),
    chunk('IDAT', idat),
    chunk('IEND', Buffer.alloc(0)),
  ]);

  return png;
}

function buildTexture(name, generator) {
  const buffer = new Uint8ClampedArray(width * height * 4);

  for (let y = 0; y < height; y += 1) {
    const v = y / (height - 1);
    for (let x = 0; x < width; x += 1) {
      const u = x / (width - 1);
      const color = generator(u, v, x, y);
      setPixel(buffer, width, x, y, color);
    }
  }

  const png = encodePng(width, height, buffer);
  const dataTexture = new THREE.DataTexture(buffer, width, height, THREE.RGBAFormat);
  dataTexture.needsUpdate = true;
  dataTexture.flipY = false;
  dataTexture.colorSpace = THREE.NoColorSpace;
  dataTexture.name = name;

  return { buffer, png, dataTexture };
}

function buildRoughnessTexture() {
  return buildTexture('monolith-shell-roughness', (u, v) => {
    const grain = fbm(u * 8.5, v * 7.5, 11, 5);
    const streaks = Math.abs(Math.sin((u * 18.0 + v * 3.1) * Math.PI));
    const edgeDarken = smoothstep(0.0, 0.22, v) * 0.15 + smoothstep(0.82, 1.0, v) * 0.2;
    const cutBias = smoothstep(0.45, 0.72, u) * smoothstep(0.1, 0.9, v) * 0.12;
    const value = clamp(0.28 + grain * 0.34 + streaks * 0.16 + edgeDarken + cutBias, 0, 1);
    const channel = Math.round(value * 255);
    return rgba(channel, channel, channel, 255);
  });
}

function buildEmissiveTexture() {
  return buildTexture('monolith-shell-emissive', (u, v) => {
    const verticalSeam = Math.exp(-Math.pow((u - 0.66) / 0.035, 2)) * (0.4 + 0.6 * smoothstep(0.12, 0.88, v));
    const crownBeam = Math.exp(-Math.pow((v - 0.15) / 0.02, 2)) * smoothstep(0.45, 0.82, u);
    const lowerRail = Math.exp(-Math.pow((v - 0.72) / 0.025, 2)) * smoothstep(0.52, 0.76, u);
    const nodeA = Math.exp(-Math.pow((u - 0.71) / 0.018, 2) - Math.pow((v - 0.34) / 0.02, 2));
    const nodeB = Math.exp(-Math.pow((u - 0.58) / 0.022, 2) - Math.pow((v - 0.62) / 0.02, 2));
    const signal = clamp(verticalSeam * 0.72 + crownBeam * 0.42 + lowerRail * 0.28 + nodeA * 0.95 + nodeB * 0.7, 0, 1);
    const channel = Math.round(signal * 255);
    return rgba(channel, channel, channel, 255);
  });
}

function buildGlassMaskTexture() {
  return buildTexture('monolith-glass-mask', (u, v) => {
    const cavity = 1 - smoothstep(0.22, 0.86, Math.abs(u - 0.68));
    const depth = smoothstep(0.1, 0.9, v) * 0.55 + (1 - smoothstep(0.0, 0.22, v)) * 0.15;
    const noise = fbm(u * 6.2, v * 8.4, 23, 4) * 0.25;
    const value = clamp(0.25 + cavity * 0.45 + depth * 0.2 + noise, 0, 1);
    const channel = Math.round(value * 255);
    return rgba(channel, channel, channel, 255);
  });
}

function makeBeamBetween(a, b, thickness, material, name = 'beam') {
  const delta = new THREE.Vector3().subVectors(b, a);
  const length = delta.length();
  const center = new THREE.Vector3().addVectors(a, b).multiplyScalar(0.5);
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(length, thickness, thickness), material);
  mesh.name = name;
  mesh.position.copy(center);
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(1, 0, 0), delta.normalize());
  return mesh;
}

function addPlate(group, position, size, material, rotation = [0, 0, 0], name = 'plate') {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(size[0], size[1], size[2]), material);
  mesh.name = name;
  mesh.position.set(position[0], position[1], position[2]);
  mesh.rotation.set(rotation[0], rotation[1], rotation[2]);
  group.add(mesh);
  return mesh;
}

function addNode(group, position, size, material, color = null, name = 'node') {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(size[0], size[1], size[2]), material.clone());
  mesh.name = name;
  mesh.position.set(position[0], position[1], position[2]);
  if (color) mesh.material.color = new THREE.Color(color);
  group.add(mesh);
  return mesh;
}

function createShell(scene, materials) {
  const shellGroup = new THREE.Group();
  shellGroup.name = 'shell';

  const shape = new THREE.Shape();
  shape.moveTo(-1.22, -3.32);
  shape.lineTo(1.06, -3.32);
  shape.lineTo(1.22, -2.62);
  shape.lineTo(1.28, 1.76);
  shape.lineTo(1.08, 4.58);
  shape.lineTo(0.76, 5.62);
  shape.lineTo(0.92, 6.28);
  shape.lineTo(0.12, 6.72);
  shape.lineTo(-0.82, 6.58);
  shape.lineTo(-1.06, 5.52);
  shape.lineTo(-1.22, 2.15);
  shape.lineTo(-1.34, -0.72);
  shape.lineTo(-1.28, -2.34);
  shape.closePath();

  const mainHole = new THREE.Path();
  mainHole.moveTo(0.16, -0.28);
  mainHole.lineTo(0.86, -0.28);
  mainHole.lineTo(0.86, 3.54);
  mainHole.lineTo(0.04, 3.54);
  mainHole.closePath();
  shape.holes.push(mainHole);

  const upperSlot = new THREE.Path();
  upperSlot.moveTo(-0.08, 4.05);
  upperSlot.lineTo(0.42, 4.05);
  upperSlot.lineTo(0.42, 5.08);
  upperSlot.lineTo(-0.12, 5.08);
  upperSlot.closePath();
  shape.holes.push(upperSlot);

  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: 1.48,
    bevelEnabled: true,
    bevelSegments: 3,
    steps: 2,
    bevelSize: 0.08,
    bevelThickness: 0.1,
  });
  geometry.center();

  const shellMesh = new THREE.Mesh(geometry, materials.shell);
  shellMesh.name = 'shell-body';
  shellMesh.castShadow = true;
  shellMesh.receiveShadow = true;
  shellGroup.add(shellMesh);

  addPlate(shellGroup, [-0.86, -2.58, 0.57], [0.72, 0.18, 0.12], materials.reinforce, [0, 0, -0.06], 'base-rib');
  addPlate(shellGroup, [-0.78, -1.14, 0.61], [0.88, 0.14, 0.1], materials.reinforce, [0, 0, 0.02], 'mid-rib');
  addPlate(shellGroup, [-0.72, 1.26, 0.57], [0.9, 0.12, 0.1], materials.reinforce, [0, 0, -0.02], 'upper-rib');
  addPlate(shellGroup, [-0.16, 5.28, 0.56], [0.9, 0.14, 0.12], materials.reinforce, [0.02, 0.03, -0.03], 'crown-rib');

  const spine = new THREE.Group();
  spine.name = 'backbone';
  const spineSegments = [
    [[-1.0, -2.8, -0.58], [-0.96, 5.7, -0.58], 0.08],
    [[-0.86, -2.1, -0.62], [-0.84, 5.5, -0.62], 0.07],
    [[-0.72, -1.4, -0.67], [-0.68, 4.9, -0.67], 0.06],
  ];
  spineSegments.forEach(([a, b, t], index) => {
    spine.add(makeBeamBetween(new THREE.Vector3(...a), new THREE.Vector3(...b), t, materials.reinforce, `spine-${index}`));
  });
  shellGroup.add(spine);

  scene.add(shellGroup);
  return shellGroup;
}

function createLaboratoryCore(scene, materials) {
  const group = new THREE.Group();
  group.name = 'lab-core';

  const framePositions = [
    [-0.04, 2.1, 0.26],
    [0.08, 1.48, 0.3],
    [0.18, 0.86, 0.31],
    [0.28, 0.24, 0.33],
  ];

  framePositions.forEach((position, index) => {
    const chamber = new THREE.Group();
    chamber.name = `lab-chamber-${index + 1}`;

    addPlate(chamber, position, [0.9, 0.46, 0.22], materials.panel, [0, 0.06 * index, -0.03 * index], 'chamber-shell');
    addPlate(chamber, [position[0] - 0.1, position[1], position[2] + 0.12], [0.66, 0.1, 0.08], materials.interior, [0, 0, 0], 'chamber-cap');
    addPlate(chamber, [position[0] + 0.06, position[1] - 0.08, position[2] + 0.02], [0.16, 0.34, 0.06], materials.reinforce, [0, 0, -0.18], 'chamber-rib');
    addPlate(chamber, [position[0] - 0.28, position[1] + 0.08, position[2] + 0.05], [0.12, 0.28, 0.06], materials.reinforce, [0, 0, 0.14], 'chamber-rib-2');
    addNode(chamber, [position[0] + 0.24, position[1] + 0.1, position[2] + 0.13], [0.1, 0.1, 0.1], materials.signal, '#79d9b0', 'chamber-node');
    group.add(chamber);
  });

  addPlate(group, [0.38, 2.92, 0.22], [0.72, 0.18, 0.08], materials.reinforce, [0.02, 0.0, 0.11], 'service-rail');
  addPlate(group, [0.44, 1.98, 0.26], [0.64, 0.12, 0.06], materials.reinforce, [0.0, 0.0, -0.08], 'service-rail-2');
  addPlate(group, [0.5, 1.14, 0.24], [0.58, 0.1, 0.06], materials.reinforce, [0.0, 0.0, 0.06], 'service-rail-3');

  const bracePairs = [
    [[0.82, 2.54, 0.37], [0.42, 3.22, 0.37]],
    [[0.84, 1.84, 0.39], [0.46, 2.42, 0.39]],
    [[0.86, 1.06, 0.4], [0.52, 1.62, 0.4]],
    [[0.9, 0.28, 0.41], [0.58, 0.74, 0.41]],
  ];
  bracePairs.forEach(([a, b], index) => {
    group.add(makeBeamBetween(new THREE.Vector3(...a), new THREE.Vector3(...b), 0.045, materials.reinforce, `lab-brace-${index}`));
  });

  scene.add(group);
  return group;
}

function createProgramCore(scene, materials) {
  const group = new THREE.Group();
  group.name = 'program-core';

  const pathPoints = [
    [-0.02, -0.5, 0.16],
    [0.48, -0.5, 0.2],
    [0.54, -0.98, 0.22],
    [0.08, -1.16, 0.24],
    [-0.12, -1.68, 0.23],
    [0.36, -1.86, 0.21],
    [0.7, -1.3, 0.2],
    [0.64, -0.54, 0.19],
  ];

  for (let i = 0; i < pathPoints.length - 1; i += 1) {
    const a = new THREE.Vector3(...pathPoints[i]);
    const b = new THREE.Vector3(...pathPoints[i + 1]);
    group.add(makeBeamBetween(a, b, 0.05, materials.signal, `program-path-${i}`));
  }

  const checkpoints = [
    [0.18, -0.52, 0.24],
    [0.52, -0.88, 0.26],
    [0.22, -1.36, 0.27],
    [0.54, -1.66, 0.24],
  ];
  checkpoints.forEach((position, index) => {
    addNode(group, position, [0.12, 0.12, 0.12], materials.signal, '#74c9ab', `program-gate-${index}`);
  });

  addPlate(group, [0.14, -1.1, 0.31], [0.9, 0.28, 0.1], materials.panel, [0.04, -0.06, 0.1], 'program-bay');
  addPlate(group, [0.0, -1.95, 0.34], [0.82, 0.18, 0.08], materials.interior, [0, 0.06, 0], 'program-baseline');
  addPlate(group, [0.58, -1.12, 0.39], [0.22, 0.72, 0.08], materials.reinforce, [0, 0, 0.04], 'program-service');
  addPlate(group, [0.68, -1.5, 0.42], [0.12, 0.48, 0.08], materials.reinforce, [0, 0, -0.1], 'program-service-2');

  scene.add(group);
  return group;
}

function createNetworkCrown(scene, materials) {
  const group = new THREE.Group();
  group.name = 'network-crown';

  const crownNodes = [
    [-0.26, 4.92, 0.58],
    [0.2, 5.42, 0.67],
    [0.72, 5.88, 0.61],
  ];

  addPlate(group, [-0.16, 4.38, 0.48], [1.18, 0.14, 0.08], materials.reinforce, [0.02, 0.02, -0.05], 'crown-lift');
  addPlate(group, [0.36, 4.82, 0.54], [0.72, 0.12, 0.08], materials.reinforce, [0.0, 0.0, 0.08], 'crown-bridge');
  addPlate(group, [0.78, 5.34, 0.58], [0.46, 0.12, 0.08], materials.reinforce, [0.0, 0.0, -0.14], 'crown-span');

  const archA = [
    [-0.58, 4.36, 0.52],
    [-0.24, 5.04, 0.58],
    [0.12, 5.44, 0.62],
    [0.54, 5.9, 0.6],
  ];
  const archB = [
    [-0.42, 4.1, 0.46],
    [0.0, 4.8, 0.54],
    [0.46, 5.16, 0.62],
    [0.98, 5.58, 0.64],
  ];

  const buildSpan = (points, prefix) => {
    for (let i = 0; i < points.length - 1; i += 1) {
      const a = new THREE.Vector3(...points[i]);
      const b = new THREE.Vector3(...points[i + 1]);
      group.add(makeBeamBetween(a, b, 0.04, materials.signal, `${prefix}-${i}`));
    }
  };
  buildSpan(archA, 'crown-arch-a');
  buildSpan(archB, 'crown-arch-b');

  crownNodes.forEach((position, index) => {
    addNode(group, position, [0.12, 0.12, 0.12], materials.signal, '#82d8ba', `crown-node-${index}`);
  });

  const braces = [
    [[0.02, 4.72, 0.56], [0.52, 5.18, 0.63]],
    [[0.28, 4.56, 0.55], [0.84, 5.14, 0.6]],
    [[0.58, 4.7, 0.59], [0.92, 5.56, 0.65]],
  ];
  braces.forEach(([a, b], index) => {
    group.add(makeBeamBetween(new THREE.Vector3(...a), new THREE.Vector3(...b), 0.032, materials.reinforce, `crown-brace-${index}`));
  });

  scene.add(group);
  return group;
}

function createSignalTraffic(scene, materials) {
  const group = new THREE.Group();
  group.name = 'signal-traffic';

  const routes = [
    [[-0.52, 2.96, 0.42], [-0.2, 2.16, 0.44], [0.12, 1.3, 0.48], [0.34, 0.4, 0.52]],
    [[-0.38, 1.62, 0.38], [0.02, 1.0, 0.46], [0.36, 0.1, 0.5], [0.64, -0.72, 0.52]],
    [[-0.06, 3.88, 0.46], [0.24, 4.44, 0.52], [0.48, 4.94, 0.58], [0.7, 5.46, 0.62]],
  ];

  routes.forEach((points, routeIndex) => {
    for (let i = 0; i < points.length - 1; i += 1) {
      const a = new THREE.Vector3(...points[i]);
      const b = new THREE.Vector3(...points[i + 1]);
      group.add(makeBeamBetween(a, b, 0.028, materials.signal, `signal-${routeIndex}-${i}`));
    }
  });

  const pulses = [
    [-0.22, 2.02, 0.46],
    [0.18, 1.18, 0.5],
    [0.48, 0.28, 0.53],
    [0.22, 4.12, 0.55],
    [0.56, 5.02, 0.59],
  ];
  pulses.forEach((position, index) => {
    addNode(group, position, [0.08, 0.08, 0.08], materials.signal, '#76d3b0', `pulse-${index}`);
  });

  scene.add(group);
  return group;
}

function createPlinth(scene, materials) {
  const group = new THREE.Group();
  group.name = 'plinth';

  addPlate(group, [0, -3.72, 0.0], [2.8, 0.28, 1.92], materials.plinth, [0, 0, 0], 'base-slab');
  addPlate(group, [0.0, -3.56, 0.0], [2.1, 0.12, 1.32], materials.reinforce, [0, 0, 0], 'base-inset');
  addPlate(group, [-0.58, -3.42, -0.28], [0.88, 0.08, 0.56], materials.reinforce, [0.0, 0.04, 0.04], 'base-rail');

  scene.add(group);
  return group;
}

function createMonolithScene(textures) {
  const scene = new THREE.Scene();
  scene.name = 'monolith-scene';

  const materials = {
    shell: new THREE.MeshPhysicalMaterial({
      name: 'shell-material',
      color: new THREE.Color('#1b1e21'),
      roughness: 0.72,
      metalness: 0.42,
      clearcoat: 0.08,
      clearcoatRoughness: 0.9,
      roughnessMap: textures.roughness.dataTexture,
      emissive: new THREE.Color('#79d0af'),
      emissiveIntensity: 0.42,
      emissiveMap: textures.emissive.dataTexture,
    }),
    reinforce: new THREE.MeshStandardMaterial({
      name: 'reinforce-material',
      color: new THREE.Color('#23282d'),
      roughness: 0.48,
      metalness: 0.72,
      emissive: new THREE.Color('#20332e'),
      emissiveIntensity: 0.06,
    }),
    panel: new THREE.MeshPhysicalMaterial({
      name: 'panel-material',
      color: new THREE.Color('#2a3136'),
      roughness: 0.32,
      metalness: 0.28,
      transmission: 0.18,
      thickness: 0.2,
      ior: 1.38,
      transparent: true,
      opacity: 0.82,
      roughnessMap: textures.glassMask.dataTexture,
      emissive: new THREE.Color('#223b34'),
      emissiveIntensity: 0.05,
    }),
    interior: new THREE.MeshPhysicalMaterial({
      name: 'interior-material',
      color: new THREE.Color('#313a40'),
      roughness: 0.2,
      metalness: 0.65,
      transmission: 0.08,
      thickness: 0.1,
      transparent: true,
      opacity: 0.95,
      roughnessMap: textures.glassMask.dataTexture,
      emissive: new THREE.Color('#304d45'),
      emissiveIntensity: 0.08,
    }),
    signal: new THREE.MeshStandardMaterial({
      name: 'signal-material',
      color: new THREE.Color('#16211e'),
      roughness: 0.24,
      metalness: 0.1,
      emissive: new THREE.Color('#7ad3b0'),
      emissiveIntensity: 0.72,
      emissiveMap: textures.emissive.dataTexture,
    }),
    plinth: new THREE.MeshStandardMaterial({
      name: 'plinth-material',
      color: new THREE.Color('#121517'),
      roughness: 0.84,
      metalness: 0.22,
    }),
  };

  createPlinth(scene, materials);
  createShell(scene, materials);
  createLaboratoryCore(scene, materials);
  createProgramCore(scene, materials);
  createNetworkCrown(scene, materials);
  createSignalTraffic(scene, materials);

  scene.updateMatrixWorld(true);
  return scene;
}

async function writeTextureAsset(outputPath, pngBuffer) {
  await writeFile(outputPath, pngBuffer);
}

async function main() {
  await mkdir(outDir, { recursive: true });

  const roughness = buildRoughnessTexture();
  const emissive = buildEmissiveTexture();
  const glassMask = buildGlassMaskTexture();

  await Promise.all([
    writeTextureAsset(path.join(outDir, signatures.roughness), roughness.png),
    writeTextureAsset(path.join(outDir, signatures.emissive), emissive.png),
    writeTextureAsset(path.join(outDir, signatures.glassMask), glassMask.png),
  ]);

  const scene = createMonolithScene({
    roughness,
    emissive,
    glassMask,
  });

  const exporter = new GLTFExporter();
  const arrayBuffer = await exporter.parseAsync(scene, {
    binary: true,
    trs: false,
    onlyVisible: true,
    maxTextureSize: 1024,
    animations: [],
    forcePowerOfTwoTextures: false,
  });

  await writeFile(path.join(outDir, signatures.glb), Buffer.from(arrayBuffer));

  const manifest = {
    asset: 'monolith',
    generatedAt: new Date().toISOString(),
    generator: path.relative(projectRoot, __filename),
    outputs: {
      glb: signatures.glb,
      textures: [signatures.roughness, signatures.emissive, signatures.glassMask],
    },
    notes: 'Run `node scripts/build-monolith.mjs` from the repo root to regenerate.',
  };

  await writeFile(path.join(outDir, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);

  const summary = [
    `Wrote ${path.join('public/assets/3d/monolith', signatures.glb)}`,
    `Wrote ${path.join('public/assets/3d/monolith', signatures.roughness)}`,
    `Wrote ${path.join('public/assets/3d/monolith', signatures.emissive)}`,
    `Wrote ${path.join('public/assets/3d/monolith', signatures.glassMask)}`,
    `Wrote ${path.join('public/assets/3d/monolith', 'manifest.json')}`,
  ];
  console.log(summary.join('\n'));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
