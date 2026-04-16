import { useEffect, useMemo, useRef, useState } from "react";
import gsap from "gsap";
import { type HostCity, type RoleChapter } from "../content";

type RolesVisualStageProps = {
  chapter: RoleChapter;
  reducedMotion: boolean;
};

type ProjectedPoint = {
  x: number;
  y: number;
  visible: boolean;
};

const GLOBE_CENTER_X = 208;
const GLOBE_CENTER_Y = 214;
const GLOBE_RADIUS = 144;
const GLOBE_LON = -96;
const GLOBE_LAT = 37;

const lower48Outline: Array<[number, number]> = [
  [-124.7, 48.6],
  [-124.2, 46.2],
  [-123.2, 43.7],
  [-122.4, 41.8],
  [-121.3, 39.8],
  [-119.7, 37.5],
  [-118.4, 35.2],
  [-117.1, 33.2],
  [-114.7, 32.6],
  [-111.0, 31.8],
  [-108.2, 31.3],
  [-106.5, 31.8],
  [-104.0, 29.9],
  [-100.4, 28.8],
  [-97.0, 26.2],
  [-90.6, 29.0],
  [-88.0, 30.4],
  [-85.0, 29.8],
  [-82.4, 28.9],
  [-80.3, 25.6],
  [-80.2, 27.8],
  [-80.6, 30.2],
  [-79.0, 32.2],
  [-77.0, 34.6],
  [-75.8, 36.3],
  [-75.1, 38.6],
  [-74.1, 40.9],
  [-71.2, 41.6],
  [-70.1, 43.4],
  [-69.5, 45.0],
  [-71.3, 45.7],
  [-73.4, 44.9],
  [-74.8, 43.9],
  [-76.3, 44.0],
  [-79.0, 43.4],
  [-82.8, 42.2],
  [-84.8, 46.0],
  [-89.8, 48.2],
  [-95.5, 49.0],
  [-104.0, 49.0],
  [-110.3, 48.9],
  [-116.2, 48.9],
  [-124.7, 48.6]
];

const globeGridLatitudes = [20, 30, 40, 50];
const globeGridLongitudes = [-120, -105, -90, -75];

function toRadians(value: number) {
  return (value * Math.PI) / 180;
}

function projectGlobePoint(
  longitude: number,
  latitude: number,
  centerLongitude = GLOBE_LON,
  centerLatitude = GLOBE_LAT
): ProjectedPoint {
  const lambda = toRadians(longitude);
  const phi = toRadians(latitude);
  const lambda0 = toRadians(centerLongitude);
  const phi0 = toRadians(centerLatitude);

  const cosc =
    Math.sin(phi0) * Math.sin(phi) +
    Math.cos(phi0) * Math.cos(phi) * Math.cos(lambda - lambda0);

  const x = GLOBE_RADIUS * Math.cos(phi) * Math.sin(lambda - lambda0);
  const y =
    GLOBE_RADIUS *
    (Math.cos(phi0) * Math.sin(phi) -
      Math.sin(phi0) * Math.cos(phi) * Math.cos(lambda - lambda0));

  return {
    x: GLOBE_CENTER_X + x,
    y: GLOBE_CENTER_Y - y,
    visible: cosc >= -0.06
  };
}

function buildProjectedPath(points: Array<[number, number]>) {
  return points
    .map(([longitude, latitude], index) => {
      const point = projectGlobePoint(longitude, latitude);
      return `${index === 0 ? "M" : "L"} ${point.x.toFixed(2)} ${point.y.toFixed(2)}`;
    })
    .join(" ");
}

function buildLatitudePath(latitude: number) {
  const points: string[] = [];

  for (let longitude = -130; longitude <= -64; longitude += 2) {
    const point = projectGlobePoint(longitude, latitude);
    if (!point.visible) {
      continue;
    }

    points.push(`${points.length === 0 ? "M" : "L"} ${point.x.toFixed(2)} ${point.y.toFixed(2)}`);
  }

  return points.join(" ");
}

