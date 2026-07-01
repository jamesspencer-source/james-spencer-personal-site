import type { DocumentaryBeat } from "../content";
import type { VNextAssetManifestItem, VNextChapter, VNextConferenceSite, VNextFloorHighlight, VNextProgramStation } from "./VNextContent";
import { VNextOverlay } from "./VNextOverlay";
import { VNextResearchSystem } from "./VNextResearchSystem";
import { getVNextDocumentaryProgress } from "./VNextSceneManifest";

type VNextExperienceProps = {
  assets: VNextAssetManifestItem[];
  chapters: VNextChapter[];
  progress: number;
  reducedMotion: boolean;
  documentary?: DocumentaryBeat;
  programStations: VNextProgramStation[];
  conferenceSites: VNextConferenceSite[];
  floorHighlights: VNextFloorHighlight[];
  onJump?: (progress: number) => void;
};

export function VNextExperience({
  assets,
  chapters,
  progress,
  reducedMotion,
  documentary,
  programStations,
  conferenceSites,
  floorHighlights,
  onJump
}: VNextExperienceProps) {
  if (reducedMotion) {
    return (
      <div className="vnext-experience vnext-experience--static" id="vnext-roles">
        <div className="vnext-shell vnext-static-stack">
          <div className="vnext-static-stack__intro">
            <p className="vnext-kicker">Current Roles</p>
            <h2>Current research operations work</h2>
          </div>
          {chapters.map((chapter) => (
            <article className="vnext-static-chapter" id={`vnext-${chapter.id}`} key={chapter.id}>
              <div className="vnext-static-chapter__visual">
                <VNextResearchSystem assets={assets} mode="static" progress={chapter.holdProgress} reducedMotion />
              </div>
              <div className="vnext-static-chapter__copy">
                <p>{chapter.dates}</p>
                <h3>{chapter.title}</h3>
                <span>{chapter.organization}</span>
                <p>{chapter.summary}</p>
                <ul>
                  {chapter.evidence.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            </article>
          ))}
          {documentary ? (
            <figure className="vnext-static-documentary">
              <img src={documentary.image.src} alt={documentary.image.alt} />
              <figcaption>{documentary.caption}</figcaption>
            </figure>
          ) : null}
        </div>
      </div>
    );
  }

  const photoProgress = getVNextDocumentaryProgress(progress);

  return (
    <div className="vnext-experience" id="vnext-roles">
      <div className="vnext-experience__pin">
        <VNextResearchSystem
          assets={assets}
          className={photoProgress > 0.02 ? "vnext-research-system--receding" : ""}
          mode="sequence"
          progress={progress}
        />
        <VNextOverlay
          chapters={chapters}
          conferenceSites={conferenceSites}
          floorHighlights={floorHighlights}
          onJump={onJump}
          programStations={programStations}
          progress={progress}
        />
        {documentary ? (
          <figure
            className="vnext-proof-photo"
            style={{
              opacity: photoProgress,
              transform: `translate3d(${(1 - photoProgress) * 6}%, ${(1 - photoProgress) * 3}%, 0) translateY(-50%) scale(${0.92 + photoProgress * 0.08})`
            }}
          >
            <img src={documentary.image.src} alt={documentary.image.alt} />
            <figcaption>{documentary.caption}</figcaption>
          </figure>
        ) : null}
        <div className="vnext-experience__progress" aria-hidden="true">
          <span style={{ transform: `scaleX(${progress})` }} />
        </div>
      </div>
    </div>
  );
}
