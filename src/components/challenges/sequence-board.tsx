"use client";

import { useState } from "react";
import type { SequenceDefinition } from "@/domain/challenges/sequence";

export function SequenceBoard({
  definition,
  initial,
  pending,
  onSubmit,
}: {
  definition: SequenceDefinition;
  initial: { order?: string[]; explanations?: Record<string, string> } | null;
  pending: boolean;
  onSubmit: (answer: { order: string[]; explanations: Record<string, string> }) => void;
}) {
  const [order, setOrder] = useState<string[]>(initial?.order ?? []);
  const [explanations, setExplanations] = useState<Record<string, string>>(initial?.explanations ?? {});
  const [dragging, setDragging] = useState<string | null>(null);
  const labels = new Map(definition.steps.map((step) => [step.id, step.label]));
  const remaining = definition.steps.filter((step) => !order.includes(step.id));

  function place(id: string, index: number) {
    setOrder((current) => {
      const without = current.filter((item) => item !== id);
      const next = [...without];
      next.splice(index, 0, id);
      return next;
    });
  }

  function move(id: string, direction: -1 | 1) {
    setOrder((current) => {
      const index = current.indexOf(id);
      const target = index + direction;
      if (index < 0 || target < 0 || target >= current.length) return current;
      const next = [...current];
      const [item] = next.splice(index, 1);
      next.splice(target, 0, item);
      return next;
    });
  }

  return (
    <form
      className="grid gap-6 lg:grid-cols-2"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit({ order, explanations });
      }}
    >
      <div>
        <h3 className="text-sm font-medium">Unordered steps</h3>
        <ul className="mt-3 space-y-2">
          {remaining.map((step) => (
            <li key={step.id}>
              <button
                type="button"
                draggable
                onDragStart={() => setDragging(step.id)}
                onClick={() => place(step.id, order.length)}
                className="w-full rounded-lg border border-line bg-sunken px-3 py-2 text-left text-sm hover:border-amber"
              >
                {step.label}
              </button>
            </li>
          ))}
          {remaining.length === 0 ? <li className="text-sm text-muted">Every step is on the path.</li> : null}
        </ul>
      </div>
      <div>
        <h3 className="text-sm font-medium">What actually happens</h3>
        <ol
          className="mt-3 space-y-2"
          onDragOver={(event) => event.preventDefault()}
          onDrop={(event) => {
            event.preventDefault();
            if (dragging) place(dragging, order.length);
            setDragging(null);
          }}
        >
          {order.map((id, index) => (
            <li key={id} className="rounded-lg border border-line bg-raise p-3">
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm">
                  <span className="mr-2 font-mono text-amber">{index + 1}</span>
                  {labels.get(id)}
                </p>
                <div className="flex gap-1">
                  <button type="button" className="rounded border border-line px-2 text-xs" onClick={() => move(id, -1)}>
                    Up
                  </button>
                  <button type="button" className="rounded border border-line px-2 text-xs" onClick={() => move(id, 1)}>
                    Down
                  </button>
                  <button
                    type="button"
                    className="rounded border border-line px-2 text-xs"
                    onClick={() => setOrder((current) => current.filter((item) => item !== id))}
                  >
                    Remove
                  </button>
                </div>
              </div>
              <label className="mt-2 block text-xs text-muted">
                What this step does
                <select
                  className="mt-1 w-full rounded-lg border border-line bg-sunken px-2 py-2 text-sm text-ink"
                  value={explanations[id] ?? ""}
                  onChange={(event) => setExplanations((current) => ({ ...current, [id]: event.target.value }))}
                >
                  <option value="">Choose an explanation</option>
                  {definition.explanations.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.text}
                    </option>
                  ))}
                </select>
              </label>
            </li>
          ))}
        </ol>
        <button
          type="submit"
          disabled={pending || order.length !== definition.steps.length}
          className="mt-4 rounded-lg bg-amber px-4 py-2 text-sm font-medium text-sunken disabled:opacity-50"
        >
          {pending ? "Scoring…" : "Submit the trace"}
        </button>
      </div>
    </form>
  );
}
