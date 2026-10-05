import { prisma } from "@/server/db";
import { DEFAULT_CHARACTER } from "@/domain/character";
import { hashPassword } from "@/server/auth/password";

export async function registerUser(input: { name: string; email: string; password: string }) {
  const email = input.email.trim().toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return { ok: false as const, error: "An account with that email already exists." };
  }

  const skills = await prisma.skill.findMany();
  const passwordHash = await hashPassword(input.password);
  const user = await prisma.user.create({
    data: {
      email,
      name: input.name.trim(),
      passwordHash,
      player: {
        create: {
          displayName: input.name.trim(),
          character: { create: DEFAULT_CHARACTER },
          skills: { create: skills.map((skill) => ({ skillId: skill.id, xp: 0 })) },
        },
      },
    },
  });

  return { ok: true as const, userId: user.id };
}
