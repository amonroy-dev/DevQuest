import Link from "next/link";
import { getSessionUser } from "@/server/auth/session";
import { getDashboard } from "@/server/services/catalog";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const user = await getSessionUser();
  if (!user?.player) redirect("/login");
  const data = await getDashboard(user.player.id);
  const xpWidth = data.player.span === 0 ? 0 : Math.round((data.player.into / data.player.span) * 100);

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <header>
        <p className="font-mono text-xs tracking-wide text-amber uppercase">{data.player.rankTitle}</p>
        <h1 className="mt-2 text-4xl font-medium">Level {data.player.level}</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">{data.player.rankLore}</p>
      </header>
      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-line bg-raise p-4 md:col-span-2">
          <div className="flex justify-between text-sm">
            <span>{data.player.xp} XP</span>
            <span className="text-muted">
              {data.player.nextRankTitle ? `${data.player.nextRankXp} XP to ${data.player.nextRankTitle}` : "Top rank"}
            </span>
          </div>
          <div className="mt-3 h-2 rounded-full bg-sunken">
            <div className="h-2 rounded-full bg-amber" style={{ width: `${xpWidth}%` }} />
          </div>
          <p className="mt-3 text-sm text-muted">Streak: {data.player.streak} day{data.player.streak === 1 ? "" : "s"}</p>
        </div>
        <div className="rounded-2xl border border-line bg-raise p-4">
          <p className="text-xs tracking-wide text-muted uppercase">Worlds touched</p>
          <p className="mt-2 text-3xl">{data.touchedWorlds}</p>
          <p className="text-sm text-muted">{data.playableWorlds} playable in this build</p>
        </div>
      </section>
      {data.mission ? (
        <section className="rounded-2xl border border-amber/40 bg-amber/5 p-5">
          <p className="text-xs tracking-wide text-amber uppercase">Current mission · {data.mission.worldTitle}</p>
          <h2 className="mt-2 text-2xl font-medium">{data.mission.title}</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">{data.mission.whyItMatters}</p>
          <Link href={`/play/${data.mission.slug}`} className="mt-4 inline-block rounded-lg bg-amber px-4 py-2 text-sm font-medium text-sunken">
            Open mission
          </Link>
        </section>
      ) : (
        <section className="rounded-2xl border border-line bg-raise p-5">
          <h2 className="text-xl">The current missions are cleared.</h2>
          <p className="mt-2 text-sm text-muted">The rest of the worlds are on the map, waiting for the next set.</p>
        </section>
      )}
      <section className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-line bg-raise p-5">
          <h2 className="text-sm font-medium">Strongest right now</h2>
          <p className="mt-2 text-sm text-muted">{data.strengths.length ? data.strengths.join(" · ") : "Clear a mission to reveal a strength."}</p>
        </div>
        <div className="rounded-2xl border border-line bg-raise p-5">
          <h2 className="text-sm font-medium">Where to focus</h2>
          <p className="mt-2 text-sm text-muted">{data.weaknesses.join(" · ")}</p>
        </div>
      </section>
      <section>
        <h2 className="text-sm font-medium">Skills</h2>
        <ul className="mt-3 space-y-3">
          {data.skills.map((skill) => (
            <li key={skill.slug}>
              <div className="flex justify-between text-sm">
                <span>{skill.name}</span>
                <span className="font-mono text-muted">{skill.possible ? `${skill.percent}%` : "later"}</span>
              </div>
              <div className="mt-1 h-1.5 rounded-full bg-sunken">
                <div className="h-1.5 rounded-full bg-blue" style={{ width: `${skill.percent}%` }} />
              </div>
            </li>
          ))}
        </ul>
      </section>
      <section>
        <h2 className="text-sm font-medium">Achievements</h2>
        <ul className="mt-3 grid gap-3 sm:grid-cols-2">
          {data.achievements.map((achievement) => (
            <li key={achievement.slug} className={`rounded-xl border p-4 ${achievement.unlocked ? "border-amber/50" : "border-line opacity-60"}`}>
              <p className="text-sm font-medium">{achievement.name}</p>
              <p className="mt-1 text-sm text-muted">{achievement.description}</p>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
