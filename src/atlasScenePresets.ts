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
    travel: Vec3;
    targetTravel: Vec3;
  };
  shell: {
    exposure: number;
    split: number;
    cutDepth: number;
    crown: number;
  };
  layers: {
    labs: number;
    program: number;
    network: number;
  };
  signal: {
    density: number;
    speed: number;
  };
  lighting: {
    key: number;
    fill: number;
    rim: number;
    accent: number;
  };
  motion: {
    drift: number;
    float: number;
    rotation: number;
  };
};

export const atlasScenePresets: Record<AtlasStateId, AtlasScenePreset> = {
  opening: {
    camera: {
      position: [0.24, 1.38, 9.6],
      target: [0.02, 0.48, 0.02],
      fov: 28,
      travel: [0.18, -0.34, -1.5],
      targetTravel: [0.04, -0.18, -0.08]
    },
    shell: {
      exposure: 0.08,
      split: 0.04,
      cutDepth: 0.06,
      crown: 0.14
    },
    layers: {
      labs: 0.28,
      program: 0.18,
      network: 0.16
    },
    signal: {
      density: 0.26,
      speed: 0.34
    },
    lighting: {
      key: 1,
      fill: 0.52,
      rim: 0.62,
      accent: 0.34
    },
    motion: {
      drift: 0.12,
      float: 0.24,
      rotation: 0.08
    }
  },
  labs: {
    camera: {
      position: [1.24, 1.34, 8.42],
      target: [0.16, 0.88, 0.08],
      fov: 27,
      travel: [0.56, -0.16, -1.24],
      targetTravel: [0.18, -0.12, -0.04]
    },
    shell: {
      exposure: 0.58,
      split: 0.54,
      cutDepth: 0.44,
      crown: 0.18
    },
    layers: {
      labs: 1,
      program: 0.24,
      network: 0.18
    },
    signal: {
      density: 0.58,
      speed: 0.48
    },
    lighting: {
      key: 1.16,
      fill: 0.44,
      rim: 0.82,
      accent: 0.44
    },
    motion: {
      drift: 0.08,
      float: 0.18,
      rotation: 0.18
    }
  },
  program: {
    camera: {
      position: [0.52, 0.18, 7.04],
      target: [0.06, -0.42, 0.16],
      fov: 25,
      travel: [-0.3, -0.92, -1],
      targetTravel: [0.04, -0.42, 0.04]
    },
    shell: {
      exposure: 0.84,
      split: 0.82,
      cutDepth: 0.76,
      crown: 0.26
    },
    layers: {
      labs: 0.28,
      program: 1,
      network: 0.24
    },
    signal: {
      density: 0.84,
      speed: 0.72
    },
    lighting: {
      key: 0.94,
      fill: 0.56,
      rim: 0.7,
      accent: 0.72
    },
    motion: {
      drift: 0.12,
      float: 0.14,
      rotation: -0.14
    }
  },
  network: {
    camera: {
      position: [0.12, 1.5, 8.96],
      target: [0, 1.28, 0.06],
      fov: 29,
      travel: [-0.34, 0.48, 1.34],
      targetTravel: [0, 0.36, 0]
    },
    shell: {
      exposure: 0.7,
      split: 0.6,
      cutDepth: 0.48,
      crown: 1.12
    },
    layers: {
      labs: 0.18,
      program: 0.34,
      network: 1
    },
    signal: {
      density: 0.7,
      speed: 0.54
    },
    lighting: {
      key: 1.08,
      fill: 0.46,
      rim: 0.96,
      accent: 0.9
    },
    motion: {
      drift: 0.16,
      float: 0.2,
      rotation: 0.1
    }
  },
  closing: {
    camera: {
      position: [0.82, 1.04, 8.08],
      target: [0.08, 0.34, 0],
      fov: 28,
      travel: [-0.26, -0.18, -0.28],
      targetTravel: [-0.08, -0.1, 0]
    },
    shell: {
      exposure: 0.34,
      split: 0.18,
      cutDepth: 0.2,
      crown: 0.42
    },
    layers: {
      labs: 0.42,
      program: 0.38,
      network: 0.46
    },
    signal: {
      density: 0.34,
      speed: 0.28
    },
    lighting: {
      key: 1,
      fill: 0.48,
      rim: 0.74,
      accent: 0.4
    },
    motion: {
      drift: 0.05,
      float: 0.1,
      rotation: 0.05
    }
  }
};
