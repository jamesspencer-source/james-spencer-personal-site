import {
  Suspense,
  lazy,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState
} from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  siteContent,
  type ActionLink,
  type OperatingStageId
} from "./content";

gsap.registerPlugin(ScrollTrigger);

const AtlasScene = lazy(async () => {
  const module = await import("./components/AtlasScene");
  return { default: module.AtlasScene };
});

type SectionId =
  | "overview"
  | "scope"
  | "roles"
  | "system"
  | "background"
  | "contact";

const navItems: Array<{ id: SectionId; label: string }> = [
  { id: "overview", label: "Overview" },
  { id: "scope", label: "Current Scope" },
  { id: "roles", label: "Current Roles" },
  { id: "system", label: "Systems View" },
  { id: "background", label: "Background" },
  { id: "contact", label: "Contact" }
];

function usePrefersReducedMotion() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updatePreference = () => setPrefersReducedMotion(mediaQuery.matches);

    updatePreference();
    mediaQuery.addEventListener("change", updatePreference);

    return () => mediaQuery.removeEventListener("change", updatePreference);
  }, []);

  return prefersReducedMotion;
}

function updateMetaTag(name: string, content: string) {
  const tag = document.querySelector(`meta[name="${name}"]`);
  if (tag) {
    tag.setAttribute("content", content);
  }
}

function updateMetaProperty(property: string, content: string) {
  const tag = document.querySelector(`meta[property="${property}"]`);
  if (tag) {
    tag.setAttribute("content", content);
  }
}

function isExternalLink(href: string) {
  return href.startsWith("http");
}

function InlineLinkRow({
  links,
  className
}: {
  links: ActionLink[];
  className?: string;
}) {
  return (
    <div className={["inline-links", className].filter(Boolean).join(" ")}>
      {links.map((link) => (
        <a
          key={link.label}
          className="inline-links__link"
          href={link.href}
          {...(isExternalLink(link.href)
            ? { target: "_blank", rel: "noreferrer" }
            : {})}
          {...(link.download ? { download: true } : {})}
        >
          {link.label}
        </a>
      ))}
    </div>
  );
}

