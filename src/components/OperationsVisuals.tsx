import { useMemo, type CSSProperties } from "react";
import { geoAlbersUsa, geoMercator, geoPath } from "d3-geo";
import type { FeatureCollection, Geometry } from "geojson";
import { feature } from "topojson-client";
import usAtlasData from "us-atlas/states-10m.json";

type AtlasTopology = {
  type: "Topology";
  objects: Record<string, unknown>;
};

const usAtlas = usAtlasData as unknown as AtlasTopology;
const states = feature(
  usAtlas as never,
  usAtlas.objects.states as never,
) as unknown as FeatureCollection<Geometry>;

const programStages = [
  ["Funding + budget", "Confirm funding, purchasing plan, and program needs."],
  ["Hiring", "Recruit, interview, select, and prepare the student cohort."],
  ["Access + onboarding", "Coordinate accounts, access, expectations, and documentation."],
  ["Lab setup", "Build out benches, supplies, PPE, equipment access, and waste streams."],
  ["Safety", "Deliver lab fundamentals and BSL-2 and biosafety preparation."],
  ["Delivery + support", "Support instructors, students, partner visits, and field sampling."],
  ["Closeout + reset", "Offboard participants, reconcile materials, and return the space."],
] as const;

const conferenceCities = [
  {
    index: "01",
    label: "Washington, DC",
    coordinates: [-77.0369, 38.9072] as [number, number],
    detail: "National conferences · 2023 and 2025",
  },
  {
    index: "02",
    label: "Boston",
    coordinates: [-71.0589, 42.3601] as [number, number],
    detail: "Regional conference · 2024",
  },
  {
    index: "03",
    label: "San Francisco",
    coordinates: [-122.4194, 37.7749] as [number, number],
    detail: "Regional conference · 2026",
  },
  {
    index: "04",
    label: "New York City",
    coordinates: [-74.006, 40.7128] as [number, number],
    detail: "Regional conference · 2026",
  },
] as const;

