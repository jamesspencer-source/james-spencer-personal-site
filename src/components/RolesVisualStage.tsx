import { useMemo, useState } from "react";
import { geoGraticule, geoOrthographic, geoPath } from "d3-geo";
import type { Feature, FeatureCollection, Geometry, LineString, MultiPolygon } from "geojson";
import { feature, merge } from "topojson-client";
import usAtlasData from "us-atlas/states-10m.json";
import worldLandData from "world-atlas/land-110m.json";
import { type HostCity, type RoleChapter } from "../content";
import LabBuildingsScene from "./LabBuildingsScene";

type RolesVisualStageProps = {
  progress: number;
  activeChapterId: RoleChapter["id"];
  chapters: RoleChapter[];
  staticMode?: boolean;
};

type TopologyShape = {
  type: "Topology";
  objects: Record<string, unknown>;
};

const usAtlas = usAtlasData as unknown as TopologyShape;
const worldAtlas = worldLandData as unknown as TopologyShape;

const LOWER_48_EXCLUSIONS = new Set([2, 15, 60, 66, 69, 72, 78]);

const LOWER_48_FEATURES = feature(
  usAtlas as never,
  usAtlas.objects.states as never
) as unknown as FeatureCollection<Geometry>;

const LOWER_48_STATES = LOWER_48_FEATURES.features.filter(
  (item) => !LOWER_48_EXCLUSIONS.has(Number(item.id))
) as Array<Feature<Geometry>>;

const LOWER_48_LAND = merge(
  usAtlas as never,
  (usAtlas.objects.states as { geometries: Array<{ id: string | number }> }).geometries.filter(
    (geometry) => !LOWER_48_EXCLUSIONS.has(Number(geometry.id))
  ) as never
) as MultiPolygon;

const WORLD_LAND = feature(
  worldAtlas as never,
  worldAtlas.objects.land as never
) as unknown as Feature<Geometry>;

const chapterStops: Record<RoleChapter["id"], number> = {
  overview: 0,
  labs: 0.24,
  program: 0.52,
  network: 0.86
};

const programStations = [
  { label: "Funding", detail: "Budget + partner setup", x: 96, y: 224 },
  { label: "Hiring", detail: "Interviews + onboarding", x: 374, y: 80 },
  { label: "Lab setup", detail: "Benches + supplies", x: 654, y: 224 },
  { label: "Biosafety", detail: "Training + access", x: 654, y: 386 },
  { label: "Delivery", detail: "Daily program support", x: 374, y: 574 },
  { label: "Closeout", detail: "Space reset + wrap-up", x: 96, y: 438 }
];

const programStationCard = {
  width: 212,
  height: 78
};

const programConnectorPaths = [
  "M 504 244 L 504 306",
  "M 672 278 L 640 334",
  "M 726 426 L 662 426",
  "M 610 558 L 566 520",
  "M 394 560 L 430 520",
  "M 312 430 L 372 430"
] as const;

const PROGRAM_SEQUENCE_START = 0.52;
const PROGRAM_SEQUENCE_END = 0.8;
const GLOBE_SEQUENCE_START = 0.78;
const GLOBE_SEQUENCE_END = 0.91;
const DOCUMENTARY_SEQUENCE_START = 0.91;
const DOCUMENTARY_SEQUENCE_END = 1;

const globeRouteConnections = [
  ["Washington, DC", "Boston"],
  ["Boston", "San Francisco"],
  ["San Francisco", "New York City"]
] as const;

const GLOBE_VIEWBOX_WIDTH = 960;
const GLOBE_VIEWBOX_HEIGHT = 720;
const GLOBE_LABEL_TOP = -34;
const GLOBE_LABEL_BOTTOM = 18;
const GLOBE_LABEL_MAX_SCALE = 1.08;
const GLOBE_LABEL_PADDING = 22;

