import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";

type WorkChapter = {
  id: "labs" | "program" | "network" | "conference";
  index: string;
  eyebrow: string;
  title: string;
  organization: string;
  dates: string;
  summary: string;
  responsibilities: string[];
  evidence: string[];
  image: string;
  imageAlt: string;
};

const asset = (path: string) => `${import.meta.env.BASE_URL}${path}`;

const chapters: WorkChapter[] = [
  {
    id: "labs",
    index: "01",
    eyebrow: "Laboratory operations",
    title: "Laboratory Manager",
    organization:
      "Bernhardt and Abraham laboratories, Department of Microbiology, Harvard Medical School",
    dates: "2019 - Present",
    summary:
      "James manages day-to-day operations for two distinct HHMI Investigator laboratories with separate research spaces, equipment, vendors, and access needs.",
    responsibilities: [
      "Purchasing, budgets, equipment, service contracts, vendors, and facilities requests.",
      "Lab access, onboarding, candidate visits, supplies, and daily support for active research space.",
    ],
    evidence: [
      "Bernhardt Lab - 4 Blackfan Circle, 10th floor",
      "Abraham Lab - Veritas Science Center, 9th floor",
    ],
    image: asset("assets/scenes/labs-focus.jpg"),
    imageAlt:
      "Nighttime aerial interpretation of two research buildings with the 10th floor at 4 Blackfan Circle and the 9th floor at Veritas Science Center illuminated.",
  },
  {
    id: "program",
    index: "02",
    eyebrow: "Scientific program operations",
    title: "Program Operations Lead",
    organization:
      "Community Phages, Department of Microbiology, Harvard Medical School",
    dates: "2022 - Present",
    summary:
      "James coordinates the practical work required to run an eight-week summer research program for Roxbury Community College students in HMS laboratory space.",
    responsibilities: [
      "Funding coordination, hiring, onboarding, lab setup, access, and biosafety preparation.",
      "Instructor support, field trips, daily student logistics, closeout, and lab-space reset.",
    ],
    evidence: [
      "Fifth annual program cycle",
      "Full delivery sequence from funding through closeout",
    ],
    image: asset("assets/scenes/program-cycle.jpg"),
    imageAlt:
      "Dimensional annual program operations cycle with stations for preparation, delivery, and closeout.",
  },
  {
    id: "network",
    index: "03",
    eyebrow: "Lab-manager conferences",
    title: "Chair, Advisory Board",
    organization:
      "Lab Management Network of Professionals, Howard Hughes Medical Institute",
    dates: "2022 - Present",
    summary:
      "James chairs advisory-board work for a professional network of laboratory managers and helps plan regional and national conferences.",
    responsibilities: [
      "Board priorities, meeting agendas, speaker coordination, partner contact, and member resources.",
      "Conference planning, site logistics, and continuity between regional and national meetings.",
    ],
    evidence: [
      "Boston and Washington, DC",
      "San Francisco and New York City",
    ],
    image: asset("assets/scenes/conference-network.jpg"),
    imageAlt:
      "North American conference network with illuminated routes connecting four meeting locations.",
  },
  {
    id: "conference",
    index: "03 / Proof",
    eyebrow: "Conference leadership in practice",
    title: "Regional LMNOP meeting",
    organization: "San Francisco",
    dates: "2026",
    summary:
      "The conference work is practical and visible: preparing the agenda, coordinating speakers and partners, managing the site, and leading the program in the room.",
    responsibilities: [
      "Designed for laboratory managers working across research institutions.",
      "Part of year-round advisory-board planning and professional development work.",
    ],
    evidence: ["James leading a conference session", "San Francisco, 2026"],
    image: asset("assets/images/lmnop-conference-photo-2026-sf.jpg"),
    imageAlt:
      "James M. Spencer speaking into a microphone during an LMNOP conference session in San Francisco.",
  },
];

const programPhases = [
  "Funding",
  "Hiring",
  "Lab setup",
  "Biosafety",
  "Delivery",
  "Closeout",
];

const conferenceCities = [
  "Washington, DC",
  "Boston",
  "San Francisco",
  "New York City",
];

const roleFit = [
  [
    "Research Operations Manager",
    "Coordination across lab space, equipment, vendors, access, budgets, and research teams.",
  ],
  [
    "Laboratory Operations Manager",
    "Multi-lab continuity in academic, biomedical, or research institute settings.",
  ],
  [
    "Scientific Program Manager",
    "Program setup, staffing, logistics, delivery, participant support, and closeout.",
  ],
  [
    "Senior Laboratory Manager",
    "Hands-on responsibility for people, facilities, supplies, purchasing, and equipment readiness.",
  ],
];

