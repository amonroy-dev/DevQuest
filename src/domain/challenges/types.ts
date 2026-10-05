export const DIMENSIONS = [
  "correctness",
  "reasoning",
  "architecture",
  "security",
  "reliability",
  "maintainability",
  "performance",
] as const;

export type DimensionKey = (typeof DIMENSIONS)[number];

export type Finding = {
  principle: string;
  productionImpact: string;
  hint: string;
};

export type Score = {
  passed: boolean;
  overall: number;
  dimensions: Partial<Record<DimensionKey, number>>;
  feedback: {
    summary: string;
    findings: Finding[];
  };
};

export type AttemptView = Score & {
  xpGained: number;
  totalXp: number;
  level: number;
  rankTitle: string;
  mastered: boolean;
};

export type ChallengeType =
  | "sequence"
  | "architecture"
  | "schema"
  | "debug"
  | "incident"
  | "explain";

export function clampScore(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}
