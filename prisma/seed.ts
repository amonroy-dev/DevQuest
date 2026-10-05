import bcrypt from "bcryptjs";
import { Prisma, PrismaClient } from "@prisma/client";
import { achievements } from "../content/achievements";
import { challenges } from "../content/challenges";
import { skills } from "../content/skills";
import { worlds } from "../content/worlds";
import { DEFAULT_CHARACTER } from "../src/domain/character";

const prisma = new PrismaClient();

function json(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

async function main() {
  for (const skill of skills) {
    await prisma.skill.upsert({
      where: { slug: skill.slug },
      update: {
        name: skill.name,
        description: skill.description,
        displayOrder: skill.displayOrder,
      },
      create: skill,
    });
  }

  for (const world of worlds) {
    const saved = await prisma.world.upsert({
      where: { slug: world.slug },
      update: {
        title: world.title,
        summary: world.summary,
        order: world.order,
        status: world.status,
      },
      create: {
        slug: world.slug,
        title: world.title,
        summary: world.summary,
        order: world.order,
        status: world.status,
      },
    });

    for (const level of world.levels) {
      await prisma.level.upsert({
        where: { slug: level.slug },
        update: {
          title: level.title,
          summary: level.summary,
          concept: level.concept,
          whyItMatters: level.whyItMatters,
          order: level.order,
          worldId: saved.id,
        },
        create: {
          slug: level.slug,
          title: level.title,
          summary: level.summary,
          concept: level.concept,
          whyItMatters: level.whyItMatters,
          order: level.order,
          worldId: saved.id,
        },
      });
    }
  }

  for (const challenge of challenges) {
    const level = await prisma.level.findUniqueOrThrow({ where: { slug: challenge.levelSlug } });
    const saved = await prisma.challenge.upsert({
      where: { slug: challenge.slug },
      update: {
        levelId: level.id,
        title: challenge.title,
        type: challenge.type,
        difficulty: challenge.difficulty,
        prompt: challenge.prompt,
        scenario: challenge.scenario,
        whyItMatters: challenge.whyItMatters,
        definition: json(challenge.definition),
        rubric: json(challenge.rubric),
        xpBase: challenge.xpBase,
        published: true,
      },
      create: {
        slug: challenge.slug,
        levelId: level.id,
        title: challenge.title,
        type: challenge.type,
        difficulty: challenge.difficulty,
        prompt: challenge.prompt,
        scenario: challenge.scenario,
        whyItMatters: challenge.whyItMatters,
        definition: json(challenge.definition),
        rubric: json(challenge.rubric),
        xpBase: challenge.xpBase,
      },
    });

    await prisma.challengeSkill.deleteMany({ where: { challengeId: saved.id } });
    for (const link of challenge.skills) {
      const skill = await prisma.skill.findUniqueOrThrow({ where: { slug: link.slug } });
      await prisma.challengeSkill.create({
        data: { challengeId: saved.id, skillId: skill.id, weight: link.weight },
      });
    }
  }

  for (const achievement of achievements) {
    await prisma.achievement.upsert({
      where: { slug: achievement.slug },
      update: {
        name: achievement.name,
        description: achievement.description,
        unlockRule: json(achievement.unlockRule),
      },
      create: {
        slug: achievement.slug,
        name: achievement.name,
        description: achievement.description,
        unlockRule: json(achievement.unlockRule),
      },
    });
  }

  const email = "ada@devquest.local";
  const existing = await prisma.user.findUnique({ where: { email } });
  if (!existing) {
    const passwordHash = await bcrypt.hash("devquest", 12);
    const allSkills = await prisma.skill.findMany();
    await prisma.user.create({
      data: {
        email,
        name: "Ada",
        passwordHash,
        player: {
          create: {
            displayName: "Ada",
            character: { create: DEFAULT_CHARACTER },
            skills: { create: allSkills.map((skill) => ({ skillId: skill.id, xp: 0 })) },
          },
        },
      },
    });
  }

  const players = await prisma.player.findMany({ select: { id: true } });
  const allSkills = await prisma.skill.findMany({ select: { id: true } });
  for (const player of players) {
    for (const skill of allSkills) {
      await prisma.playerSkill.upsert({
        where: { playerId_skillId: { playerId: player.id, skillId: skill.id } },
        update: {},
        create: { playerId: player.id, skillId: skill.id, xp: 0 },
      });
    }
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
