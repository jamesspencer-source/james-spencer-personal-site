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

export type OperatingScopeItem = {
  label: string;
  heading: string;
  body: string;
  details: string[];
};

export type FitRole = {
  tier: "Primary fit" | "Adjacent fit";
  title: string;
  detail: string;
};

export type OperatingScopeContent = {
  label: string;
  heading: string;
  intro: string;
  items: OperatingScopeItem[];
  fitHeading: string;
  fitIntro: string;
  fitRoles: FitRole[];
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
  | { kind: "labs-schematic" }
  | { kind: "program-cycle" }
  | { kind: "network-globe"; hostCities: HostCity[] };

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
  id: "labs" | "program" | "network";
  sceneId: "labs" | "program" | "network";
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
    title: "Research operations leader for academic labs and programs",
    location: "Boston, Massachusetts",
    summary: [
      "James M. Spencer manages day-to-day research operations for two HHMI Investigator laboratories in Harvard Medical School Microbiology.",
      "His work covers lab space, equipment, purchasing, vendors, onboarding, biosafety preparation, student-program logistics, and conference planning for lab managers."
    ],
    proof: [
      {
        headline: "Two HHMI Investigator laboratories",
        detail:
          "Distinct HMS Microbiology research groups with separate spaces, equipment, vendors, and access needs."
      },
      {
        headline: "Community Phages program delivery",
        detail:
          "Funding coordination, hiring, onboarding, lab setup, student support, and closeout for an eight-week program."
      },
      {
        headline: "Lab-manager conference planning",
        detail:
          "Lab Management Network of Professionals advisory-board work covering speakers, partners, agendas, and regional/national conferences."
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
      "Laboratory management is the primary role. Community Phages adds student-program delivery; the Lab Management Network of Professionals adds conference planning and peer resources for lab managers.",
    visualCopy: {
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
        id: "labs",
        sceneId: "labs",
        navLabel: "Laboratory Operations",
        title: "Laboratory Manager",
        organization:
          "Thomas Bernhardt and Jonathan Abraham laboratories, Department of Microbiology, Harvard Medical School",
        dates: "2019 - Present",
        summary:
          "James manages day-to-day operations for the Bernhardt and Abraham laboratories, two HHMI Investigator labs in HMS Microbiology with separate spaces, equipment, and research needs.",
        responsibilities: [
          "Keeps equipment, supplies, purchasing, facilities requests, and service contracts moving.",
          "Coordinates vendors, access, onboarding, candidate visits, and daily lab support."
        ],
        evidence: [
          {
            label: "Research spaces",
            value:
              "Two distinct HHMI Investigator labs across 9th- and 10th-floor research space."
          },
          {
            label: "Daily operations",
            value:
              "Purchasing, budgets, vendors, equipment, facilities, safety, and access."
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
          "James helps deliver Community Phages, an eight-week summer research program for Roxbury Community College students working in Harvard Medical School laboratory space.",
        responsibilities: [
          "Coordinates funding, hiring, onboarding, access, biosafety preparation, and lab setup.",
          "Supports instructors, field trips, student needs, daily logistics, and closeout."
        ],
        evidence: [
          {
            label: "Program cycle",
            value:
              "Fifth annual cycle of an eight-week RCC research program."
          },
          {
            label: "Program setup",
            value:
              "Funding, hiring, onboarding, lab setup, biosafety prep, delivery, and closeout."
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
        navLabel: "Lab-Manager Conferences",
        title: "Chair, Advisory Board",
        organization:
          "Lab Management Network of Professionals, Howard Hughes Medical Institute",
        dates: "2022 - Present",
        summary:
          "James chairs the advisory board for the Lab Management Network of Professionals, a peer group for laboratory managers.",
        responsibilities: [
          "Sets board priorities and helps plan regional and national conferences.",
          "Maintains meeting agendas, speaker coordination, partner contact, and member resources."
        ],
        evidence: [
          {
            label: "Advisory board",
            value:
              "Board priorities, conference planning, speaker coordination, and member resources."
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
            "James leading an LMNOP conference session during a regional meeting in San Francisco."
        }
      }
    ] as RoleChapter[]
  },
  operatingScope: {
    label: "Operational Scope",
    heading: "Where this experience fits",
    intro:
      "The strongest fit is research operations work that depends on coordination across people, space, equipment, vendors, budgets, access, safety preparation, programs, and events.",
    items: [
      {
        label: "Laboratories",
        heading: "Daily research operations",
        body:
          "Support for two HHMI Investigator laboratories in HMS Microbiology with separate spaces, equipment, vendors, access needs, and scientific programs.",
        details: [
          "Purchasing, budgets, and vendor contact",
          "Equipment readiness and service contracts",
          "Facilities requests, lab access, and onboarding",
          "Candidate visits and day-to-day research support"
        ]
      },
      {
        label: "Programs",
        heading: "Student-program delivery",
        body:
          "Operations support for Community Phages, an eight-week summer research program for Roxbury Community College students at Harvard Medical School.",
        details: [
          "Funding coordination and hiring",
          "Student and instructor onboarding",
          "Lab-space and biosafety preparation",
          "Daily logistics, field trips, support, and closeout"
        ]
      },
      {
        label: "Lab managers",
        heading: "Conference operations",
        body:
          "Advisory-board chair work for the Lab Management Network of Professionals, supporting regional and national conferences and year-round resources for laboratory managers.",
        details: [
          "Board priorities and meeting agendas",
          "Speaker coordination and partner contact",
          "Conference logistics and site planning",
          "Member resources between meetings"
        ]
      }
    ],
    fitHeading: "Relevant roles",
    fitIntro:
      "Best-fit roles sit in academic and biomedical research environments, with program delivery and conference planning as supporting strengths.",
    fitRoles: [
      {
        tier: "Primary fit",
        title: "Research Operations Manager",
        detail:
          "Lab space, purchasing, vendors, access, equipment, budgets, and daily research support."
      },
      {
        tier: "Primary fit",
        title: "Laboratory Operations Manager",
        detail:
          "Multi-lab coordination in academic or biomedical research environments."
      },
      {
        tier: "Adjacent fit",
        title: "Scientific Program Manager",
        detail:
          "Program setup, staffing, logistics, student support, delivery, and closeout."
      },
      {
        tier: "Primary fit",
        title: "Senior Lab Manager",
        detail:
          "Hands-on continuity across people, equipment, facilities, supplies, and purchasing."
      },
      {
        tier: "Adjacent fit",
        title: "Conference Operations Manager",
        detail:
          "Agendas, speakers, partner contact, logistics, and member resources."
      }
    ]
  } satisfies OperatingScopeContent,
  proofSection: {
    label: "Evidence",
    heading: "Selected work",
    intro:
      "Examples that make the scope more concrete.",
    items: [
      {
        id: "labs",
        index: "01",
        label: "Laboratory operations",
        title: "Two HHMI Investigator labs, two operating environments",
        summary:
          "Day-to-day lab management for two active research groups in Harvard Medical School Microbiology.",
        details: [
          "Bernhardt Lab: 10th floor, 4 Blackfan Circle.",
          "Abraham Lab: 9th floor, Veritas Science Center.",
          "Budgets, purchasing, vendors, access, equipment, facilities requests, and lab support."
        ],
        visual: "labs"
      },
      {
        id: "program",
        index: "02",
        label: "Scientific program delivery",
        title: "Eight-week student program, fifth annual cycle",
        summary:
          "Community Phages requires setup before students arrive, daily support during the program, and lab-space closeout after.",
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
          "LMNOP includes board support, recurring events, speaker coordination, partner contact, and conference logistics.",
        details: [
          "Advisory-board chair work for a peer network for laboratory managers.",
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
          "LMNOP conference session during a regional meeting in San Francisco."
      }
    ]
  } satisfies ProofSectionContent,
  background: {
    label: "Background",
    heading: "Earlier work",
    intro:
      "Earlier work adds bench-science context and people-management experience: lab practice, documentation, peer training, and residential-life coordination.",
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
      "For research operations, lab management, scientific program operations, or conference planning, LinkedIn is the best way to reach James.",
    supportLine:
      "Relevant conversations include lab space, equipment, program delivery, and professional-development work for lab managers.",
    contextTags: [
      "Research operations",
      "Lab management",
      "Scientific program operations",
      "Conference planning"
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
