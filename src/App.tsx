import { useEffect, useMemo, useState } from "react";
import {
  ConferenceMap,
  LabFloorLocator,
  OperationsLedger,
  ProgramCycle,
} from "./components/OperationsVisuals";

const asset = (path: string) => `${import.meta.env.BASE_URL}${path}`;

const scopeAreas = [
  {
    index: "01",
    title: "Financial stewardship",
    detail:
      "Budget planning across sponsors, burn-rate tracking, major-purchase timing, and headcount planning with investigators.",
  },
  {
    index: "02",
    title: "Hiring + onboarding",
    detail:
      "Staff recruiting and selection, postdoctoral-candidate visits, start planning, access, training, and onboarding.",
  },
  {
    index: "03",
    title: "Equipment + facilities",
    detail:
      "Capital equipment, service coverage, renovations, site planning, installations, facilities requests, and shared equipment.",
  },
  {
    index: "04",
    title: "Safety + compliance",
    detail:
      "Lab-specific BSL-2 onboarding, institutional training, COMS and IACUC documentation, approvals, and inspection readiness.",
  },
  {
    index: "05",
    title: "Program operations",
    detail:
      "Annual laboratory setup, access, safety, purchasing, partner visits, field sampling, student support, and closeout.",
  },
  {
    index: "06",
    title: "Professional network",
    detail:
      "Board priorities, monthly speakers, member resources, institute partners, and regional and national conference planning.",
  },
] as const;

const trajectory = [
  {
    year: "2019",
    title: "Laboratory management",
    detail: "Began managing research operations in Harvard Medical School Microbiology.",
  },
  {
    year: "2022",
    title: "Program + board scope",
    detail: "Added Community Phages operations and joined the LMNOP Advisory Board.",
  },
  {
    year: "2025",
    title: "Expanded responsibility",
    detail: "Became LMNOP chair in July and added a second HHMI Investigator laboratory in August.",
  },
  {
    year: "Now",
    title: "Multi-lab research operations",
    detail: "Manages two labs while continuing annual program and professional-network responsibilities.",
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
        Studied the effects of beta-lactam antibiotic stress in lon protease-deficient{" "}
        <i>Caulobacter crescentus</i>, building practical experience with bench work,
        experimental records, strains, and reagents.
      </>
    ),
  },
  {
    dates: "2016–2018",
    title: "Area Governor",
    organization: "UMass Amherst Residential Life",
    body: (
      <>
        Elected to lead a residential community of roughly 6,000 students, recruit and
        train a 14-person executive board, secure funding, and run large-scale programming.
      </>
    ),
  },
  {
    dates: "2016–2018",
    title: "Resident Advisor + Peer Trainer",
    organization: "UMass Amherst Residential Life",
    body: (
      <>
        Supported roughly 50 residents day to day and about 600 while on call; selected as
        a training mentor for new staff and coordinated urgent facilities and safety issues.
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
            <h1 id="hero-title">Research operations leadership for academic science.</h1>
            <p className="hero__summary">
              James M. Spencer manages two HHMI Investigator laboratories at Harvard
              Medical School, runs annual operations for the Community Phages internship,
              and chairs HHMI&apos;s Lab Management Network of Professionals Advisory Board.
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
          <div className="hero__ledger" aria-hidden="false">
            <OperationsLedger />
          </div>
        </section>

        <section className="scope" id="scope" aria-labelledby="scope-title">
          <div className="section-heading" data-reveal>
            <p className="eyebrow">Scope of responsibility</p>
            <h2 id="scope-title">What the role includes.</h2>
            <p>
              Across the laboratories, James is responsible for the financial, people,
              facility, equipment, and compliance work required to support active research.
              The program and board roles add annual delivery and cross-institutional work.
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
            <h2 id="work-title">Responsibilities at HMS and HHMI.</h2>
            <p>
              Laboratory management is the core position. Community Phages adds annual
              student-program operations; LMNOP adds advisory-board and conference work for
              laboratory managers across HHMI.
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
                Manages operations for two distinct HHMI Investigator laboratories, with
                BSL-2 research space in two buildings. Each lab typically includes 15–20
                people; the Abraham laboratory was added in August 2025.
              </p>
              <dl className="role__details">
                <div>
                  <dt>Finance</dt>
                  <dd>Budgets across sponsors, burn-rate tracking, spending decisions, and headcount planning.</dd>
                </div>
                <div>
                  <dt>People</dt>
                  <dd>Hiring manager for staff roles; postdoctoral-candidate visits, onboarding, development, and daily support.</dd>
                </div>
                <div>
                  <dt>Infrastructure</dt>
                  <dd>Vendors, contracts, capital equipment, renovations, installations, and service strategy.</dd>
                </div>
                <div>
                  <dt>Compliance</dt>
                  <dd>BSL-2 training, COMS and IACUC records, approvals, updates, and equipment accountability.</dd>
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
                Runs annual operations for an eight-week internship serving eight RCC
                students in Harvard Medical School laboratory space.
              </p>
              <dl className="role__details">
                <div>
                  <dt>Readiness</dt>
                  <dd>Planning, purchasing, access, benches, supplies, PPE, equipment, and waste streams.</dd>
                </div>
                <div>
                  <dt>Training</dt>
                  <dd>Lab fundamentals, safety, documentation, culture, and support for new instructors.</dd>
                </div>
                <div>
                  <dt>Program delivery</dt>
                  <dd>Student logistics, partner site visits, field sampling, budget management, and closeout.</dd>
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
                <span>03 / Professional network</span>
                <span>Board since Dec 2022 · Chair since Jul 2025</span>
              </div>
              <h3>Chair, Advisory Board</h3>
              <p className="role__organization">
                Lab Management Network of Professionals · Howard Hughes Medical Institute
              </p>
              <p className="role__summary">
                Chairs the executive board for HHMI&apos;s network of roughly 330 laboratory
                managers, setting priorities and leading work on training, shared resources,
                member support, and conferences.
              </p>
              <dl className="role__details">
                <div>
                  <dt>Year-round work</dt>
                  <dd>Monthly guest speakers, an institute-wide Slack workspace, board agendas, and member resources.</dd>
                </div>
                <div>
                  <dt>Regional meetings</dt>
                  <dd>One-day programs for roughly 100 attendees, including speakers, partners, and site logistics.</dd>
                </div>
                <div>
                  <dt>National conference</dt>
                  <dd>A week-long 2025 meeting for 60 selected lab managers and about 20 institute partners.</dd>
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
              <span>Conference delivery</span>
              <strong>Leading an LMNOP session in San Francisco · 2026</strong>
              <p>
                Conference planning continues through delivery: agenda, speakers, partner
                coordination, site logistics, and facilitation in the room.
              </p>
            </figcaption>
          </figure>
        </section>

        <section className="trajectory" id="trajectory" aria-labelledby="trajectory-title">
          <div className="section-heading section-heading--compact" data-reveal>
            <p className="eyebrow">Leadership trajectory</p>
            <h2 id="trajectory-title">Responsibility has expanded over time.</h2>
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
            <p className="eyebrow">Background</p>
            <h2 id="background-title">Scientific training and early people leadership.</h2>
            <p>
              Bench experience provides scientific context. Earlier residential-life roles
              established the people, training, facilities, and incident-response experience
              that now supports laboratory operations.
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
              For conversations about multi-lab operations, laboratory management,
              scientific program delivery, or conference planning for lab managers,
              LinkedIn is the best way to reach James.
            </p>
            <div className="contact__topics" aria-label="Relevant topics">
              <span>Lab operations</span>
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
                alt="James M. Spencer in a studio portrait."
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
