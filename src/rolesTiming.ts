import type { RoleChapter } from "./content";

// Single chapter timing map for the Current Roles sequence.
// Jump stops land inside stable hold regions, not transition bands.
export const chapterStops: Record<RoleChapter["id"], number> = {
  labs: 0,
  program: 0.34,
  network: 0.66
};

export const rolesTiming = {
  active: {
    program: 0.34,
    network: 0.66
  },
  jumpStops: {
    labs: 0.12,
    program: 0.45,
    network: 0.72
  },
  sequences: {
    labs: { start: 0, end: 0.34 },
    program: { start: 0.34, end: 0.66 },
    globe: { start: 0.66, end: 0.88 },
    documentary: { start: 0.88, end: 1 }
  },
  visibility: {
    labs: { enterStart: 0, enterEnd: 0.06, exitStart: 0.31, exitEnd: 0.34 },
    program: { enterStart: 0.34, enterEnd: 0.41, exitStart: 0.62, exitEnd: 0.66 },
    globe: { enterStart: 0.66, enterEnd: 0.74, exitStart: 1.08, exitEnd: 1.18 }
  },
  programCopy: {
    start: 0.34,
    end: 0.66
  }
};
