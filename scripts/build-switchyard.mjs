#!/usr/bin/env node

/**
 * Build the Research Operations Switchyard asset pack.
 *
 * Outputs:
 * - public/assets/3d/switchyard/switchyard.glb
 * - public/assets/3d/switchyard/switchyard-ao.png
 * - public/assets/3d/switchyard/switchyard-roughness.png
 * - public/assets/3d/switchyard/switchyard-normal.png
 * - public/assets/3d/switchyard/switchyard-emissive.png
 * - public/assets/3d/switchyard/switchyard-glass-mask.png
 * - public/assets/3d/switchyard/manifest.json
 *
 * Run with:
 *   node scripts/build-switchyard.mjs
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
const outDir = path.join(projectRoot, 'public/assets/3d/switchyard');

const width = 1024;
const height = 1024;

const signatures = {
  ao: 'switchyard-ao.png',
  roughness: 'switchyard-roughness.png',
  normal: 'switchyard-normal.png',
  emissive: 'switchyard-emissive.png',
  glassMask: 'switchyard-glass-mask.png',
  glb: 'switchyard.glb',
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
  if (hex.startsWith('#')) {
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

function switchyardFields(u, v) {
  const grain = fbm(u * 14.2, v * 14.2, 7, 5);
  const brushed = Math.abs(Math.sin((u * 46 + v * 5.8) * Math.PI)) * 0.35;
  const micro = fbm(u * 58, v * 58, 19, 3) * 0.2;

  const spineMass = rectMask(u, v, 0.18, 0.08, 0.44, 0.95, 0.012);
  const spineSeamA = lineMask(u, v, [0.255, 0.5], [1, 0], 0.0025, 0.0035);
  const spineSeamB = lineMask(u, v, [0.338, 0.5], [1, 0], 0.0028, 0.0038);

  const labDeckA = rectMask(u, v, 0.06, 0.62, 0.43, 0.69, 0.008);
  const labDeckB = rectMask(u, v, 0.08, 0.49, 0.41, 0.56, 0.008);
  const labDeckC = rectMask(u, v, 0.1, 0.36, 0.39, 0.43, 0.008);
  const labHousingA = rectMask(u, v, 0.11, 0.66, 0.3, 0.78, 0.008);
  const labHousingB = rectMask(u, v, 0.13, 0.53, 0.31, 0.63, 0.008);
  const labHousingC = rectMask(u, v, 0.15, 0.39, 0.31, 0.49, 0.008);

  const programPath = polylineMask(u, v, [
    [0.42, 0.34], [0.55, 0.28], [0.68, 0.24], [0.78, 0.28], [0.8, 0.18], [0.67, 0.11], [0.48, 0.14], [0.4, 0.24], [0.42, 0.34],
  ], 0.012);
  const programBench = rectMask(u, v, 0.46, 0.13, 0.78, 0.22, 0.01);
  const programGateA = circleMask(u, v, 0.56, 0.27, 0.018, 0.014);
  const programGateB = circleMask(u, v, 0.72, 0.25, 0.018, 0.014);
  const programGateC = circleMask(u, v, 0.73, 0.16, 0.018, 0.014);

  const networkBridge = polylineMask(u, v, [
    [0.38, 0.78], [0.52, 0.86], [0.7, 0.91], [0.9, 0.89],
  ], 0.009);
  const networkBridge2 = polylineMask(u, v, [
    [0.42, 0.72], [0.56, 0.8], [0.76, 0.82], [0.92, 0.78],
  ], 0.008);
  const crownNodeA = circleMask(u, v, 0.7, 0.92, 0.02, 0.015);
  const crownNodeB = circleMask(u, v, 0.84, 0.89, 0.02, 0.015);
  const crownNodeC = circleMask(u, v, 0.92, 0.78, 0.018, 0.014);

  const conduitA = polylineMask(u, v, [
    [0.37, 0.63], [0.48, 0.62], [0.58, 0.66], [0.67, 0.76], [0.76, 0.84],
  ], 0.007);
  const conduitB = polylineMask(u, v, [
    [0.35, 0.42], [0.49, 0.36], [0.58, 0.28], [0.63, 0.2],
  ], 0.007);
  const conduitC = polylineMask(u, v, [
    [0.31, 0.82], [0.47, 0.84], [0.66, 0.88],
  ], 0.007);

  const technicalGrid = (
    lineMask(u, v, [0.12, 0.5], [1, 0], 0.0016, 0.0024) * 0.4 +
    lineMask(u, v, [0.52, 0.5], [1, 0], 0.0016, 0.0024) * 0.2 +
    lineMask(u, v, [0.5, 0.18], [0, 1], 0.0016, 0.0024) * 0.18 +
    lineMask(u, v, [0.5, 0.82], [0, 1], 0.0016, 0.0024) * 0.16
  );

  const panelSeams = clamp(
    spineSeamA * 0.9 + spineSeamB * 0.75 +
    labDeckA * 0.12 + labDeckB * 0.12 + labDeckC * 0.12 +
    labHousingA * 0.18 + labHousingB * 0.18 + labHousingC * 0.18 +
    programBench * 0.14 + technicalGrid,
    0,
    1,
  );

  const signalRoutes = clamp(
    conduitA * 0.9 + conduitB * 0.86 + conduitC * 0.82 +
    programPath * 0.95 + networkBridge * 0.78 + networkBridge2 * 0.7 +
    programGateA * 1.2 + programGateB * 1.15 + programGateC * 1.1 +
    crownNodeA * 1.1 + crownNodeB * 1.05 + crownNodeC,
    0,
    1,
  );

  const cavity = clamp(
    spineMass * 0.35 +
    labHousingA * 0.65 + labHousingB * 0.6 + labHousingC * 0.56 +
    programBench * 0.58 +
    networkBridge * 0.26 + networkBridge2 * 0.22 +
    crownNodeA * 0.55 + crownNodeB * 0.52,
    0,
    1,
  );

  const wear = smoothstep(0.02, 0.9, grain) * 0.4 + brushed + micro;

  return {
    grain,
    brushed,
    panelSeams,
    cavity,
    signalRoutes,
    glassPresence: clamp(cavity * 0.72 + signalRoutes * 0.1, 0, 1),
    wear,
  };
}

function buildAoTexture() {
  return buildTexture('switchyard-ao', (u, v) => {
    const fields = switchyardFields(u, v);
    const cavityShadow = clamp(fields.cavity * 0.72 + fields.panelSeams * 0.42 + fields.grain * 0.16, 0, 1);
    const value = clamp(0.95 - cavityShadow * 0.7, 0, 1);
    const channel = Math.round(value * 255);
    return rgba(channel, channel, channel, 255);
  });
}

function buildRoughnessTexture() {
  return buildTexture('switchyard-roughness', (u, v) => {
    const fields = switchyardFields(u, v);
    const brushedBias = smoothstep(0.0, 1.0, fields.brushed) * 0.18;
    const value = clamp(0.34 + fields.wear * 0.34 + fields.panelSeams * 0.08 + brushedBias, 0, 1);
    const channel = Math.round(value * 255);
    return rgba(channel, channel, channel, 255);
  });
}

function buildGlassMaskTexture() {
  return buildTexture('switchyard-glass-mask', (u, v) => {
    const fields = switchyardFields(u, v);
    const frosted = clamp(0.22 + fields.glassPresence * 0.58 + fields.grain * 0.18, 0, 1);
    const channel = Math.round(frosted * 255);
    return rgba(channel, channel, channel, 255);
  });
}

function buildEmissiveTexture() {
  return buildTexture('switchyard-emissive', (u, v) => {
    const fields = switchyardFields(u, v);
    const a = clamp(fields.signalRoutes * 1.1, 0, 1);
    const b = clamp(fields.signalRoutes * 0.78 + fields.panelSeams * 0.06, 0, 1);
    const c = clamp(fields.signalRoutes * 0.58 + fields.grain * 0.04, 0, 1);
    return rgba(Math.round(a * 186), Math.round(b * 235), Math.round(c * 215), 255);
  }, { colorSpace: THREE.SRGBColorSpace });
}

function buildNormalTexture() {
  const strength = 10;
  const sample = (u, v) => {
    const fields = switchyardFields(clamp(u, 0, 1), clamp(v, 0, 1));
    return clamp(fields.panelSeams * 0.85 + fields.cavity * 0.28 + fields.wear * 0.16, 0, 1);
  };

  return buildTexture('switchyard-normal', (u, v) => {
    const dx = sample(u + 1 / width, v) - sample(u - 1 / width, v);
    const dy = sample(u, v + 1 / height) - sample(u, v - 1 / height);
    const nx = clamp(0.5 - dx * strength, 0, 1);
    const ny = clamp(0.5 - dy * strength, 0, 1);
    const nz = 1.0;
    return rgba(Math.round(nx * 255), Math.round(ny * 255), Math.round(nz * 255), 255);
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

function roundedRectShape(width, height, radius) {
  const x = -width / 2;
  const y = -height / 2;
  const shape = new THREE.Shape();
  shape.moveTo(x + radius, y);
  shape.lineTo(x + width - radius, y);
  shape.quadraticCurveTo(x + width, y, x + width, y + radius);
  shape.lineTo(x + width, y + height - radius);
  shape.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  shape.lineTo(x + radius, y + height);
  shape.quadraticCurveTo(x, y + height, x, y + height - radius);
  shape.lineTo(x, y + radius);
  shape.quadraticCurveTo(x, y, x + radius, y);
  return shape;
}

function extrudedMesh({
  shape,
  depth,
  material,
  name,
  bevelSize = 0.06,
  bevelThickness = 0.05,
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

function tubeAlong(points, radius, material, name, tubularSegments = 96, radialSegments = 10) {
  const curve = new THREE.CatmullRomCurve3(points, false, 'centripetal');
  const geometry = ensureUv2(new THREE.TubeGeometry(curve, tubularSegments, radius, radialSegments, false));
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
    name: 'switchyard-shell-material',
    color: new THREE.Color('#191d21'),
    roughness: 0.78,
    metalness: 0.52,
    clearcoat: 0.06,
    clearcoatRoughness: 0.88,
    aoMap: textures.ao.dataTexture,
    roughnessMap: textures.roughness.dataTexture,
    normalMap: textures.normal.dataTexture,
    normalScale: new THREE.Vector2(0.55, 0.55),
    emissive: new THREE.Color('#355a4f'),
    emissiveMap: textures.emissive.dataTexture,
    emissiveIntensity: 0.18,
  });

  const structureMaterial = new THREE.MeshStandardMaterial({
    name: 'switchyard-structure-material',
    color: new THREE.Color('#252b30'),
    roughness: 0.46,
    metalness: 0.84,
    aoMap: textures.ao.dataTexture,
    roughnessMap: textures.roughness.dataTexture,
    normalMap: textures.normal.dataTexture,
    normalScale: new THREE.Vector2(0.48, 0.48),
    emissive: new THREE.Color('#172320'),
    emissiveIntensity: 0.05,
  });

  const glassMaterial = new THREE.MeshPhysicalMaterial({
    name: 'switchyard-glass-material',
    color: new THREE.Color('#4c655e'),
    roughness: 0.18,
    metalness: 0.06,
    transmission: 0.55,
    thickness: 0.22,
    ior: 1.35,
    transparent: true,
    opacity: 0.82,
    aoMap: textures.ao.dataTexture,
    roughnessMap: textures.glassMask.dataTexture,
    normalMap: textures.normal.dataTexture,
    normalScale: new THREE.Vector2(0.12, 0.12),
    emissive: new THREE.Color('#274239'),
    emissiveMap: textures.emissive.dataTexture,
    emissiveIntensity: 0.09,
  });

  const signalMaterial = new THREE.MeshStandardMaterial({
    name: 'switchyard-signal-material',
    color: new THREE.Color('#1a2523'),
    roughness: 0.24,
    metalness: 0.08,
    emissive: new THREE.Color('#88dbc2'),
    emissiveMap: textures.emissive.dataTexture,
    emissiveIntensity: 0.88,
  });

  const accentMaterial = new THREE.MeshStandardMaterial({
    name: 'switchyard-accent-material',
    color: new THREE.Color('#617a74'),
    roughness: 0.38,
    metalness: 0.32,
    aoMap: textures.ao.dataTexture,
    roughnessMap: textures.roughness.dataTexture,
    normalMap: textures.normal.dataTexture,
    normalScale: new THREE.Vector2(0.32, 0.32),
    emissive: new THREE.Color('#20352f'),
    emissiveIntensity: 0.04,
  });

  const plinthMaterial = new THREE.MeshStandardMaterial({
    name: 'switchyard-plinth-material',
    color: new THREE.Color('#101214'),
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

  addMesh(group, boxMesh([7.8, 0.34, 4.6], materials.plinth, 'plinth-slab'), [0, -4.7, 0]);
  addMesh(group, boxMesh([6.3, 0.12, 3.5], materials.structure, 'plinth-inset'), [0.18, -4.49, -0.08]);
  addMesh(group, boxMesh([4.2, 0.08, 0.52], materials.structure, 'plinth-track-a'), [-0.7, -4.37, 0.96], [0, 0.05, 0.02]);
  addMesh(group, boxMesh([2.8, 0.08, 0.46], materials.structure, 'plinth-track-b'), [1.45, -4.35, -1.02], [0, -0.08, -0.03]);

  return group;
}

function createCoreSpine(materials) {
  const group = new THREE.Group();
  group.name = 'core-spine';

  const outerShape = createShape([
    [-1.14, -3.32],
    [-0.96, 4.46],
    [-0.68, 5.48],
    [-0.06, 6.26],
    [0.68, 5.94],
    [0.98, 4.72],
    [1.14, 0.28],
    [0.86, -0.54],
    [0.92, -2.88],
    [0.44, -3.42],
    [-0.42, -3.56],
  ]);

  const cavity = createShape([
    [0.06, -0.86],
    [0.82, -0.6],
    [0.78, 3.86],
    [0.46, 5.02],
    [-0.04, 5.34],
    [-0.32, 4.4],
    [-0.2, 0.26],
  ]);
  outerShape.holes.push(cavity);

  const shellBody = extrudedMesh({
    shape: outerShape,
    depth: 2.3,
    material: materials.shell,
    name: 'core-shell',
    bevelSize: 0.08,
    bevelThickness: 0.08,
    bevelSegments: 3,
  });
  shellBody.geometry.center();
  shellBody.position.set(0.1, 0.52, 0);
  group.add(shellBody);

  const facePlateShape = createShape([
    [-0.42, -2.9],
    [-0.24, 4.72],
    [0.06, 5.58],
    [0.42, 5.34],
    [0.58, 0.22],
    [0.26, -2.92],
  ]);
  const facePlate = extrudedMesh({
    shape: facePlateShape,
    depth: 0.16,
    material: materials.structure,
    name: 'core-face-plate',
    bevelSize: 0.03,
    bevelThickness: 0.03,
  });
  facePlate.geometry.center();
  facePlate.position.set(-0.16, 0.58, 1.18);
  group.add(facePlate);

  const ribPaths = [
    [new THREE.Vector3(-0.78, -2.9, -0.92), new THREE.Vector3(-0.62, 5.62, -0.92)],
    [new THREE.Vector3(-0.54, -2.3, -0.66), new THREE.Vector3(-0.4, 5.2, -0.66)],
    [new THREE.Vector3(-0.3, -1.84, -0.42), new THREE.Vector3(-0.12, 4.86, -0.42)],
  ];
  ribPaths.forEach((pair, index) => {
    group.add(beamBetween(pair[0], pair[1], 0.12 - index * 0.016, materials.structure, `core-rib-${index}`));
  });

  const bracePairs = [
    [new THREE.Vector3(-0.56, 3.72, -0.56), new THREE.Vector3(0.12, 4.78, -0.32)],
    [new THREE.Vector3(-0.58, 2.2, -0.58), new THREE.Vector3(0.22, 3.1, -0.2)],
    [new THREE.Vector3(-0.62, 0.36, -0.6), new THREE.Vector3(0.28, 1.12, -0.14)],
    [new THREE.Vector3(-0.66, -1.46, -0.62), new THREE.Vector3(0.2, -0.88, -0.18)],
  ];
  bracePairs.forEach((pair, index) => {
    group.add(beamBetween(pair[0], pair[1], 0.07, materials.structure, `core-brace-${index}`));
  });

  addMesh(group, boxMesh([1.44, 0.2, 0.24], materials.structure, 'core-access-plate-a'), [-0.36, -2.92, 0.98], [0, 0.03, -0.06]);
  addMesh(group, boxMesh([1.16, 0.16, 0.22], materials.structure, 'core-access-plate-b'), [-0.22, -0.74, 1.02], [0, -0.04, 0.07]);
  addMesh(group, boxMesh([1.08, 0.14, 0.2], materials.structure, 'core-access-plate-c'), [-0.08, 1.4, 1.04], [0, 0.06, -0.04]);
  addMesh(group, boxMesh([0.96, 0.12, 0.18], materials.accent, 'core-seam-plate'), [0.04, 4.52, 1.04], [0.04, -0.08, 0.04]);

  return group;
}

function createLabDecks(materials) {
  const group = new THREE.Group();
  group.name = 'lab-decks';

  const decks = [
    { name: 'alpha', pos: new THREE.Vector3(-1.42, 2.88, 0.82), angle: 0.14, width: 2.16 },
    { name: 'beta', pos: new THREE.Vector3(-1.18, 1.54, 0.7), angle: 0.08, width: 1.96 },
    { name: 'gamma', pos: new THREE.Vector3(-0.96, 0.18, 0.58), angle: 0.02, width: 1.76 },
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
    const deckPlate = extrudedMesh({
      shape: plateShape,
      depth: 0.26,
      material: materials.structure,
      name: `lab-deck-plate-${deck.name}`,
      bevelSize: 0.03,
      bevelThickness: 0.03,
    });
    deckPlate.geometry.center();
    addMesh(deckGroup, deckPlate, [0, 0, 0], [0, deck.angle, 0]);

    const housingShape = createShape([
      [-0.54, -0.26],
      [0.34, -0.3],
      [0.6, 0.02],
      [0.46, 0.38],
      [-0.4, 0.42],
      [-0.62, 0.12],
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

    addMesh(deckGroup, boxMesh([0.82, 0.18, 0.18], materials.structure, `lab-service-rail-${deck.name}`), [0.56, 0.08, 0.38], [0, deck.angle, 0.05]);
    addMesh(deckGroup, boxMesh([0.54, 0.16, 0.14], materials.structure, `lab-equipment-bay-${deck.name}`), [-0.22, 0.22, 0.3], [0, deck.angle * 0.6, -0.12]);
    addMesh(deckGroup, boxMesh([0.32, 0.48, 0.18], materials.structure, `lab-access-tower-${deck.name}`), [0.78, 0.42, 0.18], [0, 0, 0.04]);

    const supportA = beamBetween(new THREE.Vector3(-0.6, -0.18, -0.24), new THREE.Vector3(0.82, -0.7, -0.62), 0.08, materials.structure, `lab-support-a-${deck.name}`);
    const supportB = beamBetween(new THREE.Vector3(-0.24, 0.1, -0.3), new THREE.Vector3(0.72, -0.62, -0.82), 0.06, materials.structure, `lab-support-b-${deck.name}`);
    deckGroup.add(supportA);
    deckGroup.add(supportB);

    deckGroup.position.copy(deck.pos);
    group.add(deckGroup);

    if (index < decks.length - 1) {
      group.add(beamBetween(
        new THREE.Vector3(deck.pos.x + 0.68, deck.pos.y + 0.06, deck.pos.z - 0.36),
        new THREE.Vector3(deck.pos.x + 1.42, deck.pos.y - 0.42, deck.pos.z - 0.86),
        0.07,
        materials.structure,
        `lab-spine-link-${deck.name}`,
      ));
    }
  });

  return group;
}

function createProgramLoop(materials) {
  const group = new THREE.Group();
  group.name = 'program-loop';

  const routePoints = [
    new THREE.Vector3(0.34, -0.86, 0.86),
    new THREE.Vector3(1.14, -1.08, 0.96),
    new THREE.Vector3(2.14, -1.24, 0.82),
    new THREE.Vector3(2.72, -0.88, 0.42),
    new THREE.Vector3(2.56, -0.12, -0.12),
    new THREE.Vector3(1.68, 0.18, -0.08),
    new THREE.Vector3(0.74, -0.04, 0.2),
    new THREE.Vector3(0.24, -0.42, 0.58),
  ];
  group.add(tubeAlong(routePoints, 0.12, materials.structure, 'program-track', 144, 14));
  group.add(tubeAlong(routePoints, 0.05, materials.signal, 'program-signal-track', 144, 10));

  const gatePositions = [
    [0.92, -1.04, 0.98],
    [1.92, -1.2, 0.86],
    [2.66, -0.72, 0.34],
    [2.28, 0.08, -0.06],
  ];
  gatePositions.forEach((position, index) => {
    const gate = new THREE.Group();
    gate.name = `program-gate-${index}`;
    addMesh(gate, boxMesh([0.16, 0.88, 0.16], materials.structure, `program-gate-${index}-left`), [-0.18, 0, 0]);
    addMesh(gate, boxMesh([0.16, 0.88, 0.16], materials.structure, `program-gate-${index}-right`), [0.18, 0, 0]);
    addMesh(gate, boxMesh([0.56, 0.12, 0.16], materials.accent, `program-gate-${index}-header`), [0, 0.36, 0]);
    gate.position.set(position[0], position[1], position[2]);
    gate.rotation.y = 0.18 - index * 0.12;
    group.add(gate);
  });

  const benchShape = createShape([
    [-1.12, -0.26],
    [0.82, -0.32],
    [1.26, -0.06],
    [1.08, 0.22],
    [-0.96, 0.26],
    [-1.18, 0.04],
  ]);
  const bench = extrudedMesh({
    shape: benchShape,
    depth: 0.28,
    material: materials.shell,
    name: 'program-bench-plate',
    bevelSize: 0.03,
    bevelThickness: 0.03,
  });
  bench.geometry.center();
  addMesh(group, bench, [1.5, -1.66, 0.38], [0.04, -0.12, 0.08]);

  addMesh(group, boxMesh([0.38, 0.98, 0.22], materials.structure, 'program-checkpoint-column-a'), [2.84, -0.58, 0.24], [0, 0.18, 0.04]);
  addMesh(group, boxMesh([0.34, 0.86, 0.22], materials.structure, 'program-checkpoint-column-b'), [0.46, -0.54, 0.52], [0, -0.14, -0.04]);
  addMesh(group, boxMesh([1.04, 0.1, 0.2], materials.structure, 'program-support-rail'), [1.04, -1.86, -0.06], [0.08, 0.04, 0.02]);

  const struts = [
    [new THREE.Vector3(0.52, -1.12, 0.72), new THREE.Vector3(1.28, -1.78, 0.08)],
    [new THREE.Vector3(1.72, -1.18, 0.7), new THREE.Vector3(1.32, -1.88, -0.08)],
    [new THREE.Vector3(2.52, -0.96, 0.34), new THREE.Vector3(1.94, -1.72, -0.08)],
  ];
  struts.forEach((pair, index) => {
    group.add(beamBetween(pair[0], pair[1], 0.06, materials.structure, `program-strut-${index}`));
  });

  return group;
}

function createNetworkBridges(materials) {
  const group = new THREE.Group();
  group.name = 'network-bridges';

  const bridgeA = [
    new THREE.Vector3(0.12, 4.28, 0.42),
    new THREE.Vector3(0.82, 4.92, 0.62),
    new THREE.Vector3(1.76, 5.42, 0.48),
    new THREE.Vector3(2.78, 5.24, 0.14),
  ];
  const bridgeB = [
    new THREE.Vector3(-0.12, 4.82, -0.24),
    new THREE.Vector3(0.66, 5.48, -0.12),
    new THREE.Vector3(1.72, 5.82, -0.06),
    new THREE.Vector3(2.58, 5.52, -0.18),
  ];
  group.add(tubeAlong(bridgeA, 0.08, materials.structure, 'network-bridge-primary', 96, 12));
  group.add(tubeAlong(bridgeB, 0.06, materials.structure, 'network-bridge-secondary', 96, 10));
  group.add(tubeAlong(bridgeA, 0.03, materials.signal, 'network-signal-primary', 96, 8));

  const nodeSupports = [
    [new THREE.Vector3(0.82, 4.92, 0.62), new THREE.Vector3(0.52, 4.12, 0.12)],
    [new THREE.Vector3(1.76, 5.42, 0.48), new THREE.Vector3(1.28, 4.38, 0.04)],
    [new THREE.Vector3(2.78, 5.24, 0.14), new THREE.Vector3(2.18, 4.22, -0.32)],
  ];
  nodeSupports.forEach((pair, index) => {
    group.add(beamBetween(pair[0], pair[1], 0.05, materials.structure, `network-support-${index}`));
  });

  const nodePositions = [
    [0.84, 4.96, 0.64],
    [1.76, 5.44, 0.48],
    [2.78, 5.24, 0.14],
    [2.56, 5.5, -0.18],
  ];
  nodePositions.forEach((position, index) => {
    addMesh(group, cylinderMesh(0.14, 0.18, 0.22, 8, materials.accent, `network-node-${index}`), position, [Math.PI / 2, 0, index * 0.16]);
  });

  const crownPlateShape = createShape([
    [-0.84, -0.18],
    [0.88, -0.22],
    [1.06, 0.0],
    [0.86, 0.2],
    [-0.78, 0.24],
    [-0.96, 0.02],
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
  addMesh(group, crownPlate, [0.9, 4.36, 0.02], [0.04, 0.16, -0.06]);

  const crossBraces = [
    [new THREE.Vector3(0.36, 4.66, 0.4), new THREE.Vector3(1.2, 5.18, -0.02)],
    [new THREE.Vector3(1.02, 4.94, 0.36), new THREE.Vector3(2.02, 5.32, -0.04)],
    [new THREE.Vector3(1.82, 5.08, 0.24), new THREE.Vector3(2.7, 5.34, -0.14)],
  ];
  crossBraces.forEach((pair, index) => {
    group.add(beamBetween(pair[0], pair[1], 0.042, materials.structure, `network-cross-brace-${index}`));
  });

  return group;
}

function createServiceConduits(materials) {
  const group = new THREE.Group();
  group.name = 'service-conduits';

  const conduits = [
    {
      name: 'conduit-lab-a',
      points: [
        new THREE.Vector3(-0.16, 3.82, -0.26),
        new THREE.Vector3(-0.66, 3.64, -0.08),
        new THREE.Vector3(-1.28, 3.2, 0.34),
        new THREE.Vector3(-1.78, 2.92, 0.74),
      ],
      radius: 0.08,
    },
    {
      name: 'conduit-lab-b',
      points: [
        new THREE.Vector3(0.02, 2.18, -0.22),
        new THREE.Vector3(-0.48, 1.98, -0.04),
        new THREE.Vector3(-1.06, 1.7, 0.26),
        new THREE.Vector3(-1.56, 1.44, 0.66),
      ],
      radius: 0.075,
    },
    {
      name: 'conduit-program',
      points: [
        new THREE.Vector3(0.32, -0.18, -0.08),
        new THREE.Vector3(0.86, -0.34, 0.14),
        new THREE.Vector3(1.46, -0.58, 0.42),
        new THREE.Vector3(2.22, -0.8, 0.58),
      ],
      radius: 0.07,
    },
    {
      name: 'conduit-network',
      points: [
        new THREE.Vector3(0.12, 4.06, -0.32),
        new THREE.Vector3(0.7, 4.52, -0.18),
        new THREE.Vector3(1.42, 4.98, -0.06),
        new THREE.Vector3(2.18, 5.22, -0.04),
      ],
      radius: 0.065,
    },
  ];

  conduits.forEach((conduit) => {
    group.add(tubeAlong(conduit.points, conduit.radius, materials.structure, conduit.name, 72, 10));
  });

  return group;
}

function createGlassVolumes(materials) {
  const group = new THREE.Group();
  group.name = 'glass-volumes';

  addMesh(group, boxMesh([0.92, 0.56, 0.7], materials.glass, 'glass-lab-alpha'), [-1.14, 3.3, 0.96], [0, 0.12, 0]);
  addMesh(group, boxMesh([0.86, 0.54, 0.68], materials.glass, 'glass-lab-beta'), [-0.92, 1.98, 0.84], [0, 0.1, 0]);
  addMesh(group, boxMesh([0.8, 0.5, 0.64], materials.glass, 'glass-lab-gamma'), [-0.74, 0.64, 0.74], [0, 0.08, 0]);
  addMesh(group, boxMesh([1.42, 0.34, 0.52], materials.glass, 'glass-program-cavity'), [1.54, -1.46, 0.26], [0.04, -0.12, 0.06]);
  addMesh(group, boxMesh([1.2, 0.22, 0.42], materials.glass, 'glass-network-bridge'), [1.32, 4.84, 0.18], [0.08, 0.18, -0.04]);

  return group;
}

function createSignalPaths(materials) {
  const group = new THREE.Group();
  group.name = 'signal-paths';

  const routes = [
    {
      name: 'signal-lab-primary',
      points: [
        new THREE.Vector3(-0.06, 3.56, 0.58),
        new THREE.Vector3(-0.82, 3.38, 0.74),
        new THREE.Vector3(-1.54, 3.08, 0.9),
      ],
    },
    {
      name: 'signal-lab-secondary',
      points: [
        new THREE.Vector3(0.04, 2.06, 0.46),
        new THREE.Vector3(-0.64, 1.84, 0.62),
        new THREE.Vector3(-1.26, 1.56, 0.76),
      ],
    },
    {
      name: 'signal-program',
      points: [
        new THREE.Vector3(0.44, -0.84, 0.88),
        new THREE.Vector3(1.38, -1.16, 0.88),
        new THREE.Vector3(2.46, -0.94, 0.44),
        new THREE.Vector3(2.38, -0.08, -0.04),
      ],
    },
    {
      name: 'signal-network',
      points: [
        new THREE.Vector3(0.18, 4.34, 0.32),
        new THREE.Vector3(1.08, 4.98, 0.46),
        new THREE.Vector3(2.12, 5.34, 0.22),
        new THREE.Vector3(2.82, 5.28, 0.06),
      ],
    },
  ];

  routes.forEach((route) => {
    group.add(tubeAlong(route.points, 0.028, materials.signal, route.name, 96, 8));
  });

  const nodes = [
    [-1.48, 3.08, 0.92],
    [-1.22, 1.58, 0.76],
    [1.38, -1.16, 0.9],
    [2.38, -0.1, -0.04],
    [2.1, 5.34, 0.22],
    [2.82, 5.28, 0.06],
  ];
  nodes.forEach((position, index) => {
    addMesh(group, cylinderMesh(0.07, 0.09, 0.16, 8, materials.signal, `signal-node-${index}`), position, [Math.PI / 2, 0, 0]);
  });

  return group;
}

function createSwitchyardScene(textures) {
  const materials = createMaterials(textures);
  const scene = new THREE.Scene();
  scene.name = 'switchyard-scene';

  const assetRoot = new THREE.Group();
  assetRoot.name = 'switchyard-asset';

  assetRoot.add(createPlinth(materials));
  assetRoot.add(createCoreSpine(materials));
  assetRoot.add(createLabDecks(materials));
  assetRoot.add(createProgramLoop(materials));
  assetRoot.add(createNetworkBridges(materials));
  assetRoot.add(createServiceConduits(materials));
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

  const scene = createSwitchyardScene({
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
    asset: 'switchyard',
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
    rootObject: 'switchyard-asset',
    subassemblies: [
      'core-spine',
      'lab-decks',
      'program-loop',
      'network-bridges',
      'service-conduits',
      'glass-volumes',
      'signal-paths',
      'plinth',
    ],
    materials: [
      'switchyard-shell-material',
      'switchyard-structure-material',
      'switchyard-glass-material',
      'switchyard-signal-material',
      'switchyard-accent-material',
      'switchyard-plinth-material',
    ],
    notes: 'Run `node scripts/build-switchyard.mjs` from the repo root to regenerate.',
  };

  await writeFile(path.join(outDir, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);

  console.log([
    `Wrote ${path.join('public/assets/3d/switchyard', signatures.glb)}`,
    `Wrote ${path.join('public/assets/3d/switchyard', signatures.ao)}`,
    `Wrote ${path.join('public/assets/3d/switchyard', signatures.roughness)}`,
    `Wrote ${path.join('public/assets/3d/switchyard', signatures.normal)}`,
    `Wrote ${path.join('public/assets/3d/switchyard', signatures.emissive)}`,
    `Wrote ${path.join('public/assets/3d/switchyard', signatures.glassMask)}`,
    `Wrote ${path.join('public/assets/3d/switchyard', 'manifest.json')}`,
  ].join('\n'));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
