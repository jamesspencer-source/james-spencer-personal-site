import type { RoleChapter } from "./content";

// Single chapter timing map for the Current Roles sequence.
// Jump stops land inside stable hold regions, not transition bands.
export const chapterStops: Record<RoleChapter["id"], number> = {
  overview: 0,
  labs: 0.18,
  program: 0.43,
  network: 0.68
};

export const rolesTiming = {
  active: {
    labs: 0.18,
    program: 0.43,
    network: 0.68
  },
  jumpStops: {
    overview: 0.04,
    labs: 0.24,
    program: 0.5,
    network: 0.73
  },
  sequences: {
    labs: { start: 0.18, end: 0.43 },
    program: { start: 0.43, end: 0.68 },
    globe: { start: 0.68, end: 0.88 },
    documentary: { start: 0.88, end: 1 }
  },
  visibility: {
    overview: { enterStart: 0, enterEnd: 0.04, exitStart: 0.15, exitEnd: 0.18 },
    labs: { enterStart: 0.18, enterEnd: 0.24, exitStart: 0.4, exitEnd: 0.43 },
    program: { enterStart: 0.43, enterEnd: 0.49, exitStart: 0.65, exitEnd: 0.68 },
    globe: { enterStart: 0.68, enterEnd: 0.76, exitStart: 1.08, exitEnd: 1.18 }
  },
  programCopy: {
    start: 0.43,
    end: 0.68
  }
};