function buildLongitudePath(longitude: number) {
  const points: string[] = [];

  for (let latitude = 22; latitude <= 54; latitude += 1.5) {
    const point = projectGlobePoint(longitude, latitude);
    if (!point.visible) {
      continue;
    }

    points.push(`${points.length === 0 ? "M" : "L"} ${point.x.toFixed(2)} ${point.y.toFixed(2)}`);
  }

  return points.join(" ");
}

function buildRoutePath(start: ProjectedPoint, end: ProjectedPoint) {
  const midpointX = (start.x + end.x) / 2;
  const midpointY = Math.min(start.y, end.y) - 42;
  return `M ${start.x.toFixed(2)} ${start.y.toFixed(2)} Q ${midpointX.toFixed(2)} ${midpointY.toFixed(2)} ${end.x.toFixed(2)} ${end.y.toFixed(2)}`;
}

function LabsSchematicPanel() {
  return (
    <svg
      className="roles-visual-panel roles-visual-panel--labs"
      viewBox="0 0 440 440"
      role="presentation"
    >
      <defs>
        <linearGradient id="labs-surface" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="rgba(255,255,255,0.76)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0.08)" />
        </linearGradient>
        <linearGradient id="labs-spine" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#61826f" />
          <stop offset="100%" stopColor="#30453b" />
        </linearGradient>
      </defs>

      <g className="js-visual-enter">
        <rect className="visual-labs__backplate" x="38" y="72" width="364" height="288" rx="28" />
        <rect className="visual-labs__deck" x="52" y="114" width="136" height="174" rx="20" />
        <rect className="visual-labs__deck" x="252" y="114" width="136" height="174" rx="20" />
        <rect className="visual-labs__spine" x="204" y="82" width="32" height="248" rx="14" />
        <rect className="visual-labs__rail" x="116" y="154" width="124" height="12" rx="6" />
        <rect className="visual-labs__rail" x="200" y="154" width="124" height="12" rx="6" />
        <rect className="visual-labs__rail" x="116" y="228" width="124" height="12" rx="6" />
        <rect className="visual-labs__rail" x="200" y="228" width="124" height="12" rx="6" />

        <g className="visual-labs__modules">
          {[
            [74, 134],
            [74, 182],
            [74, 230],
            [128, 134],
            [128, 182],
            [128, 230],
            [274, 134],
            [274, 182],
            [274, 230],
            [328, 134],
            [328, 182],
            [328, 230]
          ].map(([x, y]) => (
            <rect key={`${x}-${y}`} x={x} y={y} width="38" height="28" rx="8" />
          ))}
        </g>

        <g className="visual-labs__support-lines">
          <path d="M 84 324 H 356" />
          <path d="M 104 324 V 352" />
          <path d="M 170 324 V 352" />
          <path d="M 220 324 V 352" />
          <path d="M 270 324 V 352" />
          <path d="M 336 324 V 352" />
        </g>

        <g className="visual-labs__building-markers">
          <path d="M 92 96 L 122 76 L 152 96 V 112 H 92 Z" />
          <path d="M 288 96 L 318 76 L 348 96 V 112 H 288 Z" />
        </g>

        <circle className="visual-labs__signal" cx="220" cy="126" r="6" />
        <circle className="visual-labs__signal" cx="220" cy="196" r="6" />
        <circle className="visual-labs__signal" cx="220" cy="266" r="6" />
      </g>
    </svg>
  );
}

