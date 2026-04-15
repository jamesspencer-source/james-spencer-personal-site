export type MapFocus = "labs" | "program" | "network";
export type SceneStageId = "opening" | MapFocus | "closing";
export type Vec3 = [number, number, number];

export type ScenePreset = {
  camera: {
    position: Vec3;
    target: Vec3;
    fov: number;
    travel: Vec3;
    targetTravel: Vec3;
  };
  root: {
    position: Vec3;
    rotation: Vec3;
    scale: number;
  };
  structure: {
    spineLift: number;
    labSpread: number;
    labDepth: number;
    programRise: number;
    programScale: number;
    networkLift: number;
    networkSpan: number;
    networkTilt: number;
  };
  layers: {
    spine: number;
    labs: number;
    program: number;
    network: number;
    routes: number;
  };
  lighting: {
    ambient: number;
    key: number;
    fill: number;
    rim: number;
    haze: number;
  };
  atmosphere: {
    fogColor: string;
    fogNear: number;
    fogFar: number;
    background: number;
    contrast: number;
  };
  motion: {
    drift: number;
    pulse: number;
    float: number;
  };
};

export const scenePresets: Record<SceneStageId, ScenePreset> = {
  opening: {
    camera: {
      position: [0.92, 0.82, 10.1],
      target: [0.08, 0.16, 0],
      fov: 22,
      travel: [0.26, -0.08, -0.44],
      targetTravel: [0.1, -0.03, 0]
    },
    root: {
      position: [0.32, 0.08, 0],
      rotation: [0.18, -0.52, 0.05],
      scale: 1.04
    },
    structure: {
      spineLift: 0.02,
      labSpread: 0.58,
      labDepth: 0.16,
      programRise: 0.3,
      programScale: 0.9,
      networkLift: 0.3,
      networkSpan: 0.68,
      networkTilt: 0.08
    },
    layers: {
      spine: 0.88,
      labs: 0.34,
      program: 0.22,
      network: 0.2,
      routes: 0.32
    },
    lighting: {
      ambient: 0.94,
      key: 1.18,
      fill: 0.72,
      rim: 0.54,
      haze: 0.38
    },
    atmosphere: {
      fogColor: "#132026",
      fogNear: 12,
      fogFar: 34,
      background: 0.72,
      contrast: 0.64
    },
    motion: {
      drift: 0.04,
      pulse: 0.28,
      float: 0.03
    }
  },
  labs: {
    camera: {
      position: [0.28, 0.72, 8.7],
      target: [0.02, 0.08, 0.06],
      fov: 24,
      travel: [0.18, -0.02, -0.26],
      targetTravel: [0.05, -0.04, 0.02]
    },
    root: {
      position: [0.16, 0, 0],
      rotation: [0.12, -0.42, 0.03],
      scale: 1.06
    },
    structure: {
      spineLift: 0.06,
      labSpread: 1,
      labDepth: 0.32,
      programRise: 0.18,
      programScale: 0.94,
      networkLift: 0.2,
      networkSpan: 0.6,
      networkTilt: 0.02
    },
    layers: {
      spine: 1,
      labs: 1,
      program: 0.24,
      network: 0.18,
      routes: 0.78
    },
    lighting: {
      ambient: 1.02,
      key: 1.24,
      fill: 0.78,
      rim: 0.72,
      haze: 0.42
    },
    atmosphere: {
      fogColor: "#15222a",
      fogNear: 12,
      fogFar: 33,
      background: 0.84,
      contrast: 0.74
    },
    motion: {
      drift: 0.035,
      pulse: 0.44,
      float: 0.03
    }
  },
  program: {
    camera: {
      position: [-0.38, -0.34, 8.3],
      target: [0.04, -1.08, 0.02],
      fov: 25,
      travel: [-0.1, -0.18, -0.22],
      targetTravel: [0.06, -0.12, 0]
    },
    root: {
      position: [0.12, -0.08, 0],
      rotation: [0.26, -0.32, 0.09],
      scale: 1.05
    },
    structure: {
      spineLift: 0,
      labSpread: 0.74,
      labDepth: 0.2,
      programRise: -0.08,
      programScale: 1.08,
      networkLift: 0.18,
      networkSpan: 0.56,
      networkTilt: -0.02
    },
    layers: {
      spine: 0.72,
      labs: 0.22,
      program: 1,
      network: 0.16,
      routes: 0.82
    },
    lighting: {
      ambient: 1,
      key: 1.18,
      fill: 0.8,
      rim: 0.64,
      haze: 0.46
    },
    atmosphere: {
      fogColor: "#17242c",
      fogNear: 11,
      fogFar: 32,
      background: 0.88,
      contrast: 0.7
    },
    motion: {
      drift: 0.04,
      pulse: 0.56,
      float: 0.035
    }
  },
  network: {
    camera: {
      position: [0.18, 1.68, 8.95],
      target: [0.02, 1.38, 0.02],
      fov: 23,
      travel: [0.16, 0.12, 0.1],
      targetTravel: [0.06, 0.08, 0]
    },
    root: {
      position: [0.18, 0.12, 0],
      rotation: [0.08, -0.56, -0.03],
      scale: 1.03
    },
    structure: {
      spineLift: 0.03,
      labSpread: 0.68,
      labDepth: 0.16,
      programRise: 0.22,
      programScale: 0.92,
      networkLift: 0.78,
      networkSpan: 1,
      networkTilt: 0.18
    },
    layers: {
      spine: 0.74,
      labs: 0.18,
      program: 0.14,
      network: 1,
      routes: 0.84
    },
    lighting: {
      ambient: 0.98,
      key: 1.22,
      fill: 0.76,
      rim: 0.86,
      haze: 0.52
    },
    atmosphere: {
      fogColor: "#14222a",
      fogNear: 11,
      fogFar: 33,
      background: 0.86,
      contrast: 0.76
    },
    motion: {
      drift: 0.038,
      pulse: 0.5,
      float: 0.032
    }
  },
  closing: {
    camera: {
      position: [0.42, 0.74, 9.5],
      target: [0.06, 0.08, 0],
      fov: 23,
      travel: [0.04, -0.04, -0.1],
      targetTravel: [0.04, -0.02, 0]
    },
    root: {
      position: [0.16, 0, 0],
      rotation: [0.16, -0.48, 0.04],
      scale: 1
    },
    structure: {
      spineLift: 0.02,
      labSpread: 0.64,
      labDepth: 0.18,
      programRise: 0.2,
      programScale: 0.92,
      networkLift: 0.28,
      networkSpan: 0.7,
      networkTilt: 0.06
    },
    layers: {
      spine: 0.78,
      labs: 0.36,
      program: 0.28,
      network: 0.26,
      routes: 0.34
    },
    lighting: {
      ambient: 0.92,
      key: 1.08,
      fill: 0.68,
      rim: 0.52,
      haze: 0.32
    },
    atmosphere: {
      fogColor: "#142128",
      fogNear: 13,
      fogFar: 35,
      background: 0.68,
      contrast: 0.56
    },
    motion: {
      drift: 0.025,
      pulse: 0.18,
      float: 0.02
    }
  }
};
