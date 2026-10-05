import { notFound, redirect } from "next/navigation";
import { ChallengePlayer } from "@/components/challenges/challenge-player";
import { parsePublicDefinition } from "@/domain/challenges/grade";
import type { AttemptView } from "@/domain/challenges/types";
import { getSessionUser } from "@/server/auth/session";
import { getChallengeView } from "@/server/services/catalog";

function asView(value: unknown): AttemptView | null {
  if (!value || typeof value !== "object") return null;
  const view = value as AttemptView;
  if (typeof view.passed !== "boolean" || typeof view.overall !== "number" || !view.feedback) return null;
  return view;
}

export default async function PlayPage({ params }: { params: Promise<{ slug: string }> }) {
  const user = await getSessionUser();
  if (!user?.player) redirect("/login");
  const { slug } = await params;
  const view = await getChallengeView(user.player.id, slug);
  if (!view) notFound();

  let parsed: ReturnType<typeof parsePublicDefinition>;
  try {
    parsed = parsePublicDefinition(view.challenge.type, view.challenge.definition);
  } catch {
    return (
      <p className="text-sm text-danger">
        This mission&apos;s public definition failed validation. The rubric stayed on the server. Re-seed the database.
      </p>
    );
  }

  return (
    <ChallengePlayer
      challenge={{
        slug: view.challenge.slug,
        title: view.challenge.title,
        type: parsed.type,
        difficulty: view.challenge.difficulty,
        prompt: view.challenge.prompt,
        scenario: view.challenge.scenario,
        whyItMatters: view.challenge.whyItMatters,
        xpBase: view.challenge.xpBase,
        worldTitle: view.challenge.level.world.title,
        definition: parsed.definition,
      }}
      initialAnswer={view.latest?.answer ?? null}
      initialView={asView(view.latest?.score)}
      attemptCount={view.progress?.attemptCount ?? 0}
    />
  );
}
