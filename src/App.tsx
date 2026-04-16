import { useEffect, useLayoutEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import CurrentRolesSection from "./components/CurrentRolesSection";
import { siteContent, type ActionLink } from "./content";

gsap.registerPlugin(ScrollTrigger);

type SectionId = "overview" | "roles" | "background" | "contact";

const navItems: Array<{ id: SectionId; label: string }> = [
  { id: "overview", label: "Overview" },
  { id: "roles", label: "Current Roles" },
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

function getContactLinkMeta(link: ActionLink) {
  if (link.download) {
    return "PDF";
  }

  if (link.href.includes("linkedin.com")) {
    return "Profile";
  }

  try {
    return new URL(link.href).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

function renderScientificNames(text: string) {
  const speciesName = "Caulobacter crescentus";

  return text.split(speciesName).flatMap((part, index, parts) => {
    if (index === parts.length - 1) {
      return part;
    }

    return [
      part,
      <em key={`${speciesName}-${index}`}>{speciesName}</em>
    ];
  });
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
      {links.map((link, index) => (
        <li
          key={link.label}
          className={`contact-list__item${index === 0 ? " contact-list__item--primary" : ""}`}
        >
          <a
            className="contact-list__link"
            href={link.href}
            {...(isExternalLink(link.href)
              ? { target: "_blank", rel: "noreferrer" }
              : {})}
            {...(link.download ? { download: true } : {})}
          >
            <span className="contact-list__index">{String(index + 1).padStart(2, "0")}</span>
            <span className="contact-list__label">{link.label}</span>
            <span className="contact-list__meta">{getContactLinkMeta(link)}</span>
          </a>
        </li>
      ))}
    </ul>
  );
}

function SectionIntro({ body }: { body?: string }) {
  if (!body) {
    return null;
  }

  return <p className="section-heading__body">{body}</p>;
}

function SectionLabel({ label, className }: { label?: string; className: string }) {
  if (!label) {
    return null;
  }

  return <p className={className}>{label}</p>;
}

function App() {
  const prefersReducedMotion = usePrefersReducedMotion();
  const rootRef = useRef<HTMLDivElement>(null);
  const [activeSection, setActiveSection] = useState<SectionId>("overview");

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
        threshold: 0.45,
        rootMargin: "-12% 0px -42% 0px"
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
            <div className="hero__layout">
              <div className="hero__copy">
                <SectionLabel
                  label={siteContent.hero.label}
                  className="hero__eyebrow js-hero-item"
                />
                <h1 className="hero__name js-hero-item">
                  {siteContent.hero.name}
                </h1>
                <p className="hero__title js-hero-item">{siteContent.hero.title}</p>
                <p className="hero__location js-hero-item">
                  {siteContent.hero.location}
                </p>
                <div className="hero__summary js-hero-item">
                  {siteContent.hero.summary.map((paragraph) => (
                    <p key={paragraph}>{paragraph}</p>
                  ))}
                </div>

                <div className="js-hero-item">
                  <ActionRow links={siteContent.hero.actions} />
                </div>
              </div>

              <aside className="hero-proof-panel js-hero-item" aria-label="Key proof">
                <p className="hero-proof-panel__label">At a glance</p>
                <div className="hero-proof-panel__list">
                  {siteContent.hero.proof.map((item) => (
                    <article className="hero-proof-panel__item" key={item.headline}>
                      <h3 className="hero-proof-panel__headline">{item.headline}</h3>
                      <p className="hero-proof-panel__detail">{item.detail}</p>
                    </article>
                  ))}
                </div>
              </aside>
            </div>
          </div>
        </section>

        <CurrentRolesSection reducedMotion={prefersReducedMotion} />

        <section
          id="background"
          data-section="background"
          className="stage stage--background js-stage"
        >
          <div className="shell">
            <div className="section-heading js-stage-reveal">
              <SectionLabel
                label={siteContent.background.label}
                className="section-heading__label"
              />
              <h2 className="section-heading__title">
                {siteContent.background.heading}
              </h2>
              <SectionIntro body={siteContent.background.intro} />
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
                    <p className="background-role__summary">
                      {renderScientificNames(entry.summary)}
                    </p>
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
            <div className="contact__content js-stage-reveal">
              <div className="section-heading contact__heading">
                <SectionLabel
                  label={siteContent.contact.label}
                  className="section-heading__label"
                />
                <h2 className="section-heading__title">{siteContent.contact.heading}</h2>
                <SectionIntro body={siteContent.contact.intro} />
              </div>

              <div className="contact__actions">
                <ContactLinks links={siteContent.contact.links} />
              </div>
            </div>

            {siteContent.contact.portrait ? (
              <figure className="contact__portrait js-stage-reveal">
                <img
                  src={siteContent.contact.portrait.src}
                  alt={siteContent.contact.portrait.alt}
                  width={1400}
                  height={1052}
                />
              </figure>
            ) : null}
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
