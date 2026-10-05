import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/server/auth/session";

export default async function HomePage() {
  const user = await getSessionUser();
  if (user) redirect("/dashboard");

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col justify-center px-6 py-16">
      <p className="font-mono text-xs tracking-[0.22em] text-amber uppercase">DevQuest</p>
      <h1 className="mt-4 text-5xl font-medium tracking-tight">From vibe coder to someone who can defend the system.</h1>
      <p className="mt-6 max-w-2xl text-lg leading-8 text-muted">
        A personal web app. Open it in your browser. Trace a request, design a login, model a database, find a
        leaked invoice, and stop a double charge. Your character, your rank, and your skill gaps stay on this machine.
      </p>
      <div className="mt-8 flex gap-3">
        <Link href="/login" className="rounded-lg bg-amber px-4 py-2 text-sm font-medium text-sunken">
          Enter
        </Link>
        <Link href="/signup" className="rounded-lg border border-line px-4 py-2 text-sm">
          Create an account
        </Link>
      </div>
    </main>
  );
}
