import type { VNextAssetId, VNextChapterId } from "./VNextContent";

export const vNextSceneTiming = {
  opening: { start: 0, end: 0.14 },
  labs: { start: 0.14, hold: 0.23, end: 0.36 },
  program: { start: 0.36, hold: 0.47, end: 0.58 },
  network: { start: 0.58, hold: 0.69, end: 0.8 },
  proof: { start: 0.8, end: 0.9 },
  release: { start: 0.9, end: 1 }
} as const;

export const vNextSceneJumps: Record<VNextChapterId, number> = {
  labs: vNextSceneTiming.labs.hold,
  program: vNextSceneTiming.program.hold,
  network: vNextSceneTiming.network.hold
};

export const vNextAssetOrder: VNextAssetId[] = [
  "system-overview",
  "labs-focus",
  "program-cycle",
  "conference-network"
];

export function clamp01(value: number) {
  return Math.max(0, Math.min(1, value));
}

export function smoothstep(start: number, end: number, value: number) {
  if (start === end) {
    return value >= end ? 1 : 0;
  }

  const x = clamp01((value - start) / (end - start));
  return x * x * (3 - 2 * x);
}

export function mix(from: number, to: number, amount: number) {
  return from + (to - from) * amount;
}

export function fadeBetween(value: number, enterStart: number, enterEnd: number, exitStart: number, exitEnd: number) {
  return smoothstep(enterStart, enterEnd, value) * (1 - smoothstep(exitStart, exitEnd, value));
}

export function getVNextActiveChapter(progress: number): VNextChapterId {
  if (progress >= vNextSceneTiming.network.start) {
    return "network";
  }

  if (progress >= vNextSceneTiming.program.start) {
    return "program";
  }

  return "labs";
}

export function getVNextDocumentaryProgress(progress: number) {
  const x = clamp01((progress - vNextSceneTiming.proof.start) / (vNextSceneTiming.proof.end - vNextSceneTiming.proof.start));
  return x * x * (3 - 2 * x);
}
