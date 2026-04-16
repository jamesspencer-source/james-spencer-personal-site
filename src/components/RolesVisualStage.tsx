import { useMemo, useState } from "react";
import { geoGraticule, geoOrthographic, geoPath } from "d3-geo";
import type { Feature, FeatureCollection, Geometry, LineString, MultiPolygon } from "geojson";
import { feature, merge } from "topojson-client";
import usAtlasData from "us-atlas/states-10m.json";
import worldLandData from "world-atlas/land-110m.json";
import { type HostCity, type RoleChapter } from "../content";

type RolesVisualStageProps = {
  progress: number;
  activeChapterId: RoleChapter["id"];
  chapters: RoleChapter[];
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
  program: 0.54,
  network: 0.82
};

const programStations = [
  { label: "Funding", x: 300, y: 246 },
  { label: "Hiring", x: 466, y: 188 },
  { label: "Lab setup", x: 646, y: 246 },
  { label: "Biosafety", x: 726, y: 418 },
  { label: "Delivery", x: 520, y: 560 },
  { label: "Closeout", x: 282, y: 456 }
];

function clamp01(value: number) {
  return Math.max(0, Math.min(1, value));
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
  return 1 - smoothstep(0.54, 0.7, progress);
}

function buildGlobeDash(progress: number) {
  return 1 - smoothstep(0.84, 1, progress);
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
    x: point[0] + (city.offsetX ?? 0),
    y: point[1] + (city.offsetY ?? 0)
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
  chapters
}: RolesVisualStageProps) {
  const [hoveredCity, setHoveredCity] = useState<string | null>(null);

  const overviewVisibility = fadeBetween(progress, 0, 0.08, 0.2, 0.34);
  const labsVisibility = fadeBetween(progress, 0.2, 0.34, 0.48, 0.62);
  const programVisibility = fadeBetween(progress, 0.48, 0.62, 0.74, 0.88);
  const globeVisibility = fadeBetween(progress, 0.74, 0.88, 1.02, 1.12);

  const overviewCompress = smoothstep(0.18, 0.34, progress);
  const labsCompress = smoothstep(0.48, 0.62, progress);
  const programEnter = smoothstep(0.48, 0.62, progress);
  const programExit = smoothstep(0.74, 0.88, progress);
  const globeEnter = smoothstep(0.76, 0.94, progress);

  const globeProjection = useMemo(() => {
    return geoOrthographic()
      .translate([558, 350])
      .scale(mix(234, 324, globeEnter))
      .clipAngle(90)
      .rotate([mix(118, 99, globeEnter), mix(-18, -33, globeEnter)]);
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

  const networkVisual = useMemo(() => {
    const chapter = chapters.find((item) => item.id === "network");
    if (!chapter || chapter.visual.kind !== "network-globe") {
      return null;
    }

    return chapter.visual;
  }, [chapters]);

  const projectedCities = useMemo(
    () =>
      (networkVisual?.hostCities ?? [])
        .map((city) => projectHostCity(city, globeProjection))
        .filter(
          (city): city is HostCity & { x: number; y: number } => city !== null
        ),
    [globeProjection, networkVisual]
  );

  const routePaths = useMemo(() => {
    if (projectedCities.length < 2) {
      return [];
    }

    return projectedCities.slice(0, -1).map((city, index) => {
      const nextCity = projectedCities[index + 1];
      const arc = {
        type: "LineString",
        coordinates: [
          [city.longitude, city.latitude],
          [nextCity.longitude, nextCity.latitude]
        ]
      } as LineString;

      return {
        key: `${city.label}-${nextCity.label}`,
        d: globePath(arc) ?? ""
      };
    });
  }, [globePath, projectedCities]);

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
            <g className="scene-overview__card" transform="translate(70 168)">
              <rect className="scene-overview__card-frame" width="248" height="290" rx="28" />
              <text className="scene-overview__index" x="30" y="38">
                01
              </text>
              <text className="scene-overview__title" x="30" y="68">
                Laboratory
              </text>
              <text className="scene-overview__title" x="30" y="94">
                operations
              </text>

              <g transform="translate(34 122)">
                <polygon className="scene-overview__mini-building" points="8,28 68,28 88,42 28,42" />
                <polygon className="scene-overview__mini-building-side" points="8,28 28,42 28,144 8,130" />
                <polygon className="scene-overview__mini-building-front" points="28,42 88,42 88,158 28,144" />

                <polygon className="scene-overview__mini-building" points="136,44 196,44 216,58 156,58" />
                <polygon className="scene-overview__mini-building-side" points="136,44 156,58 156,142 136,130" />
                <polygon className="scene-overview__mini-building-front" points="156,58 216,58 216,154 156,142" />

                <rect className="scene-overview__mini-bridge" x="88" y="92" width="68" height="14" rx="7" />
                <rect className="scene-overview__mini-bridge" x="88" y="114" width="68" height="14" rx="7" />
              </g>

              <text className="scene-overview__caption" x="30" y="248">
                Two research labs
              </text>
              <text className="scene-overview__caption scene-overview__caption--soft" x="30" y="270">
                One shared operating backbone
              </text>
            </g>

            <g className="scene-overview__card" transform="translate(356 168)">
              <rect className="scene-overview__card-frame" width="248" height="290" rx="28" />
              <text className="scene-overview__index" x="30" y="38">
                02
              </text>
              <text className="scene-overview__title" x="30" y="68">
                Community
              </text>
              <text className="scene-overview__title" x="30" y="94">
                Phages
              </text>

              <g transform="translate(28 112)">
                <path
                  className="scene-overview__mini-cycle"
                  d="M 38 98 C 38 54, 74 24, 124 24 C 178 24, 214 60, 214 108 C 214 154, 176 188, 122 188 C 72 188, 38 156, 38 110"
                />
                <circle className="scene-overview__mini-node" cx="124" cy="24" r="8" />
                <circle className="scene-overview__mini-node" cx="214" cy="108" r="8" />
                <circle className="scene-overview__mini-node" cx="122" cy="188" r="8" />
                <circle className="scene-overview__mini-node" cx="38" cy="110" r="8" />
                <circle className="scene-overview__mini-node scene-overview__mini-node--soft" cx="72" cy="52" r="6" />
                <circle className="scene-overview__mini-node scene-overview__mini-node--soft" cx="186" cy="62" r="6" />
              </g>

              <text className="scene-overview__caption" x="30" y="248">
                Annual program delivery
              </text>
              <text className="scene-overview__caption scene-overview__caption--soft" x="30" y="270">
                One repeatable operating cycle
              </text>
            </g>

            <g className="scene-overview__card" transform="translate(642 168)">
              <rect className="scene-overview__card-frame" width="248" height="290" rx="28" />
              <text className="scene-overview__index" x="30" y="38">
                03
              </text>
              <text className="scene-overview__title" x="30" y="68">
                Network
              </text>
              <text className="scene-overview__title" x="30" y="94">
                leadership
              </text>

              <g transform="translate(0 -2)">
                <circle className="scene-overview__mini-globe-aura" cx="124" cy="158" r="88" />
                <circle className="scene-overview__mini-globe" cx="124" cy="158" r="72" />
                <path className="scene-overview__mini-graticule" d={overviewGlobePath(graticule) ?? ""} />
                <path className="scene-overview__mini-land" d={overviewGlobePath(LOWER_48_LAND) ?? ""} />
                <path className="scene-overview__mini-route" d="M 92 146 C 112 118, 146 116, 164 138" />
                <circle className="scene-overview__mini-pin" cx="96" cy="150" r="5" />
                <circle className="scene-overview__mini-pin" cx="136" cy="126" r="5" />
                <circle className="scene-overview__mini-pin" cx="160" cy="160" r="5" />
              </g>

              <text className="scene-overview__caption" x="30" y="248">
                Regional and national convenings
              </text>
              <text className="scene-overview__caption scene-overview__caption--soft" x="30" y="270">
                Professional community leadership
              </text>
            </g>
          </g>
        </svg>
      </div>

      <div
        className="roles-scene__layer roles-scene__layer--labs"
        style={{
          opacity: labsVisibility,
          transform: `translate3d(${mix(0, -52, labsCompress)}px, ${mix(-10, -24, labsCompress)}px, 0) scale(${mix(0.98, 0.9, labsCompress)})`
        }}
      >
        <svg className="roles-scene__svg" viewBox="0 0 960 720" role="presentation">
          <defs>
            <linearGradient id="labs-glass" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#4f6776" />
              <stop offset="100%" stopColor="#1b232a" />
            </linearGradient>
            <linearGradient id="labs-glass-side" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#394954" />
              <stop offset="100%" stopColor="#11171c" />
            </linearGradient>
            <linearGradient id="labs-concrete" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#343d46" />
              <stop offset="100%" stopColor="#171c21" />
            </linearGradient>
            <linearGradient id="labs-highlight" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#a6d5bf" />
              <stop offset="100%" stopColor="#5d7e72" />
            </linearGradient>
          </defs>

          <ellipse className="scene-labs__shadow" cx="488" cy="586" rx="294" ry="58" />

          <path className="scene-labs__ground" d="M 132 568 L 836 568" />
          <path className="scene-labs__ground scene-labs__ground--minor" d="M 178 596 L 794 596" />

          <g className="scene-labs__structure">
            <polygon className="scene-labs__him-roof" points="236,180 366,180 412,208 282,208" />
            <polygon className="scene-labs__him-side" points="236,180 282,208 282,520 236,490" />
            <polygon className="scene-labs__him-main" points="282,208 412,208 412,546 282,520" />

            <polygon className="scene-labs__connector-roof" points="382,326 500,326 546,356 426,356" />
            <polygon className="scene-labs__connector-front" points="426,356 546,356 546,438 426,438" />
            <polygon className="scene-labs__connector-side" points="546,356 598,390 598,472 546,438" />

            <polygon className="scene-labs__veritas-roof" points="500,164 708,164 774,206 566,206" />
            <polygon className="scene-labs__veritas-edge" points="500,164 566,206 566,520 500,478" />
            <polygon className="scene-labs__veritas-front" points="566,206 774,206 774,522 566,520" />
            <polygon className="scene-labs__veritas-side" points="774,206 840,248 840,564 774,522" />

            <polygon className="scene-labs__podium-roof" points="388,350 626,350 700,396 462,396" />
            <polygon className="scene-labs__podium-front" points="462,396 700,396 700,524 462,524" />
            <polygon className="scene-labs__podium-side" points="700,396 780,444 780,572 700,524" />

            <polygon className="scene-labs__auditorium-roof" points="272,388 386,388 426,414 312,414" />
            <polygon className="scene-labs__auditorium-front" points="312,414 426,414 426,518 312,518" />
            <polygon className="scene-labs__auditorium-side" points="426,414 470,444 470,548 426,518" />
            <ellipse className="scene-labs__auditorium-dome" cx="350" cy="412" rx="42" ry="20" />
          </g>

          <g className="scene-labs__rooftop">
            {[
              { x: 294, y: 188, width: 22, height: 14 },
              { x: 320, y: 188, width: 22, height: 14 },
              { x: 346, y: 188, width: 22, height: 14 },
              { x: 372, y: 188, width: 22, height: 14 }
            ].map((unit) => (
              <rect
                key={`${unit.x}-${unit.y}`}
                className="scene-labs__roof-unit"
                x={unit.x}
                y={unit.y}
                width={unit.width}
                height={unit.height}
                rx="3"
              />
            ))}
            <circle className="scene-labs__roof-fan" cx="302" cy="202" r="10" />
            <circle className="scene-labs__roof-fan" cx="336" cy="202" r="10" />
            <path className="scene-labs__roof-rail" d="M 278 188 L 400 188" />
            <path className="scene-labs__roof-arch" d="M 350 206 Q 382 158 412 206" />

            {Array.from({ length: 8 }).map((_, index) => {
              const x = 588 + index * 22;
              return (
                <rect
                  key={`stack-${x}`}
                  className="scene-labs__roof-stack"
                  x={x}
                  y="172"
                  width="8"
                  height="24"
                  rx="3"
                />
              );
            })}
          </g>

          <g className="scene-labs__floors">
            {Array.from({ length: 9 }).map((_, index) => {
              const y = 238 + index * 30;
              return (
                <g key={y}>
                  <path className="scene-labs__floor-line" d={`M 288 ${y} L 408 ${y}`} />
                  <path className="scene-labs__floor-line" d={`M 574 ${y + 12} L 770 ${y + 12}`} />
                </g>
              );
            })}
          </g>

          <g className="scene-labs__podium-lines">
            {Array.from({ length: 4 }).map((_, index) => {
              const y = 420 + index * 22;
              return (
                <path
                  key={y}
                  className="scene-labs__podium-line"
                  d={`M 470 ${y} L 694 ${y}`}
                />
              );
            })}
          </g>

          <g className="scene-labs__windows">
            {Array.from({ length: 6 }).map((_, column) => {
              const x = 300 + column * 18;
              return <path key={x} className="scene-labs__window-line" d={`M ${x} 214 L ${x} 514`} />;
            })}
            {Array.from({ length: 8 }).map((_, column) => {
              const x = 590 + column * 22;
              return <path key={x} className="scene-labs__window-line" d={`M ${x} 212 L ${x} 518`} />;
            })}
          </g>

          <g className="scene-labs__highlight-bands">
            <polygon points="282,258 412,258 412,280 282,280" />
            <polygon points="236,230 282,258 282,280 236,252" />
            <polygon points="412,258 564,314 564,336 412,280" />
            <polygon points="564,314 774,314 774,336 564,336" />
            <polygon points="774,314 840,356 840,378 774,336" />
          </g>

          <g className="scene-labs__bridges">
            <polygon points="424,342 544,342 544,362 424,362" />
          </g>

          <g className="scene-labs__floor-markers">
            <text x="446" y="276">10</text>
            <text x="658" y="332">09</text>
          </g>

          <g
            className="scene-labs__signals"
            style={{ opacity: mix(0.6, 1, 1 - labsCompress) }}
          >
            <path
              d="M 422 270 L 560 324"
              pathLength={1}
              style={{
                strokeDasharray: 1,
                strokeDashoffset: 1 - smoothstep(0.04, 0.16, progress)
              }}
            />
            <path
              d="M 434 276 L 574 330"
              pathLength={1}
              style={{
                strokeDasharray: 1,
                strokeDashoffset: 1 - smoothstep(0.1, 0.22, progress)
              }}
            />
          </g>

          <g className="scene-labs__labels">
            <text x="322" y="606">Harvard Institutes of Medicine</text>
            <text x="636" y="606">Veritas Science Center</text>
          </g>
        </svg>
      </div>

      <div
        className="roles-scene__layer roles-scene__layer--program"
        style={{
          opacity: programVisibility,
          transform: `translate3d(${mix(54, -28, programExit)}px, ${mix(28, -10, programExit)}px, 0) scale(${mix(0.84, 1.02, programEnter) - programExit * 0.1})`
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
            className="scene-program__track scene-program__track--inner"
            d="M 330 388 C 330 304, 402 248, 504 248 C 624 248, 704 326, 704 428 C 704 528, 622 578, 504 578 C 404 578, 330 516, 330 436"
          />

          <g className="scene-program__connectors">
            <path d="M 504 244 L 504 306" />
            <path d="M 672 278 L 640 334" />
            <path d="M 726 426 L 662 426" />
            <path d="M 610 558 L 566 520" />
            <path d="M 394 560 L 430 520" />
            <path d="M 312 430 L 372 430" />
          </g>

          <g className="scene-program__stations">
            {programStations.map((station, index) => {
              const width = station.label.length > 10 ? 112 : 94;
              return (
                <g
                  key={station.label}
                  transform={`translate(${station.x - width / 2} ${station.y - 24})`}
                  style={{
                    opacity: clamp01(programEnter * 1.15 - index * 0.08),
                    transform: `translateY(${mix(18, 0, programEnter)}px)`
                  }}
                >
                  <rect width={width} height={48} rx={15} />
                  <text x={width / 2} y={29}>
                    {station.label}
                  </text>
                </g>
              );
            })}
          </g>

          <g className="scene-program__gates">
            <circle cx="504" cy="192" r="12" />
            <circle cx="750" cy="426" r="12" />
            <circle cx="500" cy="632" r="12" />
            <circle cx="282" cy="430" r="12" />
          </g>

          <g className="scene-program__core-labels">
            <text x="504" y="388">Annual operating cycle</text>
            <text x="504" y="416">Community Phages</text>
          </g>
        </svg>
      </div>

      <div
        className="roles-scene__layer roles-scene__layer--globe"
        style={{
          opacity: globeVisibility,
          transform: `translate3d(${mix(72, 0, globeEnter)}px, ${mix(14, -8, globeEnter)}px, 0) scale(${mix(0.74, 1.03, globeEnter)})`
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

          <circle className="scene-globe__aura" cx="558" cy="350" r="328" />
          <circle className="scene-globe__sphere" cx="558" cy="350" r={mix(234, 324, globeEnter)} />

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

          {routePaths.map((route, index) => (
            <path
              key={route.key}
              className="scene-globe__route"
              d={route.d}
              pathLength={1}
              style={{
                strokeDasharray: 1,
                strokeDashoffset: buildGlobeDash(progress) + index * 0.08
              }}
            />
          ))}

          {projectedCities.map((city, index) => {
            const active = hoveredCity === city.label;
            const label = `${city.label}, ${city.state}${city.year ? ` · ${city.year}` : ""}`;
            const labelWidth = Math.max(138, label.length * 6.4);
            const passiveWidth = Math.max(72, city.label.length * 6 + 20);
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
                  opacity: clamp01(globeEnter * 1.15 - index * 0.08),
                  transform: `scale(${active ? 1.16 : 1})`
                }}
              >
                <circle className="scene-globe__pin-aura" r="20" />
                <circle className="scene-globe__pin-ring" r="11" />
                <circle className="scene-globe__pin-core" r="4.6" />
                <g className="scene-globe__pin-city" transform="translate(14 -16)">
                  <rect x="-6" y="-17" width={passiveWidth} height="24" rx="12" />
                  <text x="8" y="-1">
                    {city.label}
                  </text>
                </g>
                {active ? (
                  <g className="scene-globe__pin-label" transform="translate(14 -16)">
                    <rect x="-6" y="12" width={labelWidth} height="28" rx="12" />
                    <text x="8" y="30">
                      {label}
                    </text>
                  </g>
                ) : null}
              </g>
            );
          })}
        </svg>
      </div>

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