function clamp01(value: number) {
  return Math.max(0, Math.min(1, value));
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function mix(from: number, to: number, amount: number) {
  return from + (to - from) * amount;
}

function smoothstep(start: number, end: number, value: number) {
  const x = clamp01((value - start) / (end - start));
  return x * x * (3 - 2 * x);
}

function fadeBetween(
  value: number,
  enterStart: number,
  enterEnd: number,
  exitStart: number,
  exitEnd: number
) {
  return smoothstep(enterStart, enterEnd, value) * (1 - smoothstep(exitStart, exitEnd, value));
}

function buildProgramDash(progress: number) {
  return 1 - getProgramSequenceProgress(progress);
}

function getProgramSequenceProgress(progress: number) {
  return smoothstep(PROGRAM_SEQUENCE_START, PROGRAM_SEQUENCE_END, progress);
}

function projectHostCity(
  city: HostCity,
  projection: ReturnType<typeof geoOrthographic>
) {
  const point = projection([city.longitude, city.latitude]);

  if (!point) {
    return null;
  }

  return {
    ...city,
    x: point[0],
    y: point[1]
  };
}

function getHostRegionRadius(label: HostCity["label"]) {
  switch (label) {
    case "Boston":
      return 34;
    case "Washington, DC":
      return 38;
    case "San Francisco":
      return 35;
    case "New York City":
      return 32;
    default:
      return 30;
  }
}

function getSequenceEmphasis(sequenceProgress: number, index: number, total: number) {
  const center = total <= 1 ? 0.5 : index / (total - 1);
  return fadeBetween(sequenceProgress, center - 0.2, center - 0.08, center + 0.08, center + 0.2);
}

function getSequenceReveal(sequenceProgress: number, index: number, total: number) {
  const start = total <= 1 ? 0 : index / total;
  return smoothstep(start - 0.02, start + 0.08, sequenceProgress);
}

function getChronologicalReveal(sequenceProgress: number, index: number, total: number) {
  const start = total <= 1 ? 0 : index / total;
  return smoothstep(start - 0.04, start + 0.1, sequenceProgress);
}

function getGlobeAnnotation(city: HostCity & { x: number; y: number }) {
  const preferred = (() => {
    switch (city.label) {
      case "Washington, DC":
        return {
          x: -252,
          y: 38,
          width: 232,
          detail: "2023 + 2025 national conferences"
        };
      case "Boston":
        return {
          x: 36,
          y: -78,
          width: 210,
          detail: "2024 regional conference"
        };
      case "New York City":
        return {
          x: 42,
          y: 40,
          width: 212,
          detail: "2026 regional conference"
        };
      case "San Francisco":
        return {
          x: -246,
          y: -64,
          width: 226,
          detail: "2026 regional conference"
        };
      default:
        return { x: 28, y: -52, width: 188, detail: "Conference host site" };
    }
  })();

  const scaledWidth = preferred.width * GLOBE_LABEL_MAX_SCALE;
  const scaledTop = GLOBE_LABEL_TOP * GLOBE_LABEL_MAX_SCALE;
  const scaledBottom = GLOBE_LABEL_BOTTOM * GLOBE_LABEL_MAX_SCALE;

  const minX = GLOBE_LABEL_PADDING - city.x;
  const maxX = GLOBE_VIEWBOX_WIDTH - GLOBE_LABEL_PADDING - scaledWidth - city.x;
  const minY = GLOBE_LABEL_PADDING - city.y - scaledTop;
  const maxY = GLOBE_VIEWBOX_HEIGHT - GLOBE_LABEL_PADDING - scaledBottom - city.y;

  return {
    ...preferred,
    x: clamp(preferred.x, minX, maxX),
    y: clamp(preferred.y, minY, maxY)
  };
}

function getCalloutStyle(
  callout: NonNullable<RoleChapter["callouts"]>[number],
  active: boolean
) {
  if (!active) {
    return {
      left: `${callout.x}%`,
      top: `${callout.y}%`,
      opacity: 0,
      transform:
        callout.align === "center"
          ? "translate(-50%, calc(-50% + 10px))"
          : "translateY(10px)"
    };
  }

  if (callout.align === "center") {
    return {
      left: `${callout.x}%`,
      top: `${callout.y}%`,
      opacity: 1,
      transform: "translate(-50%, -50%)"
    };
  }

  return {
    left: `${callout.x}%`,
    top: `${callout.y}%`,
    opacity: 1,
    transform: "translateY(-50%)"
  };
}

function RolesVisualStage({
  progress,
  activeChapterId,
  chapters,
  staticMode = false
}: RolesVisualStageProps) {
  const [hoveredCity, setHoveredCity] = useState<string | null>(null);

  const overviewVisibility = fadeBetween(progress, 0, 0.08, 0.2, 0.34);
  const labsVisibility = fadeBetween(progress, 0.2, 0.34, 0.48, 0.62);
  const programVisibility = fadeBetween(progress, 0.48, 0.62, 0.82, 0.92);
  const globeVisibility = fadeBetween(progress, 0.76, 0.88, 1.08, 1.18);

  const overviewCompress = smoothstep(0.18, 0.34, progress);
  const labsCompress = smoothstep(0.48, 0.62, progress);
  const labsReveal = smoothstep(0.22, 0.38, progress);
  const labsDetail =
    smoothstep(0.3, 0.46, progress) * (1 - smoothstep(0.54, 0.62, progress));
  const programEnter = smoothstep(0.48, 0.62, progress);
  const programExit = smoothstep(0.82, 0.92, progress);
  const programStationsVisibility =
    smoothstep(0.6, 0.72, progress) * (1 - smoothstep(0.94, 0.99, progress));
  const programSequenceProgress = getProgramSequenceProgress(progress);
  const globeSequenceProgress = clamp01(
    (progress - GLOBE_SEQUENCE_START) / (GLOBE_SEQUENCE_END - GLOBE_SEQUENCE_START)
  );
  const globeEnter = smoothstep(0.76, 0.88, progress);
  const documentaryEnter = smoothstep(
    DOCUMENTARY_SEQUENCE_START,
    DOCUMENTARY_SEQUENCE_END,
    progress
  );
  const documentaryVisibility = globeVisibility * documentaryEnter;
  const globeLayerVisibility = globeVisibility * mix(1, 0.24, documentaryEnter);

  const globeProjection = useMemo(() => {
    return geoOrthographic()
      .translate([558, 360])
      .scale(mix(238, 500, globeEnter))
      .clipAngle(90)
      .rotate([mix(118, 97, globeEnter), mix(-18, -37, globeEnter)]);
  }, [globeEnter]);

  const overviewGlobeProjection = useMemo(() => {
    return geoOrthographic()
      .translate([124, 158])
      .scale(68)
      .clipAngle(90)
      .rotate([104, -26]);
  }, []);

  const globePath = useMemo(() => geoPath(globeProjection), [globeProjection]);
  const overviewGlobePath = useMemo(
    () => geoPath(overviewGlobeProjection),
    [overviewGlobeProjection]
  );
  const graticule = useMemo(() => geoGraticule().step([15, 15])(), []);

  const networkChapter = useMemo(
    () => chapters.find((item) => item.id === "network") ?? null,
    [chapters]
  );

  const networkVisual = useMemo(() => {
    if (!networkChapter || networkChapter.visual.kind !== "network-globe") {
      return null;
    }

    return networkChapter.visual;
  }, [networkChapter]);

  const documentaryBeat = networkChapter?.documentaryBeat ?? null;

  const projectedCities = useMemo(
    () =>
      (networkVisual?.hostCities ?? [])
        .map((city) => projectHostCity(city, globeProjection))
        .filter(
          (city): city is HostCity & { x: number; y: number } => city !== null
        ),
    [globeProjection, networkVisual]
  );

  const overviewProjectedCities = useMemo(
    () =>
      (networkVisual?.hostCities ?? [])
        .map((city) => projectHostCity(city, overviewGlobeProjection))
        .filter(
          (city): city is HostCity & { x: number; y: number } => city !== null
        ),
    [networkVisual, overviewGlobeProjection]
  );

  const routePaths = useMemo(() => {
    const cities = networkVisual?.hostCities ?? [];
    if (cities.length < 2) {
      return [];
    }

    const cityByLabel = new Map(
      cities.map((city, index) => [city.label, { city, index }])
    );

    return globeRouteConnections.flatMap(([from, to]) => {
      const start = cityByLabel.get(from);
      const end = cityByLabel.get(to);

      if (!start || !end) {
        return [];
      }

      const arc = {
        type: "LineString",
        coordinates: [
          [start.city.longitude, start.city.latitude],
          [end.city.longitude, end.city.latitude]
        ]
      } as LineString;

      return [
        {
          key: `${from}-${to}`,
          d: globePath(arc) ?? "",
          revealIndex: Math.max(start.index, end.index)
        }
      ];
    });
  }, [globePath, networkVisual]);

  const overviewRoutePaths = useMemo(() => {
    const cities = networkVisual?.hostCities ?? [];
    if (cities.length < 2) {
      return [];
    }

    const cityByLabel = new Map(
      cities.map((city, index) => [city.label, { city, index }])
    );

    return globeRouteConnections.flatMap(([from, to]) => {
      const start = cityByLabel.get(from);
      const end = cityByLabel.get(to);

      if (!start || !end) {
        return [];
      }

      const arc = {
        type: "LineString",
        coordinates: [
          [start.city.longitude, start.city.latitude],
          [end.city.longitude, end.city.latitude]
        ]
      } as LineString;

      return [
        {
          key: `overview-${from}-${to}`,
          d: overviewGlobePath(arc) ?? ""
        }
      ];
    });
  }, [networkVisual, overviewGlobePath]);

  const globeFocusLabel = hoveredCity;

  const activeCallouts =
    chapters.find((chapter) => chapter.id === activeChapterId)?.callouts ?? [];

  return (
    <div className={`roles-scene roles-scene--${activeChapterId}`}>
      <div className="roles-scene__backdrop" />
      <div className="roles-scene__glow" />

      <div
        className="roles-scene__layer roles-scene__layer--overview"
        style={{
          opacity: overviewVisibility,
          transform: `translate3d(${mix(0, -40, overviewCompress)}px, ${mix(0, -18, overviewCompress)}px, 0) scale(${mix(1, 0.92, overviewCompress)})`
        }}
      >
        <svg className="roles-scene__svg" viewBox="0 0 960 720" role="presentation">
          <defs>
            <linearGradient id="overview-card" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="rgba(245, 249, 247, 0.13)" />
              <stop offset="100%" stopColor="rgba(245, 249, 247, 0.04)" />
            </linearGradient>
            <linearGradient id="overview-mini-track" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#9ecab3" />
              <stop offset="100%" stopColor="#4b675c" />
            </linearGradient>
          </defs>

          <g className="scene-overview__cards">
            <g className="scene-overview__card" transform="translate(42 136)">
              <rect className="scene-overview__card-frame" width="276" height="360" rx="28" />
              <text className="scene-overview__index" x="30" y="42">
                01
              </text>
              <text className="scene-overview__title" x="30" y="78">
                Laboratory
              </text>
              <text className="scene-overview__title" x="30" y="106">
                operations
              </text>

              <g transform="translate(30 132) scale(1.08)">
                <polygon className="scene-overview__mini-building" points="8,28 68,28 88,42 28,42" />
                <polygon className="scene-overview__mini-building-side" points="8,28 28,42 28,144 8,130" />
                <polygon className="scene-overview__mini-building-front" points="28,42 88,42 88,158 28,144" />

                <polygon className="scene-overview__mini-building" points="136,44 196,44 216,58 156,58" />
                <polygon className="scene-overview__mini-building-side" points="136,44 156,58 156,142 136,130" />
                <polygon className="scene-overview__mini-building-front" points="156,58 216,58 216,154 156,142" />

                <rect className="scene-overview__mini-bridge" x="88" y="92" width="68" height="14" rx="7" />
                <rect className="scene-overview__mini-bridge" x="88" y="114" width="68" height="14" rx="7" />
                <rect className="scene-overview__mini-bridge-pulse" x="88" y="92" width="34" height="14" rx="7" />
                <rect className="scene-overview__mini-bridge-pulse scene-overview__mini-bridge-pulse--delay" x="88" y="114" width="34" height="14" rx="7" />
              </g>

              <text className="scene-overview__caption" x="30" y="286">
                Two research labs
              </text>
              <text className="scene-overview__caption scene-overview__caption--soft" x="30" y="312">
                Coordinated lab
              </text>
              <text className="scene-overview__caption scene-overview__caption--soft" x="30" y="332">
                support
              </text>
            </g>

            <g className="scene-overview__card" transform="translate(342 136)">
              <rect className="scene-overview__card-frame" width="276" height="360" rx="28" />
              <text className="scene-overview__index" x="30" y="42">
                02
              </text>
              <text className="scene-overview__title" x="30" y="78">
                Community
              </text>
              <text className="scene-overview__title" x="30" y="106">
                Phages
              </text>

              <g transform="translate(24 126) scale(1.06)">
                <path
                  className="scene-overview__mini-cycle"
                  d="M 38 98 C 38 54, 74 24, 124 24 C 178 24, 214 60, 214 108 C 214 154, 176 188, 122 188 C 72 188, 38 156, 38 110"
                />
                <path
                  className="scene-overview__mini-cycle-pulse"
                  d="M 38 98 C 38 54, 74 24, 124 24 C 178 24, 214 60, 214 108 C 214 154, 176 188, 122 188 C 72 188, 38 156, 38 110"
                  pathLength={1}
                />
                <path className="scene-overview__mini-cycle-arrow" d="M 204 84 L 218 108 L 194 105" />
                <circle className="scene-overview__mini-node" cx="124" cy="24" r="8" />
                <circle className="scene-overview__mini-node" cx="214" cy="108" r="8" />
                <circle className="scene-overview__mini-node" cx="122" cy="188" r="8" />
                <circle className="scene-overview__mini-node" cx="38" cy="110" r="8" />
                <circle className="scene-overview__mini-node scene-overview__mini-node--soft" cx="72" cy="52" r="6" />
                <circle className="scene-overview__mini-node scene-overview__mini-node--soft" cx="186" cy="62" r="6" />
              </g>

              <text className="scene-overview__caption" x="30" y="286">
                Annual program delivery
              </text>
              <text className="scene-overview__caption scene-overview__caption--soft" x="30" y="312">
                Repeatable operating
              </text>
              <text className="scene-overview__caption scene-overview__caption--soft" x="30" y="332">
                cycle
              </text>
            </g>

            <g className="scene-overview__card" transform="translate(642 136)">
              <rect className="scene-overview__card-frame" width="276" height="360" rx="28" />
              <text className="scene-overview__index" x="30" y="42">
                03
              </text>
              <text className="scene-overview__title" x="30" y="78">
                Network
              </text>
              <text className="scene-overview__title" x="30" y="106">
                leadership
              </text>

              <g transform="translate(14 18) scale(1.05)">
                <circle className="scene-overview__mini-globe-aura" cx="124" cy="158" r="92" />
                <circle className="scene-overview__mini-globe" cx="124" cy="158" r="76" />
                <path className="scene-overview__mini-graticule" d={overviewGlobePath(graticule) ?? ""} />
                <path className="scene-overview__mini-land" d={overviewGlobePath(LOWER_48_LAND) ?? ""} />
                {overviewRoutePaths.map((route) => (
                  <path key={route.key} className="scene-overview__mini-route" d={route.d} />
                ))}
                {overviewProjectedCities.map((city) => (
                  <circle
                    key={`overview-pin-${city.label}`}
                    className="scene-overview__mini-pin"
                    cx={city.x}
                    cy={city.y}
                    r="4.5"
                  />
                ))}
              </g>

              <text className="scene-overview__caption" x="30" y="282">
                Regional and national
              </text>
              <text className="scene-overview__caption" x="30" y="306">
                conferences
              </text>
              <text className="scene-overview__caption scene-overview__caption--soft" x="30" y="332">
                Professional community
              </text>
              <text className="scene-overview__caption scene-overview__caption--soft" x="30" y="352">
                leadership
              </text>
            </g>
          </g>
        </svg>
      </div>

      <div
        className="roles-scene__layer roles-scene__layer--labs"
        style={{
          opacity: labsVisibility,
          transform: `translate3d(${mix(0, -26, labsCompress)}px, ${mix(-8, -18, labsCompress)}px, 0) scale(${mix(0.99, 0.94, labsCompress)})`
        }}
      >
        <LabBuildingsScene
          progress={progress}
          reveal={labsReveal}
          detail={labsDetail}
          compress={labsCompress}
          staticMode={staticMode}
        />
      </div>

      <div
        className="roles-scene__layer roles-scene__layer--program"
        style={{
          opacity: programVisibility,
          transform: `translate3d(${mix(28, -12, programExit)}px, ${mix(18, -8, programExit)}px, 0) scale(${mix(0.9, 1.02, programEnter) - programExit * 0.06})`
        }}
      >
        <svg className="roles-scene__svg" viewBox="0 0 960 720" role="presentation">
          <defs>
            <linearGradient id="program-track" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#86ab97" />
              <stop offset="100%" stopColor="#2a4940" />
            </linearGradient>
          </defs>

          <ellipse className="scene-program__shadow" cx="520" cy="586" rx="290" ry="62" />

          <g className="scene-program__workplane" style={{ opacity: mix(0.3, 1, programEnter) }}>
            <path d="M 218 432 C 242 270, 360 154, 520 154 C 706 154, 826 300, 814 468" />
            <path d="M 236 506 C 330 644, 560 688, 710 566" />
          </g>

          <path
            className="scene-program__track scene-program__track--outer"
            d="M 286 378 C 286 270, 378 192, 504 192 C 650 192, 750 292, 750 426 C 750 554, 640 632, 500 632 C 368 632, 282 544, 282 430"
            pathLength={1}
            style={{
              strokeDasharray: 1,
              strokeDashoffset: buildProgramDash(progress)
            }}
          />

          <path
            className="scene-program__track-arrow"
            d="M 740 393 L 759 426 L 724 422"
            style={{ opacity: smoothstep(0.6, 0.72, progress) }}
          />

          <path
            className="scene-program__track scene-program__track--inner"
            d="M 330 388 C 330 304, 402 248, 504 248 C 624 248, 704 326, 704 428 C 704 528, 622 578, 504 578 C 404 578, 330 516, 330 436"
          />

          <g className="scene-program__connectors">
            {programConnectorPaths.map((path, index) => {
              const emphasis = getSequenceEmphasis(
                programSequenceProgress,
                index,
                programConnectorPaths.length
              );
              const reveal = getSequenceReveal(
                programSequenceProgress,
                index,
                programConnectorPaths.length
              );

              return (
                <path
                  key={path}
                  d={path}
                  style={{
                    opacity: mix(0.16, 1, emphasis) * reveal,
                    strokeWidth: mix(2.8, 4.6, emphasis)
                  }}
                />
              );
            })}
          </g>

          <g className="scene-program__gates">
            {[
              { x: 504, y: 192, at: 0.12 },
              { x: 750, y: 426, at: 0.38 },
              { x: 500, y: 632, at: 0.64 },
              { x: 282, y: 430, at: 0.86 }
            ].map((gate) => {
              const gateEmphasis = smoothstep(
                gate.at - 0.08,
                gate.at + 0.06,
                programSequenceProgress
              );

              return (
                <circle
                  key={`${gate.x}-${gate.y}`}
                  cx={gate.x}
                  cy={gate.y}
                  r={mix(9, 14, gateEmphasis)}
                  style={{ opacity: mix(0.42, 1, gateEmphasis) }}
                />
              );
            })}
          </g>

          <g className="scene-program__stations">
            {programStations.map((station, index) => {
              const reveal = getSequenceReveal(
                programSequenceProgress,
                index,
                programStations.length
              );
              const yOffset = mix(18, 0, reveal);
              const emphasis = getSequenceEmphasis(
                programSequenceProgress,
                index,
                programStations.length
              );
              const scale = mix(0.94, mix(1, 1.04, emphasis), reveal);
              const translateX = station.x;
              const translateY = station.y + yOffset;
              const cardCenterX = programStationCard.width / 2;
              const cardCenterY = programStationCard.height / 2;

              return (
                <g
                  key={station.label}
                  transform={`translate(${translateX} ${translateY}) translate(${cardCenterX} ${cardCenterY}) scale(${scale}) translate(${-cardCenterX} ${-cardCenterY})`}
                  style={{
                    opacity:
                      reveal *
                      mix(0.68, 1, emphasis) *
                      clamp01(programStationsVisibility * 1.08)
                  }}
                >
                  <rect
                    className="scene-program__station-accent"
                    x={-6}
                    y={-6}
                    width={programStationCard.width + 12}
                    height={programStationCard.height + 12}
                    rx={18}
                    style={{ opacity: emphasis * 0.9 }}
                  />
                  <rect
                    className="scene-program__station-card"
                    width={programStationCard.width}
                    height={programStationCard.height}
                    rx={14}
                  />
                  <circle
                    className="scene-program__station-dot"
                    cx={25}
                    cy={50}
                    r={mix(4, 6.5, emphasis)}
                    style={{ opacity: mix(0.54, 1, emphasis) }}
                  />
                  <text className="scene-program__station-index" x={20} y={22}>
                    {String(index + 1).padStart(2, "0")}
                  </text>
                  <text className="scene-program__station-label" x={46} y={43}>
                    {station.label}
                  </text>
                  <text className="scene-program__station-detail" x={46} y={61}>
                    {station.detail}
                  </text>
                </g>
              );
            })}
          </g>

          <g className="scene-program__core-labels">
            <text x="504" y="388">Annual operating cycle</text>
            <text x="504" y="416">Community Phages</text>
            <g className="scene-program__header-progress">
              <rect x="438" y="436" width="132" height="3" rx="1.5" />
              <rect
                className="scene-program__header-progress-fill"
                x="438"
                y="436"
                width={132 * programSequenceProgress}
                height="3"
                rx="1.5"
              />
            </g>
          </g>
        </svg>
      </div>

      <div
        className="roles-scene__layer roles-scene__layer--globe"
        style={{
          opacity: globeLayerVisibility,
          transform: `translate3d(${mix(42, -4, globeEnter)}px, ${mix(14, -8, globeEnter)}px, 0) scale(${mix(0.78, 1.08, globeEnter)})`
        }}
      >
        <svg className="roles-scene__svg" viewBox="0 0 960 720" role="presentation">
          <defs>
            <radialGradient id="globe-sphere" cx="34%" cy="28%" r="72%">
              <stop offset="0%" stopColor="#eef5f1" stopOpacity="0.98" />
              <stop offset="30%" stopColor="#d5e4dc" stopOpacity="0.86" />
              <stop offset="100%" stopColor="#6a7c75" stopOpacity="0.24" />
            </radialGradient>
            <radialGradient id="globe-aura" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="rgba(131, 186, 157, 0.34)" />
              <stop offset="100%" stopColor="rgba(131, 186, 157, 0)" />
            </radialGradient>
          </defs>

          <circle className="scene-globe__aura" cx="558" cy="360" r="424" />
          <circle className="scene-globe__sphere" cx="558" cy="360" r={mix(238, 500, globeEnter)} />

          <path className="scene-globe__graticule" d={globePath(graticule) ?? ""} />
          <path className="scene-globe__world" d={globePath(WORLD_LAND) ?? ""} />
          <path className="scene-globe__landmass" d={globePath(LOWER_48_LAND) ?? ""} />
          {LOWER_48_STATES.map((stateShape) => (
            <path
              key={String(stateShape.id)}
              className="scene-globe__state"
              d={globePath(stateShape) ?? ""}
            />
          ))}

          {projectedCities.map((city, index) => {
            const radius = getHostRegionRadius(city.label);
            const reveal = getChronologicalReveal(
              globeSequenceProgress,
              index,
              projectedCities.length
            );
            const active = globeFocusLabel === city.label;
            const visualEmphasis = active ? 1 : reveal;

            return (
              <g
                key={`region-${city.label}`}
                className="scene-globe__region"
                transform={`translate(${city.x} ${city.y})`}
                style={{
                  opacity:
                    reveal *
                    mix(0.32, 0.9, visualEmphasis) *
                    clamp01(globeEnter * 1.08 - index * 0.04),
                  transform: `scale(${mix(0.82, active ? 1.2 : 1, visualEmphasis)})`
                }}
              >
                <circle className="scene-globe__region-glow" r={radius} />
                <circle className="scene-globe__region-ring" r={radius * 0.64} />
                <circle className="scene-globe__region-core" r={Math.max(7, radius * 0.22)} />
              </g>
            );
          })}

          {routePaths.map((route) => (
            (() => {
              const reveal = getChronologicalReveal(
                globeSequenceProgress,
                route.revealIndex,
                projectedCities.length
              );

              return (
                <g key={route.key} className="scene-globe__route-group">
                  <path
                    className="scene-globe__route scene-globe__route--glow"
                    d={route.d}
                    pathLength={1}
                    style={{
                      opacity: reveal * 0.32,
                      strokeWidth: mix(8, 13, reveal),
                      strokeDasharray: 1,
                      strokeDashoffset: 1 - reveal
                    }}
                  />
                  <path
                    className="scene-globe__route"
                    d={route.d}
                    pathLength={1}
                    style={{
                      opacity: reveal * 0.95,
                      strokeWidth: mix(2.4, 4.3, reveal),
                      strokeDasharray: 1,
                      strokeDashoffset: 1 - reveal
                    }}
                  />
                </g>
              );
            })()
          ))}

          {projectedCities.map((city, index) => {
            const reveal = getChronologicalReveal(
              globeSequenceProgress,
              index,
              projectedCities.length
            );
            const active = globeFocusLabel === city.label;
            const annotation = getGlobeAnnotation(city);
            const labelScale = mix(0.96, active ? 1.06 : 1, active ? 1 : reveal);
            const leaderX = annotation.x < 0 ? annotation.x + annotation.width : annotation.x;
            const leaderY = annotation.y - 8;
            return (
              <g
                key={`${city.label}-${city.year}`}
                className="scene-globe__pin"
                transform={`translate(${city.x} ${city.y})`}
                tabIndex={0}
                role="button"
                aria-label={`${city.label}, ${city.state}${city.year ? ` (${city.year})` : ""}`}
                onMouseEnter={() => setHoveredCity(city.label)}
                onMouseLeave={() => setHoveredCity(null)}
                onFocus={() => setHoveredCity(city.label)}
                onBlur={() => setHoveredCity(null)}
                onClick={() =>
                  setHoveredCity((current) => (current === city.label ? null : city.label))
                }
                style={{
                  opacity: reveal * clamp01(globeEnter * 1.15),
                  transform: `scale(${mix(0.86, active ? 1.2 : 1, active ? 1 : reveal)})`
                }}
              >
                <circle
                  className="scene-globe__pin-aura"
                  r={mix(18, active ? 36 : 26, active ? 1 : reveal)}
                />
                <circle className="scene-globe__pin-ring" r="15" />
                <circle className="scene-globe__pin-core" r="6.5" />
                <line
                  className="scene-globe__pin-label-leader"
                  x1="0"
                  y1="0"
                  x2={leaderX}
                  y2={leaderY}
                  style={{ opacity: reveal }}
                />
                <g
                  className="scene-globe__pin-label"
                  transform={`translate(${annotation.x} ${annotation.y}) scale(${labelScale})`}
                  style={{
                    opacity: reveal
                  }}
                >
                  <rect x="0" y="-34" width={annotation.width} height="52" rx="12" />
                  <text className="scene-globe__pin-label-city" x="14" y="-13">
                    {city.label}
                  </text>
                  <text className="scene-globe__pin-label-detail" x="14" y="4">
                    {annotation.detail}
                  </text>
                </g>
              </g>
            );
          })}

          <g
            className="scene-globe__legend"
            transform="translate(94 582)"
            style={{ opacity: clamp01(globeEnter * 1.12) }}
          >
            <rect width="430" height="82" rx="18" />
            <text x="22" y="28">Conference footprint</text>
            <text x="22" y="52">Regional and national conference sites appear chronologically.</text>
            <text x="22" y="69">Each location remains visible as the map progresses.</text>
          </g>
        </svg>
      </div>

      {documentaryBeat ? (
        <div
          className="roles-scene__layer roles-scene__layer--documentary"
          style={{
            opacity: documentaryVisibility,
            transform: `translate3d(${mix(56, 0, documentaryEnter)}px, ${mix(26, 0, documentaryEnter)}px, 0) scale(${mix(0.96, 1, documentaryEnter)})`
          }}
        >
          <figure className="roles-scene__documentary-panel">
            <img
              src={documentaryBeat.image.src}
              alt={documentaryBeat.image.alt}
              loading="lazy"
              decoding="async"
            />
            <figcaption className="roles-scene__documentary-caption">
              {documentaryBeat.caption}
            </figcaption>
            {documentaryBeat.credit ? (
              <p className="roles-scene__documentary-credit">{documentaryBeat.credit}</p>
            ) : null}
          </figure>
        </div>
      ) : null}

      {activeCallouts.length > 0 ? (
        <div className="roles-scene__callouts" aria-hidden="true">
          {activeCallouts.map((callout) => (
            <div
              key={callout.label}
              className={`roles-scene__callout roles-scene__callout--${callout.align ?? "left"}`}
              style={getCalloutStyle(callout, true)}
            >
              <span className="roles-scene__callout-dot" />
              <span className="roles-scene__callout-line" />
              <span className="roles-scene__callout-label">{callout.label}</span>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export { chapterStops };
export default RolesVisualStage;
