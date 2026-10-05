export const LEVEL_TABLE = [0, 100, 250, 450, 700, 1000] as const;

export type Rank = {
  id: string;
  title: string;
  minXp: number;
  lore: string;
};

export const RANKS: readonly Rank[] = [
  {
    id: "vibe_coder",
    title: "Vibe Coder",
    minXp: 0,
    lore: "You can ship with an agent. The work now is to understand the machine you just shipped.",
  },
  {
    id: "junior_ai_builder",
    title: "Junior AI Builder",
    minXp: 250,
    lore: "You can trace a request and name the pieces you are responsible for.",
  },
  {
    id: "ai_developer",
    title: "AI Developer",
    minXp: 800,
    lore: "You can review generated code against how the system is actually put together.",
  },
  {
    id: "ai_product_builder",
    title: "AI Product Builder",
    minXp: 1600,
    lore: "You can shape a feature across the interface, the API, and the data.",
  },
  {
    id: "ai_product_engineer",
    title: "AI Product Engineer",
    minXp: 2800,
    lore: "You can ship a change that survives retries, bad input, and a second user.",
  },
  {
    id: "software_engineer",
    title: "Software Engineer",
    minXp: 4500,
    lore: "You can defend a design, a test plan, and a rollback to another engineer.",
  },
  {
    id: "ai_native_engineer",
    title: "AI Native Engineer",
    minXp: 7000,
    lore: "The agent can write the code. You own the engineering decision.",
  },
] as const;

export function thresholdForLevel(level: number): number {
  if (level <= 1) return 0;
  const index = level - 1;
  if (index < LEVEL_TABLE.length) return LEVEL_TABLE[index];
  return 1000 + (level - LEVEL_TABLE.length) * 400;
}

export function levelForXp(xp: number): number {
  const safeXp = Math.max(0, xp);
  let level = 1;
  while (level < 200 && thresholdForLevel(level + 1) <= safeXp) {
    level += 1;
  }
  return level;
}

export function levelProgress(xp: number): {
  level: number;
  floor: number;
  next: number;
  into: number;
  span: number;
} {
  const level = levelForXp(xp);
  const floor = thresholdForLevel(level);
  const next = thresholdForLevel(level + 1);
  return { level, floor, next, into: xp - floor, span: next - floor };
}

export function rankForXp(xp: number): Rank {
  let current: Rank = RANKS[0];
  for (const rank of RANKS) {
    if (xp >= rank.minXp) current = rank;
  }
  return current;
}

export function nextRank(xp: number): Rank | null {
  const current = rankForXp(xp);
  const index = RANKS.findIndex((rank) => rank.id === current.id);
  return RANKS[index + 1] ?? null;
}

export function rankMeets(currentRankId: string, requiredRankId: string): boolean {
  const current = RANKS.findIndex((rank) => rank.id === currentRankId);
  const required = RANKS.findIndex((rank) => rank.id === requiredRankId);
  if (current < 0 || required < 0) return false;
  return current >= required;
}
