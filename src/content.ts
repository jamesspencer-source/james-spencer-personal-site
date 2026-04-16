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
};

export type BackgroundEntry = {
  title: string;
  organization: string;
  dates: string;
  summary: string;
};

export type PortraitAsset = {
  src: string;
  alt: string;
};

export type ContactContent = {
  label: string;
  heading: string;
  intro: string;
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
    note: "National meetings"
  },
  {
    label: "Boston",
    state: "Massachusetts",
    latitude: 42.3601,
    longitude: -71.0589,
    year: "2024",
    note: "Regional meetings, including Chicago lab managers hosted in Boston"
  },
  {
    label: "San Francisco",
    state: "California",
    latitude: 37.7749,
    longitude: -122.4194,
    year: "2026",
    note: "Regional meeting"
  },
  {
    label: "New York City",
    state: "New York",
    latitude: 40.7128,
    longitude: -74.006,
    year: "2026",
    note: "Regional meeting"
  }
];

export const siteContent = {
  meta: {
    title: "James M. Spencer | Laboratory Operations and Scientific Program Leader",
    description:
      "James M. Spencer leads laboratory operations, scientific program delivery, and professional community leadership at Harvard Medical School."
  },
  hero: {
    label: "",
    name: "James M. Spencer",
    title: "Laboratory Operations and Scientific Program Leader",
    location: "Boston, Massachusetts",
    summary: [
      "James M. Spencer manages operations for two Howard Hughes Medical Institute Investigator laboratories in the Department of Microbiology at Harvard Medical School. He also leads operations for the Community Phages summer internship program and chairs the Lab Management Network of Professionals.",
      "His remit includes staffing, budgets, facilities, equipment, regulated laboratory space, vendor relationships, onboarding, continuity, and day-to-day execution."
    ],
    proof: [
      {
        headline: "Two research laboratories across one shared operating footprint",
        detail:
          "Direct responsibility spans shared facilities, equipment, regulated space, and staff support across two buildings."
      },
      {
        headline: "Annual scientific-program delivery",
        detail:
          "Leads the operating cycle for Community Phages, an eight-week summer internship program now in its fifth year."
      },
      {
        headline: "Regional and national lab-manager conference leadership",
        detail:
          "Chairs the Lab Management Network of Professionals and helps shape programming for regional and national meetings."
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
      "James's current work spans laboratory management, annual program delivery, and professional leadership for lab managers.",
    chapters: [
      {
        id: "overview",
        sceneId: "overview",
        navLabel: "Overview",
        title: "Current responsibilities",
        organization:
          "Harvard Medical School, Howard Hughes Medical Institute, and the Lab Management Network of Professionals",
        dates: "Current",
        summary:
          "James's current work has three main parts: leading day-to-day laboratory operations, running the Community Phages summer internship program, and chairing a professional network for laboratory managers. The throughline across all three is operational execution.",
        responsibilities: [
          "Laboratory operations remain the primary role, covering staffing, budgets, equipment, facilities, vendor relationships, and regulated research space across two active laboratories.",
          "Program delivery and network leadership extend that same operating base into an annual student internship program and recurring regional and national conferences for lab managers."
        ],
        evidence: [
          {
            label: "Current scope",
            value:
              "Two research laboratories, one annual summer program, and recurring regional and national professional meetings."
          },
          {
            label: "Shared throughline",
            value:
              "Planning, staffing, logistics, facilities, and continuity across each operating surface."
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
          "As laboratory manager for the Bernhardt and Abraham laboratories, James runs the shared operating model for two Howard Hughes Medical Institute Investigator labs within the Department of Microbiology at Harvard Medical School. The role covers continuity across people, space, budgets, equipment, vendor relationships, and daily execution.",
        responsibilities: [
          "Directs budgets, purchasing, facilities coordination, vendor relationships, and equipment planning across laboratory space in the Veritas Science Center and the building formerly known as the Harvard Institutes of Medicine.",
          "Handles hiring logistics, onboarding, candidate visits, access, and regulated laboratory-space coordination for active research space on the ninth and tenth floors."
        ],
        evidence: [
          {
            label: "Current footprint",
            value:
              "Two Howard Hughes Medical Institute Investigator laboratories operating from one shared management model across two buildings."
          },
          {
            label: "Operating surface",
            value:
              "Staffing, facilities, equipment, budgets, vendor coordination, onboarding, and day-to-day continuity."
          }
        ],
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
          "James leads the operating side of Community Phages, an eight-week summer internship program for Roxbury Community College students at Harvard Medical School. The role covers funding coordination, hiring and onboarding, laboratory setup, biosafety preparation, partner logistics, instructor support, student experience, and closeout.",
        responsibilities: [
          "Builds the annual program before students arrive, including funding coordination, hiring and interviewing, access, biosafety planning, bench setup, supply readiness, and lab-space turnover.",
          "Runs delivery end to end during the program, coordinating instructors, partner logistics, student support, field trips, daily schedules, and final closeout."
        ],
        evidence: [
          {
            label: "Program cycle",
            value:
              "Fifth annual operating cycle for an eight-week research internship program."
          },
          {
            label: "Operating scope",
            value:
              "Funding, hiring, onboarding, lab buildout, biosafety preparation, daily execution, and closeout across one repeatable annual sequence."
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
          "As chair of the advisory board for the Lab Management Network of Professionals, James helps set direction for a peer professional-development community of laboratory managers. The role combines board leadership, conference planning, recurring programming, and relationship-building across regional and national conferences.",
        responsibilities: [
          "Sets board priorities and helps plan regional and national meetings for laboratory managers and institute partners.",
          "Supports recurring programming, peer exchange, speaker coordination, and the year-round continuity that keeps the network active between conferences."
        ],
        evidence: [
          {
            label: "Leadership remit",
            value:
              "Board direction, conference planning, and recurring professional-development programming for laboratory managers."
          },
          {
            label: "Hosted conferences",
            value:
              "Regional and national meetings organized in Boston, Washington, DC, San Francisco, and New York City."
          }
        ],
        visual: {
          kind: "network-globe",
          hostCities
        }
      }
    ] as RoleChapter[]
  },
  background: {
    label: "Background",
    heading: "Earlier research and leadership work.",
    intro:
      "Earlier work in bench science and residential leadership helped build the foundation for the current operations role.",
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
          "Served in an annually elected role overseeing a residential area of roughly 6,000 students, recruiting and supporting a 14-person student leadership board, engaging cross-institutional partners, and planning large-scale events and initiatives for a 30,037-student campus community."
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
    heading: "Connect on LinkedIn",
    intro:
      "For professional conversations about research operations, scientific program leadership, or lab management, connect with James on LinkedIn.",
    portrait: {
      src: asset("assets/images/james-m-spencer-contact-headshot.jpg"),
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
