export const achievements = [
  {
    slug: "first-trace",
    name: "Request tracer",
    description: "Cleared the login trace.",
    unlockRule: { type: "challenge_passed", slug: "trace-the-login-click" },
  },
  {
    slug: "architect",
    name: "Login architect",
    description: "Defended a login design.",
    unlockRule: { type: "challenge_passed", slug: "build-a-login" },
  },
  {
    slug: "modeler",
    name: "Data modeler",
    description: "Designed users and organizations.",
    unlockRule: { type: "challenge_passed", slug: "design-users-and-orgs" },
  },
  {
    slug: "reviewer",
    name: "Hole finder",
    description: "Found the invoice authorization bug.",
    unlockRule: { type: "challenge_passed", slug: "invoice-that-isnt-yours" },
  },
  {
    slug: "incident-lead",
    name: "Incident lead",
    description: "Stopped the double charge.",
    unlockRule: { type: "challenge_passed", slug: "double-charge-incident" },
  },
  {
    slug: "briefing",
    name: "Briefing cleared",
    description: "Explained a login to a senior engineer.",
    unlockRule: { type: "challenge_passed", slug: "explain-the-login" },
  },
  {
    slug: "streak-3",
    name: "Three-day streak",
    description: "Showed up three days in a row.",
    unlockRule: { type: "streak", count: 3 },
  },
  {
    slug: "junior-rank",
    name: "Junior AI Builder",
    description: "Left the starting rank.",
    unlockRule: { type: "rank", rankId: "junior_ai_builder" },
  },
] as const;
