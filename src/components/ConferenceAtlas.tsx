import { memo, useId, useState } from "react";
import { geoAlbersUsa, geoPath } from "d3-geo";
import { feature } from "topojson-client";
import type { GeometryCollection, Topology } from "topojson-specification";
import usAtlasData from "us-atlas/states-10m.json";
import "../conference-atlas.css";

const conferenceCities = [
  {
    id: "washington",
    city: "Washington, DC",
    coordinates: [-77.0369, 38.9072] as [number, number],
    event: "National conferences",
    years: "2023 and 2025",
    caption: { x: 525, y: 391, side: "right" },
  },
  {
    id: "boston",
    city: "Boston",
    coordinates: [-71.0589, 42.3601] as [number, number],
    event: "Regional conference",
    years: "2024",
    caption: { x: 580, y: 95, side: "right" },
  },
  {
    id: "san-francisco",
    city: "San Francisco",
    coordinates: [-122.4194, 37.7749] as [number, number],
    event: "Regional conference",
    years: "2026",
    caption: { x: 210, y: 206, side: "left" },
  },
  {
    id: "new-york",
    city: "New York City",
    coordinates: [-74.006, 40.7128] as [number, number],
    event: "Regional conference",
    years: "2026",
    caption: { x: 560, y: 145, side: "right" },
  },
] as const;

const topology = usAtlasData as unknown as Topology<{ states: GeometryCollection }>;
const states = feature(topology, topology.objects.states);
const projection = geoAlbersUsa().fitExtent([[30, 80], [970, 630]], states);
const path = geoPath(projection);

// Geography is static: selection and parent rerenders never regenerate state paths.
const statePaths = states.features.flatMap((state, index) => {
  const d = path(state);
  return d ? [{ id: String(state.id ?? index), d }] : [];
});
const locations = conferenceCities.map((city) => {
  const point = projection(city.coordinates);
  if (!point) throw new Error(`Conference location is outside the atlas: ${city.city}`);
  return { ...city, x: point[0], y: point[1] };
});

const StateBoundaries = memo(function StateBoundaries() {
  return (
    <g className="conference-atlas__states">
      {statePaths.map((state) => <path key={state.id} d={state.d} />)}
    </g>
  );
});

function ConferenceAtlas() {
  const instanceId = useId();
  const titleId = `${instanceId}-title`;
  const mapTitleId = `${instanceId}-map-title`;
  const mapDescriptionId = `${instanceId}-map-description`;
  const detailId = `${instanceId}-detail`;
  const [selectedId, setSelectedId] = useState<string>(locations[0].id);
  const selected = locations.find((location) => location.id === selectedId) ?? locations[0];
  const captionWidth = 290;
  const captionEdge = selected.caption.x + (selected.caption.side === "right" ? captionWidth : 0);
  const captionY = selected.caption.y + 37;
  const elbowX = captionEdge + (selected.caption.side === "right" ? 22 : -22);

  return (
    <figure className="conference-atlas" aria-labelledby={titleId}>
      <figcaption className="conference-atlas__heading">
        <div>
          <p className="conference-atlas__eyebrow">LMNOP</p>
          <h3 id={titleId}>Conference locations</h3>
        </div>
        <span className="conference-atlas__period">2023 - 2026</span>
      </figcaption>

      <svg
        className="conference-atlas__map"
        viewBox="0 0 1000 680"
        width="1000"
        height="680"
        role="img"
        aria-labelledby={`${mapTitleId} ${mapDescriptionId}`}
      >
        <title id={mapTitleId}>LMNOP conference locations across the United States</title>
        <desc id={mapDescriptionId}>
          Washington, DC: national conferences in 2023 and 2025. Boston: regional conference
          in 2024. San Francisco and New York City: regional conferences in 2026.
          {` Selected: ${selected.city}, ${selected.event.toLowerCase()}, ${selected.years}.`}
        </desc>
        <StateBoundaries />
        <path
          className="conference-atlas__leader"
          d={`M${selected.x},${selected.y} L${elbowX},${captionY} H${captionEdge}`}
        />
        <g className="conference-atlas__caption" transform={`translate(${selected.caption.x},${selected.caption.y})`}>
          <rect width={captionWidth} height="76" rx="3" />
          <text className="conference-atlas__caption-city" x="16" y="31">{selected.city}</text>
          <text className="conference-atlas__caption-years" x="16" y="57">{selected.years}</text>
        </g>
        {locations.map((location) => (
          <g
            key={location.id}
            className={`conference-atlas__pin${location.id === selectedId ? " conference-atlas__pin--selected" : ""}`}
            transform={`translate(${location.x},${location.y})`}
          >
            {location.id === selectedId && <circle className="conference-atlas__pin-ring" r="18" />}
            <circle className="conference-atlas__pin-dot" r="8" />
          </g>
        ))}
      </svg>

      <div className="conference-atlas__cities" role="group" aria-label="Conference cities">
        {locations.map((location, index) => (
          <button
            className="conference-atlas__city"
            key={location.id}
            type="button"
            aria-pressed={location.id === selectedId}
            aria-controls={detailId}
            onClick={() => setSelectedId(location.id)}
          >
            <span className="conference-atlas__city-number" aria-hidden="true">0{index + 1}</span>
            <span className="conference-atlas__city-name">{location.city}</span>
            <span className="conference-atlas__city-years">{location.years}</span>
          </button>
        ))}
      </div>

      <div className="conference-atlas__detail" id={detailId} role="status" aria-atomic="true">
        <p className="conference-atlas__detail-city">{selected.city}</p>
        <p className="conference-atlas__detail-event">{selected.event}</p>
        <p className="conference-atlas__detail-years">{selected.years}</p>
      </div>
    </figure>
  );
}

export default memo(ConferenceAtlas);
