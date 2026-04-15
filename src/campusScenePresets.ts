export type CampusSceneStateId =
  | "opening"
  | "labs"
  | "program"
  | "network"
  | "closing";

export type Vec3 = [number, number, number];

export type CampusScenePreset = {
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
  atmosphere: {
    fogColor: string;
    fogNear: number;
    fogFar: number;
    ambientFloor: number;
    backfield: number;
    contrast: number;
    glow: number;
  };
  motion: {
    drift: number;
    float: number;
    rotation: number;
  };
};

export const campusScenePresets: Record<
  CampusSceneStateId,
  CampusScenePreset
> = {
  opening: {
    camera: {
      position: [1.42, 1.82, 12.4],
      target: [0.7, 1.02, 0.18],
      fov: 22,
      travel: [0.42, -0.12, -1.18],
      targetTravel: [0.14, -0.06, 0]
    },
    shell: {
      split: 0.06,
      aperture: 0.08,
      cutDepth: 0.1,
      lift: 0.04,
      tilt: 0.04
    },
    layers: {
      core: 0.62,
      labs: 0.24,
      program: 0.14,
      network: 0.1,
      conduits: 0.26,
      glass: 0.26
    },
    signal: {
      density: 0.18,
      speed: 0.22,
      labs: 0.2,
      program: 0.14,
      network: 0.12
    },
    lighting: {
      key: 0.96,
      fill: 0.44,
      rim: 0.52,
      accent: 0.24,
      haze: 0.18
    },
    atmosphere: {
      fogColor: "#10181b",
      fogNear: 13,
      fogFar: 40,
      ambientFloor: 0.72,
      backfield: 0.56,
      contrast: 0.42,
      glow: 0.28
    },
    motion: {
      drift: 0.04,
      float: 0.05,
      rotation: 0.03
    }
  },
  labs: {
    camera: {
      position: [0.94, 1.94, 9.86],
      target: [0.18, 1.2, 0.22],
      fov: 24,
      travel: [0.18, -0.1, -1],
      targetTravel: [0.04, -0.08, 0.02]
    },
    shell: {
      split: 0.56,
      aperture: 0.62,
      cutDepth: 0.48,
      lift: 0.18,
      tilt: 0.12
    },
    layers: {
      core: 0.86,
      labs: 1,
      program: 0.12,
      network: 0.08,
      conduits: 0.9,
      glass: 0.7
    },
    signal: {
      density: 0.58,
      speed: 0.42,
      labs: 1,
      program: 0.22,
      network: 0.14
    },
    lighting: {
      key: 1.12,
      fill: 0.4,
      rim: 0.82,
      accent: 0.38,
      haze: 0.24
    },
    atmosphere: {
      fogColor: "#11181b",
      fogNear: 12,
      fogFar: 43,
      ambientFloor: 0.8,
      backfield: 0.62,
      contrast: 0.58,
      glow: 0.34
    },
    motion: {
      drift: 0.04,
      float: 0.05,
      rotation: 0.08
    }
  },
  program: {
    camera: {
      position: [0.18, 0.18, 8.52],
      target: [0.16, -0.88, 0.3],
      fov: 24,
      travel: [-0.08, -0.26, -0.54],
      targetTravel: [0.02, -0.16, 0.06]
    },
    shell: {
      split: 0.8,
      aperture: 0.92,
      cutDepth: 0.9,
      lift: 0.08,
      tilt: -0.08
    },
    layers: {
      core: 0.68,
      labs: 0.08,
      program: 1,
      network: 0.1,
      conduits: 0.58,
      glass: 0.92
    },
    signal: {
      density: 0.82,
      speed: 0.68,
      labs: 0.2,
      program: 1,
      network: 0.16
    },
    lighting: {
      key: 1.02,
      fill: 0.52,
      rim: 0.64,
      accent: 0.64,
      haze: 0.24
    },
    atmosphere: {
      fogColor: "#0f161a",
      fogNear: 11,
      fogFar: 42,
      ambientFloor: 0.78,
      backfield: 0.66,
      contrast: 0.5,
      glow: 0.42
    },
    motion: {
      drift: 0.05,
      float: 0.06,
      rotation: -0.06
    }
  },
  network: {
    camera: {
      position: [-0.18, 2.86, 10.88],
      target: [0.16, 2.36, 0.14],
      fov: 24,
      travel: [-0.2, 0.16, 0.48],
      targetTravel: [0.08, 0.22, 0]
    },
    shell: {
      split: 0.3,
      aperture: 0.28,
      cutDepth: 0.18,
      lift: 1.12,
      tilt: 0.2
    },
    layers: {
      core: 0.58,
      labs: 0.08,
      program: 0.12,
      network: 1,
      conduits: 0.62,
      glass: 0.4
    },
    signal: {
      density: 0.62,
      speed: 0.5,
      labs: 0.14,
      program: 0.18,
      network: 1
    },
    lighting: {
      key: 1.08,
      fill: 0.42,
      rim: 0.96,
      accent: 0.88,
      haze: 0.3
    },
    atmosphere: {
      fogColor: "#10161a",
      fogNear: 12,
      fogFar: 45,
      ambientFloor: 0.76,
      backfield: 0.68,
      contrast: 0.62,
      glow: 0.46
    },
    motion: {
      drift: 0.05,
      float: 0.07,
      rotation: 0.06
    }
  },
  closing: {
    camera: {
      position: [0.52, 1.34, 10.1],
      target: [0.18, 0.88, 0.08],
      fov: 23,
      travel: [-0.14, -0.06, -0.28],
      targetTravel: [-0.04, -0.04, 0]
    },
    shell: {
      split: 0.14,
      aperture: 0.16,
      cutDepth: 0.14,
      lift: 0.18,
      tilt: 0.02
    },
    layers: {
      core: 0.7,
      labs: 0.38,
      program: 0.34,
      network: 0.42,
      conduits: 0.46,
      glass: 0.48
    },
    signal: {
      density: 0.28,
      speed: 0.22,
      labs: 0.34,
      program: 0.32,
      network: 0.4
    },
    lighting: {
      key: 1.02,
      fill: 0.42,
      rim: 0.64,
      accent: 0.34,
      haze: 0.18
    },
    atmosphere: {
      fogColor: "#0b1013",
      fogNear: 13,
      fogFar: 38,
      ambientFloor: 0.6,
      backfield: 0.46,
      contrast: 0.3,
      glow: 0.18
    },
    motion: {
      drift: 0.04,
      float: 0.05,
      rotation: 0.02
    }
  }
};
