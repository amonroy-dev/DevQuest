"use client";

import { useState } from "react";
import type { ExplainDefinition } from "@/domain/challenges/explain";

export function ExplainBoard({
  definition,
  initial,
  pending,
  onSubmit,
}: {
  definition: ExplainDefinition;
  initial: { text?: string } | null;
  pending: boolean;
  onSubmit: (answer: { text: string }) => void;
}) {
  const [text, setText] = useState(initial?.text ?? "");
  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit({ text });
      }}
    >
      <pre className="overflow-auto rounded-xl border border-line bg-sunken p-4 font-mono text-sm leading-6 whitespace-pre-wrap">
        {definition.architecture}
      </pre>
      <ol className="list-decimal space-y-1 pl-5 text-sm text-muted">
        {definition.prompts.map((prompt) => (
          <li key={prompt}>{prompt}</li>
        ))}
      </ol>
      <textarea
        className="min-h-56 w-full rounded-xl border border-line bg-sunken p-4 text-sm leading-6"
        value={text}
        onChange={(event) => setText(event.target.value)}
        placeholder="Write the explanation you would say out loud."
      />
      <button
        type="submit"
        disabled={pending || text.trim().length < 40}
        className="rounded-lg bg-amber px-4 py-2 text-sm font-medium text-sunken disabled:opacity-50"
      >
        {pending ? "Reading…" : "Send it to the senior"}
      </button>
    </form>
  );
}
