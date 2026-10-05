import { redirect } from "next/navigation";
import { Shell } from "@/components/shell";
import { isCharacterAppearance, DEFAULT_CHARACTER } from "@/domain/character";
import { rankForXp } from "@/domain/progression/progression";
import { getSessionUser } from "@/server/auth/session";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();
  if (!user?.player) redirect("/login");
  const character = user.player.character && isCharacterAppearance(user.player.character)
    ? user.player.character
    : DEFAULT_CHARACTER;

  return (
    <Shell displayName={user.player.displayName} rankTitle={rankForXp(user.player.totalXp).title} character={character}>
      {children}
    </Shell>
  );
}
