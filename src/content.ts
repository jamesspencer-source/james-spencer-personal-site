import type { AtlasStateId } from "./atlasScenePresets";

export type ActionLink = {
  label: string;
  href: string;
  download?: boolean;
};

export type AccentTone = "labs" | "program" | "network" | "neutral";

export type HeroProofItem = {
  headline: string;
  detail: string;
  tone?: AccentTone;
};

export type ScopeDomain = {
  title: string;
  detail: string;
  tone?: AccentTone;
};

export type ResultItem = {
  title: string;
  detail: string;
};

export type RoleEvidence = {
  label: string;
  value: string;
};

export type RoleEntry = {
  id: string;
  navLabel: string;
  title: string;
  organization: string;
  dates: string;
  summary: string;
  bullets: string[];
  evidence: RoleEvidence[];
  link?: ActionLink;
};

export type OperatingStageId = Extract<AtlasStateId, "labs" | "program" | "network">;

export type OperatingSystemEntry = {
  id: OperatingStageId;
  kicker: string;
  title: string;
  summary: string;
  evidence: string[];
};

export type BackgroundEntry = {
  title: string;
  organization: string;
  dates: string;
  summary: string;
};

export type EducationEntry = {
  degree: string;
  organization: string;
  dates: string;
};

const asset = (path: string) => `${import.meta.env.BASE_URL}${path}`;

