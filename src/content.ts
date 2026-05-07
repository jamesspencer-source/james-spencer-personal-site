import siteMeta from "../site-meta.json";

export type ActionLink = {
  label: string;
  href: string;
  download?: boolean;
};

export type ProofItem = {
  headline: string;
  detail: string;
};

export type ProofSectionItem = {
  id: "labs" | "program" | "network";
  index: string;
  label: string;
  title: string;
  summary: string;
  details: string[];
  visual: "labs" | "program" | "network";
  image?: PortraitAsset;
  caption?: string;
};

export type ProofSectionContent = {
  label: string;
  heading: string;
  intro: string;
  items: ProofSectionItem[];
};

export type RoleEvidence = {
  label: string;
  value: string;
};

export type SceneCallout = {
  label: string;
  x: number;
  y: number;
  align?: "left" | "right" | "center";
};

export type HostCity = {
  label: string;
  state: string;
  latitude: number;
  longitude: number;
  year?: string;
  note?: string;
};

export type PortraitAsset = {
  src: string;
  alt: string;
  sources?: Array<{
    src: string;
    width: number;
  }>;
};

export type DocumentaryBeat = {
  image: PortraitAsset;
  caption: string;
  credit?: string;
};

export type RoleVisual =
  | { kind: "roles-overview" }
  | { kind: "labs-schematic" }
  | { kind: "program-cycle" }
  | { kind: "network-globe"; hostCities: HostCity[] };

export type OverviewVisualCard = {
  index: string;
  titleLines: string[];
  captionLines: string[];
};

export type ProgramStation = {
  label: string;
  detail: string;
  x: number;
  y: number;
};

export type GlobeAnnotation = {
  city: string;
  detail: string;
};

export type RoleChapter = {
  id: "overview" | "labs" | "program" | "network";
  sceneId: "overview" | "labs" | "program" | "network";
  navLabel: string;
  title: string;
  organization: string;
  dates: string;
  summary: string;
  responsibilities: string[];
  evidence: RoleEvidence[];
  callouts?: SceneCallout[];
  link?: ActionLink;
  visual: RoleVisual;
  documentaryBeat?: DocumentaryBeat;
};

export type BackgroundEntry = {
  title: string;
  organization: string;
  dates: string;
  summary: string;
};

export type ContactContent = {
  label: string;
  heading: string;
  intro: string;
  supportLine?: string;
  contextTags?: string[];
  portrait?: PortraitAsset | null;
  links: ActionLink[];
};

export type RolesVisualCopy = {
  overviewCards: OverviewVisualCard[];
  programStations: ProgramStation[];
  programCore: {
    title: string;
    subtitle: string;
  };
  globeAnnotation: {
    title: string;
    subtitle: string;
    rows: GlobeAnnotation[];
    legendTitle: string;
    legendLines: string[];
  };
};

const asset = (path: string) => `${import.meta.env.BASE_URL}${path}`;

const hostCities: HostCity[] = [
  {
    label: "Washington, DC",
    state: "District of Columbia",
    latitude: 38.9072,
    longitude: -77.0369,
    year: "2023 + 2025",
    note: "National conferences"
  },
  {
    label: "Boston",
    state: "Massachusetts",
    latitude: 42.3601,
    longitude: -71.0589,
    year: "2024",
    note: "Regional conferences, including Chicago lab managers hosted in Boston"
  },
  {
    label: "San Francisco",
    state: "California",
    latitude: 37.7749,
    longitude: -122.4194,
    year: "2026",
    note: "Regional conference"
  },
  {
    label: "New York City",
    state: "New York",
    latitude: 40.7128,
    longitude: -74.006,
    year: "2026",
    note: "Regional conference"
  }
];

