import type { ActionLink, ContactContent, FitRole, OperatingScopeItem } from "../content";
import type { VNextChapter } from "./VNextContent";
import VNextScene from "./VNextScene";

function isExternalLink(href: string) {
  return href.startsWith("http");
}

function smoothstep(start: number, end: number, value: number) {
  const x = Math.max(0, Math.min(1, (value - start) / (end - start)));
  return x * x * (3 - 2 * x);
}

function getActiveChapter(progress: number) {
  if (progress >= 0.62) {
    return "network";
  }

  if (progress >= 0.34) {
    return "program";
  }

  return "labs";
}

function ActionLinkRow({ links }: { links: ActionLink[] }) {
  return (
    <div className="vnext-actions">
      {links.map((link) => (
        <a
          key={link.label}
          href={link.href}
          {...(isExternalLink(link.href) ? { target: "_blank", rel: "noreferrer" } : {})}
          {...(link.download ? { download: true } : {})}
        >
          {link.label}
        </a>
      ))}
    </div>
  );
}

export function VNextHero({
  name,
  title,
  summary,
  proof,
  links
}: {
  name: string;
  title: string;
  summary: string;
  proof: string[];
  links: ActionLink[];
}) {
  return (
    <section className="vnext-hero" id="vnext-overview">
      <div className="vnext-shell vnext-hero__layout">
        <div className="vnext-hero__copy">
          <p className="vnext-kicker">{name}</p>
          <h1>{title}</h1>
          <p>{summary}</p>
          <ActionLinkRow links={links} />
        </div>

        <aside className="vnext-hero__index" aria-label="Prototype focus">
          <p>Prototype focus</p>
          {proof.map((item, index) => (
            <div className="vnext-hero__index-row" key={item}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <strong>{item}</strong>
            </div>
          ))}
        </aside>
      </div>
    </section>
  );
}

export function VNextStory({
  chapters,
  progress,
  reducedMotion,
  documentary
}: {
  chapters: VNextChapter[];
  progress: number;
  reducedMotion: boolean;
  documentary?: {
    image: { src: string; alt: string };
    caption: string;
  };
}) {
  const activeChapter = getActiveChapter(progress);
  const photoProgress = smoothstep(0.82, 0.92, progress);

  return (
    <div className="vnext-story__pin">
      <div className="vnext-shell vnext-story__inner">
        <div className="vnext-story__topline">
          <p>Current roles</p>
          <div className="vnext-story__meter" aria-hidden="true">
            <span style={{ transform: `scaleX(${progress})` }} />
          </div>
        </div>

        <div className="vnext-story__layout">
          <div className="vnext-story__copy">
            <div className="vnext-story__chapter-nav" aria-label="Chapter progress">
              {chapters.map((chapter) => (
                <span key={chapter.id} data-active={activeChapter === chapter.id}>
                  {chapter.index}
                </span>
              ))}
            </div>

            <div className="vnext-story__panels">
              {chapters.map((chapter) => (
                <article
                  className="vnext-story__panel"
                  data-active={activeChapter === chapter.id || reducedMotion}
                  key={chapter.id}
                >
                  <p>{chapter.label}</p>
                  <h2>{chapter.title}</h2>
                  <span>{chapter.summary}</span>
                  <ul>
                    {chapter.points.map((point) => (
                      <li key={point}>{point}</li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>
          </div>

          <div className="vnext-story__visual">
            <VNextScene progress={progress} reducedMotion={reducedMotion} />
            {documentary ? (
              <figure
                className="vnext-documentary"
                style={{
                  opacity: photoProgress,
                  transform: `translate3d(0, ${24 - photoProgress * 24}px, 0) scale(${0.96 + photoProgress * 0.04})`
                }}
              >
                <img src={documentary.image.src} alt={documentary.image.alt} />
                <figcaption>{documentary.caption}</figcaption>
              </figure>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

export function VNextFit({
  title,
  summary,
  roles,
  scope
}: {
  title: string;
  summary: string;
  roles: FitRole[];
  scope: OperatingScopeItem[];
}) {
  return (
    <section className="vnext-fit" id="vnext-fit">
      <div className="vnext-shell vnext-fit__layout">
        <div className="vnext-fit__heading">
          <p className="vnext-kicker">Role fit</p>
          <h2>{title}</h2>
          <p>{summary}</p>
        </div>

        <div className="vnext-fit__roles">
          {roles.map((role) => (
            <article key={role.title}>
              <p>{role.tier}</p>
              <h3>{role.title}</h3>
              <span>{role.detail}</span>
            </article>
          ))}
        </div>

        <div className="vnext-fit__scope">
          {scope.map((item) => (
            <article key={item.label}>
              <p>{item.label}</p>
              <h3>{item.heading}</h3>
              <span>{item.body}</span>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export function VNextContact({ contact }: { contact: ContactContent }) {
  const portrait = contact.portrait;

  return (
    <section className="vnext-contact" id="vnext-contact">
      <div className="vnext-shell vnext-contact__layout">
        <div className="vnext-contact__copy">
          <p className="vnext-kicker">{contact.label}</p>
          <h2>{contact.heading}</h2>
          <p>{contact.intro}</p>
          {contact.supportLine ? <span>{contact.supportLine}</span> : null}
          {contact.contextTags?.length ? (
            <ul>
              {contact.contextTags.map((tag) => (
                <li key={tag}>{tag}</li>
              ))}
            </ul>
          ) : null}
          <ActionLinkRow links={contact.links} />
        </div>

        {portrait ? (
          <figure className="vnext-contact__portrait">
            <picture>
              {portrait.sources?.length ? (
                <source
                  type="image/jpeg"
                  srcSet={portrait.sources.map((source) => `${source.src} ${source.width}w`).join(", ")}
                  sizes="(max-width: 720px) 82vw, 30rem"
                />
              ) : null}
              <img src={portrait.src} alt={portrait.alt} />
            </picture>
          </figure>
        ) : null}
      </div>
    </section>
  );
}
