"use client";

export default function AppError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="mx-auto max-w-lg rounded-2xl border border-line bg-raise p-6">
      <h1 className="text-2xl">This page failed.</h1>
      <p className="mt-3 text-sm leading-6 text-muted">
        The failure was contained here. The rest of the app is still available from the sidebar.
      </p>
      <p className="mt-3 font-mono text-xs text-rose">{error.message}</p>
      <button type="button" onClick={reset} className="mt-4 rounded-lg bg-amber px-4 py-2 text-sm font-medium text-sunken">
        Try again
      </button>
    </div>
  );
}
