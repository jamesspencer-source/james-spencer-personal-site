import { useLayoutEffect, useMemo, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import RolesVisualStage, { chapterStops } from "./RolesVisualStage";
import { siteContent, type RoleChapter } from "../content";

gsap.registerPlugin(ScrollTrigger);

type CurrentRolesSectionProps = {
  reducedMotion: boolean;
};

const PROGRAM_COPY_PROGRESS_END = 0.76;
const NETWORK_DOCUMENTARY_PROGRESS_START = 0.9;

function clamp01(value: number) {
  return Math.max(0, Math.min(1, value));
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

function getActiveChapterId(progress: number): RoleChapter["id"] {
  if (progress >= 0.78) {
    return "network";
  }

  if (progress >= 0.52) {
    return "program";
  }

  if (progress >= 0.22) {
    return "labs";
  }

  return "overview";
}

function RoleCopy({
  chapter,
  active,
  chapterProgress = 0,
  documentaryProgress = 0
}: {
  chapter: RoleChapter;
  active: boolean;
  chapterProgress?: number;
  documentaryProgress?: number;
}) {
  return (
    <article
      className="roles-story__panel"
      data-active={active}
      aria-hidden={!active}
    >
      <p className="roles-story__dates">{chapter.dates}</p>
      <h3 className="roles-story__title">{chapter.title}</h3>
      {chapter.id === "program" ? (
        <div
          className="roles-story__program-progress"
          aria-hidden="true"
        >
          <span style={{ transform: `scaleX(${chapterProgress})` }} />
        </div>
      ) : null}
      <p className="roles-story__organization">{chapter.organization}</p>
      <p className="roles-story__summary">{chapter.summary}</p>

      {chapter.link ? (
        <p className="roles-story__link">
          <a href={chapter.link.href} target="_blank" rel="noreferrer">
            {chapter.link.label}
          </a>
        </p>
      ) : null}

      <div className="roles-story__grid">
        <ul className="roles-story__list">
          {chapter.responsibilities.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>

        <dl className="roles-story__evidence">
          {chapter.evidence.map((item) => (
            <div key={item.label} className="roles-story__evidence-item">
              <dt>{item.label}</dt>
              <dd>{item.value}</dd>
            </div>
          ))}
        </dl>
      </div>

      {chapter.documentaryBeat ? (
        <div
          className="roles-story__documentary-note"
          style={{
            opacity: documentaryProgress,
            transform: `translate3d(0, ${18 - documentaryProgress * 18}px, 0)`
          }}
        >
          <p className="roles-story__documentary-label">Conference leadership</p>
          <p className="roles-story__documentary-caption">
            {chapter.documentaryBeat.caption}
          </p>
          {chapter.documentaryBeat.credit ? (
            <p className="roles-story__documentary-credit">
              {chapter.documentaryBeat.credit}
            </p>
          ) : null}
        </div>
      ) : null}
    </article>
  );
}

function ReducedMotionRoles() {
  const chapters = siteContent.rolesSection.chapters;

  return (
    <section id="roles" data-section="roles" className="stage stage--roles">
      <div className="roles-story roles-story--reduced">
        <div className="roles-story__chrome">
          <div className="roles-story__heading-block">
            <p className="roles-story__eyebrow">{siteContent.rolesSection.label}</p>
            <h2 className="roles-story__heading">{siteContent.rolesSection.heading}</h2>
            <p className="roles-story__intro">{siteContent.rolesSection.intro}</p>
          </div>
        </div>

        <div className="roles-story__cards">
          {chapters.map((chapter) => (
            <article key={chapter.id} className="roles-story__card">
              <div className="roles-story__card-visual">
                <RolesVisualStage
                  progress={chapter.id === "network" ? 0.985 : chapterStops[chapter.id] + 0.04}
                  activeChapterId={chapter.id}
                  chapters={chapters}
                  staticMode
                />
              </div>
              <div className="roles-story__card-copy">
                <RoleCopy
                  chapter={chapter}
                  active
                  chapterProgress={chapter.id === "program" ? 1 : 0}
                  documentaryProgress={chapter.id === "network" ? 1 : 0}
                />
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function CurrentRolesSection({ reducedMotion }: CurrentRolesSectionProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const scrollTriggerRef = useRef<ScrollTrigger | null>(null);
  const rafRef = useRef<number | null>(null);
  const progressValueRef = useRef(0);
  const [progress, setProgress] = useState(0);
  const [activeChapterId, setActiveChapterId] = useState<RoleChapter["id"]>("overview");

  const chapters = siteContent.rolesSection.chapters;
  const programChapterProgress = clamp01(
    (progress - chapterStops.program) / (PROGRAM_COPY_PROGRESS_END - chapterStops.program)
  );
  const networkDocumentaryProgress = clamp01(
    (progress - NETWORK_DOCUMENTARY_PROGRESS_START) / (1 - NETWORK_DOCUMENTARY_PROGRESS_START)
  );

  const chapterVisibility = useMemo(
    () => ({
      overview: fadeBetween(progress, 0, 0.08, 0.24, 0.36),
      labs: fadeBetween(progress, 0.2, 0.3, 0.48, 0.58),
      program: fadeBetween(progress, 0.48, 0.56, 0.78, 0.88),
      network: fadeBetween(progress, 0.76, 0.84, 1.08, 1.18)
    }),
    [progress]
  );

  useLayoutEffect(() => {
    if (reducedMotion || !sectionRef.current || !viewportRef.current) {
      return;
    }

    const updateProgress = (value: number) => {
      progressValueRef.current = value;

      if (rafRef.current !== null) {
        return;
      }

      rafRef.current = window.requestAnimationFrame(() => {
        rafRef.current = null;
        const nextProgress = progressValueRef.current;
        setProgress(nextProgress);
        setActiveChapterId((current) => {
          const next = getActiveChapterId(nextProgress);
          return current === next ? current : next;
        });
      });
    };

    const headerHeight =
      document.querySelector<HTMLElement>(".site-header")?.getBoundingClientRect()
        .height ?? 76;

    const progressState = { value: 0 };
    const masterTimeline = gsap.timeline({ paused: true });

    masterTimeline.to(progressState, {
      value: 1,
      duration: 1,
      ease: "none",
      onUpdate: () => updateProgress(progressState.value)
    });

    scrollTriggerRef.current = ScrollTrigger.create({
      trigger: sectionRef.current,
      animation: masterTimeline,
      pin: viewportRef.current,
      start: () => `top top+=${headerHeight}`,
      end: () =>
        `+=${Math.round(
          window.innerHeight * (window.innerWidth < 900 ? 6.4 : 8)
        )}`,
      scrub: 0.52,
      anticipatePin: 1,
      invalidateOnRefresh: true
    });

    return () => {
      if (rafRef.current !== null) {
        window.cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      scrollTriggerRef.current?.kill();
      scrollTriggerRef.current = null;
      masterTimeline.kill();
    };
  }, [reducedMotion]);

  const handleJump = (chapterId: RoleChapter["id"]) => {
    const trigger = scrollTriggerRef.current;
    if (!trigger) {
      const target = document.getElementById(`roles-${chapterId}`);
      target?.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth" });
      return;
    }

    const stop = chapterStops[chapterId];
    const scrollTop = trigger.start + (trigger.end - trigger.start) * stop;
    window.scrollTo({
      top: scrollTop,
      behavior: reducedMotion ? "auto" : "smooth"
    });
  };

  if (reducedMotion) {
    return <ReducedMotionRoles />;
  }

  return (
    <section id="roles" data-section="roles" className="stage stage--roles" ref={sectionRef}>
      <div className="roles-story" ref={viewportRef}>
        <div className="roles-story__layout">
          <div className="roles-story__copy">
            <div className="roles-story__heading-block">
              <p className="roles-story__eyebrow">{siteContent.rolesSection.label}</p>
              <h2 className="roles-story__heading">{siteContent.rolesSection.heading}</h2>
              <p className="roles-story__intro">{siteContent.rolesSection.intro}</p>
            </div>

            <nav className="roles-story__progress" aria-label="Current role chapters">
              {chapters.map((chapter, index) => (
                <button
                  key={chapter.id}
                  type="button"
                  className="roles-story__progress-item"
                  data-active={activeChapterId === chapter.id}
                  onClick={() => handleJump(chapter.id)}
                >
                  <span className="roles-story__progress-index">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span className="roles-story__progress-label">{chapter.navLabel}</span>
                </button>
              ))}
            </nav>

            <div className="roles-story__panels">
              {chapters.map((chapter) => (
                (() => {
                  const isActive = activeChapterId === chapter.id;
                  const opacity = isActive ? 1 : chapterVisibility[chapter.id];

                  return (
                    <div
                      key={chapter.id}
                      id={`roles-${chapter.id}`}
                      className="roles-story__panel-shell"
                      data-active={isActive}
                      style={{
                        opacity,
                        transform: `translate3d(0, ${isActive ? 0 : 24 - opacity * 24}px, 0)`
                      }}
                    >
                      <RoleCopy
                        chapter={chapter}
                        active={isActive}
                        chapterProgress={
                          chapter.id === "program" ? programChapterProgress : 0
                        }
                        documentaryProgress={
                          chapter.id === "network" ? networkDocumentaryProgress : 0
                        }
                      />
                    </div>
                  );
                })()
              ))}
            </div>
          </div>

          <div className="roles-story__visual">
            <RolesVisualStage
              progress={progress}
              activeChapterId={activeChapterId}
              chapters={chapters}
            />
          </div>
        </div>
      </div>
    </section>
  );
}

export default CurrentRolesSection;
