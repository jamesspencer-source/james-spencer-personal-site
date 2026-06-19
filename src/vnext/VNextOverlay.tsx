import type { VNextChapter, VNextConferenceSite, VNextProgramStation } from "./VNextContent";

export function getVNextActiveChapter(progress: number): VNextChapter["id"] {
  if (progress >= 0.66) {
    return "network";
  }

  if (progress >= 0.34) {
    return "program";
  }

  return "labs";
}

function getDocumentaryProgress(progress: number) {
  const x = Math.max(0, Math.min(1, (progress - 0.88) / 0.08));
  return x * x * (3 - 2 * x);
}

export function VNextOverlay({
  chapters,
  progress,
  programStations,
  conferenceSites,
  onJump
}: {
  chapters: VNextChapter[];
  progress: number;
  programStations: VNextProgramStation[];
  conferenceSites: VNextConferenceSite[];
  onJump?: (progress: number) => void;
}) {
  const activeChapter = getVNextActiveChapter(progress);
  const chapter = chapters.find((item) => item.id === activeChapter) ?? chapters[0];
  const documentaryProgress = getDocumentaryProgress(progress);
  const programActiveCount = Math.max(0, Math.min(programStations.length, Math.ceil(((progress - 0.38) / 0.22) * programStations.length)));
  const conferenceActiveCount = Math.max(0, Math.min(conferenceSites.length, Math.ceil(((progress - 0.68) / 0.16) * conferenceSites.length)));

  return (
    <div className="vnext-overlay">
      <div className="vnext-overlay__copy">
        <p className="vnext-overlay__label">Current Roles</p>
        <p className="vnext-overlay__dates">{chapter.dates}</p>
        <h2>{chapter.title}</h2>
        <p className="vnext-overlay__org">{chapter.organization}</p>
        <p className="vnext-overlay__summary">{chapter.summary}</p>
        <div className="vnext-overlay__detail-grid">
          <div>
            <span>Responsibilities</span>
            <ul>
              {chapter.responsibilities.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
          <div>
            <span>Evidence</span>
            <ul>
              {chapter.evidence.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <div className="vnext-overlay__rail" aria-label="Current Roles chapters">
        {chapters.map((item) => (
          <button
            aria-current={activeChapter === item.id ? "step" : undefined}
            key={item.id}
            onClick={() => onJump?.(item.holdProgress)}
            type="button"
          >
            <span>{item.index}</span>
            <strong>{item.navLabel}</strong>
          </button>
        ))}
      </div>

      <div className="vnext-overlay__labels" aria-hidden="true">
        <span className="vnext-overlay__scene-label vnext-overlay__scene-label--labs">Two research labs</span>
        <span className="vnext-overlay__scene-label vnext-overlay__scene-label--program">Annual program cycle</span>
        <span className="vnext-overlay__scene-label vnext-overlay__scene-label--network">Conference network</span>
      </div>

      <div className="vnext-overlay__program" data-visible={activeChapter === "program"}>
        {programStations.map((station, index) => (
          <article data-active={index < programActiveCount} key={station.label}>
            <span>{String(index + 1).padStart(2, "0")}</span>
            <strong>{station.label}</strong>
            <p>{station.detail}</p>
          </article>
        ))}
      </div>

      <div className="vnext-overlay__network" data-visible={activeChapter === "network" && documentaryProgress < 0.58}>
        <p>Conference locations</p>
        {conferenceSites.map((site, index) => (
          <article data-active={index < conferenceActiveCount} key={site.city}>
            <strong>{site.city}</strong>
            <span>{site.detail}</span>
          </article>
        ))}
      </div>
    </div>
  );
}
