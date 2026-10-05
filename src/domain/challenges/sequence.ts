import { z } from "zod";
import { clampScore, type Finding, type Score } from "@/domain/challenges/types";

export const sequenceDefinition = z.object({
  steps: z.array(z.object({ id: z.string(), label: z.string() })).min(2),
  explanations: z.array(z.object({ id: z.string(), text: z.string() })).min(2),
});

export const sequenceRubric = z.object({
  correctOrder: z.array(z.string()).min(2),
  explanationByStep: z.record(z.string(), z.string()),
  lessons: z.record(
    z.string(),
    z.object({
      principle: z.string(),
      productionImpact: z.string(),
      hint: z.string(),
    }),
  ),
});

export const sequenceAnswer = z.object({
  order: z.array(z.string()),
  explanations: z.record(z.string(), z.string()),
});

export type SequenceDefinition = z.infer<typeof sequenceDefinition>;
export type SequenceRubric = z.infer<typeof sequenceRubric>;
export type SequenceAnswer = z.infer<typeof sequenceAnswer>;

export function pairwiseOrderScore(correct: string[], given: string[]): number {
  const position = new Map(given.map((id, index) => [id, index]));
  let matches = 0;
  let total = 0;
  for (let i = 0; i < correct.length; i += 1) {
    for (let j = i + 1; j < correct.length; j += 1) {
      total += 1;
      const left = position.get(correct[i]);
      const right = position.get(correct[j]);
      if (left !== undefined && right !== undefined && left < right) matches += 1;
    }
  }
  return total === 0 ? 0 : matches / total;
}

function misplacedSteps(correct: string[], given: string[]): string[] {
  const position = new Map(given.map((id, index) => [id, index]));
  const bad: string[] = [];
  let previous = -1;
  for (const id of correct) {
    const current = position.get(id);
    if (current === undefined || current < previous) bad.push(id);
    else previous = current;
  }
  return bad;
}

export function scoreSequence(
  definition: SequenceDefinition,
  rubric: SequenceRubric,
  answer: SequenceAnswer,
): Score {
  const orderRatio = pairwiseOrderScore(rubric.correctOrder, answer.order);
  const explanationHits = rubric.correctOrder.filter(
    (stepId) => answer.explanations[stepId] === rubric.explanationByStep[stepId],
  ).length;
  const explanationRatio =
    rubric.correctOrder.length === 0 ? 0 : explanationHits / rubric.correctOrder.length;
  const correctness = clampScore(orderRatio * 100);
  const reasoning = clampScore(explanationRatio * 100);
  const overall = clampScore(orderRatio * 70 + explanationRatio * 30);
  const passed = orderRatio >= 0.8 && explanationRatio >= 0.6;

  const labels = new Map(definition.steps.map((step) => [step.id, step.label]));
  const findings: Finding[] = misplacedSteps(rubric.correctOrder, answer.order)
    .slice(0, 3)
    .map((stepId) => {
      const lesson = rubric.lessons[stepId];
      return (
        lesson ?? {
          principle: `${labels.get(stepId) ?? stepId} is out of order.`,
          productionImpact: "The rest of the path is hard to trust if this step is in the wrong place.",
          hint: "Ask what must already be true before this step can happen.",
        }
      );
    });

  if (explanationRatio < 1) {
    findings.push({
      principle: "Naming a box is not the same as knowing what it does.",
      productionImpact:
        "In a real outage you will describe this path to someone else. A wrong story sends the investigation to the wrong tier.",
      hint: "For each step, say which computer is acting and what it sends or stores.",
    });
  }

  const summary = passed
    ? `The path is ${correctness}% in order and ${explanationHits} of ${rubric.correctOrder.length} explanations match.`
    : `Not yet. Order is ${correctness}% and ${explanationHits} of ${rubric.correctOrder.length} explanations match. Both have to be solid.`;

  return {
    passed,
    overall,
    dimensions: { correctness, reasoning },
    feedback: { summary, findings },
  };
}
