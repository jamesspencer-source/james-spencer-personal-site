import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { siteContent } from "../content";
import { vNextContent } from "./VNextContent";
import { VNextExperience } from "./VNextExperience";
import { VNextContact, VNextFit, VNextHero } from "./VNextSections";
import "./vnext.css";

gsap.registerPlugin(ScrollTrigger);

function usePrefersReducedMotion() {
  const [reducedMotion, setReducedMotion] = useState(() => {
    if (typeof window === "undefined") {
      return false;
    }

    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  });

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(mediaQuery.matches);

    update();
    mediaQuery.addEventListener("change", update);

    return () => mediaQuery.removeEventListener("change", update);
  }, []);

  return reducedMotion;
}

function usePinnedExperienceEnabled(reducedMotion: boolean) {
  const [enabled, setEnabled] = useState(() => {
    if (typeof window === "undefined") {
      return false;
    }

    return !reducedMotion && window.innerWidth >= 980 && window.innerHeight >= 740;
  });

  useEffect(() => {
    const update = () => {
      setEnabled(!reducedMotion && window.innerWidth >= 980 && window.innerHeight >= 740);
    };

    update();
    window.addEventListener("resize", update);

    return () => window.removeEventListener("resize", update);
  }, [reducedMotion]);

  return enabled;
}

export default function VNextApp() {
  const reducedMotion = usePrefersReducedMotion();
  const pinnedExperienceEnabled = usePinnedExperienceEnabled(reducedMotion);
  const staticExperience = reducedMotion || !pinnedExperienceEnabled;
  const experienceRef = useRef<HTMLDivElement | null>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    document.title = `${siteContent.hero.name} | Research Operations vNext`;
  }, []);

  useLayoutEffect(() => {
    const experience = experienceRef.current;

    if (!experience || staticExperience) {
      setProgress(0);
      return;
    }

    const ctx = gsap.context(() => {
      const pin = experience.querySelector<HTMLElement>(".vnext-experience__pin");

      if (!pin) {
        return;
      }

      ScrollTrigger.create({
        id: "vnext-experience",
        trigger: experience,
        start: "top top",
        end: "+=700%",
        pin,
        scrub: 0.68,
        anticipatePin: 1,
        invalidateOnRefresh: true,
        onUpdate: (self) => setProgress(Number(self.progress.toFixed(4)))
      });

      gsap.utils.toArray<HTMLElement>(".vnext-reveal").forEach((item) => {
        gsap.fromTo(
          item,
          { autoAlpha: 0, y: 36 },
          {
            autoAlpha: 1,
            y: 0,
            duration: 0.78,
            ease: "power2.out",
            scrollTrigger: {
              trigger: item,
              start: "top 84%",
              once: true
            }
          }
        );
      });
    }, experience);

    return () => ctx.revert();
  }, [staticExperience]);

  const handleJump = useCallback(
    (targetProgress: number) => {
      if (staticExperience) {
        const target = document.getElementById(`vnext-${targetProgress < 0.38 ? "labs" : targetProgress < 0.6 ? "program" : "network"}`);
        target?.scrollIntoView({ block: "start", behavior: "smooth" });
        return;
      }

      const trigger = ScrollTrigger.getById("vnext-experience");

      if (!trigger) {
        return;
      }

      const top = trigger.start + (trigger.end - trigger.start) * targetProgress;
      window.scrollTo({ top, behavior: "auto" });
    },
    [staticExperience]
  );

  return (
    <div className="vnext-page">
      <header className="vnext-header">
        <a href={import.meta.env.BASE_URL} className="vnext-header__brand">
          James M. Spencer
        </a>
        <nav aria-label="Prototype navigation">
          {vNextContent.nav.map((item) => (
            <a href={item.href} key={item.label}>
              {item.label}
            </a>
          ))}
        </nav>
      </header>

      <main>
        <VNextHero
          assets={vNextContent.assets}
          links={vNextContent.hero.links}
          name={vNextContent.hero.name}
          proof={vNextContent.hero.proof}
          reducedMotion={staticExperience}
          summary={vNextContent.hero.summary}
          title={vNextContent.hero.title}
        />

        <div ref={experienceRef}>
          <VNextExperience
            assets={vNextContent.assets}
            chapters={vNextContent.chapters}
            conferenceSites={vNextContent.system.conferenceSites}
            documentary={vNextContent.documentary}
            floorHighlights={vNextContent.system.floorHighlights}
            onJump={handleJump}
            programStations={vNextContent.system.programStations}
            progress={progress}
            reducedMotion={staticExperience}
          />
        </div>

        <div className="vnext-reveal">
          <VNextFit
            roles={vNextContent.fit.roles}
            scope={vNextContent.fit.scope}
            summary={vNextContent.fit.summary}
            title={vNextContent.fit.title}
          />
        </div>

        <div className="vnext-reveal">
          <VNextContact contact={vNextContent.contact} />
        </div>
      </main>
    </div>
  );
}
