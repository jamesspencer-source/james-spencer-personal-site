export type ActionLink = {
  label: string;
  href: string;
  download?: boolean;
};

export type ProofItem = {
  value: string;
  label: string;
  detail: string;
};

export type InstitutionItem = {
  name: string;
  detail: string;
};

export type DomainItem = {
  title: string;
  description: string;
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
      "James M. Spencer leads laboratory operations and scientific programs in complex research environments, with responsibility for staffing, budgets, facilities, equipment, and day-to-day execution."
  },
  hero: {
    label: "Overview",
    name: "James M. Spencer",
    title: "Laboratory Operations and Scientific Program Leader",
    location: "Boston, Massachusetts",
    summary:
      "James M. Spencer leads operations for two research laboratories and a summer research program at Harvard Medical School. His work includes staffing, budgets, facilities, equipment, regulated laboratory space, vendor coordination, and day-to-day coordination across those environments.",
    proof: [
      {
        value: "2",
        label: "research laboratories",
        detail: "Harvard Medical School"
      },
      {
        value: "2",
        label: "buildings",
        detail: "shared laboratory footprint"
      },
      {
        value: "8 weeks",
        label: "summer research program",
        detail: "annual delivery"
      },
      {
        value: "100+",
        label: "regional attendees",
        detail: "plus a national program"
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
      "Current responsibilities across laboratory operations and scientific programs.",
    overview:
      "His current work sits between laboratory operations, staffing, and program delivery. It includes budgets, hiring and onboarding, shared equipment and facilities, vendor relationships, regulated biosafety level 2 laboratory space, and the annual delivery of a summer research program.",
    institutions: [
      {
        name: "Howard Hughes Medical Institute",
        detail:
          "Sponsor context for the Thomas Bernhardt and Jonathan Abraham laboratories."
      },
      {
        name: "Harvard Medical School",
        detail:
          "Institutional setting for laboratory infrastructure, shared facilities, and program delivery."
      },
      {
        name: "Community Phages",
        detail:
          "An eight-week summer research program for Roxbury Community College students."
      },
      {
        name: "Lab Management Network of Professionals",
        detail:
          "Institute community leadership for laboratory managers."
      }
    ] as InstitutionItem[],
    domains: [
      {
        title: "Laboratory operations",
        description:
          "Budgets, equipment, facilities, purchasing, vendor relationships, and day-to-day continuity across shared research environments."
      },
      {
        title: "Staffing and coordination",
        description:
          "Recruiting logistics, onboarding, postdoctoral candidate visits, schedules, and practical support for teams and trainees."
      },
      {
        title: "Programs and community",
        description:
          "Summer-program delivery, regional meetings, national convenings, and ongoing peer-support infrastructure for laboratory managers."
      }
    ] as DomainItem[],
    results: [
      "Leads operations for two Howard Hughes Medical Institute (HHMI) investigator laboratories across shared biosafety level 2 laboratory space in two buildings.",
      "Expanded responsibility from one laboratory to two in August 2025 while maintaining one shared system.",
      "Runs an annual eight-week Community Phages summer research program for eight Roxbury Community College students.",
      "Chairs the Lab Management Network of Professionals (LMNOP) and helps lead regional meetings of about 100 attendees plus a 2025 week-long national program for 60 selected lab managers and about 20 institute partners."
    ]
  },
  experience: {
    label: "Experience",
    heading: "Current roles and institute leadership.",
    intro:
      "The roles below cover laboratory management, summer-program operations, and institute community leadership.",
    entries: [
      {
        id: "labs",
        navLabel: "Laboratory management",
        title: "Laboratory Manager",
        organization:
          "Howard Hughes Medical Institute (HHMI), Department of Microbiology, Harvard Medical School",
        dates: "2019 - Present",
        summary:
          "Leads shared operations for the Thomas Bernhardt and Jonathan Abraham laboratories.",
        responsibilities: [
          "Oversees budgets, purchasing, vendor relationships, facilities work, and equipment planning across two research laboratories.",
          "Manages hiring logistics, onboarding, candidate visits, and day-to-day continuity across shared biosafety level 2 laboratory space."
        ],
        evidence: [
          {
            label: "Scope",
            value:
              "Two research laboratories in two buildings with one shared regulated laboratory footprint."
          },
          {
            label: "Responsibility",
            value:
              "Budgets, staffing, equipment, facilities, vendor coordination, and execution."
          }
        ]
      },
      {
        id: "program",
        navLabel: "Summer program",
        title: "Operations Lead",
        organization:
          "Community Phages, Department of Microbiology, Harvard Medical School",
        dates: "2022 - Present",
        summary:
          "Runs the annual operating cycle for an eight-week summer research program serving Roxbury Community College students.",
        responsibilities: [
          "Builds and runs the yearly program environment, including benches, supplies, access, safety setup, schedules, and closeout.",
          "Coordinates daily logistics, field visits, partner activity, and student and instructor support throughout the eight-week program."
        ],
        evidence: [
          {
            label: "Program model",
            value: "Annual eight-week research experience for Roxbury Community College students."
          },
          {
            label: "Scale",
            value:
              "Eight students plus instructors, visitors, field activities, and a dedicated lab environment."
          }
        ]
      },
      {
        id: "network",
        navLabel: "Institute network",
        title: "Chair, Advisory Board",
        organization:
          "Lab Management Network of Professionals (LMNOP), Howard Hughes Medical Institute",
        dates: "2022 - Present",
        summary:
          "Leads advisory board work and recurring programming for laboratory managers across Howard Hughes Medical Institute.",
        responsibilities: [
          "Sets board priorities and helps shape the operating agenda for regional and national convenings.",
          "Maintains recurring peer-support infrastructure through monthly programming and the institute-wide Slack workspace."
        ],
        evidence: [
          {
            label: "Regional meetings",
            value: "Meetings of about 100 attendees."
          },
          {
            label: "2025 national program",
            value:
              "A 2025 week-long program for 60 selected lab managers and about 20 institute partners."
          }
        ]
      }
    ] as ExperienceEntry[]
  },
  background: {
    label: "Background",
    heading: "Earlier research and leadership work.",
    intro:
      "Earlier work included bench research at the University of Massachusetts Amherst and leadership roles in residential life.",
    portrait: {
      src: asset("assets/images/james-m-spencer-background-5900.jpg"),
      alt: "Portrait of James M. Spencer"
    } as PortraitAsset,
    entries: [
      {
        title: "Research Assistant",
        organization:
          "Laboratory of Peter Chien, PhD, University of Massachusetts Amherst",
        dates: "2015 - 2018",
        summary:
          "Studied the effects of beta-lactam antibiotic stress in lon protease-deficient Caulobacter crescentus."
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
      degree: "B.S., Science & Biochemistry",
      organization: "University of Massachusetts Amherst",
      dates: "2018"
    }
  },
  contact: {
    label: "Contact",
    heading: "Current public links.",
    intro: "LinkedIn and the public resume are the current public contact routes for this site.",
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