export const siteContent = {
  meta: {
    title: "James M. Spencer | Laboratory Operations and Scientific Program Leader",
    description:
      "James M. Spencer leads operations for research laboratories, scientific programs, and professional communities at Harvard Medical School."
  },
  hero: {
    name: "James M. Spencer",
    title: "Laboratory Operations and Scientific Program Leader",
    location: "Boston, Massachusetts",
    summary: [
      "James M. Spencer manages operations for two Howard Hughes Medical Institute Investigator laboratories in the Department of Microbiology at Harvard Medical School. He also leads operations for the Community Phages summer internship program and chairs the Lab Management Network of Professionals.",
      "His remit includes staffing, budgets, facilities, equipment, regulated laboratory space, vendor relationships, onboarding, operational continuity, and the day-to-day execution that keeps scientific work moving."
    ],
    proof: [
      {
        headline: "Two Investigator laboratories, one shared operating model",
        detail:
          "Daily responsibility spans people, equipment, facilities, vendors, and continuity across one shared footprint in two buildings.",
        tone: "labs"
      },
      {
        headline: "Community Phages delivered as a fifth-year summer program",
        detail:
          "James leads the operating cycle for the annual eight-week internship program, from setup and access to student support and closeout.",
        tone: "program"
      },
      {
        headline: "Lab manager network leadership",
        detail:
          "As chair of the Lab Management Network of Professionals, he helps shape programming and convenings for laboratory managers across Howard Hughes Medical Institute laboratories.",
        tone: "network"
      }
    ] as HeroProofItem[],
    links: [
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
  scope: {
    heading: "Current Scope",
    intro:
      "James leads laboratory and program operations in environments where research depends on reliable coordination across people, space, vendors, equipment, schedules, and scientific work.",
    context:
      "Current work sits within the Department of Microbiology at Harvard Medical School, Howard Hughes Medical Institute laboratories, the Community Phages summer program, and the Lab Management Network of Professionals.",
    domains: [
      {
        title: "Laboratory operations",
        detail:
          "Budgets, purchasing, equipment, facilities, vendor coordination, and regulated laboratory-space management across active research groups.",
        tone: "labs"
      },
      {
        title: "People, hiring, and onboarding",
        detail:
          "Candidate visits, recruiting logistics, onboarding, schedules, and practical support for scientists, trainees, and visiting participants.",
        tone: "neutral"
      },
      {
        title: "Scientific program delivery",
        detail:
          "Planning and running Community Phages from setup through closeout, with the operational work beneath the student-facing program.",
        tone: "program"
      },
      {
        title: "Professional community leadership",
        detail:
          "Board leadership, programming, and convenings for a peer network of laboratory managers across Howard Hughes Medical Institute laboratories.",
        tone: "network"
      }
    ] as ScopeDomain[],
    results: [
      {
        title: "Expanded from one laboratory to two without splitting the operating model",
        detail:
          "A second Howard Hughes Medical Institute Investigator laboratory was added in August 2025 while keeping shared facilities, equipment, and regulated space coordinated under one system."
      },
      {
        title: "Community Phages delivered end to end each year",
        detail:
          "The annual eight-week internship program runs on repeatable planning, setup, daily logistics, student support, and closeout."
      },
      {
        title: "Lab manager network leadership extends the work beyond a single institution",
        detail:
          "Regional programming and national convenings support the broader lab manager community and its institute partners."
      }
    ] as ResultItem[]
  },
  roles: {
    heading: "Current Roles",
    intro:
      "Current responsibilities break across laboratory operations, scientific program delivery, and professional community leadership.",
    entries: [
      {
        id: "laboratories",
        navLabel: "Laboratories",
        title: "Laboratory manager",
        organization:
          "Thomas Bernhardt and Jonathan Abraham laboratories, Department of Microbiology, Harvard Medical School",
        dates: "2019 - Present",
        summary:
          "Leads shared operations for two Howard Hughes Medical Institute Investigator laboratories within the Department of Microbiology at Harvard Medical School.",
        bullets: [
          "Directs budgets, purchasing, vendor relationships, facilities coordination, and equipment planning across a shared research footprint spanning two buildings.",
          "Handles hiring logistics, onboarding, candidate visits, regulated laboratory-space coordination, and day-to-day continuity for two active research laboratories.",
          "Keeps the operating model stable so research groups can move without preventable delays."
        ],
        evidence: [
          {
            label: "Operating context",
            value:
              "Two Howard Hughes Medical Institute Investigator laboratories with one shared biosafety level 2 laboratory footprint."
          },
          {
            label: "Current remit",
            value:
              "Staffing, budgets, equipment, facilities, vendor coordination, onboarding, and continuity."
          }
        ]
      },
      {
        id: "community-phages",
        navLabel: "Community Phages",
        title: "Program Operations Lead",
        organization:
          "Community Phages, Department of Microbiology, Harvard Medical School",
        dates: "2022 - Present",
        summary:
          "Leads the operating model for Community Phages, an eight-week summer internship program for Roxbury Community College students.",
        bullets: [
          "Builds and runs the annual program environment, including benches, supplies, safety setup, schedules, access, partner coordination, and closeout.",
          "Owns the operational side of the program end to end, supporting students, instructors, visitors, and daily execution throughout the summer.",
          "Coordinates the practical work beneath recruitment, setup, field activity, and completion."
        ],
        evidence: [
          {
            label: "Program structure",
            value:
              "An annual eight-week summer internship program now in its fifth operating cycle."
          },
          {
            label: "Delivery model",
            value:
              "Combines laboratory setup, logistics, student support, partner coordination, and closeout."
          }
        ],
        link: {
          label: "Program website",
          href: "https://phages.hms.harvard.edu/"
        }
      },
      {
        id: "network-leadership",
        navLabel: "Network",
        title: "Chair, advisory board",
        organization:
          "Lab Management Network of Professionals, Howard Hughes Medical Institute",
        dates: "2022 - Present",
        summary:
          "Chairs the advisory board for the Lab Management Network of Professionals, a peer professional-development organization for laboratory managers at Howard Hughes Medical Institute laboratories.",
        bullets: [
          "Sets board priorities and helps shape regional and national programming for a network of laboratory managers across the institute.",
          "Supports recurring programming, board coordination, and ongoing community support.",
          "Extends the work from individual laboratory operations into professional community leadership."
        ],
        evidence: [
          {
            label: "Programming scale",
            value:
              "Regional gatherings and larger national convenings for laboratory managers and institute partners."
          },
          {
            label: "Leadership focus",
            value:
              "Board direction, recurring programming, and professional community support."
          }
        ]
      }
    ] as RoleEntry[]
  },
  operatingSystem: {
    heading: "Systems View",
    intro:
      "The monolith visualizes three connected layers of the work: research infrastructure, program delivery, and professional network leadership.",
    entries: [
      {
        id: "labs",
        kicker: "Laboratory layer",
        title: "Research infrastructure and continuity",
        summary:
          "Within the monolith, the laboratory layer stands for the infrastructure that keeps research moving: facilities, equipment, vendor coordination, staffing logistics, and regulated-space management across two laboratories.",
        evidence: [
          "Two Howard Hughes Medical Institute Investigator laboratories coordinated through one shared operating model.",
          "Budgets, vendors, equipment, facilities, and staffing logistics kept in sync."
        ]
      },
      {
        id: "program",
        kicker: "Program layer",
        title: "Annual program delivery",
        summary:
          "The program layer stands for the annual operating cycle behind Community Phages: preparation, setup, scheduling, access, supplies, student support, field activity, and closeout.",
        evidence: [
          "Community Phages delivered as an annual eight-week summer internship program.",
          "Operations run end to end across setup, daily logistics, participant support, and completion."
        ]
      },
      {
        id: "network",
        kicker: "Network layer",
        title: "Professional community leadership",
        summary:
          "The network layer extends beyond a single laboratory. It stands for board leadership, recurring programming, and convenings that connect laboratory managers across institutions.",
        evidence: [
          "James chairs the Lab Management Network of Professionals.",
          "Regional and national convenings bring laboratory managers and institute partners into the same professional space."
        ]
      }
    ] as OperatingSystemEntry[]
  },
  background: {
    heading: "Background",
    intro:
      "Earlier bench research and student leadership work helped shape the operating approach behind the current role.",
    entries: [
      {
        title: "Research Assistant",
        organization: "Peter Chien laboratory, University of Massachusetts Amherst",
        dates: "2015 - 2018",
        summary:
          "Worked on bacterial stress-response questions in Caulobacter crescentus and developed a bench-research foundation in experimental design, documentation, and day-to-day lab execution."
      },
      {
        title: "Area Governor",
        organization: "University of Massachusetts Amherst Residential Life",
        dates: "2016 - 2018",
        summary:
          "Led a residential area of roughly 6,000 students and recruited, trained, and supported a 14-person student leadership board."
      },
      {
        title: "Resident Assistant",
        organization: "University of Massachusetts Amherst Residential Life",
        dates: "2016 - 2018",
        summary:
          "Supported residents day to day, served as a peer trainer, and handled on-call response within a large residential system."
      }
    ] as BackgroundEntry[],
    education: {
      degree: "B.S., Science and Biochemistry",
      organization: "University of Massachusetts Amherst",
      dates: "2018"
    } as EducationEntry
  },
  contact: {
    heading: "Contact",
    links: [
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
  footer: {
    disclaimer:
      "This website is maintained by James M. Spencer in a personal capacity. It is not an official website of Harvard Medical School, Howard Hughes Medical Institute, or any affiliated laboratory or program, and nothing here should be understood as speaking on behalf of those institutions."
  }
};
