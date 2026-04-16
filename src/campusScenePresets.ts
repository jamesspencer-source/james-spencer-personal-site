export type MapFocus = "labs" | "program" | "network";
export type SceneStageId = "opening" | MapFocus | "closing";
export type SceneLayer = "spine" | MapFocus;
export type ViewportTier = "mobile" | "tablet" | "desktop";
export type Vec3 = [number, number, number];

export type CameraState = {
  position: Vec3;
  target: Vec3;
  fov: number;
};

export type ScenePreset = {
  camera: Record<ViewportTier, CameraState>;
  root: {
    position: Vec3;
    rotation: Vec3;
    scale: number;
  };
  layers: Record<SceneLayer, number>;
  emphasis: {
    labsLift: number;
    programLift: number;
    networkLift: number;
    cutDepth: number;
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
    fieldColor: string;
    glowColor: string;
    backgroundStrength: number;
  };
  motion: {
    drift: number;
    parallax: number;
    signal: number;
  };
};

export type SignalRoute = {
  id: string;
  focus: MapFocus;
  points: Vec3[];
};

const sharedCamera = {
  mobile: { position: [0.42, 1.08, 13.2], target: [0, 0.64, 0], fov: 25 },
  tablet: { position: [0.52, 1.02, 12.1], target: [0, 0.62, 0], fov: 24.5 },
  desktop: { position: [0.62, 0.98, 11.2], target: [0, 0.62, 0], fov: 24 }
} satisfies Record<ViewportTier, CameraState>;

export const signalRoutes: SignalRoute[] = [
  {
    id: "labs-west",
    focus: "labs",
    points: [
      [0.12, 0.82, 0.26],
      [-0.88, 1.12, 0.28],
      [-1.78, 1.42, 0.3],
      [-3.06, 1.76, 0.34]
    ]
  },
  {
    id: "labs-east",
    focus: "labs",
    points: [
      [-0.12, 0.82, -0.26],
      [0.88, 1.12, -0.28],
      [1.78, 1.42, -0.3],
      [3.06, 1.76, -0.34]
    ]
  },
  {
    id: "program-loop",
    focus: "program",
    points: [
      [-2.58, -1.46, 0.46],
      [-1.22, -2.2, 0.18],
      [0, -2.34, 0],
      [1.22, -2.2, -0.18],
      [2.58, -1.46, -0.46],
      [1.64, -0.96, -0.48],
      [-1.64, -0.96, 0.48],
      [-2.58, -1.46, 0.46]
    ]
  },
  {
    id: "network-bridge",
    focus: "network",
    points: [
      [-2.82, 3.36, 0.12],
      [-1.66, 3.18, 0.08],
      [0, 3.1, 0],
      [1.66, 3.18, -0.08],
      [2.82, 3.36, -0.12]
    ]
  }
];

