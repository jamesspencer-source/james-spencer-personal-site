// Current public scope combines the linked resume and James's approved site facts.
// Do not infer budget totals, headcounts, floor area, or measured outcomes.
export const roleLinks = [
  { id: "laboratories", label: "Laboratories" },
  { id: "community-phages", label: "Community Phages" },
  { id: "lmnop", label: "LMNOP" },
] as const;

export const expertise = [
  { title: "Budgets & financial planning", description: "Manages budgets, purchasing, and spending across funding sources. Works with investigators on staffing costs, spending priorities, and the timing of major purchases." },
  { title: "Hiring & personnel operations", description: "Leads recruitment and selection for staff roles. Coordinates postdoctoral candidate visits, onboarding, access, and start-date preparation, and supports day-to-day personnel administration." },
  { title: "Capital equipment, vendors & facilities", description: "Coordinates capital equipment purchases, vendor relationships, service contracts, installations, renovations, and facilities requests. Plans service coverage and purchasing around each laboratory's research needs." },
  { title: "Internal compliance & research administration", description: "Maintains laboratory compliance documentation, coordinates COMS and IACUC submissions and records, and supports lab-specific training, biosafety preparation, and inspections." },
] as const;

export const programPhases = [
  { title: "Plan", description: "Funding coordination, budgeting, recruitment, hiring, and the annual program schedule." },
  { title: "Prepare", description: "Participant onboarding, access, lab setup, supplies, equipment, biosafety preparation, and instructor support." },
  { title: "Deliver", description: "Student and instructor support, field trips, partner visits, purchasing, and daily program logistics." },
  { title: "Close", description: "Participant offboarding, spending reconciliation, materials closeout, and laboratory reset." },
] as const;
