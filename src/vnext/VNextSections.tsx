import type { ActionLink, ContactContent, FitRole, OperatingScopeItem } from "../content";
import { VNextResearchSystem } from "./VNextResearchSystem";

function isExternalLink(href: string) {
  return href.startsWith("http");
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
  links,
  reducedMotion
}: {
  name: string;
  title: string;
  summary: string[];
  proof: Array<{ label: string; value: string }>;
  links: ActionLink[];
  reducedMotion: boolean;
}) {
  return (
    <section className="vnext-hero" id="vnext-overview">
      <div className="vnext-shell vnext-hero__layout">
        <div className="vnext-hero__copy">
          <p className="vnext-kicker">{name}</p>
          <h1>{title}</h1>
          {summary.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
          <ActionLinkRow links={links} />
        </div>

        <div className="vnext-hero__visual">
          <VNextResearchSystem progress={0.12} reducedMotion={reducedMotion} />
        </div>

        <aside className="vnext-hero__index" aria-label="At a glance">
          {proof.map((item, index) => (
            <div className="vnext-hero__index-row" key={item.label}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <strong>{item.label}</strong>
              <p>{item.value}</p>
            </div>
          ))}
        </aside>
      </div>
    </section>
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
                  sizes="(max-width: 760px) 86vw, 34rem"
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
