import type { AttemptView } from "@/domain/challenges/types";

const LABELS: Record<string, string> = {
  correctness: "Correctness",
  reasoning: "Reasoning",
  architecture: "Architecture",
  security: "Security",
  reliability: "Reliability",
  maintainability: "Maintainability",
  performance: "Performance",
};

export function Debrief({ view }: { view: AttemptView }) {
  return (
    <section className="rounded-2xl border border-line bg-raise p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h2 className="text-lg font-medium">{view.passed ? "Cleared" : "Not cleared"}</h2>
        <p className="font-mono text-sm text-amber">
          {view.overall}% · +{view.xpGained} XP · {view.rankTitle}
        </p>
      </div>
      <p className="mt-2 text-sm leading-6 text-muted">{view.feedback.summary}</p>
      {view.mastered ? <p className="mt-2 text-sm text-green">Mastered. Your best score is high enough to keep.</p> : null}
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {Object.entries(view.dimensions).map(([key, value]) => (
          <div key={key}>
            <div className="mb-1 flex justify-between text-xs text-muted">
              <span>{LABELS[key] ?? key}</span>
              <span className="font-mono">{value}</span>
            </div>
            <div className="h-1.5 rounded-full bg-sunken">
              <div className="h-1.5 rounded-full bg-blue" style={{ width: `${value}%` }} />
            </div>
          </div>
        ))}
      </div>
      {view.feedback.findings.length > 0 ? (
        <ul className="mt-5 space-y-3">
          {view.feedback.findings.map((finding) => (
            <li key={finding.principle} className="rounded-xl border border-line bg-sunken p-4">
              <p className="text-sm font-medium">{finding.principle}</p>
              <p className="mt-2 text-sm leading-6 text-rose">{finding.productionImpact}</p>
              <p className="mt-2 text-sm leading-6 text-muted">{finding.hint}</p>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
