import { useMemo, useState } from "react";
import {
  geoGraticule,
  geoOrthographic,
  geoPath
} from "d3-geo";
import type { Feature, FeatureCollection, Geometry, LineString, MultiPolygon } from "geojson";
import { feature, merge } from "topojson-client";
import usAtlasData from "us-atlas/states-10m.json";
import { type HostCity, type RoleChapter } from "../content";

type RolesVisualStageProps = {
  progress: number;
  activeChapterId: RoleChapter["id"];
  chapters: RoleChapter[];
};

type UsAtlasShape = {
  type: "Topology";
  objects: {
    states: {
      type: string;
      geometries: Array<{
        id: string | number;
      }>;
    };
  };
};

const atlas = usAtlasData as unknown as UsAtlasShape;

const LOWER_48_EXCLUSIONS = new Set([2, 15, 60, 66, 69, 72, 78]);

const LOWER_48_FEATURES = feature(
  atlas as never,
  atlas.objects.states as never
) as unknown as FeatureCollection<Geometry>;

const LOWER_48_STATES = LOWER_48_FEATURES.features.filter(
  (item) => !LOWER_48_EXCLUSIONS.has(Number(item.id))
) as Array<Feature<Geometry>>;

const LOWER_48_LAND = merge(
  atlas as never,
  atlas.objects.states.geometries.filter(
    (geometry) => !LOWER_48_EXCLUSIONS.has(Number(geometry.id))
  ) as never
) as MultiPolygon;

const chapterStops: Record<RoleChapter["id"], number> = {
  labs: 0,
  program: 0.46,
  network: 0.84
};

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

function buildProgramDash(progress: number) {
  return 1 - smoothstep(0.36, 0.58, progress);
}

function buildGlobeDash(progress: number) {
  return 1 - smoothstep(0.76, 0.92, progress);
}

function getCalloutStyle(
  callout: NonNullable<RoleChapter["callouts"]>[number],
  active: boolean
) {
  const translateX =
    callout.align === "right" ? 16 : callout.align === "center" ? 0 : -16;

  return {
    left: `${callout.x}%`,
    top: `${callout.y}%`,
    transform: `translate(${translateX}px, -50%)`,
    opacity: active ? 1 : 0
  };
}