function App() {
  const prefersReducedMotion = usePrefersReducedMotion();
  const rootRef = useRef<HTMLDivElement>(null);
  const systemSectionRef = useRef<HTMLElement>(null);

  const [activeSection, setActiveSection] = useState<SectionId>("overview");
  const [activeRoleId, setActiveRoleId] = useState(
    siteContent.roles.entries[0]?.id ?? ""
  );
  const [activeSystemStage, setActiveSystemStage] = useState<OperatingStageId>(
    siteContent.operatingSystem.entries[0]?.id ?? "labs"
  );
  const [systemProgress, setSystemProgress] = useState(0.28);
  const [shouldLoadHeroScene, setShouldLoadHeroScene] = useState(false);
  const [shouldLoadSystemScene, setShouldLoadSystemScene] = useState(false);

  const activeRole = useMemo(
    () =>
      siteContent.roles.entries.find((entry) => entry.id === activeRoleId) ??
      siteContent.roles.entries[0],
    [activeRoleId]
  );

  useEffect(() => {
    document.title = siteContent.meta.title;
    updateMetaTag("description", siteContent.meta.description);
    updateMetaProperty("og:title", siteContent.meta.title);
    updateMetaProperty("og:description", siteContent.meta.description);
    updateMetaTag("twitter:title", siteContent.meta.title);
    updateMetaTag("twitter:description", siteContent.meta.description);
  }, []);

  useEffect(() => {
    let timeoutId: number | undefined;
    let idleId: number | undefined;

    if (prefersReducedMotion) {
      setShouldLoadHeroScene(true);
      return undefined;
    }

    const loadHero = () => setShouldLoadHeroScene(true);

    if ("requestIdleCallback" in window) {
      idleId = window.requestIdleCallback(loadHero, { timeout: 1000 });
    } else {
      timeoutId = globalThis.setTimeout(loadHero, 220);
    }

    return () => {
      if (idleId !== undefined && "cancelIdleCallback" in window) {
        window.cancelIdleCallback(idleId);
      }
      if (timeoutId !== undefined) {
        globalThis.clearTimeout(timeoutId);
      }
    };
  }, [prefersReducedMotion]);

  useEffect(() => {
    const node = systemSectionRef.current;
    if (!node) {
      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setShouldLoadSystemScene(true);
          }
        });
      },
      { rootMargin: "280px 0px" }
    );

    observer.observe(node);

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!prefersReducedMotion) {
      return undefined;
    }

    const sections = Array.from(
      document.querySelectorAll<HTMLElement>("[data-section]")
    );
    const steps = Array.from(
      document.querySelectorAll<HTMLElement>("[data-operating-stage]")
    );

    const sectionObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id as SectionId);
          }
        });
      },
      {
        threshold: 0.42,
        rootMargin: "-18% 0px -35% 0px"
      }
    );

    const stageObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const element = entry.target as HTMLElement;
            setActiveSystemStage(
              element.dataset.operatingStage as OperatingStageId
            );
            setSystemProgress(0.5);
          }
        });
      },
      {
        threshold: 0.45,
        rootMargin: "-12% 0px -30% 0px"
      }
    );

    sections.forEach((section) => sectionObserver.observe(section));
    steps.forEach((step) => stageObserver.observe(step));

    return () => {
      sectionObserver.disconnect();
      stageObserver.disconnect();
    };
  }, [prefersReducedMotion]);

  useLayoutEffect(() => {
    if (!rootRef.current) {
      return undefined;
    }

    const ctx = gsap.context(() => {
      if (prefersReducedMotion) {
        gsap.set(".js-reveal", { autoAlpha: 1, y: 0 });
        return;
      }

      gsap.utils.toArray<HTMLElement>("[data-section]").forEach((section) => {
        ScrollTrigger.create({
          trigger: section,
          start: "top 38%",
          end: "bottom 42%",
          onEnter: () => setActiveSection(section.id as SectionId),
          onEnterBack: () => setActiveSection(section.id as SectionId)
        });
      });

      gsap.utils.toArray<HTMLElement>(".js-reveal").forEach((panel) => {
        gsap.fromTo(
          panel,
          { autoAlpha: 0, y: 26 },
          {
            autoAlpha: 1,
            y: 0,
            duration: 0.8,
            ease: "power2.out",
            scrollTrigger: {
              trigger: panel,
              start: "top 84%",
              once: true
            }
          }
        );
      });

      gsap.utils
        .toArray<HTMLElement>("[data-operating-stage]")
        .forEach((step) => {
          const stageId = step.dataset.operatingStage as OperatingStageId;

          ScrollTrigger.create({
            trigger: step,
            start: "top 62%",
            end: "bottom 38%",
            onEnter: () => setActiveSystemStage(stageId),
            onEnterBack: () => setActiveSystemStage(stageId),
            onUpdate: (self) => {
              if (self.isActive) {
                setActiveSystemStage(stageId);
                setSystemProgress(Math.max(0.18, self.progress));
              }
            }
          });
        });
    }, rootRef);

    return () => ctx.revert();
  }, [prefersReducedMotion]);

  return (
    <div className="site-app" ref={rootRef}>
      <a className="skip-link" href="#content">
        Skip to content
      </a>

      <header className="site-header">
        <div className="shell site-header__inner">
          <a className="site-brand" href="#overview">
            James M. Spencer
          </a>

          <nav className="site-nav" aria-label="Section navigation">
            {navItems.map((item) => (
              <a
                key={item.id}
                className="site-nav__link"
                href={`#${item.id}`}
                aria-current={
                  activeSection === item.id ? "location" : undefined
                }
              >
                {item.label}
              </a>
            ))}
          </nav>
        </div>
      </header>

      <main id="content" className="site-main">
        <section
          id="overview"
          className="site-section hero-section"
          data-section="overview"
        >
          <div className="shell hero-grid">
            <div className="hero-copy js-reveal">
              <p className="section-label">Overview</p>
              <h1 className="hero-copy__name">{siteContent.hero.name}</h1>
              <p className="hero-copy__title">{siteContent.hero.title}</p>
              <p className="hero-copy__location">{siteContent.hero.location}</p>

              <div className="hero-copy__summary">
                {siteContent.hero.summary.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>

              <InlineLinkRow links={siteContent.hero.links} />

              <div className="hero-proof">
                {siteContent.hero.proof.map((item) => (
                  <article
                    key={item.headline}
                    className={`hero-proof__item hero-proof__item--${
                      item.tone ?? "neutral"
                    }`}
                  >
                    <h2 className="hero-proof__headline">{item.headline}</h2>
                    <p className="hero-proof__detail">{item.detail}</p>
                  </article>
                ))}
              </div>
            </div>

            <aside className="hero-visual js-reveal">
              <div className="scene-frame scene-frame--hero">
                {shouldLoadHeroScene ? (
                  <Suspense
                    fallback={<div className="scene-frame__placeholder" />}
                  >
                    <AtlasScene
                      activeStage="opening"
                      reducedMotion={prefersReducedMotion}
                      stageProgress={0.42}
                      variant="hero"
                      paused={activeSection !== "overview"}
                    />
                  </Suspense>
                ) : (
                  <div className="scene-frame__placeholder" />
                )}
              </div>
            </aside>
          </div>
        </section>

        <section
          id="scope"
          className="site-section scope-section"
          data-section="scope"
        >
          <div className="shell">
            <div className="section-heading js-reveal">
              <h2 className="section-title">{siteContent.scope.heading}</h2>
            </div>

            <div className="scope-intro-grid">
              <article className="scope-intro js-reveal">
                <p className="scope-intro__lead">{siteContent.scope.intro}</p>
                <p className="scope-intro__context">{siteContent.scope.context}</p>
              </article>

              <aside className="results-panel js-reveal">
                <p className="results-panel__label">Selected Results</p>
                <div className="results-list">
                  {siteContent.scope.results.map((result) => (
                    <article key={result.title} className="results-list__item">
                      <h3 className="results-list__title">{result.title}</h3>
                      <p className="results-list__detail">{result.detail}</p>
                    </article>
                  ))}
                </div>
              </aside>
            </div>

            <div className="domains-grid js-reveal">
              {siteContent.scope.domains.map((domain) => (
                <article
                  key={domain.title}
                  className={`domain-item domain-item--${domain.tone ?? "neutral"}`}
                >
                  <h3 className="domain-item__title">{domain.title}</h3>
                  <p className="domain-item__detail">{domain.detail}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section
          id="roles"
          className="site-section roles-section"
          data-section="roles"
        >
          <div className="shell">
            <div className="section-heading js-reveal">
              <h2 className="section-title">{siteContent.roles.heading}</h2>
              <p className="section-intro">{siteContent.roles.intro}</p>
            </div>

            <div className="roles-layout">
              <div className="role-tabs js-reveal" role="tablist" aria-label="Current roles">
                {siteContent.roles.entries.map((entry) => (
                  <button
                    key={entry.id}
                    type="button"
                    role="tab"
                    aria-selected={activeRole?.id === entry.id}
                    className={`role-tabs__button${
                      activeRole?.id === entry.id ? " is-active" : ""
                    }`}
                    onClick={() => setActiveRoleId(entry.id)}
                  >
                    <span className="role-tabs__label">{entry.navLabel}</span>
                    <span className="role-tabs__meta">{entry.dates}</span>
                  </button>
                ))}
              </div>

              {activeRole ? (
                <article className="role-detail js-reveal" role="tabpanel">
                  <p className="role-detail__eyebrow">{activeRole.organization}</p>
                  <h3 className="role-detail__title">{activeRole.title}</h3>
                  <p className="role-detail__dates">{activeRole.dates}</p>
                  <p className="role-detail__summary">{activeRole.summary}</p>

                  <ul className="detail-list">
                    {activeRole.bullets.map((bullet) => (
                      <li key={bullet}>{bullet}</li>
                    ))}
                  </ul>

                  <dl className="detail-evidence">
                    {activeRole.evidence.map((item) => (
                      <div key={item.label} className="detail-evidence__item">
                        <dt>{item.label}</dt>
                        <dd>{item.value}</dd>
                      </div>
                    ))}
                  </dl>

                  {activeRole.link ? (
                    <InlineLinkRow
                      links={[activeRole.link]}
                      className="inline-links--detail"
                    />
                  ) : null}
                </article>
              ) : null}
            </div>
          </div>
        </section>

        <section
          id="system"
          ref={systemSectionRef}
          className="site-section system-section"
          data-section="system"
        >
          <div className="shell">
            <div className="section-heading js-reveal">
              <h2 className="section-title">{siteContent.operatingSystem.heading}</h2>
              <p className="section-intro">{siteContent.operatingSystem.intro}</p>
            </div>

            <div className="system-shell">
              <div className="system-layout">
                <div className="system-scene-column js-reveal">
                  <div className="scene-frame scene-frame--system">
                    {shouldLoadSystemScene ? (
                      <Suspense
                        fallback={<div className="scene-frame__placeholder" />}
                      >
                        <AtlasScene
                          activeStage={activeSystemStage}
                          reducedMotion={prefersReducedMotion}
                          stageProgress={systemProgress}
                          variant="system"
                          paused={activeSection !== "system"}
                        />
                      </Suspense>
                    ) : (
                      <div className="scene-frame__placeholder" />
                    )}
                  </div>
                </div>

                <div className="system-steps">
                  {siteContent.operatingSystem.entries.map((entry) => (
                    <article
                      key={entry.id}
                      className={`system-step${
                        activeSystemStage === entry.id ? " is-active" : ""
                      }`}
                      data-operating-stage={entry.id}
                    >
                      <p className="system-step__kicker">{entry.kicker}</p>
                      <h3 className="system-step__title">{entry.title}</h3>
                      <p className="system-step__summary">{entry.summary}</p>
                      <ul className="system-step__evidence">
                        {entry.evidence.map((line) => (
                          <li key={line}>{line}</li>
                        ))}
                      </ul>
                    </article>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section
          id="background"
          className="site-section background-section"
          data-section="background"
        >
          <div className="shell">
            <div className="section-heading js-reveal">
              <h2 className="section-title">{siteContent.background.heading}</h2>
              <p className="section-intro">{siteContent.background.intro}</p>
            </div>

            <div className="background-grid">
              <div className="background-list js-reveal">
                {siteContent.background.entries.map((entry) => (
                  <article key={`${entry.title}-${entry.organization}`} className="background-item">
                    <h3 className="background-item__title">{entry.title}</h3>
                    <p className="background-item__meta">
                      {entry.organization}
                      <span>{entry.dates}</span>
                    </p>
                    <p className="background-item__summary">{entry.summary}</p>
                  </article>
                ))}
              </div>

              <aside className="education-block js-reveal">
                <p className="education-block__label">Education</p>
                <h3 className="education-block__degree">
                  {siteContent.background.education.degree}
                </h3>
                <p className="education-block__school">
                  {siteContent.background.education.organization}
                </p>
                <p className="education-block__dates">
                  {siteContent.background.education.dates}
                </p>
              </aside>
            </div>
          </div>
        </section>

        <section
          id="contact"
          className="site-section contact-section"
          data-section="contact"
        >
          <div className="shell">
            <div className="contact-panel js-reveal">
              <h2 className="section-title">{siteContent.contact.heading}</h2>
              <InlineLinkRow
                links={siteContent.contact.links}
                className="inline-links--contact"
              />
            </div>
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <div className="shell site-footer__inner">
          <p>{siteContent.footer.disclaimer}</p>
        </div>
      </footer>
    </div>
  );
}

export default App;
