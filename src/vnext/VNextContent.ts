import { siteContent, type ActionLink, type ContactContent, type DocumentaryBeat } from "../content";

export type VNextChapterId = "labs" | "program" | "network";

export type VNextChapter = {
  id: VNextChapterId;
  index: string;
  navLabel: string;
  title: string;
  organization: string;
  dates: string;
  summary: string;
  responsibilities: string[];
  evidence: string[];
  holdProgress: number;
};

export type VNextProgramStation = {
  label: string;
  detail: string;
};

export type VNextConferenceSite = {
  city: string;
  detail: string;
};

const roleChapters = siteContent.rolesSection.chapters;
const labRole = roleChapters.find((chapter) => chapter.id === "labs")!;
const programRole = roleChapters.find((chapter) => chapter.id === "program")!;
const networkRole = roleChapters.find((chapter) => chapter.id === "network")!;

export const vNextContent = {
  nav: [
    { label: "Current site", href: import.meta.env.BASE_URL },
    { label: "vNext", href: `${import.meta.env.BASE_URL}vnext` }
  ],
  hero: {
    name: siteContent.hero.name,
    title: "Research operations for labs, programs, and scientific meetings",
    summary: [
      "A more cinematic prototype for James M. Spencer’s work in academic research operations.",
      "The visual system moves from laboratory management to student-program delivery to lab-manager conference planning."
    ],
    proof: [
      {
        label: "Laboratories",
        value: "Two HHMI Investigator labs in HMS Microbiology"
      },
      {
        label: "Program delivery",
        value: "Community Phages annual student research program"
      },
      {
        label: "Meetings",
        value: "LMNOP regional and national conference planning"
      }
    ],
    links: siteContent.hero.actions as ActionLink[]
  },
  chapters: [
    {
      id: "labs",
      index: "01",
      navLabel: "Laboratory operations",
      title: labRole.title,
      organization: labRole.organization,
      dates: labRole.dates,
      summary: labRole.summary,
      responsibilities: labRole.responsibilities,
      evidence: labRole.evidence.map((item) => item.value),
      holdProgress: 0.18
    },
    {
      id: "program",
      index: "02",
      navLabel: "Community Phages",
      title: programRole.title,
      organization: programRole.organization,
      dates: programRole.dates,
      summary: programRole.summary,
      responsibilities: programRole.responsibilities,
      evidence: programRole.evidence.map((item) => item.value),
      holdProgress: 0.48
    },
    {
      id: "network",
      index: "03",
      navLabel: "Lab-manager conferences",
      title: networkRole.title,
      organization: networkRole.organization,
      dates: networkRole.dates,
      summary: networkRole.summary,
      responsibilities: networkRole.responsibilities,
      evidence: networkRole.evidence.map((item) => item.value),
      holdProgress: 0.76
    }
  ] satisfies VNextChapter[],
  system: {
    labels: [
      { label: "Laboratory operations", x: 18, y: 72 },
      { label: "Program delivery", x: 52, y: 78 },
      { label: "Conference network", x: 82, y: 70 }
    ],
    programStations: [
      { label: "Funding", detail: "Budget and partner setup" },
      { label: "Hiring", detail: "Interviews and onboarding" },
      { label: "Lab setup", detail: "Benches, access, supplies" },
      { label: "Biosafety", detail: "Training and readiness" },
      { label: "Delivery", detail: "Daily program support" },
      { label: "Closeout", detail: "Space reset and wrap-up" }
    ] satisfies VNextProgramStation[],
    conferenceSites: [
      { city: "Washington, DC", detail: "National conferences" },
      { city: "Boston", detail: "Regional conference" },
      { city: "San Francisco", detail: "Regional conference" },
      { city: "New York City", detail: "Regional conference" }
    ] satisfies VNextConferenceSite[]
  },
  fit: {
    title: "Best-fit roles",
    summary:
      "The strongest fit is research operations work inside academic or biomedical environments: labs, programs, space, equipment, vendors, budgets, people, timelines, and meetings.",
    roles: siteContent.operatingScope.fitRoles,
    scope: siteContent.operatingScope.items
  },
  documentary: networkRole.documentaryBeat as DocumentaryBeat | undefined,
  contact: siteContent.contact as ContactContent
};
