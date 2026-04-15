export type SwitchyardStateId =
  | "opening"
  | "labs"
  | "program"
  | "network"
  | "closing";

export type Vec3 = [number, number, number];

export type SwitchyardScenePreset = {
  camera: {
    position: Vec3;
    target: Vec3;
    fov: number;
    travel: Vec3;
    targetTravel: Vec3;
  };
  shell: {
    split: number;
    aperture: number;
    cutDepth: number;
    lift: number;
    tilt: number;
  };
  layers: {
    core: number;
    labs: number;
    program: number;
    network: number;
    conduits: number;
    glass: number;
  };
  signal: {
    density: number;
    speed: number;
    labs: number;
    program: number;
    network: number;
  };
  lighting: {
    key: number;
    fill: number;
    rim: number;
    accent: number;
    haze: number;
  };
  motion: {
    drift: number;
    float: number;
    rotation: number;
  };
};

export const switchyardScenePresets: Record<
  SwitchyardStateId,
  SwitchyardScenePreset
> = {
  opening: {
    camera: {
      position: [1.2, 1.46, 11.6],
      target: [0.82, 0.86, 0.08],
      fov: 23,
      travel: [0.48, -0.16, -1.42],
      targetTravel: [0.16, -0.08, -0.02]
    },
    shell: {
      split: 0.08,
      aperture: 0.12,
      cutDepth: 0.12,
      lift: 0.1,
      tilt: 0.08
    },
    layers: {
      core: 0.64,
      labs: 0.24,
      program: 0.18,
      network: 0.16,
      conduits: 0.28,
      glass: 0.3
    },
    signal: {
      density: 0.22,
      speed: 0.28,
      labs: 0.22,
      program: 0.16,
      network: 0.14
    },
    lighting: {
      key: 0.98,
      fill: 0.46,
      rim: 0.56,
      accent: 0.28,
      haze: 0.22
    },
    motion: {
      drift: 0.08,
      float: 0.12,
      rotation: 0.06
    }
  },
  labs: {
    camera: {
      position: [0.82, 1.74, 9.18],
      target: [0.18, 1.22, 0.16],
      fov: 24,
      travel: [0.22, -0.14, -1.1],
      targetTravel: [0.08, -0.08, 0.04]
    },
    shell: {
      split: 0.54,
      aperture: 0.58,
      cutDepth: 0.48,
      lift: 0.18,
      tilt: 0.14
    },
    layers: {
      core: 0.86,
      labs: 1,
      program: 0.28,
      network: 0.18,
      conduits: 0.82,
      glass: 0.72
    },
    signal: {
      density: 0.6,
      speed: 0.46,
      labs: 1,
      program: 0.24,
      network: 0.18
    },
    lighting: {
      key: 1.16,
      fill: 0.42,
      rim: 0.84,
      accent: 0.44,
      haze: 0.28
    },
    motion: {
      drift: 0.06,
      float: 0.12,
      rotation: 0.16
    }
  },
  program: {
    camera: {
      position: [0.28, 0.06, 8.34],
      target: [0.12, -0.78, 0.22],
      fov: 24,
      travel: [-0.18, -0.46, -0.78],
      targetTravel: [0.02, -0.26, 0.08]
    },
    shell: {
      split: 0.76,
      aperture: 0.9,
      cutDepth: 0.86,
      lift: 0.1,
      tilt: -0.06
    },
    layers: {
      core: 0.72,
      labs: 0.26,
      program: 1,
      network: 0.2,
      conduits: 0.7,
      glass: 0.88
    },
    signal: {
      density: 0.84,
      speed: 0.72,
      labs: 0.24,
      program: 1,
      network: 0.18
    },
    lighting: {
      key: 1,
      fill: 0.52,
      rim: 0.66,
      accent: 0.7,
      haze: 0.26
    },
    motion: {
      drift: 0.08,
      float: 0.1,
      rotation: -0.12
    }
  },
  network: {
    camera: {
      position: [-0.3, 2.56, 10.14],
      target: [0.18, 2.18, 0.12],
      fov: 25,
      travel: [-0.36, 0.32, 0.68],
      targetTravel: [0.08, 0.28, 0]
    },
    shell: {
      split: 0.48,
      aperture: 0.46,
      cutDepth: 0.3,
      lift: 1,
      tilt: 0.22
    },
    layers: {
      core: 0.64,
      labs: 0.18,
      program: 0.22,
      network: 1,
      conduits: 0.74,
      glass: 0.54
    },
    signal: {
      density: 0.68,
      speed: 0.52,
      labs: 0.18,
      program: 0.22,
      network: 1
    },
    lighting: {
      key: 1.1,
      fill: 0.44,
      rim: 0.96,
      accent: 0.92,
      haze: 0.34
    },
    motion: {
      drift: 0.09,
      float: 0.14,
      rotation: 0.1
    }
  },
  closing: {
    camera: {
      position: [0.42, 1.18, 9.48],
      target: [0.12, 0.74, 0.02],
      fov: 24,
      travel: [-0.16, -0.08, -0.42],
      targetTravel: [-0.04, -0.06, 0]
    },
    shell: {
      split: 0.2,
      aperture: 0.22,
      cutDepth: 0.2,
      lift: 0.26,
      tilt: 0.04
    },
    layers: {
      core: 0.74,
      labs: 0.42,
      program: 0.4,
      network: 0.48,
      conduits: 0.5,
      glass: 0.52
    },
    signal: {
      density: 0.34,
      speed: 0.26,
      labs: 0.42,
      program: 0.4,
      network: 0.46
    },
    lighting: {
      key: 1.02,
      fill: 0.46,
      rim: 0.72,
      accent: 0.38,
      haze: 0.2
    },
    motion: {
      drift: 0.04,
      float: 0.08,
      rotation: 0.04
    }
  }
};
