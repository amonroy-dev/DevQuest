"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { login, signup } from "@/server/actions/auth";

export function AuthForm({ mode, nextPath }: { mode: "login" | "signup"; nextPath?: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6">
      <p className="font-mono text-xs tracking-[0.22em] text-amber uppercase">DevQuest</p>
      <h1 className="mt-3 text-3xl font-medium">{mode === "login" ? "Sign in" : "Create your player"}</h1>
      <form
        className="mt-6 space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          const form = new FormData(event.currentTarget);
          const email = String(form.get("email") ?? "");
          const password = String(form.get("password") ?? "");
          const name = String(form.get("name") ?? "");
          setError(null);
          startTransition(async () => {
            const result =
              mode === "login"
                ? await login({ email, password, next: nextPath })
                : await signup({ name, email, password });
            if (!result.ok) {
              setError(result.error);
              return;
            }
            router.push(result.redirectTo);
            router.refresh();
          });
        }}
      >
        {mode === "signup" ? (
          <label className="block text-sm">
            Name
            <input name="name" required className="mt-1 w-full rounded-lg border border-line bg-sunken px-3 py-2" />
          </label>
        ) : null}
        <label className="block text-sm">
          Email
          <input name="email" type="email" required className="mt-1 w-full rounded-lg border border-line bg-sunken px-3 py-2" />
        </label>
        <label className="block text-sm">
          Password
          <input name="password" type="password" required className="mt-1 w-full rounded-lg border border-line bg-sunken px-3 py-2" />
        </label>
        {error ? <p className="text-sm text-danger">{error}</p> : null}
        <button type="submit" disabled={pending} className="rounded-lg bg-amber px-4 py-2 text-sm font-medium text-sunken disabled:opacity-50">
          {pending ? "Working…" : mode === "login" ? "Sign in" : "Create account"}
        </button>
      </form>
      {mode === "login" ? (
        <div className="mt-6 rounded-xl border border-line bg-raise p-4 text-sm text-muted">
          <p>Local account seeded for you:</p>
          <p className="mt-2 font-mono text-ink">ada@devquest.local</p>
          <p className="font-mono text-ink">devquest</p>
          <p className="mt-3">
            Or <Link href="/signup" className="text-amber">create your own</Link>.
          </p>
        </div>
      ) : (
        <p className="mt-4 text-sm text-muted">
          Already have an account? <Link href="/login" className="text-amber">Sign in</Link>
        </p>
      )}
    </main>
  );
}
