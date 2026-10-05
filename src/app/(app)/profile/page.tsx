import { redirect } from "next/navigation";
import { CharacterEditor } from "@/components/character-editor";
import { DEFAULT_CHARACTER, isCharacterAppearance } from "@/domain/character";
import { rankForXp } from "@/domain/progression/progression";
import { getSessionUser } from "@/server/auth/session";

export default async function ProfilePage() {
  const user = await getSessionUser();
  if (!user?.player) redirect("/login");
  const rank = rankForXp(user.player.totalXp);
  const character = user.player.character && isCharacterAppearance(user.player.character)
    ? user.player.character
    : DEFAULT_CHARACTER;

  return <CharacterEditor displayName={user.player.displayName} rankTitle={rank.title} rankLore={rank.lore} initial={character} />;
}
