import { rankMeets } from "@/domain/progression/progression";

export type UnlockRule =
  | { type: "challenge_passed"; slug: string }
  | { type: "rank"; rankId: string }
  | { type: "streak"; count: number };

export type UnlockContext = {
  passedSlugs: ReadonlySet<string>;
  rankId: string;
  streak: number;
};

export function isUnlocked(rule: UnlockRule, context: UnlockContext): boolean {
  switch (rule.type) {
    case "challenge_passed":
      return context.passedSlugs.has(rule.slug);
    case "rank":
      return rankMeets(context.rankId, rule.rankId);
    case "streak":
      return context.streak >= rule.count;
    default: {
      const never: never = rule;
      return never;
    }
  }
}
