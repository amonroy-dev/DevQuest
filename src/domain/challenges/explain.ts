import { z } from "zod";
import { clampScore, type Finding, type Score } from "@/domain/challenges/types";

export const explainDefinition = z.object({
  architecture: z.string(),
  prompts: z.array(z.string()),
});

export const explainRubric = z.object({
  concepts: z.array(
    z.object({
      id: z.string(),
      label: z.string(),
      phrases: z.array(z.string()),
      missed: z.object({
        principle: z.string(),
        productionImpact: z.string(),
        hint: z.string(),
      }),
    }),
  ),
  minToPass: z.number().int().positive(),
});

export const explainAnswer = z.object({
  text: z.string(),
});

export type ExplainDefinition = z.infer<typeof explainDefinition>;
export type ExplainRubric = z.infer<typeof explainRubric>;
export type ExplainAnswer = z.infer<typeof explainAnswer>;

export function scoreExplain(
  _definition: ExplainDefinition,
  rubric: ExplainRubric,
  answer: ExplainAnswer,
): Score {
  const text = answer.text.toLowerCase();
  const matched = rubric.concepts.filter((concept) =>
    concept.phrases.some((phrase) => text.includes(phrase.toLowerCase())),
  );
  const missed = rubric.concepts.filter((concept) => !matched.includes(concept));
  const findings: Finding[] = missed.slice(0, 4).map((concept) => concept.missed);
  const overall = clampScore(rubric.concepts.length === 0 ? 0 : (matched.length / rubric.concepts.length) * 100);
  const passed = matched.length >= rubric.minToPass;

  return {
    passed,
    overall,
    dimensions: { reasoning: overall, correctness: overall },
    feedback: {
      summary: passed
        ? `A senior could follow this. You covered ${matched.length} of ${rubric.concepts.length} ideas: ${matched.map((concept) => concept.label).join(", ")}.`
        : `Not yet. ${matched.length} of ${rubric.concepts.length} ideas landed. Cover at least ${rubric.minToPass}.`,
      findings,
    },
  };
}
