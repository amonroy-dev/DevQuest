import { z } from "zod";
import { clampScore, type Finding, type Score } from "@/domain/challenges/types";

export const debugDefinition = z.object({
  lines: z.array(z.object({ n: z.number(), text: z.string() })),
  request: z.string(),
  response: z.string(),
  logs: z.array(z.string()),
  causeOptions: z.array(z.object({ id: z.string(), label: z.string() })),
  fixOptions: z.array(z.object({ id: z.string(), label: z.string() })),
});

export const debugRubric = z.object({
  buggyLines: z.array(z.number()),
  causeId: z.string(),
  fixId: z.string(),
  wrongCause: z.record(
    z.string(),
    z.object({ principle: z.string(), productionImpact: z.string(), hint: z.string() }),
  ),
  wrongFix: z.record(
    z.string(),
    z.object({ principle: z.string(), productionImpact: z.string(), hint: z.string() }),
  ),
  lineMiss: z.object({ principle: z.string(), productionImpact: z.string(), hint: z.string() }),
});

export const debugAnswer = z.object({
  line: z.number(),
  causeId: z.string(),
  fixId: z.string(),
});

export type DebugDefinition = z.infer<typeof debugDefinition>;
export type DebugRubric = z.infer<typeof debugRubric>;
export type DebugAnswer = z.infer<typeof debugAnswer>;

export function scoreDebug(_definition: DebugDefinition, rubric: DebugRubric, answer: DebugAnswer): Score {
  const findings: Finding[] = [];
  let points = 0;
  const lineOk = rubric.buggyLines.includes(answer.line);
  const causeOk = answer.causeId === rubric.causeId;
  const fixOk = answer.fixId === rubric.fixId;
  if (lineOk) points += 40;
  else findings.push(rubric.lineMiss);
  if (causeOk) points += 30;
  else if (rubric.wrongCause[answer.causeId]) findings.push(rubric.wrongCause[answer.causeId]);
  if (fixOk) points += 30;
  else if (rubric.wrongFix[answer.fixId]) findings.push(rubric.wrongFix[answer.fixId]);

  const overall = clampScore(points);
  const security = clampScore((causeOk ? 50 : 0) + (fixOk ? 50 : 0));
  return {
    passed: overall >= 70,
    overall,
    dimensions: { correctness: overall, security },
    feedback: {
      summary: overall >= 70
        ? "You found the hole: the handler is authenticated and still not authorized."
        : "The bug is still in the handler. Authentication ran. Authorization did not.",
      findings,
    },
  };
}
