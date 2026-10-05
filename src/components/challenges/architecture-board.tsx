"use client";

import { useState } from "react";
import type { ArchitectureDefinition } from "@/domain/challenges/architecture";

const LANES = [
  { id: "client", label: "Client" },
  { id: "application", label: "Application" },
  { id: "data", label: "Data" },
] as const;

export function ArchitectureBoard({
  definition,
  initial,
  pending,
  onSubmit,
}: {
  definition: ArchitectureDefinition;
  initial: { nodes?: string[]; edges?: { from: string; to: string }[]; rationale?: string } | null;
  pending: boolean;
  onSubmit: (answer: { nodes: string[]; edges: { from: string; to: string }[]; rationale: string }) => void;
}) {
  const [nodes, setNodes] = useState<string[]>(initial?.nodes ?? []);
  const [edges, setEdges] = useState<{ from: string; to: string }[]>(initial?.edges ?? []);
  const [from, setFrom] = useState(initial?.nodes?.[0] ?? "");
  const [to, setTo] = useState("");
  const [rationale, setRationale] = useState(initial?.rationale ?? "");
  const labels = new Map(definition.nodes.map((node) => [node.id, node.label]));

  function toggle(id: string) {
    setNodes((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));
    setEdges((current) => current.filter((edge) => edge.from !== id && edge.to !== id));
  }

  function addEdge() {
    if (!from || !to || from === to) return;
    const key = `${from}->${to}`;
    setEdges((current) => (current.some((edge) => `${edge.from}->${edge.to}` === key) ? current : [...current, { from, to }]));
  }

  return (
    <form
      className="space-y-6"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit({ nodes, edges, rationale });
      }}
    >
      <div className="grid gap-4 lg:grid-cols-3">
        {LANES.map((lane) => (
          <div key={lane.id} className="rounded-xl border border-line bg-sunken p-3">
            <h3 className="text-xs tracking-wide text-muted uppercase">{lane.label}</h3>
            <ul className="mt-3 space-y-2">
              {definition.nodes
                .filter((node) => node.lane === lane.id)
                .map((node) => {
                  const on = nodes.includes(node.id);
                  return (
                    <li key={node.id}>
                      <button
                        type="button"
                        onClick={() => toggle(node.id)}
                        className={`w-full rounded-lg border px-3 py-2 text-left ${
                          on ? "border-amber bg-amber/10" : "border-line bg-raise"
                        }`}
                      >
                        <span className="block text-sm">{node.label}</span>
                        <span className="mt-1 block text-xs text-muted">{node.blurb}</span>
                      </button>
                    </li>
                  );
                })}
            </ul>
          </div>
        ))}
      </div>
      <div className="rounded-xl border border-line p-4">
        <h3 className="text-sm font-medium">Connections</h3>
        <div className="mt-3 flex flex-wrap items-end gap-2">
          <label className="text-xs text-muted">
            From
            <select className="mt-1 block rounded-lg border border-line bg-sunken px-2 py-2 text-sm" value={from} onChange={(event) => setFrom(event.target.value)}>
              <option value="">Select</option>
              {nodes.map((id) => (
                <option key={id} value={id}>
                  {labels.get(id)}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs text-muted">
            To
            <select className="mt-1 block rounded-lg border border-line bg-sunken px-2 py-2 text-sm" value={to} onChange={(event) => setTo(event.target.value)}>
              <option value="">Select</option>
              {nodes.map((id) => (
                <option key={id} value={id}>
                  {labels.get(id)}
                </option>
              ))}
            </select>
          </label>
          <button type="button" onClick={addEdge} className="rounded-lg border border-line px-3 py-2 text-sm">
            Connect
          </button>
        </div>
        <ul className="mt-3 space-y-1 text-sm">
          {edges.map((edge) => (
            <li key={`${edge.from}-${edge.to}`} className="flex items-center justify-between gap-3">
              <span>
                {labels.get(edge.from)} → {labels.get(edge.to)}
              </span>
              <button
                type="button"
                className="text-xs text-muted"
                onClick={() => setEdges((current) => current.filter((item) => item !== edge))}
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      </div>
      <label className="block text-sm">
        What does this design protect?
        <textarea
          className="mt-2 min-h-28 w-full rounded-xl border border-line bg-sunken p-3 text-sm"
          value={rationale}
          onChange={(event) => setRationale(event.target.value)}
          placeholder="Where does the password live, and what does the browser keep?"
        />
      </label>
      <button type="submit" disabled={pending} className="rounded-lg bg-amber px-4 py-2 text-sm font-medium text-sunken disabled:opacity-50">
        {pending ? "Scoring…" : "Submit the architecture"}
      </button>
    </form>
  );
}