export function ScopeIndex() {
  const rows = [
    [
      "2",
      "HHMI Investigator laboratories",
      "Separate scientific programs, research spaces, budgets, and infrastructure",
    ],
    [
      "15–20",
      "people per laboratory",
      "Hiring, onboarding, space, equipment, and daily operations",
    ],
    [
      "8 × 8",
      "weeks × interns",
      "Annual program with a 10–15-person instructional team",
    ],
    [
      "~330",
      "laboratory managers",
      "Advisory-board and conference leadership across HHMI",
    ],
  ];

  return (
    <div className="scope-index" aria-label="Current professional scope">
      <div className="scope-index__header">
        <span>Current scope</span>
        <span>HMS · HHMI</span>
      </div>
      <div className="scope-index__body">
        {rows.map(([value, label, detail], index) => (
          <div className="scope-index__row" key={label}>
            <span>{String(index + 1).padStart(2, "0")}</span>
            <strong>{value}</strong>
            <div>
              <p>{label}</p>
              <small>{detail}</small>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function LabFloorLocator() {
  const floors = Array.from({ length: 9 }, (_, index) => index);
  const windows = Array.from({ length: 7 }, (_, index) => index);

  return (
    <div className="lab-locator">
      <svg
        viewBox="0 0 1000 700"
        role="img"
        aria-labelledby="lab-locator-title lab-locator-desc"
      >
        <title id="lab-locator-title">Laboratory locations in two Longwood buildings</title>
        <desc id="lab-locator-desc">
          A sectional illustration highlights the Bernhardt Lab on the tenth floor of 4
          Blackfan Circle and the Abraham Lab on the ninth floor of Veritas Science Center.
        </desc>
        <defs>
          <pattern id="concrete-grid" width="34" height="39" patternUnits="userSpaceOnUse">
            <rect width="34" height="39" fill="#4c5558" />
            <rect x="7" y="8" width="19" height="17" fill="#202b2f" />
            <path d="M0 38.5H34" stroke="#7c8586" strokeOpacity=".34" />
          </pattern>
          <pattern id="glass-grid" width="40" height="42" patternUnits="userSpaceOnUse">
            <rect width="40" height="42" fill="#31434a" />
            <rect x="3" y="4" width="34" height="34" fill="#65777b" fillOpacity=".26" />
            <path d="M39.5 0V42" stroke="#a7b7b8" strokeOpacity=".26" />
          </pattern>
        </defs>

        <path className="lab-locator__site" d="M84 599L487 628L926 560" />
        <path className="lab-locator__street" d="M35 656L472 683L963 606" />
        <path className="lab-locator__street-tick" d="M150 650L155 669M773 620L777 639" />

        <g className="lab-locator__building lab-locator__building--4bc">
          <path d="M135 165L205 125H408L452 158L392 194H135Z" fill="#8d9492" />
          <path d="M392 194L452 158V548L392 578Z" fill="#30393c" />
          <rect x="135" y="165" width="257" height="413" fill="url(#concrete-grid)" />
          {floors.map((floor) => (
            <path
              key={floor}
              d={`M135 ${206 + floor * 41.3}H392`}
              stroke="#9aa19f"
              strokeOpacity=".24"
            />
          ))}
          {windows.map((window) => (
            <path
              key={window}
              d={`M${169 + window * 31} 165V578`}
              stroke="#aeb4b1"
              strokeOpacity=".12"
            />
          ))}
          <g className="lab-locator__roof-equipment">
            <rect x="204" y="119" width="42" height="25" fill="#5c6565" />
            <rect x="260" y="108" width="54" height="34" fill="#687171" />
            <rect x="324" y="117" width="38" height="25" fill="#5c6565" />
            <path d="M202 116H364" stroke="#b1b7b5" strokeOpacity=".55" />
          </g>
          <rect
            className="lab-locator__floor lab-locator__floor--4bc"
            x="135"
            y="165"
            width="257"
            height="41.3"
          />
          <path
            className="lab-locator__floor lab-locator__floor--4bc-side"
            d="M392 194L452 158V199L392 235Z"
          />
        </g>

        <g className="lab-locator__building lab-locator__building--vsc">
          <path d="M510 116L571 78H821L882 117L820 153H510Z" fill="#a4b2b1" />
          <path d="M820 153L882 117V537L820 574Z" fill="#26353b" />
          <rect x="510" y="116" width="310" height="458" fill="url(#glass-grid)" />
          {floors.map((floor) => (
            <path
              key={floor}
              d={`M510 ${161.8 + floor * 45.8}H820`}
              stroke="#b9c8c9"
              strokeOpacity=".3"
            />
          ))}
          <g className="lab-locator__roof-equipment">
            {Array.from({ length: 9 }, (_, index) => (
              <rect
                key={index}
                x={590 + index * 21}
                y={72 - (index % 2) * 5}
                width="8"
                height="27"
                fill="#c6cfcd"
              />
            ))}
            <rect x="687" y="64" width="66" height="28" fill="#647372" />
          </g>
          <rect
            className="lab-locator__floor lab-locator__floor--vsc"
            x="510"
            y="161.8"
            width="310"
            height="45.8"
          />
          <path
            className="lab-locator__floor lab-locator__floor--vsc-side"
            d="M820 199L882 163V209L820 245Z"
          />
        </g>

        <g className="lab-locator__podium">
          <path d="M510 520L820 520L906 568L592 615L510 574Z" fill="#3f5055" />
          <path d="M592 615L906 568V620L592 660Z" fill="#26343a" />
          <path d="M708 568L864 544L929 580L772 609Z" fill="#6d7c7d" />
          <path d="M772 609L929 580V621L772 649Z" fill="#344247" />
        </g>

        <g className="lab-locator__skybridge">
          <path d="M392 391L510 373V419L392 437Z" fill="#92a4a4" fillOpacity=".74" />
          <path d="M402 398L500 383" stroke="#d9e4df" strokeOpacity=".65" />
          <path d="M402 425L500 410" stroke="#d9e4df" strokeOpacity=".35" />
        </g>

      </svg>

      <div className="lab-locator__legend">
        <div>
          <span>4 Blackfan Circle</span>
          <strong>Bernhardt Lab · 10th floor</strong>
        </div>
        <div>
          <span>Veritas Science Center</span>
          <strong>Abraham Lab · 9th floor</strong>
        </div>
      </div>
    </div>
  );
}

export function ProgramCycle() {
  return (
    <div className="program-schedule" role="img" aria-labelledby="program-schedule-title">
      <div className="program-schedule__header">
        <div>
          <span>Annual program</span>
          <strong id="program-schedule-title">Community Phages annual delivery plan</strong>
        </div>
        <div className="program-schedule__metrics">
          <p><strong>8</strong><span>weeks</span></p>
          <p><strong>8</strong><span>interns</span></p>
          <p><strong>10–15</strong><span>instructors</span></p>
        </div>
      </div>
      <div className="program-schedule__track" aria-hidden="true">
        <span>Prepare</span>
        <span>Deliver</span>
        <span>Close</span>
      </div>
      <ol className="program-schedule__list">
        {programStages.map(([title, detail], index) => (
          <li key={title} style={{ "--stage": index } as CSSProperties}>
            <span>{String(index + 1).padStart(2, "0")}</span>
            <div>
              <strong>{title}</strong>
              <p>{detail}</p>
            </div>
          </li>
        ))}
      </ol>
      <p className="program-schedule__footer">
        A dedicated HMS laboratory is built out, operated, and returned to regular use every year.
      </p>
    </div>
  );
}

export function ConferenceMap() {
  const nationalProjection = useMemo(
    () => geoAlbersUsa().translate([340, 310]).scale(790),
    [],
  );
  const northeastProjection = useMemo(
    () => geoMercator().center([-74.6, 40.3]).translate([814, 190]).scale(1850),
    [],
  );
  const nationalPath = useMemo(() => geoPath(nationalProjection), [nationalProjection]);
  const northeastPath = useMemo(() => geoPath(northeastProjection), [northeastProjection]);
  const sanFrancisco = useMemo(() => {
    const city = conferenceCities.find(({ label }) => label === "San Francisco");
    if (!city) return null;
    const point = nationalProjection(city.coordinates);
    return point ? { ...city, x: point[0], y: point[1] } : null;
  }, [nationalProjection]);
  const northeastCities = useMemo(
    () =>
      conferenceCities
        .filter(({ label }) => label !== "San Francisco")
        .flatMap((city) => {
          const point = northeastProjection(city.coordinates);
          return point ? [{ ...city, x: point[0], y: point[1] }] : [];
        }),
    [northeastProjection],
  );

  const labelOffset = (label: string) => {
    if (label === "Washington, DC") return { x: 18, y: 24, anchor: "start" as const };
    if (label === "Boston") return { x: -18, y: -18, anchor: "end" as const };
    return { x: 18, y: 24, anchor: "start" as const };
  };

  return (
    <div className="conference-map">
      <svg viewBox="0 0 1000 600" role="img" aria-labelledby="map-title map-desc">
        <title id="map-title">LMNOP conference locations in the United States</title>
        <desc id="map-desc">
          A national map identifies San Francisco and a larger Northeast detail identifies
          Washington DC, Boston, and New York City.
        </desc>
        <defs>
          <clipPath id="conference-map-northeast-clip">
            <rect x="655" y="48" width="318" height="300" />
          </clipPath>
        </defs>

        <text className="conference-map__kicker" x="28" y="38">United States</text>
        <g className="conference-map__states">
          {states.features.map((state, index) => (
            <path key={state.id ?? index} d={nationalPath(state) ?? undefined} />
          ))}
        </g>

        {sanFrancisco ? (
          <g
            className="conference-map__pin conference-map__pin--national"
            transform={`translate(${sanFrancisco.x} ${sanFrancisco.y})`}
            style={{ "--pin": 2 } as CSSProperties}
            role="img"
            aria-label={`${sanFrancisco.label}: ${sanFrancisco.detail}`}
          >
            <circle className="conference-map__pin-ring" r="15" />
            <circle className="conference-map__pin-dot" r="7" />
            <path className="conference-map__leader" d="M10 -8L72 -42" />
            <text className="conference-map__city-label" x="78" y="-44">San Francisco</text>
            <text className="conference-map__city-detail" x="78" y="-25">Regional · 2026</text>
          </g>
        ) : null}

        <path className="conference-map__corridor" d="M465 178L590 167L615 338L487 347Z" />
        <path className="conference-map__inset-link" d="M590 167L655 98M615 338L655 320" />

        <rect className="conference-map__inset-field" x="655" y="48" width="318" height="300" />
        <g clipPath="url(#conference-map-northeast-clip)">
          <g className="conference-map__states conference-map__states--inset">
            {states.features.map((state, index) => (
              <path key={state.id ?? index} d={northeastPath(state) ?? undefined} />
            ))}
          </g>
          <g className="conference-map__pins">
            {northeastCities.map((city) => {
              const offset = labelOffset(city.label);
              return (
                <g
                  key={city.label}
                  className="conference-map__pin"
                  transform={`translate(${city.x} ${city.y})`}
                  style={{
                    "--pin": city.index === "01" ? 0 : city.index === "02" ? 1 : 3,
                  } as CSSProperties}
                  role="img"
                  aria-label={`${city.label}: ${city.detail}`}
                >
                  <circle className="conference-map__pin-ring" r="13" />
                  <circle className="conference-map__pin-dot" r="7" />
                  <path
                    className="conference-map__leader"
                    d={`M${offset.x > 0 ? 8 : -8} ${offset.y > 0 ? 8 : -8}L${offset.x} ${offset.y - 5}`}
                  />
                  <text
                    className="conference-map__city-label"
                    x={offset.x}
                    y={offset.y}
                    textAnchor={offset.anchor}
                  >
                    {city.label}
                  </text>
                </g>
              );
            })}
          </g>
        </g>
        <rect
          className="conference-map__inset-frame"
          x="655"
          y="48"
          width="318"
          height="300"
        />
        <text className="conference-map__inset-title" x="676" y="76">
          Northeast detail
        </text>
        <text className="conference-map__context" x="655" y="382">
          Northeast sites enlarged for geographic clarity.
        </text>
      </svg>
      <ol className="conference-map__legend" aria-label="Conference locations">
        {conferenceCities.map((city) => (
          <li key={city.label}>
            <span>{city.index}</span>
            <strong>{city.label}</strong>
            <small>{city.detail}</small>
          </li>
        ))}
      </ol>
    </div>
  );
}
