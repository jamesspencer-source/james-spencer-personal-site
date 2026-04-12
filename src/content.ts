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

const asset = (path: string) => `${import.meta.env.BASE_URL}${path}`;

export const siteContent = {
  meta: {
    title: "James M. Spencer | Laboratory Operations and Scientific Program Leader",
    description:
      "James M. Spencer leads laboratory operations and scientific programs in complex research environments, with responsibility for staffing, budgets, facilities, equipment, and day-to-day execution."
  },
  hero: {
    eyebrow: "James M. Spencer",
    headline:
      "He keeps research laboratories and scientific programs running.",
    summary:
      "James M. Spencer currently leads operating work for two research laboratories and a summer research program at Harvard Medical School. His scope includes staffing, budgets, facilities, equipment, regulated laboratory space, vendor coordination, and the day-to-day execution required to keep those environments running.",
    location: "Boston, Massachusetts",
    portrait: {
      src: asset("assets/images/james-m-spencer-hero-5904.jpg"),
      alt: "Portrait of James M. Spencer"
    },
    proof: [
      {
        value: "2",
        label: "Research laboratories",
        detail: "shared operating model"
      },
      {
        value: "2",
        label: "Buildings",
        detail: "one regulated footprint"
      },
      {
        value: "8 weeks",
        label: "Summer research program",
        detail: "annual delivery cycle"
      },
      {
        value: "100+",
        label: "Regional convenings",
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
      "Current responsibilities across research operations and scientific programs.",
    overview:
      "His work sits where laboratory operations, people, and program delivery meet. The current environment includes sponsor-aware budgets, recruiting and onboarding, shared equipment and facilities, vendor relationships, regulated biosafety level 2 laboratory space, and the annual execution of a summer research experience.",
    institutions: [
      {
        name: "Howard Hughes Medical Institute",
        detail:
          "Two investigator laboratories in the Harvard Medical School Department of Microbiology."
      },
      {
        name: "Harvard Medical School",
        detail:
          "Current operating setting for laboratory infrastructure, shared facilities, and program delivery."
      },
      {
        name: "Community Phages",
        detail:
          "An eight-week summer research program for Roxbury Community College students."
      },
      {
        name: "Lab Management Network of Professionals",
        detail:
          "Professional community leadership for lab managers across the institute."
      }
    ] as InstitutionItem[],
    domains: [
      {
        title: "Laboratory operations",
        description:
          "Budgets, equipment, facilities, vendor relationships, and the daily continuity work behind shared research environments."
      },
      {
        title: "People and execution",
        description:
          "Recruiting logistics, onboarding, postdoctoral candidate visits, schedules, and practical support for teams and trainees."
      },
      {
        title: "Programs and community",
        description:
          "Annual summer-program delivery plus regional and national event leadership for lab manager communities."
      }
    ] as DomainItem[],
    results: [
      "Leads operations for two Howard Hughes Medical Institute investigator laboratories across shared biosafety level 2 laboratory space in two buildings.",
      "Expanded the operating model from one laboratory to two in August 2025 while keeping one shared system in place.",
      "Runs an annual eight-week Community Phages summer research program for eight Roxbury Community College students.",
      "Chairs the Lab Management Network of Professionals and helps lead regional meetings of about 100 attendees plus a 2025 national program for 60 selected lab managers and about 20 institute partners."
    ]
  },
  experience: {
    label: "Experience",
    heading: "Selected leadership roles.",
    intro:
      "Role history across research laboratories, program operations, and professional community leadership.",
    entries: [
      {
        id: "labs",
        navLabel: "Research laboratories",
        title: "Laboratory Manager",
        organization:
          "Howard Hughes Medical Institute (HHMI), Harvard Medical School Department of Microbiology",
        dates: "2019 - Present",
        summary:
          "Leads shared operations for the Thomas Bernhardt and Jonathan Abraham laboratories.",
        responsibilities: [
          "Directs budget oversight, sponsor-aware spending, purchasing, vendor relationships, facilities work, and equipment planning across two active laboratories.",
          "Manages recruiting logistics, onboarding, postdoctoral candidate visits, and the practical conditions required for stable day-to-day laboratory operations.",
          "Oversees work tied to shared biosafety level 2 laboratory space, including access, continuity, and operational follow-through."
        ],
        evidence: [
          {
            label: "Operating environment",
            value:
              "Two research laboratories, two buildings, and one shared regulated laboratory footprint."
          },
          {
            label: "Primary remit",
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
          "Community Phages, Harvard Medical School Department of Microbiology",
        dates: "2022 - Present",
        summary:
          "Runs the annual operating cycle for an eight-week summer research program serving Roxbury Community College students.",
        responsibilities: [
          "Builds the yearly lab environment from the ground up, from benches and supplies to access, safety setup, and end-of-program closeout.",
          "Coordinates schedules, field visits, partner activity, and daily logistics so students and instructors can focus on the research experience.",
          "Maintains the yearly delivery rhythm for the program across setup, operation, and closeout."
        ],
        evidence: [
          {
            label: "Program cadence",
            value: "Annual eight-week research experience."
          },
          {
            label: "Program scale",
            value:
              "Eight students plus instructors, visitors, field activities, and a dedicated lab environment."
          }
        ]
      },
      {
        id: "network",
        navLabel: "Professional network",
        title: "Chair, Advisory Board",
        organization:
          "Lab Management Network of Professionals (LMNOP), Howard Hughes Medical Institute",
        dates: "2022 - Present",
        summary:
          "Leads board work and recurring programming for a network of lab managers across the institute.",
        responsibilities: [
          "Sets board priorities and helps shape the operating agenda for regional and national convenings.",
          "Maintains recurring peer-support infrastructure through monthly programming and the institute-wide Slack workspace.",
          "Connects institute partners with working lab managers when operational input is needed."
        ],
        evidence: [
          {
            label: "Regional programs",
            value: "Meetings of about 100 attendees."
          },
          {
            label: "National program",
            value:
              "A 2025 week-long program for 60 selected lab managers and about 20 institute partners."
          }
        ]
      }
    ] as ExperienceEntry[]
  },
  background: {
    label: "Background",
    heading: "Earlier research and leadership experience.",
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
    heading: "Professional contact.",
    intro: "LinkedIn is the current public contact route for this site.",
    links: [
      {
        label: "LinkedIn",
        href: "https://www.linkedin.com/in/jamesmspencer/"
      }
    ] as ActionLink[]
  },
  footer: {
    disclaimer:
      "This website is maintained by James M. Spencer in a personal capacity. It is not an official website of Harvard Medical School, HHMI, or any affiliated laboratory or program, and nothing here should be understood as speaking on behalf of those institutions."
  }
};
