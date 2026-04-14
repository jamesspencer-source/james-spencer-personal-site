export type ActionLink = {
  label: string;
  href: string;
  download?: boolean;
};

export type ProofItem = {
  headline: string;
  detail: string;
  tone?: "labs" | "program" | "network" | "neutral";
};

export type OpeningContent = {
  name: string;
  title: string;
  location: string;
  summary: string[];
  proof: ProofItem[];
  links: ActionLink[];
};

export type AtlasStage = {
  id: "labs" | "program" | "network";
  navLabel: string;
  kicker: string;
  title: string;
  summary: string;
  proof: ProofItem[];
  alignment: "left" | "right";
};

export type ClosingContent = {
  title: string;
  links: ActionLink[];
};

const asset = (path: string) => `${import.meta.env.BASE_URL}${path}`;

export const siteContent = {
  meta: {
    title: "James M. Spencer | Laboratory Operations and Scientific Program Leader",
    description:
      "James M. Spencer leads laboratory operations, scientific programs, and professional community work at Harvard Medical School."
  },
  opening: {
    name: "James M. Spencer",
    title: "Laboratory Operations and Scientific Program Leader",
    location: "Boston, Massachusetts",
    summary: [
      "James M. Spencer leads the operational work that keeps complex scientific environments moving at Harvard Medical School.",
      "His responsibilities span two research laboratories supported by the Howard Hughes Medical Institute (HHMI), Community Phages, and the Lab Management Network of Professionals. The work includes staffing, budgets, facilities, equipment, regulated laboratory space, vendor coordination, and day-to-day execution."
    ],
    proof: [
      {
        headline: "Laboratory operations",
        detail: "Two research laboratories, one shared operating model, and daily continuity across people, equipment, space, and vendors.",
        tone: "labs"
      },
      {
        headline: "Scientific program delivery",
        detail: "Community Phages, an eight-week summer internship program, planned and run end to end.",
        tone: "program"
      },
      {
        headline: "Professional network leadership",
        detail: "Chairing a lab manager network and helping shape regional and national convenings.",
        tone: "network"
      }
    ] as ProofItem[],
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
  } as OpeningContent,
  atlasStages: [
    {
      id: "labs",
      navLabel: "Laboratory Operations",
      kicker: "Howard Hughes Medical Institute + Harvard Medical School",
      title: "Laboratory Operations",
      summary:
        "James directs budgets, facilities, equipment, staffing logistics, vendor relationships, and day-to-day continuity across two research laboratories led by Howard Hughes Medical Institute (HHMI) Investigators. The work is measured less by visibility than by whether research can move without friction, interruption, or preventable delay.",
      proof: [
        {
          headline: "Shared operating model",
          detail: "One coordinated system across personnel, space, equipment, purchasing, and continuity.",
          tone: "labs"
        },
        {
          headline: "Regulated laboratory space and equipment",
          detail: "Facilities coordination, maintenance, and vendor stewardship for complex research work.",
          tone: "labs"
        },
        {
          headline: "Operational support close to the science",
          detail: "Staffing support, candidate visits, onboarding, and daily decisions that keep work moving.",
          tone: "labs"
        }
      ],
      alignment: "left"
    },
    {
      id: "program",
      navLabel: "Community Phages",
      kicker: "Community Phages",
      title: "Community Phages",
      summary:
        "Community Phages is an annual summer research program, and James leads the operating cycle that makes it possible. He brings together benches, supplies, safety preparation, schedules, partner coordination, student support, and closeout so the program runs as a coherent whole.",
      proof: [
        {
          headline: "Eight-week annual program",
          detail: "A repeatable program delivered each summer rather than a one-off event.",
          tone: "program"
        },
        {
          headline: "Roxbury Community College partnership",
          detail: "Student-facing delivery anchored in dependable preparation and coordination.",
          tone: "program"
        },
        {
          headline: "End-to-end execution",
          detail: "The practical work beneath recruitment, setup, day-to-day support, and completion.",
          tone: "program"
        }
      ],
      alignment: "right"
    },
    {
      id: "network",
      navLabel: "Network Leadership",
      kicker: "Lab Management Network of Professionals",
      title: "Network Leadership",
      summary:
        "As chair of the advisory board for the Lab Management Network of Professionals, James helps shape regional gatherings, national convenings, recurring programming, and professional support for laboratory managers. The role extends his work from individual laboratories into the broader systems that support them.",
      proof: [
        {
          headline: "Advisory board chair",
          detail: "Leadership for planning, continuity, and institutional coordination.",
          tone: "network"
        },
        {
          headline: "Regional and national convenings",
          detail: "Programming that brings laboratory managers and institute partners into one room.",
          tone: "network"
        },
        {
          headline: "Peer infrastructure",
          detail: "Professional community support that continues between meetings and events.",
          tone: "network"
        }
      ],
      alignment: "left"
    }
  ] as AtlasStage[],
  closing: {
    title: "Contact",
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
  } as ClosingContent,
  footer: {
    disclaimer:
      "This website is maintained by James M. Spencer in a personal capacity. It is not an official website of Harvard Medical School, HHMI, or any affiliated laboratory or program, and nothing here should be understood as speaking on behalf of those institutions."
  }
};
