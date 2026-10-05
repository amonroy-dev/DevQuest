import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/server/auth/session";
import { getWorldMap } from "@/server/services/catalog";

export default async function WorldsPage() {
  const user = await getSessionUser();
  if (!user?.player) redirect("/login");
  const worlds = await getWorldMap(user.player.id);

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-4xl font-medium">Worlds</h1>
      <p className="mt-3 text-sm leading-6 text-muted">
        Ten regions. Six missions are playable. The rest of the map is the curriculum, not empty decoration.
      </p>
      <ol className="mt-8 space-y-4 border-l border-line pl-6">
        {worlds.map((world) => (
          <li key={world.slug} className="relative">
            <span className="absolute top-5 -left-[31px] h-3 w-3 rounded-full border border-amber bg-bg" />
            <article className="rounded-2xl border border-line bg-raise p-5">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h2 className="text-xl">
                  <span className="mr-2 font-mono text-sm text-amber">{String(world.order).padStart(2, "0")}</span>
                  {world.title}
                </h2>
                <span className="text-xs tracking-wide text-muted uppercase">
                  {world.status === "playable" ? `${world.cleared}/${world.total} cleared` : "Coming soon"}
                </span>
              </div>
              <p className="mt-2 text-sm leading-6 text-muted">{world.summary}</p>
              {world.levels.length > 0 ? (
                <ul className="mt-4 space-y-2">
                  {world.levels.map((level) => (
                    <li key={level.slug} className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-sunken px-3 py-2">
                      <div>
                        <p className="text-sm">{level.title}</p>
                        <p className="text-xs text-muted">{level.difficulty}</p>
                      </div>
                      {level.challengeSlug ? (
                        <Link href={`/play/${level.challengeSlug}`} className="text-sm text-amber">
                          {level.state === "open" ? "Play" : level.state === "mastered" ? "Mastered" : "Cleared"}
                        </Link>
                      ) : null}
                    </li>
                  ))}
                </ul>
              ) : null}
            </article>
          </li>
        ))}
      </ol>
    </div>
  );
}
