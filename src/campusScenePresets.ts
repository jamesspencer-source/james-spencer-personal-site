export type MapFocus = "labs" | "program" | "network";
export type SceneStageId = "opening" | MapFocus | "closing";
export type Vec3 = [number, number, number];

export type ScenePreset = {
  camera: {
    position: Vec3;
    target: Vec3;
    fov: number;
  };
  root: {
    position: Vec3;
    rotation: Vec3;
    scale: number;
  };
  diagram: {
    labSpread: number;
    labLift: number;
    labDepth: number;
    programLift: number;
    programScale: number;
    networkLift: number;
    networkSpread: number;
    connectorLean: number;
  };
  layers: {
    spine: number;
    labs: number;
    program: number;
    network: number;
    connectors: number;
    signals: number;
  };
  lighting: {
    ambient: number;
    key: number;
    fill: number;
    rim: number;
    accent: number;
  };
  atmosphere: {
    fogColor: string;
    fogNear: number;
    fogFar: number;
    background: number;
    haze: number;
  };
  motion: {
    drift: number;
    signal: number;
  };
};

export const scenePresets: Record<SceneStageId, ScenePreset> = {
  opening: {
    camera: {
      position: [0.82, 0.98, 10.2],
      target: [0.16, 0.06, 0],
      fov: 23
    },
    root: {
      position: [0.24, 0.08, 0],
      rotation: [0.34, -0.42, 0.04],
      scale: 1.02
    },
    diagram: {
      labSpread: 0.8,
      labLift: 0.16,
      labDepth: 0.16,
      programLift: 0.12,
      programScale: 0.9,
      networkLift: 0.18,
      networkSpread: 0.84,
      connectorLean: 0.02
    },
    layers: {
      spine: 0.96,
      labs: 0.54,
      program: 0.38,
      network: 0.34,
      connectors: 0.48,
      signals: 0.34
    },
    lighting: {
      ambient: 1.08,
      key: 1.16,
      fill: 0.72,
      rim: 0.4,
      accent: 0.28
    },
    atmosphere: {
      fogColor: "#162029",
      fogNear: 12,
      fogFar: 34,
      background: 0.88,
      haze: 0.28
    },
    motion: {
      drift: 0.024,
      signal: 0.22
    }
  },
  labs: {
    camera: {
      position: [0.52, 0.88, 9.5],
      target: [0.18, 0.18, 0.02],
      fov: 23
    },
    root: {
      position: [0.16, 0.02, 0],
      rotation: [0.36, -0.44, 0.03],
      scale: 1.04
    },
    diagram: {
      labSpread: 1,
      labLift: 0.28,
      labDepth: 0.22,
      programLift: 0.04,
      programScale: 0.92,
      networkLift: 0.14,
      networkSpread: 0.76,
      connectorLean: 0.02
    },
    layers: {
      spine: 1,
      labs: 1,
      program: 0.28,
      network: 0.22,
      connectors: 0.88,
      signals: 0.74
    },
    lighting: {
      ambient: 1.12,
      key: 1.2,
      fill: 0.78,
      rim: 0.46,
      accent: 0.34
    },
    atmosphere: {
      fogColor: "#17212a",
      fogNear: 12,
      fogFar: 33,
      background: 0.96,
      haze: 0.34
    },
    motion: {
      drift: 0.02,
      signal: 0.38
    }
  },
  program: {
    camera: {
      position: [0.34, 0.08, 9.2],
      target: [0.16, -1.46, 0.02],
      fov: 24
    },
    root: {
      position: [0.12, -0.02, 0],
      rotation: [0.32, -0.36, 0.05],
      scale: 1.03
    },
    diagram: {
      labSpread: 0.78,
      labLift: 0.14,
      labDepth: 0.12,
      programLift: -0.24,
      programScale: 1.08,
      networkLift: 0.1,
      networkSpread: 0.72,
      connectorLean: 0.04
    },
    layers: {
      spine: 0.76,
      labs: 0.28,
      program: 1,
      network: 0.18,
      connectors: 0.76,
      signals: 0.88
    },
    lighting: {
      ambient: 1.1,
      key: 1.14,
      fill: 0.76,
      rim: 0.42,
      accent: 0.34
    },
    atmosphere: {
      fogColor: "#18232c",
      fogNear: 11,
      fogFar: 32,
      background: 0.98,
      haze: 0.36
    },
    motion: {
      drift: 0.022,
      signal: 0.46
    }
  },
  network: {
    camera: {
      position: [0.64, 1.76, 9.45],
      target: [0.18, 2.18, 0.02],
      fov: 23
    },
    root: {
      position: [0.18, 0.06, 0],
      rotation: [0.28, -0.48, -0.02],
      scale: 1.02
    },
    diagram: {
      labSpread: 0.74,
      labLift: 0.12,
      labDepth: 0.08,
      programLift: 0.02,
      programScale: 0.9,
      networkLift: 0.76,
      networkSpread: 1,
      connectorLean: 0.08
    },
    layers: {
      spine: 0.72,
      labs: 0.2,
      program: 0.18,
      network: 1,
      connectors: 0.84,
      signals: 0.9
    },
    lighting: {
      ambient: 1.06,
      key: 1.18,
      fill: 0.78,
      rim: 0.54,
      accent: 0.38
    },
    atmosphere: {
      fogColor: "#162129",
      fogNear: 11,
      fogFar: 33,
      background: 0.94,
      haze: 0.34
    },
    motion: {
      drift: 0.022,
      signal: 0.42
    }
  },
  closing: {
    camera: {
      position: [0.58, 0.82, 9.9],
      target: [0.16, 0.06, 0],
      fov: 23
    },
    root: {
      position: [0.18, 0.02, 0],
      rotation: [0.32, -0.42, 0.04],
      scale: 0.99
    },
    diagram: {
      labSpread: 0.76,
      labLift: 0.12,
      labDepth: 0.1,
      programLift: 0.1,
      programScale: 0.9,
      networkLift: 0.16,
      networkSpread: 0.8,
      connectorLean: 0.02
    },
    layers: {
      spine: 0.8,
      labs: 0.34,
      program: 0.28,
      network: 0.24,
      connectors: 0.38,
      signals: 0.2
    },
    lighting: {
      ambient: 1,
      key: 1.08,
      fill: 0.66,
      rim: 0.34,
      accent: 0.22
    },
    atmosphere: {
      fogColor: "#141d25",
      fogNear: 13,
      fogFar: 35,
      background: 0.72,
      haze: 0.22
    },
    motion: {
      drift: 0.014,
      signal: 0.14
    }
  }
};
