"use client";

import { useState, useTransition } from "react";
import { ArchitectureBoard } from "@/components/challenges/architecture-board";
import { DebugBoard } from "@/components/challenges/debug-board";
import { Debrief } from "@/components/challenges/debrief";
import { ExplainBoard } from "@/components/challenges/explain-board";
import { IncidentBoard } from "@/components/challenges/incident-board";
import { SchemaBoard } from "@/components/challenges/schema-board";
import { SequenceBoard } from "@/components/challenges/sequence-board";
import type { ArchitectureDefinition } from "@/domain/challenges/architecture";
import type { DebugDefinition } from "@/domain/challenges/debug";
import type { ExplainDefinition } from "@/domain/challenges/explain";
import type { IncidentDefinition } from "@/domain/challenges/incident";
import type { SchemaDefinition } from "@/domain/challenges/schema";
import type { SequenceDefinition } from "@/domain/challenges/sequence";
import type { AttemptView } from "@/domain/challenges/types";
import { submitChallenge } from "@/server/actions/challenge";

type PlayerChallenge = {
  slug: string;
  title: string;
  type: "sequence" | "architecture" | "schema" | "debug" | "incident" | "explain";
  difficulty: string;
  prompt: string;
  scenario: string;
  whyItMatters: string;
  xpBase: number;
  worldTitle: string;
  definition:
    | SequenceDefinition
    | ArchitectureDefinition
    | SchemaDefinition
    | DebugDefinition
    | IncidentDefinition
    | ExplainDefinition;
};

export function ChallengePlayer({
  challenge,
  initialAnswer,
  initialView,
  attemptCount,
}: {
  challenge: PlayerChallenge;
  initialAnswer: unknown;
  initialView: AttemptView | null;
  attemptCount: number;
}) {
  const [view, setView] = useState<AttemptView | null>(initialView);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function submit(next: unknown) {
    setError(null);
    startTransition(async () => {
      const result = await submitChallenge(challenge.slug, next);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setView(result.data);
    });
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <header>
        <p className="font-mono text-xs tracking-wide text-amber uppercase">
          {challenge.worldTitle} · {challenge.difficulty} · {challenge.xpBase} XP
        </p>
        <h1 className="mt-2 text-3xl font-medium">{challenge.title}</h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-muted">{challenge.scenario}</p>
      </header>
      <section className="rounded-2xl border border-amber/30 bg-amber/5 p-4">
        <p className="text-xs tracking-wide text-amber uppercase">Why this matters</p>
        <p className="mt-2 text-sm leading-6">{challenge.whyItMatters}</p>
      </section>
      <p className="text-sm leading-6">{challenge.prompt}</p>
      {attemptCount > 0 ? <p className="text-xs text-muted">Attempts so far: {attemptCount}</p> : null}
      {error ? <p className="rounded-lg border border-danger/40 bg-danger/10 px-3 py-2 text-sm">{error}</p> : null}
      {view ? <Debrief view={view} /> : null}
      {challenge.type === "sequence" ? (
        <SequenceBoard
          definition={challenge.definition as SequenceDefinition}
          initial={initialAnswer as { order?: string[]; explanations?: Record<string, string> } | null}
          pending={pending}
          onSubmit={submit}
        />
      ) : null}
      {challenge.type === "architecture" ? (
        <ArchitectureBoard
          definition={challenge.definition as ArchitectureDefinition}
          initial={initialAnswer as { nodes?: string[]; edges?: { from: string; to: string }[]; rationale?: string } | null}
          pending={pending}
          onSubmit={submit}
        />
      ) : null}
      {challenge.type === "schema" ? (
        <SchemaBoard
          definition={challenge.definition as SchemaDefinition}
          initial={
            initialAnswer as {
              tables?: { name: string; columns: { name: string; type: string; pk: boolean; unique: boolean }[] }[];
              foreignKeys?: { fromTable: string; fromColumn: string; toTable: string; toColumn: string }[];
            } | null
          }
          pending={pending}
          onSubmit={submit}
        />
      ) : null}
      {challenge.type === "debug" ? (
        <DebugBoard
          definition={challenge.definition as DebugDefinition}
          initial={initialAnswer as { line?: number; causeId?: string; fixId?: string } | null}
          pending={pending}
          onSubmit={submit}
        />
      ) : null}
      {challenge.type === "incident" ? (
        <IncidentBoard
          definition={challenge.definition as IncidentDefinition}
          initial={initialAnswer as { choices?: Record<string, string> } | null}
          pending={pending}
          onSubmit={submit}
        />
      ) : null}
      {challenge.type === "explain" ? (
        <ExplainBoard
          definition={challenge.definition as ExplainDefinition}
          initial={initialAnswer as { text?: string } | null}
          pending={pending}
          onSubmit={submit}
        />
      ) : null}
    </div>
  );
}
