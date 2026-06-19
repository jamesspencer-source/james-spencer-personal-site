import { useEffect, useLayoutEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { siteContent } from "../content";
import { vNextContent } from "./VNextContent";
import { VNextContact, VNextFit, VNextHero, VNextStory } from "./VNextSections";
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

function usePinnedStoryEnabled(reducedMotion: boolean) {
  const [enabled, setEnabled] = useState(() => {
    if (typeof window === "undefined") {
      return false;
    }

    return !reducedMotion && window.innerWidth >= 1000 && window.innerHeight >= 760;
  });

  useEffect(() => {
    const update = () => {
      setEnabled(!reducedMotion && window.innerWidth >= 1000 && window.innerHeight >= 760);
    };

    update();
    window.addEventListener("resize", update);

    return () => window.removeEventListener("resize", update);
  }, [reducedMotion]);

  return enabled;
}

export default function VNextApp() {
  const reducedMotion = usePrefersReducedMotion();
  const pinnedStoryEnabled = usePinnedStoryEnabled(reducedMotion);
  const staticStory = reducedMotion || !pinnedStoryEnabled;
  const storyRef = useRef<HTMLElement | null>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    document.title = `${siteContent.hero.name} | vNext Prototype`;
  }, []);

  useLayoutEffect(() => {
    const story = storyRef.current;

    if (!story || staticStory) {
      setProgress(0.58);
      return;
    }

    const ctx = gsap.context(() => {
      const pin = story.querySelector<HTMLElement>(".vnext-story__pin");

      if (!pin) {
        return;
      }

      ScrollTrigger.create({
        trigger: story,
        start: "top top",
        end: "+=520%",
        pin,
        scrub: 0.65,
        anticipatePin: 1,
        invalidateOnRefresh: true,
        onUpdate: (self) => setProgress(Number(self.progress.toFixed(4)))
      });

      gsap.utils.toArray<HTMLElement>(".vnext-reveal").forEach((item) => {
        gsap.fromTo(
          item,
          { autoAlpha: 0, y: 28 },
          {
            autoAlpha: 1,
            y: 0,
            duration: 0.72,
            ease: "power2.out",
            scrollTrigger: {
              trigger: item,
              start: "top 82%",
              once: true
            }
          }
        );
      });
    }, story);

    return () => ctx.revert();
  }, [staticStory]);

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
          name={vNextContent.hero.name}
          title={vNextContent.hero.title}
          summary={vNextContent.hero.summary}
          proof={vNextContent.hero.proof}
          links={siteContent.hero.actions}
        />

        <section
          ref={storyRef}
          className={`vnext-story${staticStory ? " vnext-story--reduced" : ""}`}
          id="vnext-roles"
        >
          <VNextStory
            chapters={vNextContent.chapters}
            progress={progress}
            reducedMotion={staticStory}
            documentary={vNextContent.documentary}
          />
        </section>

        <div className="vnext-reveal">
          <VNextFit
            title={vNextContent.fit.title}
            summary={vNextContent.fit.summary}
            roles={vNextContent.fit.roles}
            scope={vNextContent.fit.scope}
          />
        </div>

        <div className="vnext-reveal">
          <VNextContact contact={siteContent.contact} />
        </div>
      </main>
    </div>
  );
}
