import { useEffect, useMemo, useState } from "react";
import {
  ConferenceMap,
  LabFloorLocator,
  ProgramCycle,
  ScopeIndex,
} from "./components/OperationsVisuals";

const asset = (path: string) => `${import.meta.env.BASE_URL}${path}`;

const scopeAreas = [
  {
    index: "01",
    title: "Financial stewardship",
    detail:
      "Owns budget planning and burn-rate monitoring across sponsors; advises investigators on headcount, major purchases, and spending priorities.",
  },
  {
    index: "02",
    title: "Hiring + talent operations",
    detail:
      "Leads recruiting and selection for staff roles and coordinates postdoctoral visits, start planning, onboarding, and development.",
  },
  {
    index: "03",
    title: "Research infrastructure",
    detail:
      "Directs vendor strategy, capital equipment, service coverage, renovations, site planning, installations, and shared equipment.",
  },
  {
    index: "04",
    title: "Safety + compliance",
    detail:
      "Maintains COMS and IACUC documentation and approvals, delivers lab-specific BSL-2 onboarding, and keeps laboratories inspection-ready.",
  },
  {
    index: "05",
    title: "Scientific program delivery",
    detail:
      "Builds the annual Community Phages operating plan from funding and hiring through lab setup, delivery, and closeout.",
  },
  {
    index: "06",
    title: "Board + conference leadership",
    detail:
      "Sets LMNOP board priorities and leads speaker programs, member resources, institute partnerships, and regional and national conferences.",
  },
] as const;

const trajectory = [
  {
    year: "2019",
    title: "Bernhardt laboratory",
    detail: "Took responsibility for day-to-day operations in the Bernhardt laboratory.",
  },
  {
    year: "2022",
    title: "Community Phages and LMNOP",
    detail: "Added Community Phages operations and joined the LMNOP Advisory Board.",
  },
  {
    year: "2025",
    title: "Abraham laboratory and board chair",
    detail: "Became LMNOP chair and took on operations for the Abraham laboratory.",
  },
  {
    year: "Now",
    title: "Multi-lab and institutional work",
    detail: "Runs two laboratories while continuing annual program delivery and lab-manager conference leadership.",
  },
] as const;

const backgroundItems = [
  {
    dates: "2015–2018",
    title: "Research Assistant",
    organization:
      "Peter Chien Laboratory · Biochemistry and Molecular Biology · UMass Amherst",
    body: (
      <>
        Studied beta-lactam antibiotic stress in lon protease-deficient{" "}
        <i>Caulobacter crescentus</i>. Three years at the bench built fluency in experimental
        work, documentation, strains, reagents, and day-to-day laboratory practice.
      </>
    ),
  },
  {
    dates: "2016–2018",
    title: "Area Governor",
    organization: "UMass Amherst Residential Life",
    body: (
      <>
        Elected annually to lead a residential community of roughly 6,000 students; recruited
        and trained a 14-person executive board, secured funding, and delivered large campus
        programs with cross-institutional partners.
      </>
    ),
  },
  {
    dates: "2016–2018",
    title: "Resident Advisor + Peer Trainer",
    organization: "UMass Amherst Residential Life",
    body: (
      <>
        Supported roughly 50 residents day to day and about 600 while on call; selected to
        train new staff and coordinate urgent facilities, safety, and incident-response work.
      </>
    ),
  },
] as const;

