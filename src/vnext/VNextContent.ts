import { siteContent } from "../content";

export type VNextChapter = {
  id: "labs" | "program" | "network";
  index: string;
  label: string;
  title: string;
  summary: string;
  points: string[];
};

export const vNextContent = {
  nav: [
    { label: "Current site", href: import.meta.env.BASE_URL },
    { label: "Prototype", href: `${import.meta.env.BASE_URL}vnext` }
  ],
  hero: {
    name: siteContent.hero.name,
    title: "Research operations, staged as a working system",
    summary:
      "A more cinematic prototype using the same public facts: laboratory operations, student-program delivery, and lab-manager conference planning presented as one connected operating environment.",
    proof: [
      "Two HHMI Investigator laboratories",
      "Community Phages program delivery",
      "Lab-manager conference planning"
    ]
  },
  chapters: [
    {
      id: "labs",
      index: "01",
      label: "Laboratory operations",
      title: "Two labs, separate spaces, daily coordination",
      summary:
        "Day-to-day operations for the Bernhardt and Abraham laboratories in HMS Microbiology, including equipment, access, vendors, purchasing, facilities requests, onboarding, and lab support.",
      points: [
        "9th- and 10th-floor research space",
        "Equipment, supplies, service contracts",
        "Access, onboarding, candidate visits"
      ]
    },
    {
      id: "program",
      index: "02",
      label: "Community Phages",
      title: "A program cycle from setup to closeout",
      summary:
        "Operations support for an eight-week summer research program, including funding coordination, hiring, onboarding, lab setup, biosafety preparation, delivery logistics, student support, and closeout.",
      points: [
        "Funding, hiring, onboarding",
        "Lab-space and biosafety preparation",
        "Daily logistics, field trips, closeout"
      ]
    },
    {
      id: "network",
      index: "03",
      label: "Lab-manager conferences",
      title: "A lab-manager network with recurring conference work",
      summary:
        "Advisory-board chair work for the Lab Management Network of Professionals, including board priorities, meeting agendas, speaker coordination, partner contact, conference logistics, and member resources.",
      points: [
        "Boston, Washington, DC, San Francisco, New York City",
        "Regional and national conferences",
        "Speaker coordination and partner contact"
      ]
    }
  ] satisfies VNextChapter[],
  fit: {
    title: "Built for research operations roles",
    summary:
      "Best-fit roles sit in academic and biomedical research environments where scientific teams need reliable coordination across people, space, equipment, budgets, vendors, timelines, programs, and events.",
    roles: siteContent.operatingScope.fitRoles,
    scope: siteContent.operatingScope.items
  },
  contact: {
    heading: siteContent.contact.heading,
    intro: siteContent.contact.intro,
    supportLine: siteContent.contact.supportLine,
    tags: siteContent.contact.contextTags ?? [],
    portrait: siteContent.contact.portrait,
    links: siteContent.contact.links
  },
  documentary: siteContent.rolesSection.chapters.find((chapter) => chapter.id === "network")
    ?.documentaryBeat
};
