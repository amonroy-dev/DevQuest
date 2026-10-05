import { redirect } from "next/navigation";
import { getSessionUser } from "@/server/auth/session";
import { getDashboard } from "@/server/services/catalog";

export default async function SkillsPage() {
  const user = await getSessionUser();
  if (!user?.player) redirect("/login");
  const data = await getDashboard(user.player.id);

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-4xl font-medium">Skills</h1>
      <p className="mt-3 text-sm leading-6 text-muted">
        Each bar is the XP you have earned in that skill divided by the XP the current missions can award. A skill with
        no missions yet stays at zero on purpose.
      </p>
      <ul className="mt-8 space-y-5">
        {data.skills.map((skill) => (
          <li key={skill.slug} className="rounded-2xl border border-line bg-raise p-4">
            <div className="flex items-baseline justify-between gap-3">
              <h2 className="text-lg">{skill.name}</h2>
              <span className="font-mono text-sm text-amber">{skill.possible ? `${skill.percent}%` : "No missions yet"}</span>
            </div>
            <p className="mt-1 text-sm text-muted">{skill.description}</p>
            <div className="mt-3 h-2 rounded-full bg-sunken">
              <div className="h-2 rounded-full bg-blue" style={{ width: `${skill.percent}%` }} />
            </div>
            {skill.possible ? (
              <p className="mt-2 font-mono text-xs text-muted">
                {skill.earned} / {skill.possible} XP
              </p>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}