function App() {
  const [activeSection, setActiveSection] = useState("overview");

  const navItems = useMemo(
    () => [
      ["Overview", "overview"],
      ["Current work", "work"],
      ["Background", "background"],
      ["Contact", "contact"],
    ],
    [],
  );

  useEffect(() => {
    const root = document.documentElement;
    const revealNodes = Array.from(document.querySelectorAll<HTMLElement>("[data-reveal]"));
    let revealObserver: IntersectionObserver | null = null;

    if ("IntersectionObserver" in window) {
      revealObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            entry.target.classList.add("is-visible");
            revealObserver?.unobserve(entry.target);
          });
        },
        { threshold: 0.13, rootMargin: "0px 0px -8%" },
      );
      root.classList.add("is-enhanced");
      revealNodes.forEach((node) => revealObserver?.observe(node));
    }

    let frame = 0;
    const updateScrollState = () => {
      frame = 0;
      const viewport = window.innerHeight;
      const scrollable = document.documentElement.scrollHeight - viewport;
      const progress = scrollable > 0 ? window.scrollY / scrollable : 0;
      root.style.setProperty("--page-progress", String(Math.max(0, Math.min(1, progress))));

      let nextSection = "overview";
      ["overview", "scope", "work", "trajectory", "background", "contact"].forEach((id) => {
        const section = document.getElementById(id);
        if (section && section.getBoundingClientRect().top <= viewport * 0.34) {
          nextSection = id;
        }
      });
      setActiveSection((current) => (current === nextSection ? current : nextSection));
    };
    const onScroll = () => {
      if (!frame) frame = window.requestAnimationFrame(updateScrollState);
    };

    updateScrollState();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);

    return () => {
      root.classList.remove("is-enhanced");
      revealObserver?.disconnect();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  const normalizedSection =
    activeSection === "scope" || activeSection === "trajectory" ? "work" : activeSection;

  return (
    <>
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      <div className="page-progress" aria-hidden="true" />

      <header className="site-header">
        <a className="site-brand" href="#overview" aria-label="James M. Spencer, home">
          <strong>James M. Spencer</strong>
          <span>Research operations</span>
        </a>
        <nav aria-label="Primary navigation">
          {navItems.map(([label, id]) => (
            <a
              key={id}
              href={`#${id}`}
              className={normalizedSection === id ? "is-active" : ""}
              aria-current={normalizedSection === id ? "location" : undefined}
            >
              {label}
            </a>
          ))}
        </nav>
      </header>

      <main id="main-content" tabIndex={-1}>
        <section className="hero" id="overview" aria-labelledby="hero-title">
          <div className="hero__copy">
            <p className="eyebrow">Research operations · Boston, Massachusetts</p>
            <h1 id="hero-title">Research operations leadership for complex academic science.</h1>
            <p className="hero__summary">
              James M. Spencer leads the financial, people, facilities, equipment, and
              compliance work for two HHMI Investigator laboratories in Harvard Medical
              School Microbiology. He also runs Community Phages operations and chairs the
              advisory board for HHMI&apos;s network of roughly 330 laboratory managers.
            </p>
            <div className="hero__actions">
              <a className="action action--primary" href="#work">
                Review current work <span aria-hidden="true">↓</span>
              </a>
              <a
                className="action"
                href={asset("assets/resume/james-m-spencer-resume.pdf")}
                target="_blank"
                rel="noreferrer"
              >
                Resume <span aria-hidden="true">↗</span>
              </a>
            </div>
          </div>
          <div className="hero__scope" aria-hidden="false">
            <ScopeIndex />
          </div>
        </section>

        <section className="scope" id="scope" aria-labelledby="scope-title">
          <div className="section-heading" data-reveal>
            <p className="eyebrow">Professional expertise</p>
            <h2 id="scope-title">Operational leadership across research, people, and infrastructure.</h2>
            <p>
              James works with investigators to turn scientific priorities into budgets,
              staffing plans, reliable lab space, compliant operations, and well-timed
              equipment and facilities work. Community Phages and LMNOP add program delivery,
              board leadership, and conference planning.
            </p>
          </div>
          <div className="scope__list">
            {scopeAreas.map((item) => (
              <article key={item.title} data-reveal>
                <span>{item.index}</span>
                <h3>{item.title}</h3>
                <p>{item.detail}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="work" id="work" aria-labelledby="work-title">
          <div className="work__heading" data-reveal>
            <p className="eyebrow">Current roles</p>
            <h2 id="work-title">Research operations at HMS and HHMI.</h2>
            <p>
              James&apos;s primary role is managing two active research laboratories. He also
              runs Community Phages operations and chairs LMNOP&apos;s Advisory Board, bringing
              laboratory-operations experience into student training and professional
              development for lab managers.
            </p>
          </div>

          <nav className="chapter-nav" aria-label="Current roles">
            <a href="#laboratories"><span>01</span> Laboratories</a>
            <a href="#community-phages"><span>02</span> Community Phages</a>
            <a href="#lmnop"><span>03</span> LMNOP</a>
          </nav>

          <article className="role role--labs" id="laboratories" data-reveal>
            <div className="role__copy">
              <div className="role__meta">
                <span>01 / Laboratory operations</span>
                <span>2019–Present</span>
              </div>
              <h3>Laboratory Manager</h3>
              <p className="role__organization">
                Bernhardt and Abraham Laboratories · Harvard Medical School Microbiology
              </p>
              <p className="role__summary">
                Trusted with day-to-day and long-range operations for two distinct HHMI
                Investigator laboratories, each with 15–20 people, separate scientific
                programs, and BSL-2 space in different HMS buildings. James advises the
                investigators on budgets, staffing, equipment, facilities, and operational risk.
              </p>
              <dl className="role__details">
                <div>
                  <dt>Financial planning</dt>
                  <dd>Owns budgets across sponsors, burn-rate monitoring, headcount planning, spending priorities, and timing of major purchases.</dd>
                </div>
                <div>
                  <dt>Hiring + onboarding</dt>
                  <dd>Hiring manager for staff roles and primary operations contact for postdoctoral candidates from interview through start date.</dd>
                </div>
                <div>
                  <dt>Infrastructure</dt>
                  <dd>Leads vendor selection, contracts, capital equipment, renovations, installations, shared equipment, and service strategy.</dd>
                </div>
                <div>
                  <dt>Safety + compliance</dt>
                  <dd>Maintains COMS and IACUC records and approvals, delivers BSL-2 onboarding, and keeps both laboratories inspection-ready.</dd>
                </div>
              </dl>
            </div>
            <div className="role__visual role__visual--labs">
              <LabFloorLocator />
            </div>
          </article>

          <article className="role role--program" id="community-phages" data-reveal>
            <div className="role__copy">
              <div className="role__meta">
                <span>02 / Scientific program operations</span>
                <span>2022–Present</span>
              </div>
              <h3>Operations Lead</h3>
              <p className="role__organization">
                HMS Community Phages · Roxbury Community College Internship
              </p>
              <p className="role__summary">
                Leads the operating plan for an eight-week research internship: eight RCC
                interns, a 10–15-person instructional team, and dedicated HMS lab space
                rebuilt for each annual cycle.
              </p>
              <dl className="role__details">
                <div>
                  <dt>Program launch</dt>
                  <dd>Coordinates funding, hiring, access, onboarding, lab buildout, supplies, equipment, PPE, biosafety, and instructor preparation.</dd>
                </div>
                <div>
                  <dt>Delivery</dt>
                  <dd>Keeps students, instructors, partner visits, field sampling, purchasing, schedules, and daily logistics aligned.</dd>
                </div>
                <div>
                  <dt>Closeout</dt>
                  <dd>Offboards participants, reconciles materials and spending, and resets the laboratory for its next use.</dd>
                </div>
              </dl>
            </div>
            <div className="role__visual role__visual--program">
              <ProgramCycle />
            </div>
          </article>

          <article className="role role--network" id="lmnop" data-reveal>
            <div className="role__copy">
              <div className="role__meta">
                <span>03 / Lab-manager network</span>
                <span>Board since Dec 2022 · Chair since Jul 2025</span>
              </div>
              <h3>Chair, Advisory Board</h3>
              <p className="role__organization">
                Lab Management Network of Professionals · Howard Hughes Medical Institute
              </p>
              <p className="role__summary">
                Chairs the advisory board for HHMI&apos;s network of roughly 330 laboratory
                managers, setting priorities for peer learning, shared resources, institute
                collaboration, and conference programming.
              </p>
              <dl className="role__details">
                <div>
                  <dt>Board leadership</dt>
                  <dd>Sets agendas and priorities, coordinates monthly speakers, maintains member resources, and connects institute teams with lab managers.</dd>
                </div>
                <div>
                  <dt>Regional conferences</dt>
                  <dd>Leads one-day programs for roughly 100 attendees, including speakers, partners, agendas, site logistics, and facilitation.</dd>
                </div>
                <div>
                  <dt>National conferences</dt>
                  <dd>Planned national meetings in 2023 and 2025, including a week-long 2025 program for 60 lab managers and about 20 institute partners.</dd>
                </div>
              </dl>
            </div>
            <div className="role__visual role__visual--network">
              <ConferenceMap />
            </div>
          </article>

          <figure className="conference-proof" data-reveal>
            <div className="conference-proof__image">
              <img
                src={asset("assets/images/lmnop-conference-photo-2026-sf.jpg")}
                alt="James M. Spencer speaking during an LMNOP conference session in San Francisco."
                width="1800"
                height="1350"
                loading="lazy"
              />
            </div>
            <figcaption>
              <span>Conference leadership</span>
              <strong>Leading an LMNOP regional conference in San Francisco · 2026</strong>
              <p>
                James led the program in the room after coordinating the agenda, speakers,
                partners, and site logistics.
              </p>
            </figcaption>
          </figure>
        </section>

        <section className="trajectory" id="trajectory" aria-labelledby="trajectory-title">
          <div className="section-heading section-heading--compact" data-reveal>
            <p className="eyebrow">Professional progression</p>
            <h2 id="trajectory-title">From one lab to multi-lab and institutional work.</h2>
          </div>
          <ol className="trajectory__list">
            {trajectory.map((item) => (
              <li key={item.year} data-reveal>
                <span>{item.year}</span>
                <strong>{item.title}</strong>
                <p>{item.detail}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="background" id="background" aria-labelledby="background-title">
          <div className="background__heading" data-reveal>
            <p className="eyebrow">Earlier experience</p>
            <h2 id="background-title">Bench science and early people leadership.</h2>
            <p>
              James began in research, not administration. Three years in the Peter Chien
              laboratory built fluency in experimental work and day-to-day lab practice.
              UMass residential-life roles added staff training, budget and event management,
              facilities coordination, and incident response at community scale.
            </p>
          </div>
          <div className="background__timeline">
            {backgroundItems.map((item) => (
              <article key={item.title} data-reveal>
                <span>{item.dates}</span>
                <div>
                  <h3>{item.title}</h3>
                  <p className="background__organization">{item.organization}</p>
                  <p>{item.body}</p>
                </div>
              </article>
            ))}
            <article className="background__education" data-reveal>
              <span>2018</span>
              <div>
                <h3>B.S., Science &amp; Biochemistry</h3>
                <p className="background__organization">University of Massachusetts Amherst</p>
              </div>
            </article>
          </div>
        </section>

        <section className="contact" id="contact" aria-labelledby="contact-title">
          <div className="contact__copy" data-reveal>
            <p className="eyebrow">Contact</p>
            <h2 id="contact-title">Connect.</h2>
            <p>
              James is interested in conversations about research operations leadership,
              multi-lab management, scientific program delivery, and professional development
              for laboratory managers. LinkedIn is the best way to connect.
            </p>
            <div className="contact__topics" aria-label="Relevant topics">
              <span>Research operations</span>
              <span>Scientific programs</span>
              <span>Facilities + equipment</span>
              <span>Lab-manager conferences</span>
            </div>
            <div className="contact__actions">
              <a
                className="contact__action contact__action--primary"
                href="https://www.linkedin.com/in/jamesmspencer/"
                target="_blank"
                rel="noreferrer"
              >
                <span>Connect on LinkedIn</span>
                <i aria-hidden="true">↗</i>
              </a>
              <a
                className="contact__action"
                href={asset("assets/resume/james-m-spencer-resume.pdf")}
                target="_blank"
                rel="noreferrer"
              >
                <span>View resume</span>
                <i aria-hidden="true">↗</i>
              </a>
            </div>
          </div>
          <figure className="contact__portrait" data-reveal>
            <picture>
              <source
                srcSet={`${asset("assets/images/james-m-spencer-studio-headshot-720.jpg")} 720w, ${asset("assets/images/james-m-spencer-studio-headshot-1100.jpg")} 1100w, ${asset("assets/images/james-m-spencer-studio-headshot-1500.jpg")} 1500w`}
                sizes="(max-width: 860px) 100vw, 40vw"
              />
              <img
                src={asset("assets/images/james-m-spencer-studio-headshot.jpg")}
                alt="James M. Spencer in a studio portrait wearing a navy shirt."
                width="1996"
                height="3000"
                loading="lazy"
              />
            </picture>
          </figure>
        </section>
      </main>

      <footer>
        <strong>James M. Spencer</strong>
        <p>
          Personal site. Not an official website of Harvard Medical School, HHMI, or any
          affiliated laboratory or program.
        </p>
        <a href="#overview">Back to top ↑</a>
      </footer>
    </>
  );
}

export default App;
