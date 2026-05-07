import { useEffect, useLayoutEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import CurrentRolesSection from "./components/CurrentRolesSection";
import { siteContent, type ActionLink, type ProofSectionItem } from "./content";

gsap.registerPlugin(ScrollTrigger);

type SectionId = "overview" | "roles" | "background" | "contact";

const navItems: Array<{ id: SectionId; label: string }> = [
  { id: "overview", label: "Overview" },
  { id: "roles", label: "Current Roles" },
  { id: "background", label: "Background" },
  { id: "contact", label: "Contact" }
];

function usePrefersReducedMotion() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(() => {
    if (typeof window === "undefined") {
      return false;
    }

    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  });

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
    return "";
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
      {links.map((link) => {
        const isLead = link.href.includes("linkedin.com");
        const meta = getContactLinkMeta(link);
        const description = isLead
          ? "Best for professional conversations and follow-up."
          : "A current PDF summary of experience and roles.";

        return (
          <li
            key={link.label}
            className={`contact-list__item${isLead ? " contact-list__item--lead" : ""}`}
          >
            <a
              className="contact-list__link"
              href={link.href}
              {...(isExternalLink(link.href)
                ? { target: "_blank", rel: "noreferrer" }
                : {})}
              {...(link.download ? { download: true } : {})}
            >
              <span className="contact-list__copy">
                <span className="contact-list__label">{link.label}</span>
                <span className="contact-list__description">{description}</span>
              </span>
              {meta ? <span className="contact-list__meta">{meta}</span> : null}
            </a>
          </li>
        );
      })}
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

function HeroOperationsIndex() {
  const items = [
    {
      index: "01",
      label: "Laboratories",
      detail: "People, space, equipment, vendors"
    },
    {
      index: "02",
      label: "Program delivery",
      detail: "Funding, hiring, onboarding, closeout"
    },
    {
      index: "03",
      label: "Lab-manager conferences",
      detail: "Board priorities, speakers, partners"
    }
  ];

  return (
    <div className="hero-operations-index" aria-hidden="true">
      <div className="hero-operations-index__rule" />
      {items.map((item) => (
        <div className="hero-operations-index__row" key={item.index}>
          <span className="hero-operations-index__index">{item.index}</span>
          <span className="hero-operations-index__label">{item.label}</span>
          <span className="hero-operations-index__detail">{item.detail}</span>
        </div>
      ))}
    </div>
  );
}

function ProofVisual({ item }: { item: ProofSectionItem }) {
  if (item.visual === "labs") {
    return (
      <svg className="proof-visual proof-visual--labs" viewBox="0 0 520 360" role="presentation">
        <defs>
          <linearGradient id="proof-lab-glass" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#9eb7bf" />
            <stop offset="100%" stopColor="#445963" />
          </linearGradient>
          <linearGradient id="proof-lab-concrete" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#c4beb1" />
            <stop offset="100%" stopColor="#7d7a72" />
          </linearGradient>
        </defs>
        <path className="proof-visual__ground" d="M 52 288 L 430 310 L 486 254 L 116 236 Z" />
        <g className="proof-visual__building proof-visual__building--concrete">
          <path d="M 100 98 L 204 82 L 204 254 L 100 266 Z" />
          <path d="M 204 82 L 240 106 L 240 268 L 204 254 Z" />
          <path d="M 100 98 L 204 82 L 240 106 L 136 122 Z" />
          {Array.from({ length: 10 }).map((_, index) => (
            <path key={`lab-floor-a-${index}`} d={`M 112 ${118 + index * 13} L 194 ${106 + index * 13}`} />
          ))}
          <path className="proof-visual__floor proof-visual__floor--left" d="M 102 116 L 204 100 L 238 122 L 136 138 Z" />
        </g>
        <g className="proof-visual__building proof-visual__building--glass">
          <path d="M 292 80 L 424 108 L 424 258 L 292 246 Z" />
          <path d="M 424 108 L 458 130 L 458 276 L 424 258 Z" />
          <path d="M 292 80 L 424 108 L 458 130 L 326 102 Z" />
          {Array.from({ length: 10 }).map((_, index) => (
            <path key={`lab-floor-b-${index}`} d={`M 306 ${105 + index * 13} L 414 ${128 + index * 10}`} />
          ))}
          <path className="proof-visual__floor proof-visual__floor--right" d="M 294 116 L 424 142 L 456 164 L 326 138 Z" />
        </g>
        <path className="proof-visual__connector" d="M 222 172 C 258 158, 284 160, 320 180" />
        <path className="proof-visual__connector proof-visual__connector--soft" d="M 222 198 C 256 188, 286 190, 320 208" />
      </svg>
    );
  }

  if (item.visual === "program") {
    return (
      <svg className="proof-visual proof-visual--program" viewBox="0 0 520 360" role="presentation">
        <defs>
          <linearGradient id="proof-cycle-track" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#9bc3ad" />
            <stop offset="100%" stopColor="#466052" />
          </linearGradient>
        </defs>
        <ellipse className="proof-visual__shadow" cx="270" cy="286" rx="180" ry="34" />
        <path
          className="proof-visual__cycle"
          d="M 142 180 C 142 102, 202 58, 276 58 C 364 58, 428 124, 420 204 C 412 278, 346 318, 266 310 C 190 302, 134 248, 142 190"
        />
        <path className="proof-visual__cycle-arrow" d="M 412 172 L 434 204 L 396 199" />
        {[
          [276, 58],
          [408, 142],
          [398, 238],
          [266, 310],
          [154, 220],
          [164, 128]
        ].map(([cx, cy], index) => (
          <g className="proof-visual__cycle-node" key={`${cx}-${cy}`}>
            <circle cx={cx} cy={cy} r={index === 0 ? 13 : 10} />
            <text x={cx} y={cy + 5}>{String(index + 1).padStart(2, "0")}</text>
          </g>
        ))}
        <g className="proof-visual__workplane">
          <path d="M 200 176 L 330 150 L 372 198 L 240 226 Z" />
          <path d="M 222 184 L 312 166" />
          <path d="M 244 204 L 338 184" />
        </g>
      </svg>
    );
  }

  return (
    <figure className="proof-media">
      {item.image ? (
        <img src={item.image.src} alt={item.image.alt} loading="lazy" decoding="async" />
      ) : (
        <svg className="proof-visual proof-visual--network" viewBox="0 0 520 360" role="presentation">
          <circle className="proof-visual__globe" cx="270" cy="176" r="112" />
          <path className="proof-visual__us" d="M 206 164 C 236 136, 304 136, 342 158 C 326 182, 278 190, 224 184 Z" />
          <path className="proof-visual__route" d="M 224 174 C 270 148, 306 150, 342 172" />
          <path className="proof-visual__route proof-visual__route--soft" d="M 208 178 C 260 204, 316 200, 354 168" />
          {[224, 278, 342, 312].map((cx, index) => (
            <circle className="proof-visual__pin" key={cx} cx={cx} cy={index === 2 ? 172 : 176 - index * 8} r="7" />
          ))}
        </svg>
      )}
      {item.caption ? <figcaption>{item.caption}</figcaption> : null}
    </figure>
  );
}

function ProofSection() {
  return (
    <section className="stage stage--proof js-stage" aria-labelledby="proof-heading">
      <div className="shell proof-section">
        <div className="proof-section__heading js-stage-reveal">
          <SectionLabel
            label={siteContent.proofSection.label}
            className="section-heading__label"
          />
          <h2 id="proof-heading" className="section-heading__title">
            {siteContent.proofSection.heading}
          </h2>
          <SectionIntro body={siteContent.proofSection.intro} />
        </div>

        <div className="proof-section__items">
          {siteContent.proofSection.items.map((item) => (
            <article className="proof-item js-stage-reveal" key={item.id}>
              <div className="proof-item__copy">
                <p className="proof-item__meta">
                  <span>{item.index}</span>
                  {item.label}
                </p>
                <h3>{item.title}</h3>
                <p>{item.summary}</p>
                <ul>
                  {item.details.map((detail) => (
                    <li key={detail}>{detail}</li>
                  ))}
                </ul>
              </div>
              <div className="proof-item__visual">
                <ProofVisual item={item} />
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
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

  useLayoutEffect(() => {
    const header = document.querySelector<HTMLElement>(".site-header");

    if (!header) {
      return;
    }

    const syncHeaderOffset = () => {
      const height = Math.ceil(header.getBoundingClientRect().height);
      document.documentElement.style.setProperty("--header-offset", `${height}px`);
    };

    syncHeaderOffset();

    const observer = new ResizeObserver(syncHeaderOffset);
    observer.observe(header);
    window.addEventListener("resize", syncHeaderOffset);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", syncHeaderOffset);
    };
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
                <p className="hero__name js-hero-item">
                  {siteContent.hero.name}
                </p>
                <h1 className="hero__title js-hero-item">{siteContent.hero.title}</h1>
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
                <HeroOperationsIndex />
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

        <ProofSection />

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
                {siteContent.contact.supportLine ? (
                  <p className="contact__support">{siteContent.contact.supportLine}</p>
                ) : null}
                {siteContent.contact.contextTags?.length ? (
                  <div className="contact__topics">
                    <p>Open to conversations about</p>
                    <ul className="contact__tags" aria-label="Conversation topics">
                      {siteContent.contact.contextTags.map((tag) => (
                        <li key={tag}>{tag}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </div>

              <div className="contact__actions">
                <ContactLinks links={siteContent.contact.links} />
              </div>
            </div>

            {siteContent.contact.portrait ? (
              <figure className="contact__portrait js-stage-reveal">
                <picture>
                  {siteContent.contact.portrait.sources?.length ? (
                    <source
                      type="image/jpeg"
                      srcSet={siteContent.contact.portrait.sources
                        .map((source) => `${source.src} ${source.width}w`)
                        .join(", ")}
                      sizes="(max-width: 640px) 88vw, (max-width: 1024px) 24rem, 24rem"
                    />
                  ) : null}
                  <img
                    src={siteContent.contact.portrait.src}
                    alt={siteContent.contact.portrait.alt}
                    width={1996}
                    height={3000}
                    loading="lazy"
                    decoding="async"
                  />
                </picture>
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