export default function App() {
  const [activeChapter, setActiveChapter] = useState(0);
  const [activeSection, setActiveSection] = useState("overview");
  const chapterRefs = useRef<Array<HTMLElement | null>>([]);

  const navItems = useMemo(
    () => [
      ["Overview", "overview"],
      ["Current work", "work"],
      ["Experience", "background"],
      ["Contact", "contact"],
    ],
    [],
  );

  useEffect(() => {
    let frame = 0;

    const update = () => {
      frame = 0;
      const viewport = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight - viewport;
      const pageProgress = documentHeight > 0 ? window.scrollY / documentHeight : 0;
      document.documentElement.style.setProperty(
        "--page-progress",
        String(Math.max(0, Math.min(1, pageProgress))),
      );
      document.documentElement.style.setProperty(
        "--hero-progress",
        String(Math.max(0, Math.min(1, window.scrollY / Math.max(viewport, 1)))),
      );

      const targetLine = viewport * 0.5;
      let nextChapter = 0;
      let shortest = Number.POSITIVE_INFINITY;

      chapterRefs.current.forEach((node, index) => {
        if (!node) return;
        const rect = node.getBoundingClientRect();
        const center = rect.top + rect.height / 2;
        const distance = Math.abs(center - targetLine);
        if (distance < shortest) {
          shortest = distance;
          nextChapter = index;
        }
      });

      setActiveChapter((current) => (current === nextChapter ? current : nextChapter));

      const sectionIds = ["overview", "work", "scope", "background", "contact"];
      let currentSection = "overview";
      sectionIds.forEach((id) => {
        const section = document.getElementById(id);
        if (section && section.getBoundingClientRect().top <= viewport * 0.35) {
          currentSection = id;
        }
      });
      setActiveSection((current) =>
        current === currentSection ? current : currentSection,
      );
    };

    const onScroll = () => {
      if (!frame) frame = window.requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <main>
      <div className="page-progress" aria-hidden="true" />

      <header className="site-header">
        <a className="site-brand" href="#overview" aria-label="James M. Spencer, home">
          <span>James M. Spencer</span>
          <small>Research operations</small>
        </a>
        <nav aria-label="Primary navigation">
          {navItems.map(([label, id]) => (
            <a
              key={id}
              href={`#${id}`}
              className={
                activeSection === id ||
                (id === "work" && activeSection === "scope")
                  ? "is-active"
                  : ""
              }
            >
              {label}
            </a>
          ))}
        </nav>
      </header>

      <section className="hero" id="overview" aria-labelledby="hero-title">
        <div className="hero-media" aria-hidden="true">
          <img src={asset("assets/scenes/system-overview.jpg")} alt="" />
          <div className="hero-grid" />
        </div>
        <div className="hero-shade" aria-hidden="true" />
        <div className="hero-copy">
          <p className="section-label">Boston, Massachusetts</p>
          <h1 id="hero-title">
            Research operations for labs, programs, and research teams.
          </h1>
          <p className="hero-summary">
            James M. Spencer manages the day-to-day work that keeps research
            space, equipment, people, vendors, programs, and conferences moving.
          </p>
          <div className="hero-actions">
            <a className="button button-primary" href="#work">
              View current work
            </a>
            <a
              className="button button-quiet"
              href={asset("assets/resume/james-m-spencer-resume.pdf")}
              target="_blank"
              rel="noreferrer"
            >
              Resume
            </a>
          </div>
        </div>
        <div className="hero-index" aria-label="Current work at a glance">
          <article>
            <span>01</span>
            <strong>Two HHMI Investigator laboratories</strong>
            <p>Separate spaces, equipment, vendors, and access needs.</p>
          </article>
          <article>
            <span>02</span>
            <strong>Community Phages</strong>
            <p>Eight-week student research program, delivered end to end.</p>
          </article>
          <article>
            <span>03</span>
            <strong>LMNOP advisory board</strong>
            <p>Regional and national conference planning for lab managers.</p>
          </article>
        </div>
        <a className="hero-scroll" href="#work">
          <span>Scroll to current work</span>
          <i aria-hidden="true" />
        </a>
      </section>

      <section className="work-section" id="work" aria-labelledby="work-title">
        <div className="work-intro">
          <p className="section-label">Current work</p>
          <h2 id="work-title">Three responsibilities, shown in context.</h2>
          <p>
            Laboratory management is the primary role. Community Phages extends
            that work into student-program delivery; LMNOP extends it into
            conference planning and professional resources for lab managers.
          </p>
        </div>

        <div className="work-layout">
          <div className="work-visual-column">
            <div className="work-stage" aria-live="polite">
              <div className="stage-topline">
                <span>Current work / {chapters[activeChapter].index}</span>
                <span>{chapters[activeChapter].eyebrow}</span>
              </div>

              <div className="stage-images">
                {chapters.map((chapter, index) => (
                  <figure
                    key={chapter.id}
                    className={`stage-image stage-image-${chapter.id} ${
                      activeChapter === index ? "is-active" : ""
                    }`}
                  >
                    <img src={chapter.image} alt={chapter.imageAlt} />
                  </figure>
                ))}
                <div className="stage-vignette" aria-hidden="true" />
                <div className="stage-scan" aria-hidden="true" />
              </div>

              <div className="stage-detail" aria-hidden="true">
                {activeChapter === 0 && (
                  <div className="floor-readout">
                    <div>
                      <span>4 Blackfan Circle</span>
                      <strong>10th floor</strong>
                      <small>Bernhardt Lab</small>
                    </div>
                    <i />
                    <div>
                      <span>Veritas Science Center</span>
                      <strong>9th floor</strong>
                      <small>Abraham Lab</small>
                    </div>
                  </div>
                )}
                {activeChapter === 1 && (
                  <div className="phase-readout">
                    {programPhases.map((phase, index) => (
                      <span key={phase} style={{ "--phase": index } as CSSProperties}>
                        {phase}
                      </span>
                    ))}
                  </div>
                )}
                {activeChapter === 2 && (
                  <div className="city-readout">
                    {conferenceCities.map((city, index) => (
                      <span key={city} style={{ "--city": index } as CSSProperties}>
                        <i /> {city}
                      </span>
                    ))}
                  </div>
                )}
                {activeChapter === 3 && (
                  <div className="photo-readout">
                    <span>Conference leadership</span>
                    <strong>San Francisco / 2026</strong>
                  </div>
                )}
              </div>

              <div className="chapter-progress" aria-label="Current work progress">
                {chapters.slice(0, 3).map((chapter, index) => (
                  <a
                    key={chapter.id}
                    href={`#chapter-${chapter.id}`}
                    className={activeChapter === index ? "is-active" : ""}
                    aria-label={`Go to ${chapter.eyebrow}`}
                  >
                    <span>{chapter.index}</span>
                    <i />
                  </a>
                ))}
              </div>
            </div>
          </div>

          <div className="work-copy-column">
            {chapters.map((chapter, index) => (
              <article
                key={chapter.id}
                id={`chapter-${chapter.id}`}
                ref={(node) => {
                  chapterRefs.current[index] = node;
                }}
                className={`work-chapter ${activeChapter === index ? "is-active" : ""}`}
              >
                <div className="mobile-chapter-image">
                  <img src={chapter.image} alt={chapter.imageAlt} />
                </div>
                <div className="chapter-heading">
                  <p className="section-label">
                    {chapter.index} / {chapter.eyebrow}
                  </p>
                  <p className="chapter-dates">{chapter.dates}</p>
                </div>
                <h3>{chapter.title}</h3>
                <p className="chapter-organization">{chapter.organization}</p>
                <p className="chapter-summary">{chapter.summary}</p>
                <ul className="chapter-responsibilities">
                  {chapter.responsibilities.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
                <div className="chapter-evidence">
                  {chapter.evidence.map((item) => (
                    <span key={item}>{item}</span>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="scope-section" id="scope" aria-labelledby="scope-title">
        <div className="scope-heading">
          <p className="section-label">Operational scope</p>
          <h2 id="scope-title">What the work covers.</h2>
          <p>
            The common thread is coordination: knowing what a scientific team,
            program, or meeting needs next, then getting the people and resources
            into place.
          </p>
        </div>
        <div className="scope-grid">
          {[
            ["Space + facilities", "Access, regulated space, service requests, readiness, and closeout."],
            ["Equipment + vendors", "Purchasing, service contracts, supply continuity, repairs, and partner contact."],
            ["People + onboarding", "New staff, trainees, candidates, instructors, students, and visiting partners."],
            ["Budgets + purchasing", "Program funding, lab purchases, planning, tracking, and vendor follow-up."],
            ["Program delivery", "Hiring, setup, biosafety preparation, daily logistics, support, and closeout."],
            ["Conference operations", "Agendas, speakers, sites, partners, attendees, and continuity between meetings."],
          ].map(([title, detail], index) => (
            <article key={title}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <h3>{title}</h3>
              <p>{detail}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="fit-section" aria-labelledby="fit-title">
        <div>
          <p className="section-label">Role fit</p>
          <h2 id="fit-title">Where this experience translates.</h2>
        </div>
        <div className="fit-list">
          {roleFit.map(([title, detail], index) => (
            <article key={title}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <h3>{title}</h3>
              <p>{detail}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="background-section" id="background" aria-labelledby="background-title">
        <div className="background-heading">
          <p className="section-label">Background</p>
          <h2 id="background-title">Science first. People work alongside it.</h2>
          <p>
            Earlier work adds bench-science context, documentation discipline,
            peer training, and experience supporting large communities.
          </p>
        </div>
        <div className="timeline">
          <article>
            <span className="timeline-date">2015 - 2018</span>
            <div>
              <h3>Research Assistant</h3>
              <p className="timeline-org">
                Peter Chien laboratory, Biochemistry and Molecular Biology,
                University of Massachusetts Amherst
              </p>
              <p>
                Supported bacterial stress-response research, experimental work,
                documentation, and strain and reagent organization in an academic
                biochemistry laboratory.
              </p>
            </div>
          </article>
          <article>
            <span className="timeline-date">2016 - 2018</span>
            <div>
              <h3>Area Governor</h3>
              <p className="timeline-org">UMass Amherst Residential Life</p>
              <p>
                Elected annually to support a residential area of roughly 6,000
                students, recruit and lead a 14-person board, coordinate campus
                partners, and plan large-scale initiatives for a 30,000-student
                community.
              </p>
            </div>
          </article>
          <article>
            <span className="timeline-date">2016 - 2018</span>
            <div>
              <h3>Resident Advisor + Peer Trainer</h3>
              <p className="timeline-org">UMass Amherst Residential Life</p>
              <p>
                Advised residents, mediated conflicts, supported on-call response,
                and was selected to train new residential-life staff.
              </p>
            </div>
          </article>
          <article className="education-row">
            <span className="timeline-date">2018</span>
            <div>
              <h3>B.S., Science and Biochemistry</h3>
              <p className="timeline-org">University of Massachusetts Amherst</p>
            </div>
          </article>
        </div>
      </section>

      <section className="contact-section" id="contact" aria-labelledby="contact-title">
        <div className="contact-copy">
          <p className="section-label">Contact</p>
          <h2 id="contact-title">Let&apos;s talk about the work.</h2>
          <p className="contact-intro">
            For research operations, laboratory management, scientific program
            delivery, or conference planning, LinkedIn is the best way to reach
            James.
          </p>
          <div className="contact-topics" aria-label="Conversation topics">
            <span>Research operations</span>
            <span>Lab management</span>
            <span>Scientific programs</span>
            <span>Conference planning</span>
          </div>
          <div className="contact-actions">
            <a
              className="contact-link contact-link-primary"
              href="https://www.linkedin.com/in/jamesmspencer/"
              target="_blank"
              rel="noreferrer"
            >
              <span>Connect on LinkedIn</span>
              <i aria-hidden="true">↗</i>
            </a>
            <a
              className="contact-link"
              href={asset("assets/resume/james-m-spencer-resume.pdf")}
              target="_blank"
              rel="noreferrer"
            >
              <span>View resume</span>
              <i aria-hidden="true">↓</i>
            </a>
          </div>
        </div>
        <figure className="contact-portrait">
          <picture>
            <source
              srcSet={`${asset("assets/images/james-m-spencer-studio-headshot-720.jpg")} 720w, ${asset("assets/images/james-m-spencer-studio-headshot-1100.jpg")} 1100w, ${asset("assets/images/james-m-spencer-studio-headshot-1500.jpg")} 1500w`}
              sizes="(max-width: 860px) 100vw, 42vw"
            />
            <img
              src={asset("assets/images/james-m-spencer-studio-headshot.jpg")}
              alt="James M. Spencer wearing a navy shirt in a studio portrait."
            />
          </picture>
        </figure>
      </section>

      <footer>
        <strong>James M. Spencer</strong>
        <p>
          This personal site is not an official website of Harvard Medical
          School, HHMI, or any affiliated laboratory or program.
        </p>
        <a href="#overview">Back to top ↑</a>
      </footer>
    </main>
  );
}
