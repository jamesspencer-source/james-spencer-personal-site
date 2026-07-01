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
    title: "Research operations for academic labs, student programs, and lab-manager conferences",
    summary: [
      "James M. Spencer manages day-to-day lab operations, program logistics, and conference planning in academic research settings. That work includes two HHMI Investigator laboratories, Community Phages, and the Lab Management Network of Professionals."
    ],
    proof: [
      {
        label: "Lab operations",
        value:
          "Equipment, purchasing, vendors, access, facilities requests, onboarding, and daily support for two HMS Microbiology labs."
      },
      {
        label: "Program logistics",
        value:
          "Funding coordination, hiring, lab setup, biosafety preparation, student support, and closeout for Community Phages."
      },
      {
        label: "Conference planning",
        value:
          "Board priorities, speakers, partners, agendas, site logistics, and regional/national meetings for lab managers."
      }
    ],
    links: siteContent.hero.actions as ActionLink[]
  },
  assets: [
    {
      id: "system-overview",
      src: vnextAsset("system-overview.jpg"),
      alt: "Research operations scene connecting laboratory buildings, a program cycle, and a conference network.",
      chapter: "opening",
      motionRole: "foundation"
    },
    {
      id: "labs-focus",
      src: vnextAsset("labs-focus.jpg"),
      alt: "Longwood-inspired laboratory building scene with two active research floors emphasized.",
      chapter: "labs",
      motionRole: "chapter-focus"
    },
    {
      id: "program-cycle",
      src: vnextAsset("program-cycle.jpg"),
      alt: "Annual program logistics cycle with staged operational checkpoints.",
      chapter: "program",
      motionRole: "chapter-focus"
    },
    {
      id: "conference-network",
      src: vnextAsset("conference-network.jpg"),
      alt: "Globe scene emphasizing lab-manager conference locations.",
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
        "Manages day-to-day operations for two distinct HHMI Investigator laboratories in Harvard Medical School Microbiology.",
      responsibilities: [
        "Coordinates space, access, purchasing, equipment, vendors, and facilities requests.",
        "Supports PIs, trainees, staff, candidates, and active research space."
      ],
      evidence: [
        "Separate research spaces, equipment needs, access needs, and vendor relationships.",
        "Purchasing, service contracts, facilities requests, onboarding, and daily lab support."
      ],
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
        "Coordinates the practical work required to run an eight-week student research program in HMS laboratory space.",
      responsibilities: [
        "Coordinates funding, hiring, onboarding, lab-space preparation, and biosafety readiness.",
        "Supports instructors, students, field trips, daily logistics, and program closeout."
      ],
      evidence: [
        "Funding, hiring, onboarding, lab setup, biosafety preparation, and student support.",
        "Instructor support, field trips, daily logistics, closeout, and lab-space reset."
      ],
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
        "Chairs advisory-board work for a professional network of laboratory managers.",
      responsibilities: [
        "Sets board priorities and helps plan regional and national conferences.",
        "Coordinates speakers, partner contact, member resources, and year-round planning."
      ],
      evidence: [
        "Board priorities, agendas, speaker coordination, partner contact, and member resources.",
        "Regional and national conference planning in Boston, Washington DC, San Francisco, and New York City."
      ],
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
      { label: "Funding", detail: "Budget and partner coordination" },
      { label: "Hiring", detail: "Interviews, offers, onboarding" },
      { label: "Lab setup", detail: "Benches, supplies, access" },
      { label: "Biosafety", detail: "Training and preparation" },
      { label: "Delivery", detail: "Daily student and instructor support" },
      { label: "Closeout", detail: "Space reset and final logistics" }
    ] satisfies VNextProgramStation[],
    conferenceSites: [
      { city: "Washington, DC", detail: "National conference planning" },
      { city: "Boston", detail: "Regional conference planning" },
      { city: "San Francisco", detail: "Regional conference planning" },
      { city: "New York City", detail: "Regional conference planning" }
    ] satisfies VNextConferenceSite[]
  },
  fit: {
    title: "Roles this maps to",
    summary:
      "This background fits roles that need someone who can keep research space, people, equipment, vendors, budgets, timelines, and meetings moving without losing the scientific context.",
    roles: siteContent.operatingScope.fitRoles,
    scope: siteContent.operatingScope.items
  },
  documentary: networkRole.documentaryBeat as DocumentaryBeat | undefined,
  contact: {
    ...siteContent.contact,
    supportLine:
      "Useful conversations include lab operations, scientific program logistics, lab management, and conference planning for research communities."
  } satisfies ContactContent
};
