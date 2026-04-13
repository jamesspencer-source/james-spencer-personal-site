export type ActionLink = {
  label: string;
  href: string;
  download?: boolean;
};

export type ProofItem = {
  headline: string;
  detail: string;
};

export type DomainItem = {
  title: string;
  description: string;
};

export type ScopeResult = {
  title: string;
  detail: string;
};

export type ExperienceEvidence = {
  label: string;
  value: string;
};

export type ExperienceEntry = {
  id: string;
  navLabel: string;
  title: string;
  organization: string;
  dates: string;
  summary: string;
  responsibilities: string[];
  evidence: ExperienceEvidence[];
  link?: ActionLink;
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

const asset = (path: string) => `${import.meta.env.BASE_URL}${path}`;

export const siteContent = {
  meta: {
    title: "James M. Spencer | Laboratory Operations and Scientific Program Leader",
    description:
      "James M. Spencer leads operations for research laboratories, scientific programs, and professional communities at Harvard Medical School."
  },
  hero: {
    label: "Overview",
    name: "James M. Spencer",
    title: "Laboratory Operations and Scientific Program Leader",
    location: "Boston, Massachusetts",
    summary:
      "James M. Spencer manages operations for two Howard Hughes Medical Institute (HHMI) Investigator laboratories in the Department of Microbiology at Harvard Medical School. He also leads operations for the Community Phages summer internship program and chairs the Lab Management Network of Professionals, a peer professional-development organization for laboratory managers. His remit includes staffing, budgets, facilities, equipment, biosafety level 2 laboratory space, vendor coordination, and day-to-day execution.",
    proof: [
      {
        headline:
          "Two Howard Hughes Medical Institute Investigator laboratories, one shared operating footprint",
        detail:
          "Direct responsibility spans shared laboratory space in two buildings, with one operating model across facilities, equipment, and daily execution."
      },
      {
        headline: "Community Phages is now in its fifth annual cycle",
        detail:
          "An eight-week summer internship program for Roxbury Community College students, planned and run from setup through closeout."
      },
      {
        headline: "Chairs a lab-manager professional-development network",
        detail:
          "Leads board work and programming for the Lab Management Network of Professionals, supporting regional and national convenings."
      },
      {
        headline: "Operational value comes through steady, disciplined execution",
        detail:
          "Cost stewardship, vendor management, onboarding, and day-to-day continuity help keep complex scientific environments running well."
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
  scope: {
    label: "Current Scope",
    heading:
      "Current operating responsibilities across research laboratories, scientific programs, and professional community work.",
    overview:
      "His current work combines laboratory operations, staffing, financial stewardship, and program delivery. It sits at the intersection of Howard Hughes Medical Institute-supported research laboratories, Community Phages, and professional programming for lab managers.",
    context: [
      "Department of Microbiology, Harvard Medical School",
      "Howard Hughes Medical Institute-supported laboratories",
      "Community Phages summer internship program",
      "Lab Management Network of Professionals"
    ],
    domains: [
      {
        title: "Laboratory operations",
        description:
          "Budgets, equipment, facilities, vendor relationships, purchasing, regulated laboratory space, and day-to-day continuity across shared research environments."
      },
      {
        title: "People, hiring, and onboarding",
        description:
          "Candidate visits, onboarding, recruiting logistics, schedules, and practical support for scientists, trainees, and visiting participants."
      },
      {
        title: "Budgets, vendors, and facilities",
        description:
          "Cost stewardship, service coordination, repairs, space planning, and the vendor relationships that keep laboratory operations steady."
      },
      {
        title: "Scientific programs and professional community",
        description:
          "Annual internship-program delivery, regional meetings, national convenings, and recurring support for a lab manager peer network."
      }
    ] as DomainItem[],
    results: [
      {
        title: "Efficiency and cost stewardship",
        detail:
          "Improves operating efficiency through careful planning, purchasing discipline, and vendor management."
      },
      {
        title: "Expanded scope without fragmentation",
        detail:
          "Added a second laboratory in August 2025 while maintaining one coherent operating model across shared facilities, equipment, and regulated space."
      },
      {
        title: "Community Phages delivered end to end",
        detail:
          "Runs the annual operating cycle for the eight-week internship program, from planning and setup through daily logistics and closeout."
      },
      {
        title: "Professional network leadership",
        detail:
          "Chairs the Lab Management Network of Professionals and helps lead programming that brings together dozens to hundreds of participants across regional and national convenings."
      }
    ] as ScopeResult[]
  },
  experience: {
    label: "Experience",
    heading: "Current roles and operating responsibility.",
    intro:
      "Select a role to view current scope, responsibility, and public context.",
    entries: [
      {
        id: "labs",
        navLabel: "Research laboratories",
        title: "Laboratory Manager",
        organization:
          "Thomas Bernhardt and Jonathan Abraham laboratories, Department of Microbiology, Harvard Medical School",
        dates: "2019 - Present",
        summary:
          "Leads shared operations for two Howard Hughes Medical Institute Investigator laboratories within the Department of Microbiology at Harvard Medical School.",
        responsibilities: [
          "Directs budgets, purchasing, vendor relationships, facilities coordination, and equipment planning across a shared research footprint spanning two buildings.",
          "Handles hiring logistics, onboarding, candidate visits, regulated laboratory-space coordination, and day-to-day continuity for two active research laboratories."
        ],
        evidence: [
          {
            label: "Current remit",
            value:
              "Operational leadership across staffing, budgets, facilities, equipment, vendor coordination, and continuity."
          },
          {
            label: "Operating context",
            value:
              "Two HHMI Investigator laboratories with one shared biosafety level 2 laboratory footprint."
          }
        ]
      },
      {
        id: "program",
        navLabel: "Community Phages program",
        title: "Program Operations Lead",
        organization:
          "Community Phages, Department of Microbiology, Harvard Medical School",
        dates: "2022 - Present",
        summary:
          "Leads the operating model for Community Phages, an eight-week summer internship program for Roxbury Community College students.",
        responsibilities: [
          "Builds and runs the annual program environment, including benches, supplies, safety setup, access, schedules, partner coordination, and closeout.",
          "Owns the operational side of the program end to end, supporting students, instructors, visitors, and daily execution throughout the summer."
        ],
        evidence: [
          {
            label: "Program structure",
            value:
              "Fifth annual operating cycle for an eight-week research internship program."
          },
          {
            label: "Delivery model",
            value:
              "Combines laboratory setup, logistics, student support, field activity coordination, and closeout."
          }
        ],
        link: {
          label: "Program website",
          href: "https://phages.hms.harvard.edu/"
        }
      },
      {
        id: "network",
        navLabel: "Lab manager network",
        title: "Chair, Advisory Board",
        organization:
          "Lab Management Network of Professionals, Howard Hughes Medical Institute",
        dates: "2022 - Present",
        summary:
          "Chairs the advisory board for the Lab Management Network of Professionals, a peer professional-development organization for Howard Hughes Medical Institute lab managers.",
        responsibilities: [
          "Sets board priorities and helps shape regional and national programming for a network of laboratory managers across the institute.",
          "Supports recurring peer infrastructure through monthly programming and the institute-wide Slack community."
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
    ] as ExperienceEntry[]
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
          "Peter Chien laboratory, University of Massachusetts Amherst",
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
    }
  },
  contact: {
    label: "Contact",
    heading: "Public links.",
    intro: "LinkedIn and the public resume are the current public routes for this site.",
    links: [
      {
        label: "LinkedIn",
        href: "https://www.linkedin.com/in/jamesmspencer/"
      },
      {
        label: "Resume",
        href: asset("assets/resume/james-m-spencer-resume.pdf"),
        download: true
      }
    ] as ActionLink[]
  },
  footer: {
    disclaimer:
      "This website is maintained by James M. Spencer in a personal capacity. It is not an official website of Harvard Medical School, HHMI, or any affiliated laboratory or program, and nothing here should be understood as speaking on behalf of those institutions."
  }
};