export const scenePresets: Record<SceneStageId, ScenePreset> = {
  opening: {
    camera: sharedCamera,
    root: {
      position: [0, 0.08, 0],
      rotation: [0.18, -0.48, 0.02],
      scale: 1.04
    },
    layers: {
      spine: 1,
      labs: 0.8,
      program: 0.56,
      network: 0.58
    },
    emphasis: {
      labsLift: 0.06,
      programLift: -0.04,
      networkLift: 0.06,
      cutDepth: 0.26
    },
    lighting: {
      ambient: 1.16,
      key: 1.36,
      fill: 0.74,
      rim: 0.96,
      accent: 0.38
    },
    atmosphere: {
      fogColor: "#5a666d",
      fogNear: 16,
      fogFar: 26,
      fieldColor: "#30424d",
      glowColor: "#92aeb5",
      backgroundStrength: 0.98
    },
    motion: {
      drift: 0.018,
      parallax: 0.02,
      signal: 0.28
    }
  },
  labs: {
    camera: {
      mobile: { position: [0.38, 1.7, 12.5], target: [0, 1.48, 0], fov: 25.5 },
      tablet: { position: [0.48, 1.64, 11.4], target: [0, 1.46, 0], fov: 25 },
      desktop: { position: [0.56, 1.56, 10.4], target: [0, 1.42, 0], fov: 24.5 }
    },
    root: {
      position: [0, 0.06, 0],
      rotation: [0.2, -0.52, 0.02],
      scale: 1.06
    },
    layers: {
      spine: 1,
      labs: 1,
      program: 0.3,
      network: 0.32
    },
    emphasis: {
      labsLift: 0.16,
      programLift: -0.06,
      networkLift: 0.04,
      cutDepth: 0.42
    },
    lighting: {
      ambient: 1.2,
      key: 1.42,
      fill: 0.82,
      rim: 1.02,
      accent: 0.42
    },
    atmosphere: {
      fogColor: "#5f6f76",
      fogNear: 15,
      fogFar: 25.5,
      fieldColor: "#334a55",
      glowColor: "#a3d4c0",
      backgroundStrength: 1.06
    },
    motion: {
      drift: 0.012,
      parallax: 0.016,
      signal: 0.5
    }
  },
  program: {
    camera: {
      mobile: { position: [0.26, -0.3, 12.7], target: [0, -1.74, 0], fov: 26 },
      tablet: { position: [0.3, -0.18, 11.5], target: [0, -1.7, 0], fov: 25.5 },
      desktop: { position: [0.34, -0.08, 10.6], target: [0, -1.66, 0], fov: 25 }
    },
    root: {
      position: [0, -0.02, 0],
      rotation: [0.16, -0.44, 0.02],
      scale: 1.03
    },
    layers: {
      spine: 0.76,
      labs: 0.38,
      program: 1,
      network: 0.28
    },
    emphasis: {
      labsLift: 0.02,
      programLift: -0.18,
      networkLift: 0.02,
      cutDepth: 0.34
    },
    lighting: {
      ambient: 1.18,
      key: 1.34,
      fill: 0.84,
      rim: 0.88,
      accent: 0.4
    },
    atmosphere: {
      fogColor: "#607078",
      fogNear: 15,
      fogFar: 25.5,
      fieldColor: "#314652",
      glowColor: "#99b6da",
      backgroundStrength: 1.04
    },
    motion: {
      drift: 0.012,
      parallax: 0.014,
      signal: 0.56
    }
  },
  network: {
    camera: {
      mobile: { position: [0.54, 2.42, 13.2], target: [0, 3.1, 0], fov: 25.5 },
      tablet: { position: [0.6, 2.34, 11.9], target: [0, 3.08, 0], fov: 25 },
      desktop: { position: [0.68, 2.26, 10.9], target: [0, 3.06, 0], fov: 24.5 }
    },
    root: {
      position: [0, 0.08, 0],
      rotation: [0.22, -0.56, -0.02],
      scale: 1.01
    },
    layers: {
      spine: 0.7,
      labs: 0.34,
      program: 0.2,
      network: 1
    },
    emphasis: {
      labsLift: 0.02,
      programLift: -0.04,
      networkLift: 0.18,
      cutDepth: 0.3
    },
    lighting: {
      ambient: 1.14,
      key: 1.42,
      fill: 0.78,
      rim: 1.1,
      accent: 0.48
    },
    atmosphere: {
      fogColor: "#5c6a70",
      fogNear: 15,
      fogFar: 26,
      fieldColor: "#2d424a",
      glowColor: "#c5d9a4",
      backgroundStrength: 1.02
    },
    motion: {
      drift: 0.013,
      parallax: 0.014,
      signal: 0.48
    }
  },
  closing: {
    camera: {
      mobile: { position: [0.42, 1.04, 13.4], target: [0, 0.68, 0], fov: 25 },
      tablet: { position: [0.52, 1.02, 12.2], target: [0, 0.66, 0], fov: 24.5 },
      desktop: { position: [0.58, 0.98, 11.4], target: [0, 0.64, 0], fov: 24 }
    },
    root: {
      position: [0, 0.02, 0],
      rotation: [0.17, -0.48, 0.01],
      scale: 0.99
    },
    layers: {
      spine: 0.74,
      labs: 0.58,
      program: 0.4,
      network: 0.44
    },
    emphasis: {
      labsLift: 0,
      programLift: -0.02,
      networkLift: 0.02,
      cutDepth: 0.14
    },
    lighting: {
      ambient: 1.08,
      key: 1.18,
      fill: 0.66,
      rim: 0.8,
      accent: 0.26
    },
    atmosphere: {
      fogColor: "#566369",
      fogNear: 16,
      fogFar: 27,
      fieldColor: "#2a383f",
      glowColor: "#799097",
      backgroundStrength: 0.9
    },
    motion: {
      drift: 0.008,
      parallax: 0.01,
      signal: 0.2
    }
  }
};
