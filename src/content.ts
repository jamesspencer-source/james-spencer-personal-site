import type { CampusSceneStateId } from "./campusScenePresets";

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
  sceneFocus: Extract<CampusSceneStateId, "labs" | "program" | "network">;
  title: string;
  organization: string;
  dates: string;
  summary: string;
  bullets: string[];
  evidence: RoleEvidence[];
  link?: ActionLink;
};

export type OperatingStageId = Extract<
  CampusSceneStateId,
  "labs" | "program" | "network"
>;

export type SystemsViewStage = {
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
    thesis:
      "James M. Spencer manages operations for two Howard Hughes Medical Institute Investigator laboratories in the Department of Microbiology at Harvard Medical School. He leads operations for the Community Phages summer internship program and chairs the Lab Management Network of Professionals, with day-to-day responsibility for staffing, budgets, facilities, equipment, regulated laboratory space, vendor relationships, onboarding, continuity, and execution.",
    proofStrip: [
      {
        headline: "Two research laboratories under one operating model",
        detail:
          "Shared facilities, equipment, vendor coordination, and regulated laboratory space run across a connected footprint in two buildings.",
        tone: "labs"
      },
      {
        headline: "Community Phages, now in its fifth year",
        detail:
          "An annual eight-week summer internship program for Roxbury Community College students, with end-to-end operational delivery each season.",
        tone: "program"
      },
      {
        headline: "Chair of a professional network for lab managers",
        detail:
          "Regional and national programming connects laboratory managers across Howard Hughes Medical Institute laboratories and institute partners.",
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
      "James's current remit centers on keeping research laboratories, a summer internship program, and a professional lab manager network coordinated, reliable, and operational.",
    context:
      "Current responsibilities sit within the Department of Microbiology at Harvard Medical School, two Howard Hughes Medical Institute Investigator laboratories, the Community Phages summer internship program, and the Lab Management Network of Professionals.",
    domains: [
      {
        title: "Research laboratory operations",
        detail:
          "Budgets, purchasing, equipment, facilities, vendor coordination, and management of regulated laboratory space across active research groups.",
        tone: "labs"
      },
      {
        title: "People, hiring, and onboarding",
        detail:
          "Candidate visits, recruiting logistics, onboarding, schedules, and practical support for scientists, trainees, and visiting participants.",
        tone: "neutral"
      },
      {
        title: "Budgets, vendors, facilities, and equipment",
        detail:
          "Stewardship of the external relationships and physical infrastructure that keep laboratories and programs functioning day to day.",
        tone: "labs"
      },
      {
        title: "Scientific programs and community leadership",
        detail:
          "Community Phages operations, board leadership, and convenings for a professional network of laboratory managers.",
        tone: "program"
      }
    ] as ScopeDomain[],
    results: [
      {
        title: "Continuity held while the research footprint expanded",
        detail:
          "A second Howard Hughes Medical Institute Investigator laboratory was added in August 2025 while shared facilities, equipment, and regulated laboratory space stayed coordinated under one system."
      },
      {
        title: "Program delivery depends on repeatable setup, execution, and closeout",
        detail:
          "The annual eight-week internship program depends on repeatable planning, setup, daily logistics, student support, and closeout."
      },
      {
        title: "Professional leadership carries the work beyond one local operation",
        detail:
          "Regional programming and national convenings support the broader lab manager community and its institute partners."
      }
    ] as ResultItem[]
  },
  roles: {
    heading: "Current Roles",
    intro:
      "The primary role is research laboratory operations leadership. Community Phages and network leadership extend that operating profile into program delivery and professional leadership for lab managers.",
    entries: [
      {
        id: "laboratories",
        navLabel: "Research laboratory operations",
        sceneFocus: "labs",
        title: "Laboratory Manager",
        organization:
          "Thomas Bernhardt and Jonathan Abraham laboratories, Department of Microbiology, Harvard Medical School",
        dates: "2019 - Present",
        summary:
          "Leads the shared operating structure for two Howard Hughes Medical Institute Investigator laboratories within the Department of Microbiology at Harvard Medical School.",
        bullets: [
          "Runs budgets, purchasing, vendor relationships, facilities coordination, equipment planning, and regulated laboratory space across a shared research footprint spanning two buildings.",
          "Leads hiring logistics, onboarding, candidate visits, and the practical support that keeps scientists, trainees, and visitors moving.",
          "Provides continuity and operational judgment as the footprint expanded from one laboratory to two in August 2025."
        ],
        evidence: [
          {
            label: "Current scope",
            value:
              "Two Howard Hughes Medical Institute Investigator laboratories with one shared biosafety level 2 laboratory footprint."
          },
          {
            label: "Responsibility",
            value:
              "Staffing, budgets, equipment, facilities, vendor coordination, onboarding, and continuity."
          },
          {
            label: "Positioning",
            value:
              "This is the core operating role; the program and network work extend outward from it."
          }
        ]
      },
      {
        id: "community-phages",
        navLabel: "Community Phages operations",
        sceneFocus: "program",
        title: "Program Operations Lead",
        organization:
          "Community Phages, Department of Microbiology, Harvard Medical School",
        dates: "2022 - Present",
        summary:
          "Leads the operating delivery behind Community Phages, an eight-week summer internship program for Roxbury Community College students.",
        bullets: [
          "Builds and runs the annual program environment, including benches, supplies, safety setup, schedules, access, partner coordination, and closeout.",
          "Owns the operational side of the program end to end, supporting students, instructors, visitors, and daily execution throughout the summer."
        ],
        evidence: [
          {
            label: "Program",
            value:
              "An annual eight-week summer internship program now in its fifth operating cycle."
          }
        ],
        link: {
          label: "Program website",
          href: "https://phages.hms.harvard.edu/"
        }
      },
      {
        id: "network-leadership",
        navLabel: "Network leadership",
        sceneFocus: "network",
        title: "Chair, Advisory Board",
        organization:
          "Lab Management Network of Professionals, Howard Hughes Medical Institute",
        dates: "2022 - Present",
        summary:
          "Chairs the advisory board for the Lab Management Network of Professionals, a professional community for laboratory managers across Howard Hughes Medical Institute laboratories.",
        bullets: [
          "Sets board priorities and helps shape regional and national programming for a network of laboratory managers across the institute.",
          "Supports recurring programming, board coordination, and ongoing community support for laboratory managers and institute partners."
        ],
        evidence: [
          {
            label: "Convenings",
            value:
              "Regional gatherings and larger national convenings for laboratory managers and institute partners."
          }
        ]
      }
    ] as RoleEntry[]
  },
  systemsView: {
    heading: "Systems View",
    intro:
      "The campus is not a literal facility. It is a structured view of the systems beneath the visible work: shared research infrastructure, recurring program delivery, and professional leadership beyond a single laboratory.",
    stages: [
      {
        id: "labs",
        kicker: "Laboratory infrastructure",
        title: "Shared infrastructure behind two active laboratories",
        summary:
          "This layer stands for the shared backbone researchers rely on every day: facilities, equipment, vendor coordination, staffing logistics, and management of regulated laboratory space.",
        evidence: [
          "Shared facilities, equipment, vendors, and laboratory space are coordinated through one operating structure.",
          "Continuity matters most when laboratories grow, change, and remain active at the same time."
        ]
      },
      {
        id: "program",
        kicker: "Program operations",
        title: "The annual operating cycle behind Community Phages",
        summary:
          "This layer represents the repeatable cycle required to run Community Phages each summer: preparation, setup, scheduling, access, supplies, student support, field activity, and closeout.",
        evidence: [
          "Operational delivery runs from pre-program setup through daily execution and final closeout.",
          "The visible student experience depends on a stable system beneath it."
        ]
      },
      {
        id: "network",
        kicker: "Network leadership",
        title: "Professional leadership beyond a single laboratory",
        summary:
          "This layer extends beyond a single laboratory. It stands for board leadership, recurring programming, and convenings that connect laboratory managers across institutions.",
        evidence: [
          "The work includes regional and national convenings for laboratory managers and institute partners.",
          "Leadership here is about shaping a professional community, not just running one local operation."
        ]
      }
    ] as SystemsViewStage[]
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
          "Bench research in bacterial stress response built an early foundation in experimental work, documentation, and day-to-day laboratory execution."
      },
      {
        title: "Area Governor",
        organization: "University of Massachusetts Amherst Residential Life",
        dates: "2016 - 2018",
        summary:
          "Led a residential area of roughly 6,000 students and supported a 14-person student leadership board."
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
