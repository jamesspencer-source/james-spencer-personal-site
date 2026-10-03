import { Component, lazy, Suspense, useEffect, useRef, useState, type ReactNode } from "react";
import { expertise, programPhases, roleLinks } from "./professionalContent";

const ConferenceAtlas = lazy(() => import("./components/ConferenceAtlas"));
const asset = (path: string) => `${import.meta.env.BASE_URL}${path}`;
function Arrow() { return <span aria-hidden="true">↗</span>; }

function ProgramPlan() {
  const [phase, setPhase] = useState(0);
  const phaseList = useRef<HTMLOListElement>(null);
  useEffect(() => {
    const query = matchMedia("(min-width: 801px) and (min-height: 700px) and (prefers-reduced-motion: no-preference)");
    let frame = 0;
    const update = () => {
      frame = 0;
      if (!query.matches || !phaseList.current) return;
      // One reading line selects a phase; competing intersection callbacks cannot skip stages.
      const readingLine = innerHeight * 0.5;
      let current = 0;
      phaseList.current.querySelectorAll("li").forEach((row, index) => {
        if (row.getBoundingClientRect().top <= readingLine) current = index;
      });
      setPhase(current);
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(update); };
    addEventListener("scroll", schedule, { passive: true });
    addEventListener("resize", schedule);
    query.addEventListener("change", schedule);
    update();
    return () => {
      cancelAnimationFrame(frame);
      removeEventListener("scroll", schedule);
      removeEventListener("resize", schedule);
      query.removeEventListener("change", schedule);
    };
  }, []);
  return <div className="program-plan">
    <div className="program-dial" aria-hidden="true"><svg viewBox="0 0 480 480">
      <defs><linearGradient id="cycle-light" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#d8f3cf"/><stop offset="1" stopColor="#78bcb0"/></linearGradient></defs>
      <circle cx="240" cy="240" r="205" fill="none" stroke="currentColor" strokeOpacity=".12"/>
      <circle cx="240" cy="240" r="150" fill="none" stroke="currentColor" strokeOpacity=".16"/>
      {[0,1,2,3].map(step => <g key={step} transform={`rotate(${step*90} 240 240)`}>
        <path d="M240 58 A182 182 0 0 1 419 207" fill="none" stroke={step <= phase ? "url(#cycle-light)" : "#426257"} strokeWidth={step === phase ? 14 : 7} className="cycle-segment"/>
        <path d="M409 199 L420 211 L430 198" fill="none" stroke={step <= phase ? "#d8f3cf" : "#426257"} strokeWidth="3"/>
      </g>)}
      <text x="240" y="210" textAnchor="middle" className="dial-number">0{phase+1}</text>
      <text x="240" y="258" textAnchor="middle" className="dial-title">{programPhases[phase].title}</text>
      <text x="240" y="294" textAnchor="middle" className="dial-note">Community Phages</text>
      {[[240,35],[445,240],[240,445],[35,240]].map(([x,y],i) => <circle key={i} cx={x} cy={y} r={i === phase ? 7 : 4} fill={i <= phase ? "#d8f3cf" : "#426257"}/>)}
    </svg><p>From funding to final closeout.<br/>Prepared again for each annual cohort.</p></div>
    <ol ref={phaseList} className="phase-list" aria-label="Annual program phases">{programPhases.map((item,i) => <li key={item.title} data-phase={i} data-active={phase === i}>
      <button type="button" aria-pressed={phase === i} onClick={() => setPhase(i)} onFocus={() => setPhase(i)}><span className="phase-number">0{i+1}</span><span><strong>{item.title}</strong><span>{item.description}</span></span><span className="phase-indicator" aria-hidden="true">↗</span></button>
    </li>)}</ol>
  </div>;
}

class MapBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() {
    if (!this.state.failed) return this.props.children;
    return <div className="map-fallback">
      <h3>Conference locations</h3>
      <p>Washington, DC · National conferences, 2023 and 2025. A 2027 conference is in planning.</p>
      <p>Boston · Regional conference, 2024</p>
      <p>San Francisco · April 21, 2026, UCSF Mission Bay. New York City · May 19, 2026, The Rockefeller University.</p>
    </div>;
  }
}

function NetworkMap() {
  const ref = useRef<HTMLDivElement>(null);
  const [ready,setReady] = useState(false);
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => { if(entry.isIntersecting){setReady(true);observer.disconnect();} },{rootMargin:"600px"});
    if(ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  },[]);
  return <div ref={ref} className="atlas-reserve">{ready && <MapBoundary><Suspense fallback={<p className="map-loading">Conference locations</p>}><ConferenceAtlas/></Suspense></MapBoundary>}</div>;
}

export default function App() {
  const [active,setActive] = useState("overview");
  const header = useRef<HTMLElement>(null);
  useEffect(() => {
    const root = document.documentElement;
    const resize = new ResizeObserver(([entry]) => root.style.setProperty("--header-height",`${entry.target.getBoundingClientRect().height}px`));
    if(header.current) resize.observe(header.current);
    const sections = Array.from(document.querySelectorAll<HTMLElement>("[data-section]"));
    let frame = 0;
    const update = () => {
      frame=0;
      const offset=(header.current?.offsetHeight ?? 80)+32;
      let id="overview";
      for(const section of sections) if(section.getBoundingClientRect().top<=offset) id=section.dataset.section ?? "overview";
      setActive(id);
      const length=document.documentElement.scrollHeight-innerHeight;
      root.style.setProperty("--reading-progress",String(length>0 ? scrollY/length : 0));
    };
    const onScroll=()=>{if(!frame) frame=requestAnimationFrame(update);};
    addEventListener("scroll",onScroll,{passive:true});addEventListener("resize",onScroll);update();
    return()=>{resize.disconnect();cancelAnimationFrame(frame);removeEventListener("scroll",onScroll);removeEventListener("resize",onScroll);};
  },[]);
  return <>
    <a className="skip-link" href="#main-content">Skip to content</a>
    <header className="site-header" ref={header}>
      <a className="wordmark" href="#overview" aria-label="James M. Spencer, home">James M. Spencer<span>Research operations</span></a>
      <nav aria-label="Primary navigation">{[["overview","Overview"],["work","Current work"],["background","Background"],["contact","Contact"]].map(([id,name])=><a key={id} href={`#${id}`} aria-current={active===id ? "location" : undefined}>{name}</a>)}</nav>
    </header>
    <main id="main-content" tabIndex={-1}>
      <section className="hero" id="overview" data-section="overview" aria-labelledby="hero-title" tabIndex={-1}>
        <div className="hero-content page-width">
          <p className="eyebrow">Harvard Medical School · Boston</p>
          <h1 id="hero-title">Research operations<br/><em>leadership.</em></h1>
          <p className="hero-summary">James M. Spencer manages operations for two HHMI Investigator laboratories at Harvard Medical School, leads Community Phages program delivery, and chairs HHMI's lab-manager advisory board.</p>
          <div className="hero-actions">
            <a className="action action-light" href="#work">Explore the work <Arrow/></a>
            <a className="text-link" href={asset("assets/resume/james-m-spencer-resume.pdf")}>Resume <Arrow/></a>
          </div>
        </div>
      </section>
      <section className="scope-band page-width" aria-label="Professional scope"><p className="eyebrow">Current scope</p><a href="#laboratories"><strong>~40</strong><span>Lab members supported<small>Across two HHMI Investigator labs</small></span><Arrow/></a><a href="#community-phages"><strong>8</strong><span>Weeks of student research<small>Community Phages annual program</small></span><Arrow/></a><a href="#lmnop"><strong>~330</strong><span>Laboratory managers<small>HHMI's LMNOP network</small></span><Arrow/></a></section>
      <section id="work" data-section="work" className="work" aria-labelledby="work-title" tabIndex={-1}>
        <div className="work-intro page-width"><p className="eyebrow">Current work</p><h2 id="work-title">Research operations<br/>&amp; program management.</h2><p>Laboratory management at Harvard Medical School, Community Phages program delivery, and conference planning for HHMI's laboratory managers.</p></div>
        <nav className="chapter-nav" aria-label="Current roles"><div className="page-width">{roleLinks.map((role,i)=><a key={role.id} href={`#${role.id}`}><span>0{i+1}</span>{role.label}<Arrow/></a>)}</div></nav>
        <article className="lab-story story page-width" id="laboratories" tabIndex={-1} aria-labelledby="lab-title">
          <div className="story-heading"><p className="eyebrow">01 / Laboratory operations</p><p className="role-date">2019–present</p></div>
          <div className="lab-grid">
            <div>
              <h2 id="lab-title">Laboratory management<br/><em>for two research groups.</em></h2>
              <p className="official-role">Laboratory Manager<span>Bernhardt &amp; Abraham Laboratories · HMS Microbiology</span></p>
              <p className="lead-copy">James manages day-to-day operations for two HHMI Investigator laboratories with separate scientific programs, research spaces, and operating needs.</p>
              <p>His responsibilities include budgets and purchasing, staff recruitment, capital equipment, vendor relationships, service contracts, facilities projects, and internal compliance. He coordinates access, onboarding, and daily support for each research group.</p>
              <dl className="lab-tenure">
                <div><dt>Bernhardt Laboratory</dt><dd>Approximately 20–22 members</dd><dd>Supported since January 2019</dd></div>
                <div><dt>Abraham Laboratory</dt><dd>Approximately 18–20 members</dd><dd>Supported since August 2025</dd></div>
              </dl>
            </div>
            <div className="expertise">
              <h3>Professional expertise</h3>
              {expertise.map((item,i) => <details key={item.title} open={i === 0 ? true : undefined}>
                <summary><span>0{i+1}</span>{item.title}<span className="disclosure-mark" aria-hidden="true">+</span></summary>
                <p>{item.description}</p>
              </details>)}
            </div>
          </div>
        </article>
        <article className="program-story story" id="community-phages" tabIndex={-1} aria-labelledby="program-title"><div className="page-width">
          <div className="story-heading"><p className="eyebrow">02 / Scientific program operations</p><p className="role-date">2022–present</p></div>
          <div className="program-intro"><div><h2 id="program-title">Eight weeks of research.<br/><em>From funding to closeout.</em></h2><p className="official-role">Operations Lead<span>HMS Community Phages · Roxbury Community College internship</span></p></div><p className="lead-copy">James coordinates the annual operating plan: funding, hiring, dedicated laboratory space, biosafety preparation, and daily logistics. He supports students and instructors throughout the program, then handles closeout and laboratory reset.</p></div>
          <dl className="program-stats"><div><dt>8</dt><dd>Program weeks</dd></div><div><dt>8</dt><dd>Student interns</dd></div><div><dt>10–15</dt><dd>Instructional team members</dd></div></dl><ProgramPlan/>
        </div></article>
        <article className="network-story story page-width" id="lmnop" tabIndex={-1} aria-labelledby="network-title">
          <div className="story-heading"><p className="eyebrow">03 / Professional network leadership</p><p className="role-date">Board: December 2022 · Chair: July 2025</p></div>
          <div className="network-intro"><div><h2 id="network-title">Connecting the people<br/><em>who manage research.</em></h2><p className="official-role">Chair, Advisory Board<span>Lab Management Network of Professionals · HHMI</span></p></div><div><p className="lead-copy">James chairs the advisory board for HHMI's network of approximately 330 laboratory managers.</p><p>He sets board priorities, coordinates speakers and member resources, and plans regional and national conferences with laboratory managers and institute partners.</p></div></div><NetworkMap/>
          <div className="conference-proof"><figure><img src={asset("assets/images/lmnop-conference-photo-2026-sf.jpg")} alt="James M. Spencer speaking at the 2026 LMNOP meeting in San Francisco." width="1800" height="1350" loading="lazy"/><figcaption>LMNOP regional meeting · UCSF Mission Bay · April 21, 2026</figcaption></figure><div><p className="eyebrow">Conference planning &amp; delivery</p><h3>Regional &amp; national<br/>lab-manager conferences.</h3><p>James coordinates speakers, partners, agendas, and site logistics, and facilitates sessions for laboratory managers. He is also planning a 2027 conference in Washington, DC.</p><dl className="meeting-evidence"><div><dt>2026 regional meetings</dt><dd>One-day programs at UCSF and The Rockefeller University, with peer sessions on practical laboratory management.</dd></div><div><dt>2025 national conference</dt><dd>A week-long program for 60 laboratory managers and approximately 20 institute partners.</dd></div><div><dt>Between conferences</dt><dd>Guest speakers, member resources, and continuing professional development.</dd></div></dl></div></div>
        </article>
      </section>
      <section id="background" data-section="background" className="background" aria-labelledby="background-title" tabIndex={-1}>
        <div className="page-width background-grid">
          <div>
            <p className="eyebrow">Background</p>
            <h2 id="background-title">Scientific experience.<br/><em>Community leadership.</em></h2>
            <p>Research experience and residential-life leadership inform how James approaches laboratory operations: with an understanding of experimental work, clear documentation, and responsibility for people.</p>
            <a className="text-link" href={asset("assets/resume/james-m-spencer-resume.pdf")}>Full experience in the resume <Arrow/></a>
          </div>
          <ol className="background-list">
            <li><span>2015–2018</span><div><h3>Research Assistant</h3><p>Peter Chien Laboratory, Biochemistry and Molecular Biology, UMass Amherst. Research on antibiotic stress in <i>Caulobacter crescentus</i>, alongside experimental documentation and day-to-day lab practice.</p></div></li>
            <li><span>2016–2018</span><div><h3>Area Governor</h3><p>Elected annually to lead a residential community, recruit and train its executive board, secure funding, coordinate partners, and organize campus events at UMass Amherst, a university of approximately 30,000 students.</p></div></li>
            <li><span>2016–2018</span><div><h3>Resident Advisor &amp; Peer Trainer</h3><p>Resident support, incident response, and facilities coordination. Selected to train incoming residential-life staff.</p></div></li>
          </ol>
        </div>
      </section>
      <section id="contact" data-section="contact" className="contact page-width" aria-labelledby="contact-title" tabIndex={-1}><div className="contact-copy"><p className="eyebrow">Contact</p><h2 id="contact-title">Connect.</h2><p className="lead-copy">For conversations about research operations, laboratory management, and scientific program leadership.</p><p>LinkedIn is the best way to reach James.</p><div className="contact-actions"><a href="https://www.linkedin.com/in/jamesmspencer/">Connect on LinkedIn <Arrow/></a><a href={asset("assets/resume/james-m-spencer-resume.pdf")}>View resume <span>PDF <Arrow/></span></a></div><p className="contact-location">Based in Boston, Massachusetts</p></div>
        <figure className="contact-portrait"><img src={asset("assets/images/james-m-spencer-studio-headshot.jpg")} srcSet={[720,1100,1500].map(w=>`${asset(`assets/images/james-m-spencer-studio-headshot-${w}.jpg`)} ${w}w`).join(", ")} sizes="(max-width: 700px) 80vw, 430px" width="1996" height="3000" alt="James M. Spencer in his original studio portrait, wearing a navy shirt." loading="lazy"/></figure>
      </section>
    </main><footer className="site-footer page-width"><div><strong>James M. Spencer</strong><p>Personal website. Not an official website of Harvard Medical School, HHMI, or affiliated laboratories and programs.</p></div><a href="#overview">Back to top ↑</a></footer>
  </>;
}
