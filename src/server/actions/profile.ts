"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { ACCENTS, ARCHETYPES, COLLARS, PALETTES, SILHOUETTES } from "@/domain/character";
import { requireUser } from "@/server/auth/session";
import { prisma } from "@/server/db";

const appearance = z.object({
  displayName: z.string().trim().min(1).max(40),
  archetype: z.enum(ARCHETYPES.map((item) => item.id) as [string, ...string[]]),
  palette: z.enum(Object.keys(PALETTES) as [string, ...string[]]),
  silhouette: z.enum(SILHOUETTES.map((item) => item.id) as [string, ...string[]]),
  collar: z.enum(COLLARS.map((item) => item.id) as [string, ...string[]]),
  accent: z.enum(ACCENTS.map((item) => item.id) as [string, ...string[]]),
});

export async function saveProfile(input: z.infer<typeof appearance>) {
  const user = await requireUser();
  const parsed = appearance.safeParse(input);
  if (!parsed.success || !user.player) {
    return { ok: false as const, error: "Check the name and the portrait options, then save again." };
  }

  await prisma.player.update({
    where: { id: user.player.id },
    data: {
      displayName: parsed.data.displayName,
      character: {
        update: {
          archetype: parsed.data.archetype,
          palette: parsed.data.palette,
          silhouette: parsed.data.silhouette,
          collar: parsed.data.collar,
          accent: parsed.data.accent,
        },
      },
    },
  });

  revalidatePath("/dashboard");
  revalidatePath("/profile");
  return { ok: true as const };
}