function ProgramCyclePanel() {
  return (
    <svg
      className="roles-visual-panel roles-visual-panel--program"
      viewBox="0 0 440 440"
      role="presentation"
    >
      <defs>
        <linearGradient id="program-track" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#6d8a78" />
          <stop offset="100%" stopColor="#365144" />
        </linearGradient>
      </defs>

      <g className="js-visual-enter">
        <rect className="visual-program__backplate" x="42" y="82" width="356" height="276" rx="28" />
        <path
          className="visual-program__loop"
          d="M 132 186 C 132 141, 182 118, 220 118 C 284 118, 334 160, 334 220 C 334 280, 284 322, 220 322 C 166 322, 126 290, 112 246"
        />
        <path
          className="visual-program__loop-secondary"
          d="M 148 196 C 148 160, 188 140, 222 140 C 272 140, 310 173, 310 220 C 310 267, 272 300, 222 300 C 182 300, 150 278, 136 244"
        />

        <g className="visual-program__gates">
          <rect x="184" y="98" width="72" height="24" rx="12" />
          <rect x="328" y="204" width="24" height="64" rx="12" />
          <rect x="184" y="316" width="72" height="24" rx="12" />
          <rect x="88" y="200" width="24" height="64" rx="12" />
        </g>

        <g className="visual-program__stations">
          <rect x="78" y="132" width="70" height="42" rx="12" />
          <rect x="290" y="132" width="70" height="42" rx="12" />
          <rect x="292" y="264" width="70" height="42" rx="12" />
          <rect x="80" y="264" width="70" height="42" rx="12" />
        </g>

        <g className="visual-program__checkpoints">
          <circle cx="220" cy="118" r="8" />
          <circle cx="334" cy="220" r="8" />
          <circle cx="220" cy="322" r="8" />
          <circle cx="112" cy="246" r="8" />
          <circle cx="132" cy="186" r="8" />
        </g>

        <g className="visual-program__routes">
          <path d="M 112 222 H 170" />
          <path d="M 270 222 H 328" />
          <path d="M 220 122 V 154" />
          <path d="M 220 286 V 318" />
        </g>
      </g>
    </svg>
  );
}

function NetworkGlobePanel({
  hostCities
}: {
  hostCities: HostCity[];
}) {
  const [activeCity, setActiveCity] = useState<string | null>(hostCities[0]?.label ?? null);

  const projectedCities = useMemo(
    () =>
      hostCities.map((city) => ({
        ...city,
        point: projectGlobePoint(city.longitude, city.latitude)
      })),
    [hostCities]
  );

  const outlinePath = useMemo(() => buildProjectedPath(lower48Outline), []);
  const latitudePaths = useMemo(
    () => globeGridLatitudes.map((latitude) => buildLatitudePath(latitude)),
    []
  );
  const longitudePaths = useMemo(
    () => globeGridLongitudes.map((longitude) => buildLongitudePath(longitude)),
    []
  );
  const routePaths = useMemo(
    () =>
      projectedCities.slice(0, -1).map((city, index) =>
        buildRoutePath(city.point, projectedCities[index + 1].point)
      ),
    [projectedCities]
  );

  return (
    <svg
      className="roles-visual-panel roles-visual-panel--globe"
      viewBox="0 0 440 440"
      role="presentation"
    >
      <defs>
        <radialGradient id="globe-shell" cx="45%" cy="36%" r="74%">
          <stop offset="0%" stopColor="#f0f4ef" stopOpacity="0.92" />
          <stop offset="40%" stopColor="#dbe4dd" stopOpacity="0.52" />
          <stop offset="100%" stopColor="#7b897f" stopOpacity="0.14" />
        </radialGradient>
        <clipPath id="globe-clip">
          <circle cx={GLOBE_CENTER_X} cy={GLOBE_CENTER_Y} r={GLOBE_RADIUS} />
        </clipPath>
      </defs>

      <g className="js-visual-enter">
        <circle className="visual-globe__aura" cx={GLOBE_CENTER_X} cy={GLOBE_CENTER_Y} r="168" />
        <circle className="visual-globe__sphere" cx={GLOBE_CENTER_X} cy={GLOBE_CENTER_Y} r={GLOBE_RADIUS} />
        <circle className="visual-globe__rim" cx={GLOBE_CENTER_X} cy={GLOBE_CENTER_Y} r={GLOBE_RADIUS} />

        <g className="visual-globe__grid" clipPath="url(#globe-clip)">
          {latitudePaths.map((pathData, index) => (
            <path key={`lat-${index}`} d={pathData} />
          ))}
          {longitudePaths.map((pathData, index) => (
            <path key={`lon-${index}`} d={pathData} />
          ))}
          <path className="visual-globe__land" d={outlinePath} />
        </g>

        <g className="visual-globe__routes" clipPath="url(#globe-clip)">
          {routePaths.map((pathData, index) => (
            <path className="js-globe-route" key={`route-${index}`} d={pathData} />
          ))}
        </g>

        <g className="visual-globe__pins">
          {projectedCities.map((city) => (
            <g
              className="js-globe-pin visual-globe__pin"
              key={`${city.label}-${city.state}`}
              transform={`translate(${city.point.x}, ${city.point.y})`}
              tabIndex={0}
              role="button"
              aria-label={`${city.label}, ${city.state}${city.year ? ` (${city.year})` : ""}`}
              onMouseEnter={() => setActiveCity(city.label)}
              onFocus={() => setActiveCity(city.label)}
              onClick={() => setActiveCity((current) => (current === city.label ? null : city.label))}
            >
              <circle className="visual-globe__pin-ring" r="10" />
              <circle className="visual-globe__pin-core" r="4.8" />
              {activeCity === city.label ? (
                <g
                  className="visual-globe__pin-label"
                  transform={`translate(${city.offsetX ?? 8}, ${city.offsetY ?? -14})`}
                >
                  <rect x="-8" y="-18" width="98" height="24" rx="10" />
                  <text x="4" y="-3">
                    {city.label}
                  </text>
                </g>
              ) : null}
            </g>
          ))}
        </g>
      </g>
    </svg>
  );
}