function RolesVisualStage({
  progress,
  activeChapterId,
  chapters
}: RolesVisualStageProps) {
  const [hoveredCity, setHoveredCity] = useState<string | null>(null);

  const labsVisibility = fadeBetween(progress, 0, 0.08, 0.28, 0.46);
  const programVisibility = fadeBetween(progress, 0.28, 0.46, 0.64, 0.82);
  const globeVisibility = fadeBetween(progress, 0.7, 0.86, 1.02, 1.12);

  const labsCompress = smoothstep(0.28, 0.46, progress);
  const programEnter = smoothstep(0.28, 0.46, progress);
  const programExit = smoothstep(0.64, 0.82, progress);
  const globeEnter = smoothstep(0.7, 0.9, progress);

  const globeProjection = useMemo(() => {
    const projection = geoOrthographic()
      .translate([470, 340])
      .scale(mix(170, 236, globeEnter))
      .clipAngle(90)
      .rotate([mix(106, 98, globeEnter), mix(-42, -36, globeEnter)]);

    return projection;
  }, [globeEnter]);

  const path = useMemo(() => geoPath(globeProjection), [globeProjection]);
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

  const activeCallouts =
    chapters.find((chapter) => chapter.id === activeChapterId)?.callouts ?? [];

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
        d: path(arc) ?? ""
      };
    });
  }, [path, projectedCities]);

  return (
    <div className={`roles-scene roles-scene--${activeChapterId}`}>
      <div className="roles-scene__backdrop" />
      <div className="roles-scene__glow" />

      <div
        className="roles-scene__layer roles-scene__layer--labs"
        style={{
          opacity: labsVisibility,
          transform: `translate3d(${mix(0, -64, labsCompress)}px, ${mix(0, -24, labsCompress)}px, 0) scale(${mix(1, 0.86, labsCompress)})`
        }}
      >
        <svg
          className="roles-scene__svg"
          viewBox="0 0 960 720"
          role="presentation"
        >
          <defs>
            <linearGradient id="labs-top-left" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#34454f" />
              <stop offset="100%" stopColor="#1d242a" />
            </linearGradient>
            <linearGradient id="labs-top-right" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#3c4c57" />
              <stop offset="100%" stopColor="#232a31" />
            </linearGradient>
            <linearGradient id="labs-front" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#192026" />
              <stop offset="100%" stopColor="#0d1217" />
            </linearGradient>
            <linearGradient id="labs-spine" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#64887d" />
              <stop offset="100%" stopColor="#1b2b29" />
            </linearGradient>
          </defs>

          <ellipse className="scene-labs__shadow" cx="490" cy="578" rx="290" ry="86" />

          <polygon className="scene-labs__building" points="176,188 296,134 382,192 260,246" />
          <polygon className="scene-labs__building" points="592,188 714,134 800,192 678,246" />

          <polygon className="scene-labs__deck-top" points="146,314 314,232 490,314 324,398" />
          <polygon className="scene-labs__deck-face" points="146,314 146,462 324,548 324,398" />
          <polygon className="scene-labs__deck-side" points="324,398 490,314 490,468 324,548" />

          <polygon className="scene-labs__deck-top scene-labs__deck-top--right" points="468,314 636,232 812,314 646,398" />
          <polygon className="scene-labs__deck-face" points="468,314 468,468 646,548 646,398" />
          <polygon className="scene-labs__deck-side" points="646,398 812,314 812,462 646,548" />

          <polygon className="scene-labs__spine-top" points="430,240 520,196 608,240 518,286" />
          <polygon className="scene-labs__spine-face" points="430,240 430,506 518,556 518,286" />
          <polygon className="scene-labs__spine-side" points="518,286 608,240 608,504 518,556" />

          <g className="scene-labs__bridges">
            <polygon points="282,334 438,258 452,274 296,350" />
            <polygon points="282,408 438,332 452,348 296,424" />
            <polygon points="508,274 664,350 648,366 494,290" />
            <polygon points="508,348 664,424 648,440 494,364" />
          </g>

          <g className="scene-labs__modules">
            {[
              [198, 318],
              [228, 392],
              [282, 346],
              [560, 292],
              [612, 338],
              [572, 410]
            ].map(([x, y]) => (
              <g key={`${x}-${y}`} transform={`translate(${x} ${y})`}>
                <polygon points="0,0 44,-20 76,0 32,20" />
                <polygon points="0,0 0,40 32,58 32,20" />
                <polygon points="32,20 76,0 76,40 32,58" />
              </g>
            ))}
          </g>

          <g
            className="scene-labs__signals"
            style={{ opacity: mix(0.55, 1, 1 - labsCompress) }}
          >
            <path d="M 300 348 L 448 278" pathLength={1} style={{ strokeDasharray: 1, strokeDashoffset: 1 - smoothstep(0.02, 0.14, progress) }} />
            <path d="M 300 424 L 448 352" pathLength={1} style={{ strokeDasharray: 1, strokeDashoffset: 1 - smoothstep(0.08, 0.2, progress) }} />
            <path d="M 496 282 L 644 354" pathLength={1} style={{ strokeDasharray: 1, strokeDashoffset: 1 - smoothstep(0.1, 0.22, progress) }} />
            <path d="M 496 358 L 644 430" pathLength={1} style={{ strokeDasharray: 1, strokeDashoffset: 1 - smoothstep(0.14, 0.26, progress) }} />
          </g>
        </svg>
      </div>

      <div
        className="roles-scene__layer roles-scene__layer--program"
        style={{
          opacity: programVisibility,
          transform: `translate3d(${mix(56, -36, programExit)}px, ${mix(34, -18, programExit)}px, 0) scale(${mix(0.82, 1.03, programEnter) - programExit * 0.13})`
        }}
      >
        <svg
          className="roles-scene__svg"
          viewBox="0 0 960 720"
          role="presentation"
        >
          <defs>
            <linearGradient id="program-track" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#6b8a7d" />
              <stop offset="100%" stopColor="#224038" />
            </linearGradient>
            <linearGradient id="program-surface" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#394750" />
              <stop offset="100%" stopColor="#20262c" />
            </linearGradient>
          </defs>

          <ellipse className="scene-program__shadow" cx="520" cy="562" rx="266" ry="74" />

          <path
            className="scene-program__track scene-program__track--outer"
            d="M 308 382 C 308 272, 394 198, 516 198 C 666 198, 774 296, 774 424 C 774 552, 660 636, 518 636 C 390 636, 304 556, 304 458"
            pathLength={1}
            style={{
              strokeDasharray: 1,
              strokeDashoffset: buildProgramDash(progress)
            }}
          />

          <path
            className="scene-program__track scene-program__track--inner"
            d="M 352 390 C 352 304, 422 244, 518 244 C 642 244, 726 322, 726 426 C 726 530, 640 590, 518 590 C 418 590, 354 530, 354 462"
          />

          <g className="scene-program__stations">
            <polygon points="250,262 344,218 434,262 342,308" />
            <polygon points="604,218 718,272 616,322 502,270" />
            <polygon points="644,470 742,422 814,470 716,520" />
            <polygon points="238,462 346,408 434,458 326,514" />
          </g>

          <g className="scene-program__cards">
            {[
              [358, 224],
              [654, 274],
              [676, 438],
              [330, 432]
            ].map(([x, y]) => (
              <g key={`${x}-${y}`} transform={`translate(${x} ${y})`}>
                <rect x={0} y={0} width={88} height={54} rx={12} />
                <rect x={14} y={14} width={58} height={8} rx={4} />
                <rect x={14} y={30} width={42} height={8} rx={4} />
              </g>
            ))}
          </g>

          <g className="scene-program__gates">
            <circle cx="514" cy="198" r="13" />
            <circle cx="774" cy="424" r="13" />
            <circle cx="520" cy="636" r="13" />
            <circle cx="304" cy="458" r="13" />
            <circle cx="308" cy="382" r="13" />
          </g>

          <g className="scene-program__spokes">
            <path d="M 514 210 L 514 296" />
            <path d="M 728 426 L 650 426" />
            <path d="M 520 546 L 520 624" />
            <path d="M 392 426 L 306 426" />
          </g>
        </svg>
      </div>

      <div
        className="roles-scene__layer roles-scene__layer--globe"
        style={{
          opacity: globeVisibility,
          transform: `translate3d(${mix(90, 0, globeEnter)}px, ${mix(24, -8, globeEnter)}px, 0) scale(${mix(0.7, 1.02, globeEnter)})`
        }}
      >
        <svg
          className="roles-scene__svg"
          viewBox="0 0 960 720"
          role="presentation"
        >
          <defs>
            <radialGradient id="globe-sphere" cx="40%" cy="34%" r="70%">
              <stop offset="0%" stopColor="#f5faf8" stopOpacity="0.96" />
              <stop offset="38%" stopColor="#d7e4de" stopOpacity="0.68" />
              <stop offset="100%" stopColor="#75867f" stopOpacity="0.16" />
            </radialGradient>
            <radialGradient id="globe-aura" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="rgba(112, 161, 137, 0.28)" />
              <stop offset="100%" stopColor="rgba(112, 161, 137, 0)" />
            </radialGradient>
          </defs>

          <circle className="scene-globe__aura" cx="470" cy="340" r="248" />
          <circle className="scene-globe__sphere" cx="470" cy="340" r={mix(170, 236, globeEnter)} />

          <path className="scene-globe__graticule" d={path(graticule) ?? ""} />
          <path className="scene-globe__landmass" d={path(LOWER_48_LAND) ?? ""} />
          {LOWER_48_STATES.map((stateShape) => (
            <path
              key={String(stateShape.id)}
              className="scene-globe__state"
              d={path(stateShape) ?? ""}
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
                  transform: `scale(${active ? 1.18 : 1})`
                }}
              >
                <circle className="scene-globe__pin-ring" r="11" />
                <circle className="scene-globe__pin-core" r="4.6" />
                {active ? (
                  <g className="scene-globe__pin-label" transform="translate(14 -16)">
                    <rect x="-6" y="-17" width="128" height="26" rx="12" />
                    <text x="8" y="0">
                      {city.label}, {city.state}
                    </text>
                  </g>
                ) : null}
              </g>
            );
          })}
        </svg>
      </div>

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
    </div>
  );
}

export { chapterStops };
export default RolesVisualStage;
