#!/usr/bin/env node

/**
 * Build the Research Operations Campus asset pack.
 *
 * Outputs:
 * - public/assets/3d/campus/campus.glb
 * - public/assets/3d/campus/campus-ao.png
 * - public/assets/3d/campus/campus-roughness.png
 * - public/assets/3d/campus/campus-normal.png
 * - public/assets/3d/campus/campus-emissive.png
 * - public/assets/3d/campus/campus-glass-mask.png
 * - public/assets/3d/campus/manifest.json
 *
 * Run with:
 *   node scripts/build-campus.mjs
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
const outDir = path.join(projectRoot, 'public/assets/3d/campus');
const width = 1024;
const height = 1024;

const signatures = {
  ao: 'campus-ao.png',
  roughness: 'campus-roughness.png',
  normal: 'campus-normal.png',
  emissive: 'campus-emissive.png',
  glassMask: 'campus-glass-mask.png',
  glb: 'campus.glb',
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
        if (typeof this.onload === 'function') this.onload({ target: this });
        if (typeof this.onloadend === 'function') this.onloadend({ target: this });
      } catch (error) {
        this.error = error;
        if (typeof this.onerror === 'function') this.onerror({ target: this, error });
        if (typeof this.onloadend === 'function') this.onloadend({ target: this });
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
  if (typeof value !== 'string') return [0, 0, 0, 255];
  const hex = value.trim();
  if (!hex.startsWith('#')) return [0, 0, 0, 255];
  const normalized = hex.slice(1);
  if (normalized.length === 3) {
    return [
      parseInt(normalized[0] + normalized[0], 16),
      parseInt(normalized[1] + normalized[1], 16),
      parseInt(normalized[2] + normalized[2], 16),
      255,
    ];
  }
  if (normalized.length === 6) {
    return [
      parseInt(normalized.slice(0, 2), 16),
      parseInt(normalized.slice(2, 4), 16),
      parseInt(normalized.slice(4, 6), 16),
      255,
    ];
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
  return Buffer.concat([
    signature,
    chunk('IHDR', ihdr),
    chunk('IDAT', idat),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

function buildTexture(name, generator, { colorSpace = THREE.NoColorSpace } = {}) {
  const buffer = new Uint8ClampedArray(width * height * 4);

  for (let y = 0; y < height; y += 1) {
    const v = y / (height - 1);
    for (let x = 0; x < width; x += 1) {
      const u = x / (width - 1);
      setPixel(buffer, width, x, y, generator(u, v, x, y));
    }
  }

  const png = encodePng(width, height, buffer);
  const dataTexture = new THREE.DataTexture(buffer, width, height, THREE.RGBAFormat);
  dataTexture.name = name;
  dataTexture.needsUpdate = true;
  dataTexture.flipY = false;
  dataTexture.colorSpace = colorSpace;
  dataTexture.wrapS = THREE.RepeatWrapping;
  dataTexture.wrapT = THREE.RepeatWrapping;
  dataTexture.repeat.set(1, 1);

  return { buffer, png, dataTexture };
}

function distanceToSegment(point, a, b) {
  const abx = b[0] - a[0];
  const aby = b[1] - a[1];
  const apx = point[0] - a[0];
  const apy = point[1] - a[1];
  const abLengthSquared = abx * abx + aby * aby;
  const t = clamp((apx * abx + apy * aby) / Math.max(abLengthSquared, 1e-6), 0, 1);
  const closestX = a[0] + abx * t;
  const closestY = a[1] + aby * t;
  const dx = point[0] - closestX;
  const dy = point[1] - closestY;
  return Math.sqrt(dx * dx + dy * dy);
}

function polylineMask(u, v, points, radius) {
  let best = Infinity;
  for (let i = 0; i < points.length - 1; i += 1) {
    best = Math.min(best, distanceToSegment([u, v], points[i], points[i + 1]));
  }
  return 1 - smoothstep(radius, radius * 1.8, best);
}

function rectMask(u, v, x0, y0, x1, y1, feather = 0.01) {
  const insideX = smoothstep(x0 - feather, x0 + feather, u) * (1 - smoothstep(x1 - feather, x1 + feather, u));
  const insideY = smoothstep(y0 - feather, y0 + feather, v) * (1 - smoothstep(y1 - feather, y1 + feather, v));
  return insideX * insideY;
}

function circleMask(u, v, cx, cy, radius, feather = radius * 0.4) {
  const dx = u - cx;
  const dy = v - cy;
  const dist = Math.sqrt(dx * dx + dy * dy);
  return 1 - smoothstep(radius, radius + feather, dist);
}

function lineMask(u, v, point, normal, thickness, feather = thickness * 0.9) {
  const dist = Math.abs((u - point[0]) * normal[0] + (v - point[1]) * normal[1]);
  return 1 - smoothstep(thickness, thickness + feather, dist);
}

function campusFields(u, v) {
  const grain = fbm(u * 15.2, v * 15.2, 21, 5);
  const brushed = Math.abs(Math.sin((u * 40 + v * 6.2) * Math.PI)) * 0.28;
  const micro = fbm(u * 58, v * 58, 33, 3) * 0.18;

  const shellMass = rectMask(u, v, 0.2, 0.05, 0.58, 0.95, 0.012);
  const spineMass = rectMask(u, v, 0.33, 0.1, 0.49, 0.93, 0.009);
  const labDeckUpper = rectMask(u, v, 0.05, 0.6, 0.43, 0.7, 0.008);
  const labDeckLower = rectMask(u, v, 0.08, 0.42, 0.41, 0.5, 0.008);
  const programLoop = polylineMask(u, v, [
    [0.44, 0.27], [0.58, 0.22], [0.73, 0.22], [0.84, 0.3], [0.86, 0.42],
    [0.79, 0.52], [0.63, 0.56], [0.5, 0.49], [0.43, 0.37], [0.44, 0.27],
  ], 0.012);
  const programCheckpoints = (
    circleMask(u, v, 0.57, 0.25, 0.019, 0.014) +
    circleMask(u, v, 0.77, 0.31, 0.019, 0.014) +
    circleMask(u, v, 0.79, 0.47, 0.019, 0.014)
  );
  const networkBridge = polylineMask(u, v, [
    [0.4, 0.82], [0.57, 0.88], [0.76, 0.91], [0.93, 0.88],
  ], 0.01);
  const networkBridge2 = polylineMask(u, v, [
    [0.42, 0.74], [0.59, 0.8], [0.78, 0.82], [0.94, 0.79],
  ], 0.009);
  const conduitA = polylineMask(u, v, [
    [0.36, 0.63], [0.27, 0.58], [0.18, 0.48], [0.13, 0.36],
  ], 0.008);
  const conduitB = polylineMask(u, v, [
    [0.35, 0.44], [0.25, 0.39], [0.15, 0.28], [0.09, 0.18],
  ], 0.007);
  const conduitC = polylineMask(u, v, [
    [0.42, 0.62], [0.5, 0.56], [0.6, 0.52], [0.71, 0.48],
  ], 0.006);
  const glassPresence = clamp(
    shellMass * 0.34 +
    spineMass * 0.5 +
    labDeckUpper * 0.66 +
    labDeckLower * 0.62 +
    programLoop * 0.38 +
    networkBridge * 0.34 +
    networkBridge2 * 0.26,
    0,
    1,
  );
  const seamField = clamp(
    lineMask(u, v, [0.36, 0.5], [1, 0], 0.0022, 0.0032) * 0.9 +
    lineMask(u, v, [0.44, 0.5], [1, 0], 0.002, 0.003) * 0.75 +
    lineMask(u, v, [0.5, 0.18], [0, 1], 0.0018, 0.0026) * 0.18 +
    lineMask(u, v, [0.5, 0.82], [0, 1], 0.0018, 0.0026) * 0.15 +
    labDeckUpper * 0.18 + labDeckLower * 0.16 +
    programLoop * 0.12 +
    networkBridge * 0.14 + networkBridge2 * 0.12,
    0,
    1,
  );
  const signalRoutes = clamp(
    conduitA * 0.78 +
    conduitB * 0.72 +
    conduitC * 0.64 +
    programLoop * 0.82 +
    programCheckpoints * 0.6 +
    networkBridge * 0.76 +
    networkBridge2 * 0.58,
    0,
    1,
  );
  const cavity = clamp(
    shellMass * 0.18 +
    spineMass * 0.22 +
    labDeckUpper * 0.32 +
    labDeckLower * 0.28 +
    programLoop * 0.22 +
    networkBridge * 0.12,
    0,
    1,
  );
  const wear = smoothstep(0.02, 0.92, grain) * 0.42 + brushed + micro;

  return {
    grain,
    brushed,
    seamField,
    cavity,
    signalRoutes,
    glassPresence,
    wear,
  };
}

function buildAoTexture() {
  return buildTexture('campus-ao', (u, v) => {
    const fields = campusFields(u, v);
    const cavityShadow = clamp(fields.cavity * 0.78 + fields.seamField * 0.36 + fields.grain * 0.14, 0, 1);
    const value = clamp(0.96 - cavityShadow * 0.72, 0, 1);
    const channel = Math.round(value * 255);
    return rgba(channel, channel, channel, 255);
  });
}

function buildRoughnessTexture() {
  return buildTexture('campus-roughness', (u, v) => {
    const fields = campusFields(u, v);
    const brushedBias = smoothstep(0.0, 1.0, fields.brushed) * 0.18;
    const value = clamp(0.3 + fields.wear * 0.32 + fields.seamField * 0.08 + brushedBias, 0, 1);
    const channel = Math.round(value * 255);
    return rgba(channel, channel, channel, 255);
  });
}

function buildGlassMaskTexture() {
  return buildTexture('campus-glass-mask', (u, v) => {
    const fields = campusFields(u, v);
    const frosted = clamp(0.18 + fields.glassPresence * 0.62 + fields.grain * 0.16, 0, 1);
    const channel = Math.round(frosted * 255);
    return rgba(channel, channel, channel, 255);
  });
}

function buildEmissiveTexture() {
  return buildTexture('campus-emissive', (u, v) => {
    const fields = campusFields(u, v);
    const a = clamp(fields.signalRoutes * 1.08, 0, 1);
    const b = clamp(fields.signalRoutes * 0.76 + fields.seamField * 0.08, 0, 1);
    const c = clamp(fields.signalRoutes * 0.62 + fields.grain * 0.04, 0, 1);
    return rgba(Math.round(a * 176), Math.round(b * 236), Math.round(c * 220), 255);
  }, { colorSpace: THREE.SRGBColorSpace });
}

function buildNormalTexture() {
  const strength = 10;
  const sample = (u, v) => {
    const fields = campusFields(clamp(u, 0, 1), clamp(v, 0, 1));
    return clamp(fields.seamField * 0.82 + fields.cavity * 0.22 + fields.wear * 0.16, 0, 1);
  };

  return buildTexture('campus-normal', (u, v) => {
    const dx = sample(u + 1 / width, v) - sample(u - 1 / width, v);
    const dy = sample(u, v + 1 / height) - sample(u, v - 1 / height);
    const nx = clamp(0.5 - dx * strength, 0, 1);
    const ny = clamp(0.5 - dy * strength, 0, 1);
    return rgba(Math.round(nx * 255), Math.round(ny * 255), 255, 255);
  });
}

function ensureUv2(geometry) {
  if (geometry.attributes.uv && !geometry.attributes.uv2) {
    geometry.setAttribute('uv2', new THREE.BufferAttribute(geometry.attributes.uv.array.slice(), 2));
  }
  return geometry;
}

function prepareMesh(mesh) {
  ensureUv2(mesh.geometry);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

function createShape(points) {
  const shape = new THREE.Shape();
  shape.moveTo(points[0][0], points[0][1]);
  for (let i = 1; i < points.length; i += 1) {
    shape.lineTo(points[i][0], points[i][1]);
  }
  shape.closePath();
  return shape;
}

function extrudedMesh({
  shape,
  depth,
  material,
  name,
  bevelSize = 0.05,
  bevelThickness = 0.04,
  bevelSegments = 2,
  steps = 1,
}) {
  const geometry = ensureUv2(new THREE.ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: true,
    bevelSize,
    bevelThickness,
    bevelSegments,
    steps,
  }));
  const mesh = new THREE.Mesh(geometry, material);
  mesh.name = name;
  return prepareMesh(mesh);
}

function boxMesh(size, material, name) {
  const mesh = new THREE.Mesh(ensureUv2(new THREE.BoxGeometry(size[0], size[1], size[2])), material);
  mesh.name = name;
  return prepareMesh(mesh);
}

function cylinderMesh(radiusTop, radiusBottom, height, radialSegments, material, name) {
  const mesh = new THREE.Mesh(
    ensureUv2(new THREE.CylinderGeometry(radiusTop, radiusBottom, height, radialSegments, 1, false)),
    material,
  );
  mesh.name = name;
  return prepareMesh(mesh);
}

function beamBetween(a, b, thickness, material, name) {
  const delta = new THREE.Vector3().subVectors(b, a);
  const length = delta.length();
  const center = new THREE.Vector3().addVectors(a, b).multiplyScalar(0.5);
  const mesh = boxMesh([length, thickness, thickness], material, name);
  mesh.position.copy(center);
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(1, 0, 0), delta.normalize());
  return mesh;
}

function tubeAlong(points, radius, material, name, tubularSegments = 96, radialSegments = 10, closed = false) {
  const curve = new THREE.CatmullRomCurve3(points, closed, 'centripetal');
  const geometry = ensureUv2(new THREE.TubeGeometry(curve, tubularSegments, radius, radialSegments, closed));
  const mesh = new THREE.Mesh(geometry, material);
  mesh.name = name;
  return prepareMesh(mesh);
}

function addMesh(group, mesh, position = [0, 0, 0], rotation = [0, 0, 0]) {
  mesh.position.set(position[0], position[1], position[2]);
  mesh.rotation.set(rotation[0], rotation[1], rotation[2]);
  group.add(mesh);
  return mesh;
}

function createMaterials(textures) {
  const shellMaterial = new THREE.MeshPhysicalMaterial({
    name: 'campus-shell-material',
    color: new THREE.Color('#181c20'),
    roughness: 0.76,
    metalness: 0.52,
    clearcoat: 0.08,
    clearcoatRoughness: 0.88,
    aoMap: textures.ao.dataTexture,
    roughnessMap: textures.roughness.dataTexture,
    normalMap: textures.normal.dataTexture,
    normalScale: new THREE.Vector2(0.52, 0.52),
    emissive: new THREE.Color('#334c44'),
    emissiveMap: textures.emissive.dataTexture,
    emissiveIntensity: 0.18,
  });

  const structureMaterial = new THREE.MeshStandardMaterial({
    name: 'campus-structure-material',
    color: new THREE.Color('#242b30'),
    roughness: 0.46,
    metalness: 0.84,
    aoMap: textures.ao.dataTexture,
    roughnessMap: textures.roughness.dataTexture,
    normalMap: textures.normal.dataTexture,
    normalScale: new THREE.Vector2(0.48, 0.48),
    emissive: new THREE.Color('#16211e'),
    emissiveIntensity: 0.04,
  });

  const glassMaterial = new THREE.MeshPhysicalMaterial({
    name: 'campus-glass-material',
    color: new THREE.Color('#4b6158'),
    roughness: 0.18,
    metalness: 0.06,
    transmission: 0.58,
    thickness: 0.26,
    ior: 1.34,
    transparent: true,
    opacity: 0.8,
    aoMap: textures.ao.dataTexture,
    roughnessMap: textures.glassMask.dataTexture,
    normalMap: textures.normal.dataTexture,
    normalScale: new THREE.Vector2(0.12, 0.12),
    emissive: new THREE.Color('#243d36'),
    emissiveMap: textures.emissive.dataTexture,
    emissiveIntensity: 0.09,
  });

  const signalMaterial = new THREE.MeshStandardMaterial({
    name: 'campus-signal-material',
    color: new THREE.Color('#172321'),
    roughness: 0.24,
    metalness: 0.08,
    emissive: new THREE.Color('#87e0c3'),
    emissiveMap: textures.emissive.dataTexture,
    emissiveIntensity: 0.9,
  });

  const accentMaterial = new THREE.MeshStandardMaterial({
    name: 'campus-accent-material',
    color: new THREE.Color('#5f7a73'),
    roughness: 0.38,
    metalness: 0.34,
    aoMap: textures.ao.dataTexture,
    roughnessMap: textures.roughness.dataTexture,
    normalMap: textures.normal.dataTexture,
    normalScale: new THREE.Vector2(0.32, 0.32),
    emissive: new THREE.Color('#20342f'),
    emissiveIntensity: 0.05,
  });

  const plinthMaterial = new THREE.MeshStandardMaterial({
    name: 'campus-plinth-material',
    color: new THREE.Color('#0f1214'),
    roughness: 0.86,
    metalness: 0.24,
    aoMap: textures.ao.dataTexture,
    roughnessMap: textures.roughness.dataTexture,
    normalMap: textures.normal.dataTexture,
    normalScale: new THREE.Vector2(0.22, 0.22),
  });

  return {
    shell: shellMaterial,
    structure: structureMaterial,
    glass: glassMaterial,
    signal: signalMaterial,
    accent: accentMaterial,
    plinth: plinthMaterial,
  };
}

function createPlinth(materials) {
  const group = new THREE.Group();
  group.name = 'plinth';

  addMesh(group, boxMesh([8.8, 0.38, 5.2], materials.plinth, 'plinth-slab'), [0, -4.8, 0]);
  addMesh(group, boxMesh([7.2, 0.12, 4.1], materials.structure, 'plinth-inset'), [0.14, -4.56, -0.1]);
  addMesh(group, boxMesh([4.4, 0.1, 0.46], materials.structure, 'plinth-channel-a'), [-1.36, -4.4, 1.12], [0, 0.02, 0.02]);
  addMesh(group, boxMesh([3.1, 0.1, 0.46], materials.structure, 'plinth-channel-b'), [1.72, -4.38, -1.16], [0, -0.06, -0.03]);
  addMesh(group, boxMesh([1.2, 0.08, 0.18], materials.accent, 'plinth-marker-a'), [3.06, -4.28, 0.74], [0, 0.12, 0]);
  addMesh(group, boxMesh([1.0, 0.08, 0.18], materials.accent, 'plinth-marker-b'), [-2.96, -4.26, -0.92], [0, -0.08, 0]);

  return group;
}

function createCampusShell(materials) {
  const group = new THREE.Group();
  group.name = 'campus-shell';

  const outerShape = createShape([
    [-1.5, -3.56],
    [-1.22, 4.62],
    [-0.84, 5.76],
    [-0.1, 6.4],
    [0.52, 6.12],
    [0.94, 5.26],
    [1.18, 3.04],
    [1.0, 0.12],
    [1.16, -2.46],
    [0.76, -3.54],
    [0.02, -3.8],
    [-0.82, -3.72],
  ]);

  const cavity = createShape([
    [0.12, -0.96],
    [0.78, -0.7],
    [0.76, 3.88],
    [0.48, 5.1],
    [0.06, 5.4],
    [-0.26, 4.44],
    [-0.2, 0.26],
  ]);
  outerShape.holes.push(cavity);

  const shell = extrudedMesh({
    shape: outerShape,
    depth: 2.5,
    material: materials.shell,
    name: 'campus-shell-main',
    bevelSize: 0.09,
    bevelThickness: 0.09,
    bevelSegments: 3,
  });
  shell.geometry.center();
  shell.position.set(0.18, 0.28, 0);
  group.add(shell);

  const cutFaceShape = createShape([
    [-0.58, -2.86],
    [-0.3, 4.88],
    [0.08, 5.72],
    [0.46, 5.5],
    [0.64, 0.28],
    [0.36, -2.98],
  ]);
  const cutFace = extrudedMesh({
    shape: cutFaceShape,
    depth: 0.18,
    material: materials.structure,
    name: 'campus-shell-cut-face',
    bevelSize: 0.03,
    bevelThickness: 0.03,
  });
  cutFace.geometry.center();
  cutFace.position.set(-0.18, 0.46, 1.16);
  group.add(cutFace);

  addMesh(group, boxMesh([1.48, 0.2, 0.22], materials.structure, 'campus-shell-access-a'), [-0.36, -2.98, 1.0], [0, 0.03, -0.06]);
  addMesh(group, boxMesh([1.18, 0.16, 0.22], materials.structure, 'campus-shell-access-b'), [-0.24, -0.82, 1.02], [0, -0.04, 0.06]);
  addMesh(group, boxMesh([1.04, 0.14, 0.2], materials.structure, 'campus-shell-access-c'), [-0.06, 1.38, 1.04], [0, 0.06, -0.04]);
  addMesh(group, boxMesh([0.92, 0.12, 0.18], materials.accent, 'campus-shell-seam-plate'), [0.08, 4.52, 1.04], [0.04, -0.08, 0.04]);
  addMesh(group, boxMesh([0.88, 0.12, 0.18], materials.accent, 'campus-shell-roof-marker'), [0.2, 5.72, 0.98], [0.04, 0.08, 0.04]);

  return group;
}

function createServiceSpine(materials) {
  const group = new THREE.Group();
  group.name = 'service-spine';

  const spineShape = createShape([
    [-0.48, -3.74],
    [-0.32, 4.88],
    [-0.08, 6.12],
    [0.2, 6.48],
    [0.48, 5.98],
    [0.58, 4.2],
    [0.62, -2.78],
    [0.36, -3.6],
    [-0.08, -3.8],
    [-0.42, -3.74],
  ]);
  const spine = extrudedMesh({
    shape: spineShape,
    depth: 0.88,
    material: materials.structure,
    name: 'service-spine-core',
    bevelSize: 0.04,
    bevelThickness: 0.04,
    bevelSegments: 3,
  });
  spine.geometry.center();
  spine.position.set(0.06, 0.38, -0.12);
  group.add(spine);

  const spineCap = boxMesh([0.92, 0.16, 0.34], materials.accent, 'service-spine-cap');
  addMesh(group, spineCap, [0.12, 5.98, 0.1], [0.02, 0.02, 0.02]);

  const ribs = [
    [-0.18, -2.8, -0.32, 0.72, 4.72, -0.32],
    [-0.28, -1.02, -0.26, 0.66, 2.6, -0.16],
    [-0.3, 0.92, -0.2, 0.68, 4.14, -0.08],
    [-0.24, 3.12, -0.14, 0.72, 5.32, 0.02],
  ];
  ribs.forEach((coords, index) => {
    group.add(beamBetween(
      new THREE.Vector3(coords[0], coords[1], coords[2]),
      new THREE.Vector3(coords[3], coords[4], coords[5]),
      0.08 - index * 0.01,
      materials.structure,
      `service-spine-rib-${index}`,
    ));
  });

  addMesh(group, boxMesh([0.72, 0.18, 0.2], materials.structure, 'service-spine-panel-a'), [-0.16, -2.72, 0.72], [0, 0.04, -0.05]);
  addMesh(group, boxMesh([0.62, 0.16, 0.18], materials.structure, 'service-spine-panel-b'), [-0.1, -0.38, 0.76], [0, -0.02, 0.06]);
  addMesh(group, boxMesh([0.56, 0.16, 0.18], materials.structure, 'service-spine-panel-c'), [0.0, 1.42, 0.78], [0, 0.06, -0.04]);
  addMesh(group, boxMesh([0.54, 0.16, 0.18], materials.accent, 'service-spine-panel-d'), [0.08, 4.48, 0.8], [0.02, 0.02, 0.04]);

  const serviceTrunks = [
    [new THREE.Vector3(-0.02, 4.56, 0.58), new THREE.Vector3(-0.62, 3.72, 0.36)],
    [new THREE.Vector3(0.0, 2.02, 0.58), new THREE.Vector3(-0.56, 1.26, 0.34)],
    [new THREE.Vector3(0.08, -0.24, 0.56), new THREE.Vector3(-0.52, -0.98, 0.3)],
  ];
  serviceTrunks.forEach((pair, index) => {
    group.add(beamBetween(pair[0], pair[1], 0.06, materials.structure, `service-spine-trunk-${index}`));
  });

  return group;
}

function createLabDecks(materials) {
  const group = new THREE.Group();
  group.name = 'lab-decks';

  const decks = [
    {
      name: 'upper',
      pos: new THREE.Vector3(-1.54, 2.88, 0.82),
      angle: 0.12,
      width: 2.22,
    },
    {
      name: 'lower',
      pos: new THREE.Vector3(-1.22, 0.56, 0.7),
      angle: 0.04,
      width: 2.0,
    },
  ];

  decks.forEach((deck, index) => {
    const deckGroup = new THREE.Group();
    deckGroup.name = `lab-deck-${deck.name}`;

    const plateShape = createShape([
      [-deck.width / 2, -0.22],
      [deck.width / 2 - 0.26, -0.28],
      [deck.width / 2, 0.0],
      [deck.width / 2 - 0.18, 0.24],
      [-deck.width / 2 + 0.14, 0.28],
      [-deck.width / 2, 0.06],
    ]);
    const plate = extrudedMesh({
      shape: plateShape,
      depth: 0.26,
      material: materials.structure,
      name: `lab-deck-plate-${deck.name}`,
      bevelSize: 0.03,
      bevelThickness: 0.03,
    });
    plate.geometry.center();
    addMesh(deckGroup, plate, [0, 0, 0], [0, deck.angle, 0]);

    const housingShape = createShape([
      [-0.56, -0.26],
      [0.36, -0.3],
      [0.62, 0.02],
      [0.48, 0.38],
      [-0.42, 0.42],
      [-0.64, 0.12],
    ]);
    const housing = extrudedMesh({
      shape: housingShape,
      depth: 0.82,
      material: materials.shell,
      name: `lab-housing-${deck.name}`,
      bevelSize: 0.04,
      bevelThickness: 0.04,
    });
    housing.geometry.center();
    addMesh(deckGroup, housing, [0.22, 0.42, 0.02], [0.06, deck.angle * 0.7, -0.08]);

    addMesh(deckGroup, boxMesh([0.84, 0.18, 0.18], materials.structure, `lab-service-rail-${deck.name}`), [0.56, 0.08, 0.38], [0, deck.angle, 0.05]);
    addMesh(deckGroup, boxMesh([0.56, 0.16, 0.14], materials.structure, `lab-equipment-bay-${deck.name}`), [-0.22, 0.22, 0.3], [0, deck.angle * 0.6, -0.12]);
    addMesh(deckGroup, boxMesh([0.34, 0.48, 0.18], materials.structure, `lab-access-tower-${deck.name}`), [0.8, 0.42, 0.18], [0, 0, 0.04]);
    addMesh(deckGroup, boxMesh([0.3, 0.18, 0.16], materials.accent, `lab-checkpoint-${deck.name}`), [0.14, -0.02, -0.08], [0.02, 0.06, 0]);
    addMesh(deckGroup, boxMesh([0.52, 0.12, 0.12], materials.accent, `lab-prep-bay-${deck.name}`), [-0.44, 0.14, 0.28], [0, deck.angle * 0.2, 0.02]);

    const supportA = beamBetween(new THREE.Vector3(-0.6, -0.18, -0.24), new THREE.Vector3(0.82, -0.7, -0.62), 0.08, materials.structure, `lab-support-a-${deck.name}`);
    const supportB = beamBetween(new THREE.Vector3(-0.24, 0.1, -0.3), new THREE.Vector3(0.72, -0.62, -0.82), 0.06, materials.structure, `lab-support-b-${deck.name}`);
    deckGroup.add(supportA);
    deckGroup.add(supportB);

    deckGroup.position.copy(deck.pos);
    group.add(deckGroup);

    if (index === 0) {
      group.add(beamBetween(
        new THREE.Vector3(deck.pos.x + 0.68, deck.pos.y + 0.1, deck.pos.z - 0.36),
        new THREE.Vector3(-0.18, 1.46, 0.64),
        0.08,
        materials.structure,
        'lab-spine-link-upper',
      ));
    } else {
      group.add(beamBetween(
        new THREE.Vector3(deck.pos.x + 0.6, deck.pos.y + 0.08, deck.pos.z - 0.34),
        new THREE.Vector3(-0.14, -0.12, 0.58),
        0.07,
        materials.structure,
        'lab-spine-link-lower',
      ));
    }
  });

  return group;
}

function createProgramLoop(materials) {
  const group = new THREE.Group();
  group.name = 'program-loop';

  const routePoints = [
    new THREE.Vector3(0.28, -1.5, 0.82),
    new THREE.Vector3(1.06, -1.82, 1.0),
    new THREE.Vector3(2.02, -1.96, 0.92),
    new THREE.Vector3(2.8, -1.68, 0.52),
    new THREE.Vector3(2.94, -0.92, 0.12),
    new THREE.Vector3(2.72, -0.22, -0.1),
    new THREE.Vector3(2.0, 0.22, -0.08),
    new THREE.Vector3(1.12, 0.18, 0.18),
    new THREE.Vector3(0.56, -0.12, 0.44),
    new THREE.Vector3(0.28, -0.78, 0.64),
  ];
  group.add(tubeAlong(routePoints, 0.12, materials.structure, 'program-track', 152, 14, true));
  group.add(tubeAlong(routePoints, 0.05, materials.signal, 'program-signal-track', 152, 10, true));

  const checkpoints = [
    [0.88, -1.92, 0.98],
    [1.98, -1.94, 0.9],
    [2.78, -1.42, 0.42],
    [2.86, -0.6, -0.02],
  ];
  checkpoints.forEach((position, index) => {
    const gate = new THREE.Group();
    gate.name = `program-checkpoint-${index}`;
    addMesh(gate, boxMesh([0.16, 0.86, 0.16], materials.structure, `program-checkpoint-${index}-left`), [-0.18, 0, 0]);
    addMesh(gate, boxMesh([0.16, 0.86, 0.16], materials.structure, `program-checkpoint-${index}-right`), [0.18, 0, 0]);
    addMesh(gate, boxMesh([0.56, 0.12, 0.16], materials.accent, `program-checkpoint-${index}-header`), [0, 0.36, 0]);
    gate.position.set(position[0], position[1], position[2]);
    gate.rotation.y = 0.18 - index * 0.12;
    group.add(gate);
  });

  const prepZones = [
    { name: 'prep-bay-a', position: [0.62, -1.72, 0.44], rotation: [0, 0.18, 0] },
    { name: 'prep-bay-b', position: [1.72, -2.0, 0.34], rotation: [0, -0.08, 0] },
    { name: 'prep-bay-c', position: [2.52, -1.16, 0.02], rotation: [0, 0.12, 0] },
  ];
  prepZones.forEach((zone) => {
    const bay = new THREE.Group();
    bay.name = zone.name;
    addMesh(bay, boxMesh([0.76, 0.18, 0.26], materials.shell, `${zone.name}-bench`), [0, 0.08, 0]);
    addMesh(bay, boxMesh([0.28, 0.52, 0.18], materials.structure, `${zone.name}-column`), [0.34, 0.26, 0]);
    addMesh(bay, boxMesh([0.18, 0.24, 0.12], materials.accent, `${zone.name}-marker`), [-0.26, 0.14, 0.04]);
    bay.position.set(zone.position[0], zone.position[1], zone.position[2]);
    bay.rotation.set(zone.rotation[0], zone.rotation[1], zone.rotation[2]);
    group.add(bay);
  });

  group.add(beamBetween(
    new THREE.Vector3(0.44, -1.54, 0.48),
    new THREE.Vector3(1.28, -1.88, 0.18),
    0.08,
    materials.structure,
    'program-support-a',
  ));
  group.add(beamBetween(
    new THREE.Vector3(1.58, -1.76, 0.42),
    new THREE.Vector3(2.54, -1.16, 0.08),
    0.06,
    materials.structure,
    'program-support-b',
  ));
  group.add(beamBetween(
    new THREE.Vector3(2.4, -0.9, 0.08),
    new THREE.Vector3(1.9, -0.18, -0.1),
    0.06,
    materials.structure,
    'program-support-c',
  ));

  return group;
}

function createNetworkBridges(materials) {
  const group = new THREE.Group();
  group.name = 'network-bridges';

  const bridgeA = [
    new THREE.Vector3(0.16, 4.34, 0.44),
    new THREE.Vector3(0.86, 4.98, 0.66),
    new THREE.Vector3(1.8, 5.48, 0.54),
    new THREE.Vector3(2.84, 5.3, 0.16),
  ];
  const bridgeB = [
    new THREE.Vector3(0.0, 4.84, -0.2),
    new THREE.Vector3(0.78, 5.44, -0.08),
    new THREE.Vector3(1.82, 5.8, -0.02),
    new THREE.Vector3(2.7, 5.5, -0.16),
  ];
  group.add(tubeAlong(bridgeA, 0.08, materials.structure, 'network-bridge-primary', 96, 12));
  group.add(tubeAlong(bridgeB, 0.06, materials.structure, 'network-bridge-secondary', 96, 10));
  group.add(tubeAlong(bridgeA, 0.028, materials.signal, 'network-signal-primary', 96, 8));

  const nodeSupports = [
    [new THREE.Vector3(0.86, 4.98, 0.66), new THREE.Vector3(0.52, 4.14, 0.16)],
    [new THREE.Vector3(1.8, 5.48, 0.54), new THREE.Vector3(1.26, 4.38, 0.04)],
    [new THREE.Vector3(2.84, 5.3, 0.16), new THREE.Vector3(2.14, 4.28, -0.28)],
  ];
  nodeSupports.forEach((pair, index) => {
    group.add(beamBetween(pair[0], pair[1], 0.05, materials.structure, `network-support-${index}`));
  });

  const nodePositions = [
    [0.88, 5.0, 0.68],
    [1.8, 5.5, 0.54],
    [2.84, 5.3, 0.16],
    [2.6, 5.56, -0.16],
  ];
  nodePositions.forEach((position, index) => {
    addMesh(group, cylinderMesh(0.14, 0.18, 0.22, 8, materials.accent, `network-node-${index}`), position, [Math.PI / 2, 0, index * 0.16]);
  });

  const crownPlateShape = createShape([
    [-0.9, -0.18],
    [0.92, -0.22],
    [1.12, 0.0],
    [0.88, 0.2],
    [-0.82, 0.24],
    [-1.0, 0.02],
  ]);
  const crownPlate = extrudedMesh({
    shape: crownPlateShape,
    depth: 0.22,
    material: materials.shell,
    name: 'network-crown-plate',
    bevelSize: 0.025,
    bevelThickness: 0.025,
  });
  crownPlate.geometry.center();
  addMesh(group, crownPlate, [0.96, 4.38, 0.02], [0.04, 0.16, -0.06]);

  const crossBraces = [
    [new THREE.Vector3(0.4, 4.7, 0.42), new THREE.Vector3(1.24, 5.2, -0.02)],
    [new THREE.Vector3(1.04, 4.98, 0.38), new THREE.Vector3(2.02, 5.34, -0.02)],
    [new THREE.Vector3(1.84, 5.1, 0.26), new THREE.Vector3(2.72, 5.34, -0.12)],
  ];
  crossBraces.forEach((pair, index) => {
    group.add(beamBetween(pair[0], pair[1], 0.042, materials.structure, `network-cross-brace-${index}`));
  });

  addMesh(group, boxMesh([0.56, 0.14, 0.16], materials.accent, 'network-crown-marker'), [2.34, 5.58, -0.04], [0.02, 0.1, 0.04]);

  return group;
}

function createConduits(materials) {
  const group = new THREE.Group();
  group.name = 'conduits';

  const conduits = [
    {
      name: 'conduit-lab-upper',
      points: [
        new THREE.Vector3(-0.12, 3.84, -0.26),
        new THREE.Vector3(-0.68, 3.62, -0.08),
        new THREE.Vector3(-1.34, 3.18, 0.34),
        new THREE.Vector3(-1.82, 2.94, 0.74),
      ],
      radius: 0.08,
    },
    {
      name: 'conduit-lab-lower',
      points: [
        new THREE.Vector3(0.0, 2.18, -0.22),
        new THREE.Vector3(-0.5, 1.96, -0.04),
        new THREE.Vector3(-1.1, 1.72, 0.26),
        new THREE.Vector3(-1.6, 1.48, 0.66),
      ],
      radius: 0.075,
    },
    {
      name: 'conduit-program',
      points: [
        new THREE.Vector3(0.3, -0.28, -0.08),
        new THREE.Vector3(0.84, -0.42, 0.14),
        new THREE.Vector3(1.42, -0.66, 0.4),
        new THREE.Vector3(2.14, -0.88, 0.54),
      ],
      radius: 0.07,
    },
    {
      name: 'conduit-network',
      points: [
        new THREE.Vector3(0.12, 4.08, -0.32),
        new THREE.Vector3(0.7, 4.52, -0.18),
        new THREE.Vector3(1.42, 4.96, -0.06),
        new THREE.Vector3(2.22, 5.22, -0.02),
      ],
      radius: 0.065,
    },
  ];

  conduits.forEach((conduit) => {
    group.add(tubeAlong(conduit.points, conduit.radius, materials.structure, conduit.name, 72, 10));
  });

  addMesh(group, boxMesh([0.84, 0.1, 0.18], materials.accent, 'cable-tray-a'), [-0.58, 3.96, 0.26], [0.02, 0.18, 0.02]);
  addMesh(group, boxMesh([0.72, 0.1, 0.18], materials.accent, 'cable-tray-b'), [-0.52, 2.08, 0.2], [0.02, -0.12, 0.02]);
  addMesh(group, boxMesh([0.66, 0.1, 0.18], materials.accent, 'maintenance-rib-a'), [1.04, -0.48, 0.46], [0.04, 0.02, 0.03]);
  addMesh(group, boxMesh([0.66, 0.1, 0.18], materials.accent, 'maintenance-rib-b'), [1.94, 5.06, 0.12], [0.04, 0.08, -0.02]);

  return group;
}

function createGlassVolumes(materials) {
  const group = new THREE.Group();
  group.name = 'glass-volumes';

  addMesh(group, boxMesh([0.96, 0.56, 0.72], materials.glass, 'glass-lab-upper'), [-1.12, 3.34, 0.94], [0, 0.12, 0]);
  addMesh(group, boxMesh([0.86, 0.54, 0.68], materials.glass, 'glass-lab-lower'), [-0.9, 1.98, 0.84], [0, 0.1, 0]);
  addMesh(group, boxMesh([0.8, 0.5, 0.62], materials.glass, 'glass-lab-support'), [-0.76, 0.64, 0.74], [0, 0.08, 0]);
  addMesh(group, boxMesh([1.38, 0.34, 0.52], materials.glass, 'glass-program-core'), [1.52, -1.46, 0.26], [0.04, -0.12, 0.06]);
  addMesh(group, boxMesh([1.18, 0.22, 0.42], materials.glass, 'glass-network-bridge'), [1.3, 4.84, 0.18], [0.08, 0.18, -0.04]);

  return group;
}

function createSignalPaths(materials) {
  const group = new THREE.Group();
  group.name = 'signal-paths';

  const routes = [
    {
      name: 'signal-lab-primary',
      points: [
        new THREE.Vector3(-0.02, 3.56, 0.58),
        new THREE.Vector3(-0.82, 3.38, 0.74),
        new THREE.Vector3(-1.54, 3.08, 0.92),
      ],
    },
    {
      name: 'signal-lab-secondary',
      points: [
        new THREE.Vector3(0.04, 2.06, 0.46),
        new THREE.Vector3(-0.62, 1.84, 0.62),
        new THREE.Vector3(-1.26, 1.56, 0.78),
      ],
    },
    {
      name: 'signal-program',
      points: [
        new THREE.Vector3(0.44, -1.5, 0.86),
        new THREE.Vector3(1.34, -1.9, 0.84),
        new THREE.Vector3(2.34, -1.64, 0.44),
        new THREE.Vector3(2.78, -0.9, 0.08),
        new THREE.Vector3(2.58, -0.16, -0.04),
      ],
    },
    {
      name: 'signal-network',
      points: [
        new THREE.Vector3(0.18, 4.34, 0.32),
        new THREE.Vector3(1.08, 4.98, 0.46),
        new THREE.Vector3(2.16, 5.34, 0.24),
        new THREE.Vector3(2.86, 5.28, 0.08),
      ],
    },
  ];

  routes.forEach((route) => {
    group.add(tubeAlong(route.points, 0.028, materials.signal, route.name, 96, 8));
  });

  const nodes = [
    [-1.48, 3.08, 0.92],
    [-1.22, 1.58, 0.76],
    [1.32, -1.9, 0.84],
    [2.58, -0.16, -0.04],
    [2.16, 5.34, 0.24],
    [2.86, 5.28, 0.08],
  ];
  nodes.forEach((position, index) => {
    addMesh(group, cylinderMesh(0.07, 0.09, 0.16, 8, materials.signal, `signal-node-${index}`), position, [Math.PI / 2, 0, 0]);
  });

  return group;
}

function createCampusScene(textures) {
  const materials = createMaterials(textures);
  const scene = new THREE.Scene();
  scene.name = 'campus-scene';

  const assetRoot = new THREE.Group();
  assetRoot.name = 'campus-asset';

  assetRoot.add(createPlinth(materials));
  assetRoot.add(createCampusShell(materials));
  assetRoot.add(createServiceSpine(materials));
  assetRoot.add(createLabDecks(materials));
  assetRoot.add(createProgramLoop(materials));
  assetRoot.add(createNetworkBridges(materials));
  assetRoot.add(createConduits(materials));
  assetRoot.add(createGlassVolumes(materials));
  assetRoot.add(createSignalPaths(materials));

  assetRoot.position.set(0, 0.08, 0);
  scene.add(assetRoot);
  scene.updateMatrixWorld(true);
  return scene;
}

async function writeTextureAsset(outputPath, pngBuffer) {
  await writeFile(outputPath, pngBuffer);
}

async function main() {
  await mkdir(outDir, { recursive: true });

  const ao = buildAoTexture();
  const roughness = buildRoughnessTexture();
  const normal = buildNormalTexture();
  const emissive = buildEmissiveTexture();
  const glassMask = buildGlassMaskTexture();

  await Promise.all([
    writeTextureAsset(path.join(outDir, signatures.ao), ao.png),
    writeTextureAsset(path.join(outDir, signatures.roughness), roughness.png),
    writeTextureAsset(path.join(outDir, signatures.normal), normal.png),
    writeTextureAsset(path.join(outDir, signatures.emissive), emissive.png),
    writeTextureAsset(path.join(outDir, signatures.glassMask), glassMask.png),
  ]);

  const scene = createCampusScene({
    ao,
    roughness,
    normal,
    emissive,
    glassMask,
  });

  const exporter = new GLTFExporter();
  const arrayBuffer = await exporter.parseAsync(scene, {
    binary: true,
    trs: false,
    onlyVisible: true,
    maxTextureSize: 2048,
    animations: [],
    forcePowerOfTwoTextures: false,
  });

  await writeFile(path.join(outDir, signatures.glb), Buffer.from(arrayBuffer));

  const manifest = {
    asset: 'campus',
    generatedAt: new Date().toISOString(),
    generator: path.relative(projectRoot, __filename),
    outputs: {
      glb: signatures.glb,
      textures: [
        signatures.ao,
        signatures.roughness,
        signatures.normal,
        signatures.emissive,
        signatures.glassMask,
      ],
    },
    rootObject: 'campus-asset',
    subassemblies: [
      'campus-shell',
      'service-spine',
      'lab-decks',
      'program-loop',
      'network-bridges',
      'conduits',
      'glass-volumes',
      'signal-paths',
      'plinth',
    ],
    materials: [
      'campus-shell-material',
      'campus-structure-material',
      'campus-glass-material',
      'campus-signal-material',
      'campus-accent-material',
      'campus-plinth-material',
    ],
    notes: 'Run `node scripts/build-campus.mjs` from the repo root to regenerate.',
  };

  await writeFile(path.join(outDir, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);

  console.log([
    `Wrote ${path.join('public/assets/3d/campus', signatures.glb)}`,
    `Wrote ${path.join('public/assets/3d/campus', signatures.ao)}`,
    `Wrote ${path.join('public/assets/3d/campus', signatures.roughness)}`,
    `Wrote ${path.join('public/assets/3d/campus', signatures.normal)}`,
    `Wrote ${path.join('public/assets/3d/campus', signatures.emissive)}`,
    `Wrote ${path.join('public/assets/3d/campus', signatures.glassMask)}`,
    `Wrote ${path.join('public/assets/3d/campus', 'manifest.json')}`,
  ].join('\n'));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
