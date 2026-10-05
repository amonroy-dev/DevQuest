import { z } from "zod";
import { clampScore, type Finding, type Score } from "@/domain/challenges/types";

const edge = z.object({ from: z.string(), to: z.string() });

export const architectureDefinition = z.object({
  nodes: z.array(
    z.object({
      id: z.string(),
      label: z.string(),
      lane: z.enum(["client", "application", "data"]),
      blurb: z.string(),
    }),
  ),
});

export const architectureRubric = z.object({
  requiredNodeIds: z.array(z.string()),
  oneOfNodeSets: z.array(z.array(z.string())),
  requiredEdges: z.array(edge),
  conditionalEdges: z.array(z.object({ whenNode: z.string(), edges: z.array(edge) })),
  forbiddenEdges: z.array(
    edge.extend({
      principle: z.string(),
      productionImpact: z.string(),
      hint: z.string(),
    }),
  ),
  rationaleConcepts: z.array(z.object({ label: z.string(), phrases: z.array(z.string()) })),
  rationaleNeeded: z.number().int().positive(),
});

export const architectureAnswer = z.object({
  nodes: z.array(z.string()),
  edges: z.array(edge),
  rationale: z.string(),
});

export type ArchitectureDefinition = z.infer<typeof architectureDefinition>;
export type ArchitectureRubric = z.infer<typeof architectureRubric>;
export type ArchitectureAnswer = z.infer<typeof architectureAnswer>;

function edgeKey(from: string, to: string): string {
  return `${from}->${to}`;
}

export function scoreArchitecture(
  _definition: ArchitectureDefinition,
  rubric: ArchitectureRubric,
  answer: ArchitectureAnswer,
): Score {
  const selected = new Set(answer.nodes);
  const edges = new Set(answer.edges.map((item) => edgeKey(item.from, item.to)));
  const findings: Finding[] = [];

  const requiredHit = rubric.requiredNodeIds.filter((id) => selected.has(id)).length;
  const requiredRatio =
    rubric.requiredNodeIds.length === 0 ? 1 : requiredHit / rubric.requiredNodeIds.length;
  const oneOfHit =
    rubric.oneOfNodeSets.length === 0 ||
    rubric.oneOfNodeSets.some((set) => set.every((id) => selected.has(id)));

  if (!oneOfHit) {
    findings.push({
      principle: "A login has to leave the caller with something the server can check later.",
      productionImpact:
        "Without a session record or a signed token, every later request is anonymous. The password check was wasted.",
      hint: "Include a session store or a token issuer, and connect the login API to it.",
    });
  }

  const missingRequired = rubric.requiredNodeIds.filter((id) => !selected.has(id));
  if (missingRequired.length > 0) {
    findings.push({
      principle: "The login path needs a form, an API, a password check, and a user record.",
      productionImpact: `Missing: ${missingRequired.join(", ")}. The request has nowhere honest to go.`,
      hint: "Turn those pieces on before you draw arrows.",
    });
  }

  const expected = [
    ...rubric.requiredEdges,
    ...rubric.conditionalEdges.filter((item) => selected.has(item.whenNode)).flatMap((item) => item.edges),
  ];
  const edgeHits = expected.filter((item) => edges.has(edgeKey(item.from, item.to))).length;
  const edgeRatio = expected.length === 0 ? 1 : edgeHits / expected.length;
  if (edgeRatio < 1) {
    findings.push({
      principle: "A box that nothing calls is not part of the design.",
      productionImpact: "The password check, the user row, or the session never runs if the arrow is missing.",
      hint: "Connect the browser to the login API, and the API to the hasher, the database, and the session or token.",
    });
  }

  const forbidden = rubric.forbiddenEdges.filter((item) => edges.has(edgeKey(item.from, item.to)));
  for (const item of forbidden) {
    findings.push({
      principle: item.principle,
      productionImpact: item.productionImpact,
      hint: item.hint,
    });
  }

  const rationale = answer.rationale.toLowerCase();
  const conceptHits = rubric.rationaleConcepts.filter((concept) =>
    concept.phrases.some((phrase) => rationale.includes(phrase.toLowerCase())),
  );
  const reasoning = clampScore((conceptHits.length / rubric.rationaleNeeded) * 100);
  if (conceptHits.length < rubric.rationaleNeeded) {
    const missing = rubric.rationaleConcepts
      .filter((concept) => !conceptHits.includes(concept))
      .map((concept) => concept.label);
    findings.push({
      principle: "Say what this design is protecting.",
      productionImpact: "A diagram without a reason is how a later change deletes the hash or the cookie.",
      hint: `Mention: ${missing.join("; ")}.`,
    });
  }

  const architecture = clampScore((requiredRatio * 0.4 + (oneOfHit ? 0.3 : 0) + edgeRatio * 0.3) * 100);
  let security = 100;
  if (!selected.has("password_hasher")) security -= 40;
  security -= forbidden.length * 45;
  security = clampScore(security);

  const overall = clampScore((architecture + security + reasoning) / 3);
  const passed =
    requiredRatio === 1 &&
    oneOfHit &&
    edgeRatio === 1 &&
    forbidden.length === 0 &&
    selected.has("password_hasher") &&
    reasoning >= 50;

  const summary = passed
    ? "This login can be defended. The browser stays out of the database, and a later request has something to check."
    : "This login would not hold. The debrief names the decision that breaks it.";

  return {
    passed,
    overall,
    dimensions: { architecture, security, reasoning, correctness: architecture },
    feedback: { summary, findings },
  };
}
