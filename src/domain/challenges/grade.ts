import { ZodError } from "zod";
import { scoreArchitecture, architectureAnswer, architectureDefinition, architectureRubric } from "@/domain/challenges/architecture";
import { scoreDebug, debugAnswer, debugDefinition, debugRubric } from "@/domain/challenges/debug";
import { scoreExplain, explainAnswer, explainDefinition, explainRubric } from "@/domain/challenges/explain";
import { scoreIncident, incidentAnswer, incidentDefinition, incidentRubric } from "@/domain/challenges/incident";
import { scoreSchema, schemaAnswer, schemaDefinition, schemaRubric } from "@/domain/challenges/schema";
import { scoreSequence, sequenceAnswer, sequenceDefinition, sequenceRubric } from "@/domain/challenges/sequence";
import type { Score } from "@/domain/challenges/types";

export function parsePublicDefinition(type: string, definition: unknown) {
  switch (type) {
    case "sequence":
      return { type, definition: sequenceDefinition.parse(definition) } as const;
    case "architecture":
      return { type, definition: architectureDefinition.parse(definition) } as const;
    case "schema":
      return { type, definition: schemaDefinition.parse(definition) } as const;
    case "debug":
      return { type, definition: debugDefinition.parse(definition) } as const;
    case "incident":
      return { type, definition: incidentDefinition.parse(definition) } as const;
    case "explain":
      return { type, definition: explainDefinition.parse(definition) } as const;
    default:
      throw new Error(`Unknown challenge type: ${type}`);
  }
}

export function grade(type: string, definition: unknown, rubric: unknown, answer: unknown): Score {
  switch (type) {
    case "sequence":
      return scoreSequence(
        sequenceDefinition.parse(definition),
        sequenceRubric.parse(rubric),
        sequenceAnswer.parse(answer),
      );
    case "architecture":
      return scoreArchitecture(
        architectureDefinition.parse(definition),
        architectureRubric.parse(rubric),
        architectureAnswer.parse(answer),
      );
    case "schema":
      return scoreSchema(schemaDefinition.parse(definition), schemaRubric.parse(rubric), schemaAnswer.parse(answer));
    case "debug":
      return scoreDebug(debugDefinition.parse(definition), debugRubric.parse(rubric), debugAnswer.parse(answer));
    case "incident":
      return scoreIncident(
        incidentDefinition.parse(definition),
        incidentRubric.parse(rubric),
        incidentAnswer.parse(answer),
      );
    case "explain":
      return scoreExplain(
        explainDefinition.parse(definition),
        explainRubric.parse(rubric),
        explainAnswer.parse(answer),
      );
    default:
      throw new Error(`Unknown challenge type: ${type}`);
  }
}

export function isAnswerError(error: unknown): error is ZodError {
  return error instanceof ZodError;
}
