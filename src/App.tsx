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
import { siteContent, type ActionLink, type ProofItem } from "./content";
import type { AtlasStateId } from "./atlasScenePresets";

gsap.registerPlugin(ScrollTrigger);

const AtlasScene = lazy(async () => {
  const module = await import("./components/AtlasScene");
  return { default: module.AtlasScene };
});

type SectionId = "overview" | "labs" | "program" | "network" | "contact";

const navItems: Array<{
  id: SectionId;
  label: string;
  scene: AtlasStateId;
}> = [
  { id: "overview", label: "Overview", scene: "opening" },
  { id: "labs", label: "Laboratory Operations", scene: "labs" },
  { id: "program", label: "Community Phages", scene: "program" },
  { id: "network", label: "Network Leadership", scene: "network" },
  { id: "contact", label: "Contact", scene: "closing" }
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

function ProofCluster({
  items,
  className
}: {
  items: ProofItem[];
  className?: string;
}) {
  return (
    <div className={["proof-cluster", className].filter(Boolean).join(" ")}>
      {items.map((item) => (
        <article
          key={item.headline}
          className={`proof-card proof-card--${item.tone ?? "neutral"}`}
        >
          <h3 className="proof-card__headline">{item.headline}</h3>
          <p className="proof-card__detail">{item.detail}</p>
        </article>
      ))}
    </div>
  );
}

function App() {
  const prefersReducedMotion = usePrefersReducedMotion();
  const rootRef = useRef<HTMLDivElement>(null);
  const [activeSection, setActiveSection] = useState<SectionId>("overview");
  const [sceneProgress, setSceneProgress] = useState(0);
  const [shouldLoadAtlas, setShouldLoadAtlas] = useState(false);

  const activeNavItem = useMemo(
    () => navItems.find((item) => item.id === activeSection) ?? navItems[0],
    [activeSection]
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
      setShouldLoadAtlas(true);
      return undefined;
    }

    const loadAtlas = () => setShouldLoadAtlas(true);

    if ("requestIdleCallback" in window) {
      idleId = window.requestIdleCallback(loadAtlas, { timeout: 1200 });
    } else {
      timeoutId = globalThis.setTimeout(loadAtlas, 280);
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
    if (!prefersReducedMotion) {
      return;
    }

    const sections = Array.from(
      document.querySelectorAll<HTMLElement>("[data-section]")
    );
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id as SectionId);
            setSceneProgress(0.5);
          }
        });
      },
      {
        threshold: 0.42,
        rootMargin: "-15% 0px -35% 0px"
      }
    );

    sections.forEach((section) => observer.observe(section));

    return () => observer.disconnect();
  }, [prefersReducedMotion]);

  useLayoutEffect(() => {
    if (!rootRef.current) {
      return;
    }

    const ctx = gsap.context(() => {
      document.documentElement.style.setProperty("--scroll-progress", "0");

      if (prefersReducedMotion) {
        gsap.set(".js-panel", { autoAlpha: 1, y: 0 });
        return;
      }

      gsap.utils.toArray<HTMLElement>("[data-section]").forEach((section) => {
        ScrollTrigger.create({
          trigger: section,
          start: "top center",
          end: "bottom center",
          onToggle: (self) => {
            if (self.isActive) {
              setActiveSection(section.id as SectionId);
            }
          },
          onUpdate: (self) => {
            if (self.isActive) {
              setActiveSection(section.id as SectionId);
              setSceneProgress(self.progress);
            }
          }
        });
      });

      gsap.utils.toArray<HTMLElement>(".js-panel").forEach((panel) => {
        gsap.fromTo(
          panel,
          { autoAlpha: 0, y: 28 },
          {
            autoAlpha: 1,
            y: 0,
            duration: 0.85,
            ease: "power2.out",
            scrollTrigger: {
              trigger: panel,
              start: "top 82%",
              once: true
            }
          }
        );
      });

      gsap.to(".atlas-viewport__veil", {
        opacity: 0.52,
        ease: "none",
        scrollTrigger: {
          start: 0,
          end: "max",
          scrub: 1
        }
      });

      ScrollTrigger.create({
        start: 0,
        end: "max",
        onUpdate: (self) => {
          document.documentElement.style.setProperty(
            "--scroll-progress",
            self.progress.toFixed(4)
          );
        }
      });
    }, rootRef);

    return () => ctx.revert();
  }, [prefersReducedMotion]);

  return (
    <div className="site-app site-app--atlas" ref={rootRef}>
      <a className="skip-link" href="#content">
        Skip to content
      </a>

      <header className="site-header">
        <div className="shell site-header__inner">
          <a className="site-brand" href="#overview">
            James M. Spencer
          </a>

          <nav className="site-nav" aria-label="Section navigation">
            {navItems.map((item, index) => (
              <a
                key={item.id}
                className="site-nav__link"
                href={`#${item.id}`}
                aria-current={
                  activeSection === item.id ? "location" : undefined
                }
              >
                <span className="site-nav__index">0{index + 1}</span>
                <span>{item.label}</span>
              </a>
            ))}
          </nav>
        </div>
      </header>

      <div className="atlas-viewport" aria-hidden="true">
        <div className="atlas-viewport__wash atlas-viewport__wash--top" />
        <div className="atlas-viewport__wash atlas-viewport__wash--bottom" />
        {shouldLoadAtlas ? (
          <Suspense fallback={<div className="atlas-viewport__placeholder" />}>
            <AtlasScene
              activeStage={activeNavItem.scene}
              activeLabel={activeNavItem.label}
              reducedMotion={prefersReducedMotion}
              stageProgress={sceneProgress}
            />
          </Suspense>
        ) : (
          <div className="atlas-viewport__placeholder" />
        )}
        <div className="atlas-viewport__veil" />
      </div>

      <nav className="stage-progress" aria-label="Story progress">
        <div className="stage-progress__rail" />
        <div className="stage-progress__meter" />
        <ol className="stage-progress__list">
          {navItems.map((item, index) => (
            <li
              key={item.id}
              className="stage-progress__item"
              data-active={activeSection === item.id ? "true" : undefined}
            >
              <a
                className="stage-progress__link"
                href={`#${item.id}`}
                aria-current={
                  activeSection === item.id ? "location" : undefined
                }
              >
                <span className="stage-progress__number">0{index + 1}</span>
                <span className="stage-progress__label">{item.label}</span>
              </a>
            </li>
          ))}
        </ol>
      </nav>

      <main id="content" className="story-main">
        <section
          id="overview"
          className="story-section story-section--opening"
          data-section="overview"
        >
          <div className="shell story-section__inner story-section__inner--opening">
            <article className="opening-panel js-panel">
              <p className="opening-panel__kicker">Overview</p>
              <h1 className="opening-panel__name">{siteContent.opening.name}</h1>
              <p className="opening-panel__title">{siteContent.opening.title}</p>
              <p className="opening-panel__location">
                {siteContent.opening.location}
              </p>

              <div className="opening-panel__summary">
                {siteContent.opening.summary.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>

              <InlineLinkRow links={siteContent.opening.links} />
            </article>

            <aside className="opening-proof js-panel">
              <p className="opening-proof__kicker">At a glance</p>
              <ProofCluster items={siteContent.opening.proof} />
            </aside>
          </div>
        </section>

        {siteContent.atlasStages.map((stage) => (
          <section
            key={stage.id}
            id={stage.id}
            className={`story-section story-section--stage story-section--${stage.alignment}`}
            data-section={stage.id}
          >
            <div className="shell story-section__inner story-section__inner--stage">
              <article className={`stage-card stage-card--${stage.id} js-panel`}>
                <p className="stage-card__kicker">{stage.kicker}</p>
                <h2 className="stage-card__title">{stage.title}</h2>
                <p className="stage-card__summary">{stage.summary}</p>
                <ProofCluster items={stage.proof} className="proof-cluster--stage" />
              </article>
            </div>
          </section>
        ))}

        <section
          id="contact"
          className="story-section story-section--closing"
          data-section="contact"
        >
          <div className="shell story-section__inner story-section__inner--closing">
            <article className="closing-panel js-panel">
              <h2 className="closing-panel__title">{siteContent.closing.title}</h2>
              <InlineLinkRow
                links={siteContent.closing.links}
                className="inline-links--closing"
              />
            </article>
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
