"use client";

import { useState } from "react";
import type { IncidentDefinition } from "@/domain/challenges/incident";

export function IncidentBoard({
  definition,
  initial,
  pending,
  onSubmit,
}: {
  definition: IncidentDefinition;
  initial: { choices?: Record<string, string> } | null;
  pending: boolean;
  onSubmit: (answer: { choices: Record<string, string> }) => void;
}) {
  const [choices, setChoices] = useState<Record<string, string>>(initial?.choices ?? {});
  const ready = definition.stages.every((stage) => choices[stage.id]);

  return (
    <form
      className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit({ choices });
      }}
    >
      <div className="space-y-4">
        <section className="rounded-xl border border-line bg-sunken p-4">
          <h3 className="text-xs tracking-wide text-muted uppercase">Logs</h3>
          <ul className="mt-2 space-y-1 font-mono text-xs leading-5">
            {definition.logs.map((log) => (
              <li key={log}>{log}</li>
            ))}
          </ul>
        </section>
        <section className="rounded-xl border border-line bg-sunken p-4">
          <h3 className="text-xs tracking-wide text-muted uppercase">Handler</h3>
          <pre className="mt-2 overflow-auto font-mono text-xs leading-5 whitespace-pre-wrap">{definition.code}</pre>
        </section>
        <section className="rounded-xl border border-line bg-sunken p-4">
          <h3 className="text-xs tracking-wide text-muted uppercase">Notes</h3>
          <ul className="mt-2 list-disc space-y-1 pl-4 text-sm text-muted">
            {definition.notes.map((note) => (
              <li key={note}>{note}</li>
            ))}
          </ul>
        </section>
      </div>
      <div className="space-y-5">
        {definition.stages.map((stage, index) => (
          <fieldset key={stage.id}>
            <legend className="text-sm font-medium">
              {index + 1}. {stage.prompt}
            </legend>
            <div className="mt-2 space-y-2">
              {stage.options.map((option) => (
                <label key={option.id} className="flex gap-2 text-sm leading-6">
                  <input
                    type="radio"
                    name={stage.id}
                    checked={choices[stage.id] === option.id}
                    onChange={() => setChoices((current) => ({ ...current, [stage.id]: option.id }))}
                  />
                  {option.label}
                </label>
              ))}
            </div>
          </fieldset>
        ))}
        <button type="submit" disabled={pending || !ready} className="rounded-lg bg-amber px-4 py-2 text-sm font-medium text-sunken disabled:opacity-50">
          {pending ? "Scoring…" : "Close the incident"}
        </button>
      </div>
    </form>
  );
}
