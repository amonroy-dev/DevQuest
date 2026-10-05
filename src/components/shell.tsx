import { logout } from "@/server/actions/auth";
import type { CharacterAppearance } from "@/domain/character";
import { CharacterPortrait } from "@/components/character-portrait";
import { SideNav } from "@/components/side-nav";

export function Shell({
  children,
  displayName,
  rankTitle,
  character,
}: {
  children: React.ReactNode;
  displayName: string;
  rankTitle: string;
  character: CharacterAppearance;
}) {
  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[260px_1fr]">
      <aside className="border-b border-line bg-sunken/80 px-5 py-5 lg:border-r lg:border-b-0">
        <a href="/dashboard" className="block">
          <p className="font-mono text-xs tracking-[0.22em] text-amber uppercase">DevQuest</p>
          <p className="mt-1 text-sm text-muted">Personal training ground</p>
        </a>
        <div className="mt-5 flex items-center gap-3">
          <CharacterPortrait character={character} size={72} />
          <div>
            <p className="font-medium">{displayName}</p>
            <p className="text-sm text-amber">{rankTitle}</p>
          </div>
        </div>
        <div className="mt-5">
          <SideNav />
        </div>
        <form action={logout} className="mt-6">
          <button className="text-sm text-muted hover:text-ink" type="submit">
            Log out
          </button>
        </form>
      </aside>
      <main className="px-5 py-8 lg:px-10">{children}</main>
    </div>
  );
}
