import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { siteContent, type ActionLink, type ExperienceEntry } from "./content";

gsap.registerPlugin(ScrollTrigger);

type SectionId = "overview" | "scope" | "experience" | "background" | "contact";

const navItems: Array<{ id: SectionId; label: string }> = [
  { id: "overview", label: "Overview" },
  { id: "scope", label: "Current Scope" },
  { id: "experience", label: "Experience" },
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

function ActionRow({ links }: { links: ActionLink[] }) {
  return (
    <div className="action-row">
      {links.map((link) => (
        <a
          key={link.label}
          className="action-row__link"
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

function ContactLinks({ links }: { links: ActionLink[] }) {
  return (
    <ul className="contact-list">
      {links.map((link) => (
        <li key={link.label} className="contact-list__item">
          <a
            className="contact-list__link"
            href={link.href}
            {...(isExternalLink(link.href)
              ? { target: "_blank", rel: "noreferrer" }
              : {})}
            {...(link.download ? { download: true } : {})}
          >
            {link.label}
          </a>
        </li>
      ))}
    </ul>
  );
}

function App() {
  const prefersReducedMotion = usePrefersReducedMotion();
  const rootRef = useRef<HTMLDivElement>(null);
  const detailRef = useRef<HTMLElement>(null);
  const [activeSection, setActiveSection] = useState<SectionId>("overview");
  const [activeRole, setActiveRole] = useState(
    siteContent.experience.entries[0].id
  );

  const activeEntry = useMemo<ExperienceEntry>(
    () =>
      siteContent.experience.entries.find((entry) => entry.id === activeRole) ??
      siteContent.experience.entries[0],
    [activeRole]
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
          }
        });
      },
      {
        threshold: 0.4,
        rootMargin: "-15% 0px -45% 0px"
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
      if (prefersReducedMotion) {
        document.documentElement.style.setProperty("--scroll-progress", "0");
        return;
      }

      gsap.fromTo(
        ".js-hero-item",
        { autoAlpha: 0, y: 14 },
        {
          autoAlpha: 1,
          y: 0,
          duration: 0.55,
          ease: "power2.out",
          stagger: 0.04
        }
      );

      gsap.utils.toArray<HTMLElement>(".js-stage").forEach((stage) => {
        const revealTargets = stage.querySelectorAll<HTMLElement>(".js-stage-reveal");
        if (!revealTargets.length) {
          return;
        }

        gsap.fromTo(
          revealTargets,
          { autoAlpha: 0, y: 24 },
          {
            autoAlpha: 1,
            y: 0,
            duration: 0.65,
            ease: "power2.out",
            stagger: 0.05,
            scrollTrigger: {
              trigger: stage,
              start: "top 78%",
              once: true
            }
          }
        );
      });

      gsap.utils.toArray<HTMLElement>("[data-section]").forEach((section) => {
        ScrollTrigger.create({
          trigger: section,
          start: "top center",
          end: "bottom center",
          onToggle: (self) => {
            if (self.isActive) {
              setActiveSection(section.id as SectionId);
            }
          }
        });
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

  useEffect(() => {
    if (prefersReducedMotion || !detailRef.current) {
      return;
    }

    const items = detailRef.current.querySelectorAll<HTMLElement>(".js-detail-item");
    gsap.fromTo(
      items,
      { autoAlpha: 0, y: 12 },
      {
        autoAlpha: 1,
        y: 0,
        duration: 0.3,
        ease: "power2.out",
        stagger: 0.04,
        clearProps: "opacity,transform"
      }
    );
  }, [activeRole, prefersReducedMotion]);

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
          <nav className="site-nav" aria-label="Primary">
            {navItems.map((item) => (
              <a
                key={item.id}
                className="site-nav__link"
                href={`#${item.id}`}
                aria-current={activeSection === item.id ? "location" : undefined}
              >
                {item.label}
              </a>
            ))}
          </nav>
        </div>
      </header>

      <main id="content">
        <section
          id="overview"
          data-section="overview"
          className="stage stage--overview"
        >
          <div className="shell hero">
            <div className="hero__copy">
              <p className="hero__eyebrow js-hero-item">
                {siteContent.hero.label}
              </p>
              <h1 className="hero__name js-hero-item">
                {siteContent.hero.name}
              </h1>
              <p className="hero__title js-hero-item">{siteContent.hero.title}</p>
              <p className="hero__location js-hero-item">
                {siteContent.hero.location}
              </p>
              <p className="hero__summary js-hero-item">
                {siteContent.hero.summary}
              </p>

              <dl className="hero-proof js-hero-item">
                {siteContent.hero.proof.map((item) => (
                  <div className="hero-proof__item" key={item.label}>
                    <dt className="hero-proof__value">{item.value}</dt>
                    <dd className="hero-proof__copy">
                      <span className="hero-proof__label">{item.label}</span>
                      <span className="hero-proof__detail">{item.detail}</span>
                    </dd>
                  </div>
                ))}
              </dl>

              <div className="js-hero-item">
                <ActionRow links={siteContent.hero.actions} />
              </div>
            </div>
          </div>
        </section>

        <section id="scope" data-section="scope" className="stage stage--scope js-stage">
          <div className="shell">
            <div className="section-heading js-stage-reveal">
              <p className="section-heading__label">{siteContent.scope.label}</p>
              <h2 className="section-heading__title">{siteContent.scope.heading}</h2>
              <p className="section-heading__body">{siteContent.scope.overview}</p>
            </div>

            <div className="scope-institutions js-stage-reveal">
              {siteContent.scope.institutions.map((item) => (
                <article className="scope-institutions__item" key={item.name}>
                  <h3>{item.name}</h3>
                  <p>{item.detail}</p>
                </article>
              ))}
            </div>

            <div className="scope-layout">
              <div className="scope-domains js-stage-reveal">
                {siteContent.scope.domains.map((domain) => (
                  <article className="scope-domains__item" key={domain.title}>
                    <h3>{domain.title}</h3>
                    <p>{domain.description}</p>
                  </article>
                ))}
              </div>

              <aside className="scope-results js-stage-reveal">
                <p className="scope-results__label">Selected results</p>
                <ol className="scope-results__list">
                  {siteContent.scope.results.map((result) => (
                    <li key={result}>{result}</li>
                  ))}
                </ol>
              </aside>
            </div>
          </div>
        </section>

        <section
          id="experience"
          data-section="experience"
          className="stage stage--experience js-stage"
        >
          <div className="shell">
            <div className="section-heading js-stage-reveal">
              <p className="section-heading__label">{siteContent.experience.label}</p>
              <h2 className="section-heading__title">
                {siteContent.experience.heading}
              </h2>
              <p className="section-heading__body">{siteContent.experience.intro}</p>
            </div>

            <div className="experience-layout">
              <div className="experience-nav js-stage-reveal">
                {siteContent.experience.entries.map((entry, index) => (
                  <button
                    key={entry.id}
                    type="button"
                    className="experience-nav__item"
                    data-active={activeRole === entry.id}
                    onClick={() => setActiveRole(entry.id)}
                  >
                    <span className="experience-nav__index">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span className="experience-nav__text">
                      <span className="experience-nav__label">{entry.navLabel}</span>
                      <span className="experience-nav__dates">{entry.dates}</span>
                    </span>
                  </button>
                ))}
              </div>

              <article className="experience-detail js-stage-reveal" ref={detailRef}>
                <p className="experience-detail__dates js-detail-item">
                  {activeEntry.dates}
                </p>
                <h3 className="experience-detail__title js-detail-item">
                  {activeEntry.title}
                </h3>
                <p className="experience-detail__organization js-detail-item">
                  {activeEntry.organization}
                </p>
                <p className="experience-detail__summary js-detail-item">
                  {activeEntry.summary}
                </p>

                <div className="experience-detail__grid">
                  <ul className="experience-detail__list js-detail-item">
                    {activeEntry.responsibilities.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>

                  <dl className="experience-detail__evidence js-detail-item">
                    {activeEntry.evidence.map((item) => (
                      <div key={item.label} className="experience-detail__evidence-item">
                        <dt>{item.label}</dt>
                        <dd>{item.value}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              </article>
            </div>
          </div>
        </section>

        <section
          id="background"
          data-section="background"
          className="stage stage--background js-stage"
        >
          <div className="shell">
            <div className="section-heading js-stage-reveal">
              <p className="section-heading__label">{siteContent.background.label}</p>
              <h2 className="section-heading__title">
                {siteContent.background.heading}
              </h2>
              <p className="section-heading__body">{siteContent.background.intro}</p>
            </div>

            <div className="background-layout">
              <div className="background-roles js-stage-reveal">
                {siteContent.background.entries.map((entry) => (
                  <article className="background-role" key={entry.title}>
                    <div className="background-role__top">
                      <h3>{entry.title}</h3>
                      <p>{entry.dates}</p>
                    </div>
                    <p className="background-role__organization">
                      {entry.organization}
                    </p>
                    <p className="background-role__summary">{entry.summary}</p>
                  </article>
                ))}
              </div>

              <aside className="background-aside js-stage-reveal">
                {siteContent.background.portrait ? (
                  <figure className="background-portrait">
                    <img
                      src={siteContent.background.portrait.src}
                      alt={siteContent.background.portrait.alt}
                      width={1200}
                      height={1600}
                    />
                  </figure>
                ) : null}

                <div className="background-education">
                  <p className="background-education__label">Education</p>
                  <h3>{siteContent.background.education.degree}</h3>
                  <p>{siteContent.background.education.organization}</p>
                  <p>{siteContent.background.education.dates}</p>
                </div>
              </aside>
            </div>
          </div>
        </section>

        <section
          id="contact"
          data-section="contact"
          className="stage stage--contact js-stage"
        >
          <div className="shell contact">
            <div className="section-heading js-stage-reveal">
              <p className="section-heading__label">{siteContent.contact.label}</p>
              <h2 className="section-heading__title">{siteContent.contact.heading}</h2>
              <p className="section-heading__body">{siteContent.contact.intro}</p>
            </div>

            <div className="contact__actions js-stage-reveal">
              <ContactLinks links={siteContent.contact.links} />
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
