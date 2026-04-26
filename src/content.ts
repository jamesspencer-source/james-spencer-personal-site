export type ActionLink = {
  label: string;
  href: string;
  download?: boolean;
};

export type ProofItem = {
  headline: string;
  detail: string;
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
  meta: {
    title: "James M. Spencer | Laboratory Manager and Program Operations Lead",
    description:
      "James M. Spencer manages research laboratory operations, supports scientific program delivery, and chairs a lab-manager advisory board."
  },
  hero: {
    label: "",
    name: "James M. Spencer",
    title: "Laboratory Manager, Program Operations Lead, and Advisory Board Chair",
    location: "Boston, Massachusetts",
    summary: [
      "James M. Spencer is a laboratory manager in Harvard Medical School Microbiology, supporting the Bernhardt and Abraham laboratories, two Howard Hughes Medical Institute Investigator labs in separate buildings.",
      "He also leads operations for Community Phages and chairs the Lab Management Network of Professionals advisory board. His work includes staffing support, budgets, purchasing, facilities, equipment, vendors, onboarding, access, biosafety preparation, program logistics, and conference planning."
    ],
    proof: [
      {
        headline: "Two Howard Hughes Medical Institute Investigator laboratories",
        detail:
          "Supports separate scientific programs in Harvard Medical School Microbiology, with facilities, equipment, regulated space, and staff support across two buildings."
      },
      {
        headline: "Community Phages program operations",
        detail:
          "Coordinates setup and delivery for Community Phages, an eight-week summer internship program now in its fifth year."
      },
      {
        headline: "Lab-manager advisory board and conferences",
        detail:
          "Chairs the Lab Management Network of Professionals advisory board and helps plan regional and national conferences."
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
      "James's current work has three main parts: laboratory management, Community Phages program operations, and Lab Management Network of Professionals advisory-board leadership.",
    chapters: [
      {
        id: "overview",
        sceneId: "overview",
        navLabel: "Overview",
        title: "Current work",
        organization:
          "Harvard Medical School, Howard Hughes Medical Institute, and the Lab Management Network of Professionals",
        dates: "Current",
        summary:
          "Across these roles, James coordinates people, space, equipment, vendors, budgets, logistics, and follow-through for research labs, a student program, and lab-manager conferences.",
        responsibilities: [
          "Supports staffing, budgets, facilities, equipment, vendors, and regulated space for active research labs with separate scientific programs and locations.",
          "Extends that work to an annual student internship program and recurring conferences for lab managers."
        ],
        evidence: [
          {
            label: "Current scope",
            value:
              "Two research laboratories, one annual summer program, and recurring regional and national conferences for lab managers."
          },
          {
            label: "Work includes",
            value:
              "Planning, staffing, logistics, facilities coordination, and day-to-day support across research, program, and lab-management work."
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
          "James's core role is laboratory management for the Bernhardt and Abraham laboratories: two Howard Hughes Medical Institute Investigator labs in Harvard Medical School Microbiology, with separate scientific programs and locations. He handles administration, facilities, equipment, vendors, staffing, access, and daily coordination.",
        responsibilities: [
          "Coordinates budgets, purchasing, facilities, vendors, and equipment planning for laboratory space in Veritas Science Center and 4 Blackfan Circle.",
          "Manages hiring logistics, onboarding, candidate visits, access, and regulated laboratory-space coordination on the ninth and tenth floors."
        ],
        evidence: [
          {
            label: "Current scope",
            value:
              "Two distinct Howard Hughes Medical Institute Investigator laboratories in the same department, located across two buildings."
          },
          {
            label: "Core responsibilities",
            value:
              "Staffing support, facilities coordination, equipment planning, budgets, purchasing, vendors, onboarding, access, and daily support."
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
          "James leads operations for Community Phages, an eight-week summer internship program for Roxbury Community College students at Harvard Medical School. He coordinates funding, hiring, onboarding, lab setup, biosafety preparation, partner logistics, instructor support, student support, and closeout.",
        responsibilities: [
          "Prepares the program before students arrive, including funding, hiring and interviewing, access, biosafety planning, bench setup, supplies, and lab-space turnover.",
          "Coordinates delivery during the program, including instructors, partner logistics, student support, field trips, daily schedules, and closeout."
        ],
        evidence: [
          {
            label: "Program cycle",
            value:
              "Fifth annual cycle for an eight-week research internship program."
          },
          {
            label: "Delivery system",
            value:
              "Funding, hiring, onboarding, lab buildout, biosafety preparation, partner logistics, student support, daily schedules, and closeout."
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
          "James chairs the advisory board for the Lab Management Network of Professionals, a peer professional-development community for laboratory managers. The role includes board priorities, conference planning, speaker coordination, partner relationships, recurring programming, and continuity between meetings.",
        responsibilities: [
          "Sets board priorities and helps plan regional and national conferences for laboratory managers and institute partners.",
          "Maintains programming, peer exchange, speaker coordination, and continuity between conferences."
        ],
        evidence: [
          {
            label: "Advisory-board leadership",
            value:
              "Board direction, conference planning, and recurring professional-development programming."
          },
          {
            label: "Hosted conferences",
            value:
              "Regional and national conferences organized in Boston, Washington, DC, San Francisco, and New York City."
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
  background: {
    label: "Background",
    heading: "Earlier work",
    intro:
      "Earlier work in bench science and residential life connects to James's current focus on laboratory practice, documentation, coordination, and support for large residential communities.",
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
      "For conversations about lab operations, scientific program operations, lab-manager networks, or conference planning, LinkedIn is the best way to reach James.",
    supportLine:
      "Relevant areas include academic research operations, lab administration, program delivery, and conference planning.",
    contextTags: [
      "Research operations",
      "Program operations",
      "Lab-manager conferences"
    ],
    portrait: {
      src: asset("assets/images/james-m-spencer-studio-headshot.jpg"),
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
