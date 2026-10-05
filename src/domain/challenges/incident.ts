import { z } from "zod";
import { clampScore, type Finding, type Score } from "@/domain/challenges/types";

const option = z.object({ id: z.string(), label: z.string() });

export const incidentDefinition = z.object({
  logs: z.array(z.string()),
  code: z.string(),
  notes: z.array(z.string()),
  stages: z.array(
    z.object({
      id: z.string(),
      prompt: z.string(),
      options: z.array(option),
    }),
  ),
});

export const incidentRubric = z.object({
  stages: z.array(
    z.object({
      id: z.string(),
      correctOptionIds: z.array(z.string()),
      wrong: z.record(
        z.string(),
        z.object({ principle: z.string(), productionImpact: z.string(), hint: z.string() }),
      ),
    }),
  ),
  passCount: z.number().int().positive(),
});

export const incidentAnswer = z.object({
  choices: z.record(z.string(), z.string()),
});

export type IncidentDefinition = z.infer<typeof incidentDefinition>;
export type IncidentRubric = z.infer<typeof incidentRubric>;
export type IncidentAnswer = z.infer<typeof incidentAnswer>;

export function scoreIncident(
  _definition: IncidentDefinition,
  rubric: IncidentRubric,
  answer: IncidentAnswer,
): Score {
  const findings: Finding[] = [];
  let correct = 0;
  let reasoningHits = 0;
  let reasoningTotal = 0;

  for (const stage of rubric.stages) {
    const choice = answer.choices[stage.id];
    const hit = stage.correctOptionIds.includes(choice ?? "");
    if (hit) correct += 1;
    else if (choice && stage.wrong[choice]) findings.push(stage.wrong[choice]);
    else {
      findings.push({
        principle: "This stage still needs a decision.",
        productionImpact: "An incident without a decision keeps charging customers.",
        hint: "Pick the option that still works when the customer clicks Pay twice.",
      });
    }
    if (stage.id === "mechanism" || stage.id === "fix") {
      reasoningTotal += 1;
      if (hit) reasoningHits += 1;
    }
  }

  const overall = clampScore(rubric.stages.length === 0 ? 0 : (correct / rubric.stages.length) * 100);
  const reasoning = clampScore(reasoningTotal === 0 ? overall : (reasoningHits / reasoningTotal) * 100);
  const passed = correct >= rubric.passCount;

  return {
    passed,
    overall,
    dimensions: { correctness: overall, reliability: overall, reasoning },
    feedback: {
      summary: passed
        ? `${correct} of ${rubric.stages.length} incident decisions hold. Customers stop getting charged twice when the retry is safe.`
        : `${correct} of ${rubric.stages.length} decisions hold. A retry is still dangerous.`,
      findings,
    },
  };
}