function RolesVisualStage({
  chapter,
  reducedMotion
}: RolesVisualStageProps) {
  const stageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (reducedMotion || !stageRef.current) {
      return;
    }

    const ctx = gsap.context(() => {
      const enterTargets = stageRef.current?.querySelectorAll<SVGElement>(".js-visual-enter");
      if (enterTargets?.length) {
        gsap.fromTo(
          enterTargets,
          { autoAlpha: 0, y: 14, scale: 0.985 },
          {
            autoAlpha: 1,
            y: 0,
            scale: 1,
            duration: 0.55,
            ease: "power2.out"
          }
        );
      }

      const routes = stageRef.current?.querySelectorAll<SVGPathElement>(".js-globe-route");
      routes?.forEach((route) => {
        const length = route.getTotalLength();
        gsap.fromTo(
          route,
          { strokeDasharray: length, strokeDashoffset: length },
          {
            strokeDashoffset: 0,
            duration: 1.15,
            ease: "power2.out",
            delay: 0.1
          }
        );
      });

      const pins = stageRef.current?.querySelectorAll<SVGGElement>(".js-globe-pin");
      if (pins?.length) {
        gsap.fromTo(
          pins,
          { autoAlpha: 0, y: 8, scale: 0.88, transformOrigin: "50% 50%" },
          {
            autoAlpha: 1,
            y: 0,
            scale: 1,
            duration: 0.45,
            ease: "power2.out",
            stagger: 0.08
          }
        );
      }
    }, stageRef);

    return () => ctx.revert();
  }, [chapter.id, reducedMotion]);

  return (
    <div className={`roles-visual-card roles-visual-card--${chapter.visual.kind}`} ref={stageRef}>
      {chapter.visual.kind === "labs-schematic" ? <LabsSchematicPanel /> : null}
      {chapter.visual.kind === "program-cycle" ? <ProgramCyclePanel /> : null}
      {chapter.visual.kind === "network-globe" ? (
        <NetworkGlobePanel hostCities={chapter.visual.hostCities} />
      ) : null}
    </div>
  );
}

export default RolesVisualStage;
