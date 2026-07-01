import { siteContent, type ActionLink, type ContactContent, type DocumentaryBeat } from "../content";

export type VNextChapterId = "labs" | "program" | "network";
export type VNextAssetId = "system-overview" | "labs-focus" | "program-cycle" | "conference-network";

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

export type VNextAssetManifestItem = {
  id: VNextAssetId;
  src: string;
  alt: string;
  chapter: "opening" | VNextChapterId;
  motionRole: "foundation" | "chapter-focus" | "network-focus";
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

const vnextAsset = (filename: string) => `${import.meta.env.BASE_URL}assets/vnext/${filename}`;

export const vNextContent = {
  nav: [
    { label: "Current site", href: import.meta.env.BASE_URL },
    { label: "vNext", href: `${import.meta.env.BASE_URL}vnext` }
  ],
  hero: {
    name: siteContent.hero.name,
    title: "Research operations for academic labs, programs, and lab-manager conferences",
    summary: [
      "James M. Spencer manages the day-to-day systems behind research labs, student-program delivery, and conference planning for lab managers."
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
  assets: [
    {
      id: "system-overview",
      src: vnextAsset("system-overview.jpg"),
      alt: "Cinematic research operations system connecting laboratory buildings, a program cycle, and a conference network.",
      chapter: "opening",
      motionRole: "foundation"
    },
    {
      id: "labs-focus",
      src: vnextAsset("labs-focus.jpg"),
      alt: "Longwood-inspired laboratory building scene with highlighted managed floors.",
      chapter: "labs",
      motionRole: "chapter-focus"
    },
    {
      id: "program-cycle",
      src: vnextAsset("program-cycle.jpg"),
      alt: "Dimensional annual program delivery cycle with staged operational checkpoints.",
      chapter: "program",
      motionRole: "chapter-focus"
    },
    {
      id: "conference-network",
      src: vnextAsset("conference-network.jpg"),
      alt: "Globe and network scene emphasizing lab-manager conference locations.",
      chapter: "network",
      motionRole: "network-focus"
    }
  ] satisfies VNextAssetManifestItem[],
  chapters: [
    {
      id: "labs",
      index: "01",
      navLabel: "Laboratory operations",
      title: labRole.title,
      organization: labRole.organization,
      dates: labRole.dates,
      summary:
        "Manages daily operations for two distinct HHMI Investigator laboratories in Harvard Medical School Microbiology.",
      responsibilities: [
        "Coordinates space, access, purchasing, equipment, vendors, and facilities requests.",
        "Supports PIs, trainees, staff, candidates, and active research space."
      ],
      evidence: ["Two separate lab locations in the same department.", "Managed floors remain visible as the scene settles."],
      holdProgress: 0.24
    },
    {
      id: "program",
      index: "02",
      navLabel: "Community Phages",
      title: programRole.title,
      organization: programRole.organization,
      dates: programRole.dates,
      summary:
        "Runs the operating side of an annual eight-week student research program, from setup through closeout.",
      responsibilities: [
        "Coordinates funding, hiring, onboarding, lab-space preparation, and biosafety readiness.",
        "Supports instructors, students, field trips, daily logistics, and program closeout."
      ],
      evidence: ["Fifth annual program cycle.", "Funding, hiring, setup, biosafety, delivery, and closeout in one sequence."],
      holdProgress: 0.48
    },
    {
      id: "network",
      index: "03",
      navLabel: "Lab-manager conferences",
      title: networkRole.title,
      organization: networkRole.organization,
      dates: networkRole.dates,
      summary:
        "Chairs advisory-board work for a lab-manager network, including conference planning and recurring programming.",
      responsibilities: [
        "Sets board priorities and helps plan regional and national conferences.",
        "Coordinates speakers, partner contact, member resources, and year-round programming."
      ],
      evidence: ["Conference locations appear chronologically.", "SF meeting photo closes the network chapter."],
      holdProgress: 0.7
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
