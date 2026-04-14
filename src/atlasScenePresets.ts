export type AtlasStateId =
  | "opening"
  | "labs"
  | "program"
  | "network"
  | "closing";

export type Vec3 = [number, number, number];

export type AtlasScenePreset = {
  camera: {
    position: Vec3;
    target: Vec3;
    fov: number;
  };
  emphasis: {
    labs: number;
    program: number;
    network: number;
  };
  motion: {
    drift: number;
    pulse: number;
    rotation: number;
  };
};

export const atlasScenePresets: Record<AtlasStateId, AtlasScenePreset> = {
  opening: {
    camera: {
      position: [0.6, 1.2, 7.4],
      target: [0, 0.2, 0],
      fov: 38
    },
    emphasis: {
      labs: 0.72,
      program: 0.54,
      network: 0.48
    },
    motion: {
      drift: 0.14,
      pulse: 0.58,
      rotation: 0.55
    }
  },
  labs: {
    camera: {
      position: [1.4, 0.9, 6.1],
      target: [0.15, 0.5, 0],
      fov: 34
    },
    emphasis: {
      labs: 1,
      program: 0.28,
      network: 0.18
    },
    motion: {
      drift: 0.08,
      pulse: 0.38,
      rotation: 0.2
    }
  },
  program: {
    camera: {
      position: [-1.7, 1.3, 5.8],
      target: [-0.15, 0.15, 0],
      fov: 36
    },
    emphasis: {
      labs: 0.42,
      program: 1,
      network: 0.34
    },
    motion: {
      drift: 0.16,
      pulse: 0.78,
      rotation: -0.42
    }
  },
  network: {
    camera: {
      position: [0, 1.6, 7.8],
      target: [0, 0.35, 0],
      fov: 40
    },
    emphasis: {
      labs: 0.24,
      program: 0.42,
      network: 1
    },
    motion: {
      drift: 0.2,
      pulse: 0.92,
      rotation: 0.78
    }
  },
  closing: {
    camera: {
      position: [1.2, 0.8, 6.8],
      target: [0.15, 0.15, 0],
      fov: 37
    },
    emphasis: {
      labs: 0.58,
      program: 0.52,
      network: 0.62
    },
    motion: {
      drift: 0.05,
      pulse: 0.24,
      rotation: 0.35
    }
  }
};