export const siteContent = {
  meta: siteMeta,
  hero: {
    label: "",
    name: "James M. Spencer",
    title:
      "Research operations leader for scientific teams and programs",
    location: "Boston, Massachusetts",
    summary: [
      "James M. Spencer manages the practical systems that keep research labs, student programs, and lab-manager conferences ready to run.",
      "His work spans two HHMI Investigator laboratories, Community Phages program delivery, and advisory-board leadership for the Lab Management Network of Professionals."
    ],
    proof: [
      {
        headline: "Two HHMI Investigator laboratories",
        detail:
          "Laboratory management for distinct HMS Microbiology research groups with separate spaces and operating needs."
      },
      {
        headline: "Community Phages operations",
        detail:
          "Funding, hiring, onboarding, lab setup, delivery support, and closeout for an eight-week student research program."
      },
      {
        headline: "LMNOP advisory-board chair",
        detail:
          "Board priorities, speaker coordination, partner contact, and regional and national conference planning for lab managers."
      }
    ] as ProofItem[],
    actions: [
      {
        label: "Resume",
        href: asset("assets/resume/james-m-spencer-resume.pdf"),
        download: true
      },
      {
        label: "LinkedIn",
        href: "https://www.linkedin.com/in/jamesmspencer/"
      }
    ] as ActionLink[]
  },
  rolesSection: {
    label: "Current Roles",
    heading: "Current Roles",
    intro:
      "Laboratory operations is the anchor. Community Phages and LMNOP extend that planning into student-program delivery and professional programming for lab managers.",
    visualCopy: {
      overviewCards: [
        {
          index: "01",
          titleLines: ["Laboratory", "operations"],
          captionLines: ["Two research labs", "Distinct spaces", "Daily continuity"]
        },
        {
          index: "02",
          titleLines: ["Community", "Phages"],
          captionLines: ["Annual program delivery", "Funding to closeout"]
        },
        {
          index: "03",
          titleLines: ["Network", "leadership"],
          captionLines: ["Regional and national", "conferences", "Year-round programming"]
        }
      ],
      programStations: [
        { label: "Funding", detail: "Budget + partner setup", x: 72, y: 220 },
        { label: "Hiring", detail: "Interviews + onboarding", x: 350, y: 60 },
        { label: "Lab setup", detail: "Benches + supplies", x: 626, y: 208 },
        { label: "Biosafety", detail: "Training + access", x: 626, y: 370 },
        { label: "Delivery", detail: "Daily program support", x: 350, y: 548 },
        { label: "Closeout", detail: "Space reset + wrap-up", x: 72, y: 430 }
      ],
      programCore: {
        title: "Annual operating cycle",
        subtitle: "Community Phages"
      },
      globeAnnotation: {
        title: "Conference locations",
        subtitle: "Hosted sites appear in sequence and remain active.",
        rows: [
          { city: "Washington, DC", detail: "2023 + 2025 national conferences" },
          { city: "Boston", detail: "2024 regional conference" },
          { city: "San Francisco", detail: "2026 regional conference" },
          { city: "New York City", detail: "2026 regional conference" }
        ],
        legendTitle: "Conference footprint",
        legendLines: [
          "Regional and national sites appear chronologically.",
          "Each location remains visible as the map progresses."
        ]
      }
    } satisfies RolesVisualCopy,
    chapters: [
      {
        id: "overview",
        sceneId: "overview",
        navLabel: "Overview",
        title: "Current scope",
        organization:
          "Harvard Medical School, Howard Hughes Medical Institute, and the Lab Management Network of Professionals",
        dates: "Current",
        summary:
          "James supports active research labs, an annual student program, and recurring lab-manager conferences.",
        responsibilities: [
          "Keeps people, space, equipment, vendors, budgets, and access aligned.",
          "Plans student-program delivery and lab-manager conference programming."
        ],
        evidence: [
          {
            label: "Current scope",
            value:
              "Two research labs, an annual summer program, and recurring conferences."
          },
          {
            label: "Execution focus",
            value:
              "Planning, staffing, logistics, facilities coordination, and follow-through."
          }
        ],
        visual: {
          kind: "roles-overview"
        }
      },
      {
        id: "labs",
        sceneId: "labs",
        navLabel: "Laboratory Operations",
        title: "Laboratory Manager",
        organization:
          "Thomas Bernhardt and Jonathan Abraham laboratories, Department of Microbiology, Harvard Medical School",
        dates: "2019 - Present",
        summary:
          "James manages operations for the Bernhardt and Abraham laboratories: two HHMI Investigator labs in Harvard Medical School Microbiology with separate scientific programs and locations.",
        responsibilities: [
          "Manages budgets, purchasing, vendors, facilities requests, equipment planning, and access.",
          "Coordinates hiring logistics, onboarding, candidate visits, training, and daily lab support."
        ],
        evidence: [
          {
            label: "Current scope",
            value:
              "Two distinct HHMI Investigator labs in HMS Microbiology."
          },
          {
            label: "Continuity work",
            value:
              "Budgets, space, equipment, vendors, safety, and daily coordination."
          }
        ],
        callouts: [],
        visual: {
          kind: "labs-schematic"
        }
      },
      {
        id: "program",
        sceneId: "program",
        navLabel: "Community Phages",
        title: "Program Operations Lead",
        organization:
          "Community Phages, Department of Microbiology, Harvard Medical School",
        dates: "2022 - Present",
        summary:
          "James leads operations for Community Phages, an eight-week summer research program for Roxbury Community College students at Harvard Medical School.",
        responsibilities: [
          "Coordinates funding, hiring, onboarding, access, biosafety prep, and lab setup.",
          "Runs delivery logistics, instructor support, field trips, student support, and closeout."
        ],
        evidence: [
          {
            label: "Program cycle",
            value:
              "Fifth annual cycle of an eight-week RCC research program."
          },
          {
            label: "Readiness work",
            value:
              "Readiness from budget setup through lab breakdown and closeout."
          }
        ],
        link: {
          label: "Community Phages website",
          href: "https://phages.hms.harvard.edu/"
        },
        visual: {
          kind: "program-cycle"
        }
      },
      {
        id: "network",
        sceneId: "network",
        navLabel: "Network Leadership",
        title: "Chair, Advisory Board",
        organization:
          "Lab Management Network of Professionals, Howard Hughes Medical Institute",
        dates: "2022 - Present",
        summary:
          "James chairs the advisory board for the Lab Management Network of Professionals, a peer professional-development community for lab managers.",
        responsibilities: [
          "Sets board priorities and plans regional and national conferences for lab managers.",
          "Maintains programming, speaker coordination, partner contact, and peer exchange."
        ],
        evidence: [
          {
            label: "Advisory-board leadership",
            value:
              "Board direction, conference planning, and professional programming."
          },
          {
            label: "Hosted conferences",
            value:
              "Conferences in Boston, Washington, DC, San Francisco, and New York City."
          }
        ],
        visual: {
          kind: "network-globe",
          hostCities
        },
        documentaryBeat: {
          image: {
            src: asset("assets/images/lmnop-conference-photo-2026-sf.jpg"),
            alt:
              "James M. Spencer speaking into a microphone beside a laptop during an LMNOP conference session in San Francisco."
          },
          caption:
            "James leading LMNOP conference programming during a regional meeting in San Francisco."
        }
      }
    ] as RoleChapter[]
  },
  proofSection: {
    label: "Selected proof",
    heading: "Selected operating work",
    intro:
      "Each role depends on readiness before launch and steady follow-through after.",
    items: [
      {
        id: "labs",
        index: "01",
        label: "Laboratory operations",
        title: "Two distinct labs, two operating environments",
        summary:
          "The laboratory role is the anchor: day-to-day continuity for active research groups in Harvard Medical School Microbiology.",
        details: [
          "Bernhardt Lab: 10th floor, 4 Blackfan Circle.",
          "Abraham Lab: 9th floor, Veritas Science Center.",
          "Budgets, purchasing, vendors, access, equipment, facilities, and lab support."
        ],
        visual: "labs"
      },
      {
        id: "program",
        index: "02",
        label: "Scientific program delivery",
        title: "Eight-week student program, full-cycle delivery",
        summary:
          "Community Phages depends on practical readiness before students arrive and steady support while the program is running.",
        details: [
          "Funding coordination, hiring, onboarding, and access.",
          "Lab setup, biosafety preparation, instructor support, and field trips.",
          "Daily delivery, student support, final logistics, and lab-space closeout."
        ],
        visual: "program"
      },
      {
        id: "network",
        index: "03",
        label: "Conference leadership",
        title: "Regional and national conferences for lab managers",
        summary:
          "The LMNOP role extends the same planning discipline into board priorities, recurring programming, speaker coordination, and conference delivery.",
        details: [
          "Advisory-board chair work for a peer professional-development network.",
          "Conference planning in Boston, Washington, DC, San Francisco, and New York City.",
          "Year-round continuity between meetings, partners, speakers, and lab managers."
        ],
        visual: "network",
        image: {
          src: asset("assets/images/lmnop-conference-photo-2026-sf.jpg"),
          alt:
            "James M. Spencer speaking into a microphone beside a laptop during an LMNOP conference session in San Francisco."
        },
        caption:
          "LMNOP conference programming during a regional meeting in San Francisco."
      }
    ]
  } satisfies ProofSectionContent,
  background: {
    label: "Background",
    heading: "Earlier work",
    intro:
      "Earlier work adds bench-science context and people-leadership experience: lab practice, documentation, peer training, and residential-life leadership.",
    portrait: null as PortraitAsset | null,
    entries: [
      {
        title: "Research Assistant",
        organization:
          "Peter Chien laboratory, Department of Biochemistry and Molecular Biology, University of Massachusetts Amherst",
        dates: "2015 - 2018",
        summary:
          "Worked on bacterial stress-response questions in Caulobacter crescentus, supporting experiments, documentation, strain and reagent organization, and day-to-day laboratory practice in an academic biochemistry and molecular biology setting."
      },
      {
        title: "Area Governor",
        organization: "University of Massachusetts Amherst Residential Life",
        dates: "2016 - 2018",
        summary:
          "Served in an annually elected role overseeing a residential area of roughly 6,000 students, recruiting and supporting a 14-person student leadership board, engaging cross-institutional partners, and planning large-scale events and initiatives for a 30,000-student campus community."
      },
      {
        title: "Resident Advisor",
        organization: "University of Massachusetts Amherst Residential Life",
        dates: "2016 - 2018",
        summary:
          "Supported residents day to day through advising, programming, conflict mediation, policy response, and on-call duty, and was selected as a peer trainer for new residential-life staff."
      }
    ] as BackgroundEntry[],
    education: {
      degree: "B.S., Science and Biochemistry",
      organization: "University of Massachusetts Amherst",
      dates: "2018"
    }
  },
  contact: {
    label: "Contact",
    heading: "Connect",
    intro:
      "For conversations about research operations, scientific program leadership, or laboratory management, LinkedIn is the best way to reach James.",
    supportLine:
      "Relevant conversations include research operations, scientific program delivery, laboratory management, and lab-manager conferences.",
    contextTags: [
      "Research operations",
      "Scientific program leadership",
      "Laboratory management"
    ],
    portrait: {
      src: asset("assets/images/james-m-spencer-studio-headshot.jpg"),
      sources: [
        {
          src: asset("assets/images/james-m-spencer-studio-headshot-720.jpg"),
          width: 720
        },
        {
          src: asset("assets/images/james-m-spencer-studio-headshot-1100.jpg"),
          width: 1100
        },
        {
          src: asset("assets/images/james-m-spencer-studio-headshot-1500.jpg"),
          width: 1500
        }
      ],
      alt: "James M. Spencer in a studio headshot wearing a navy shirt against a gray background."
    } as PortraitAsset,
    links: [
      {
        label: "Connect on LinkedIn",
        href: "https://www.linkedin.com/in/jamesmspencer/"
      },
      {
        label: "Resume",
        href: asset("assets/resume/james-m-spencer-resume.pdf"),
        download: true
      }
    ] as ActionLink[]
  } satisfies ContactContent,
  footer: {
    disclaimer:
      "This website is maintained by James M. Spencer in a personal capacity. It is not an official website of Harvard Medical School, HHMI, or any affiliated laboratory or program, and nothing here should be understood as speaking on behalf of those institutions."
  }
};
