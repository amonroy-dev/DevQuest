"use client";

import { useState } from "react";
import type { DebugDefinition } from "@/domain/challenges/debug";

export function DebugBoard({
  definition,
  initial,
  pending,
  onSubmit,
}: {
  definition: DebugDefinition;
  initial: { line?: number; causeId?: string; fixId?: string } | null;
  pending: boolean;
  onSubmit: (answer: { line: number; causeId: string; fixId: string }) => void;
}) {
  const [line, setLine] = useState<number | null>(initial?.line ?? null);
  const [causeId, setCauseId] = useState(initial?.causeId ?? "");
  const [fixId, setFixId] = useState(initial?.fixId ?? "");

  return (
    <form
      className="space-y-6"
      onSubmit={(event) => {
        event.preventDefault();
        if (line === null) return;
        onSubmit({ line, causeId, fixId });
      }}
    >
      <div className="grid gap-4 lg:grid-cols-[1.4fr_0.8fr]">
        <div>
          <p className="text-xs tracking-wide text-muted uppercase">Handler</p>
          <ol className="mt-2 overflow-hidden rounded-xl border border-line bg-sunken font-mono text-sm">
            {definition.lines.map((item) => (
              <li key={item.n}>
                <button
                  type="button"
                  onClick={() => setLine(item.n)}
                  className={`flex w-full gap-3 px-3 py-1.5 text-left ${line === item.n ? "bg-amber/20" : "hover:bg-white/5"}`}
                >
                  <span className="w-6 text-muted">{item.n}</span>
                  <span>{item.text}</span>
                </button>
              </li>
            ))}
          </ol>
        </div>
        <div className="space-y-4 text-sm">
          <pre className="overflow-auto rounded-xl border border-line bg-sunken p-3 text-xs leading-5 whitespace-pre-wrap">{definition.request}</pre>
          <pre className="overflow-auto rounded-xl border border-line bg-sunken p-3 text-xs leading-5 whitespace-pre-wrap">{definition.response}</pre>
          <ul className="space-y-1 font-mono text-xs text-muted">
            {definition.logs.map((log) => (
              <li key={log}>{log}</li>
            ))}
          </ul>
        </div>
      </div>
      <fieldset>
        <legend className="text-sm font-medium">Cause</legend>
        <div className="mt-2 space-y-2">
          {definition.causeOptions.map((option) => (
            <label key={option.id} className="flex gap-2 text-sm">
              <input type="radio" name="cause" checked={causeId === option.id} onChange={() => setCauseId(option.id)} />
              {option.label}
            </label>
          ))}
        </div>
      </fieldset>
      <fieldset>
        <legend className="text-sm font-medium">Fix</legend>
        <div className="mt-2 space-y-2">
          {definition.fixOptions.map((option) => (
            <label key={option.id} className="flex gap-2 text-sm">
              <input type="radio" name="fix" checked={fixId === option.id} onChange={() => setFixId(option.id)} />
              {option.label}
            </label>
          ))}
        </div>
      </fieldset>
      <button
        type="submit"
        disabled={pending || line === null || !causeId || !fixId}
        className="rounded-lg bg-amber px-4 py-2 text-sm font-medium text-sunken disabled:opacity-50"
      >
        {pending ? "Scoring…" : "Submit the diagnosis"}
      </button>
    </form>
  );
}
