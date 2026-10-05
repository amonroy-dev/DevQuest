import { isCharacterAppearance, DEFAULT_CHARACTER, type CharacterAppearance } from "@/domain/character";
import { levelProgress, nextRank, rankForXp } from "@/domain/progression/progression";
import { prisma } from "@/server/db";

function appearance(character: {
  archetype: string;
  palette: string;
  silhouette: string;
  collar: string;
  accent: string;
}): CharacterAppearance {
  return isCharacterAppearance(character) ? character : DEFAULT_CHARACTER;
}

export async function getDashboard(playerId: string) {
  const player = await prisma.player.findUniqueOrThrow({
    where: { id: playerId },
    include: {
      character: true,
      skills: { include: { skill: true } },
      progress: { include: { challenge: { select: { slug: true } } } },
      achievements: { include: { achievement: true } },
    },
  });

  const challenges = await prisma.challenge.findMany({
    where: { published: true },
    include: {
      skills: true,
      level: { include: { world: true } },
    },
    orderBy: [{ level: { world: { order: "asc" } } }, { level: { order: "asc" } }],
  });

  const possible = new Map<string, number>();
  for (const challenge of challenges) {
    for (const link of challenge.skills) {
      possible.set(link.skillId, (possible.get(link.skillId) ?? 0) + challenge.xpBase * link.weight);
    }
  }

  const progressByChallenge = new Map(player.progress.map((row) => [row.challengeId, row]));
  const mission = challenges.find((challenge) => {
    const row = progressByChallenge.get(challenge.id);
    return row?.status !== "completed" && row?.status !== "mastered";
  });

  const skills = player.skills
    .slice()
    .sort((a, b) => a.skill.displayOrder - b.skill.displayOrder)
    .map((row) => {
      const cap = possible.get(row.skillId) ?? 0;
      const percent = cap === 0 ? 0 : Math.min(100, Math.round((row.xp / cap) * 100));
      return {
        slug: row.skill.slug,
        name: row.skill.name,
        description: row.skill.description,
        percent,
        earned: row.xp,
        possible: Math.round(cap),
      };
    });

  const withMissions = skills.filter((skill) => skill.possible > 0);
  const ranked = withMissions.slice().sort((a, b) => b.percent - a.percent);
  const strengths = ranked.filter((skill) => skill.percent > 0).slice(0, 2).map((skill) => skill.name);
  const weaknesses = withMissions
    .slice()
    .sort((a, b) => a.percent - b.percent)
    .slice(0, 2)
    .map((skill) => skill.name);

  const achievements = await prisma.achievement.findMany({ orderBy: { name: "asc" } });
  const unlocked = new Set(player.achievements.map((row) => row.achievementId));
  const progress = levelProgress(player.totalXp);
  const rank = rankForXp(player.totalXp);
  const upcoming = nextRank(player.totalXp);
  const playableWorlds = await prisma.world.count({ where: { status: "playable" } });
  const clearedWorldIds = new Set(
    challenges
      .filter((challenge) => {
        const row = progressByChallenge.get(challenge.id);
        return row?.status === "completed" || row?.status === "mastered";
      })
      .map((challenge) => challenge.level.worldId),
  );

  return {
    player: {
      displayName: player.displayName,
      level: progress.level,
      xp: player.totalXp,
      into: progress.into,
      span: progress.span,
      rankTitle: rank.title,
      rankLore: rank.lore,
      nextRankTitle: upcoming?.title ?? null,
      nextRankXp: upcoming?.minXp ?? null,
      streak: player.streakCount,
    },
    character: player.character ? appearance(player.character) : DEFAULT_CHARACTER,
    mission: mission
      ? {
          slug: mission.slug,
          title: mission.title,
          worldTitle: mission.level.world.title,
          whyItMatters: mission.whyItMatters,
          difficulty: mission.difficulty,
        }
      : null,
    skills,
    strengths,
    weaknesses,
    achievements: achievements.map((achievement) => ({
      slug: achievement.slug,
      name: achievement.name,
      description: achievement.description,
      unlocked: unlocked.has(achievement.id),
    })),
    playableWorlds,
    touchedWorlds: clearedWorldIds.size,
  };
}

export async function getWorldMap(playerId: string) {
  const worlds = await prisma.world.findMany({
    orderBy: { order: "asc" },
    include: {
      levels: {
        orderBy: { order: "asc" },
        include: { challenges: { where: { published: true } } },
      },
    },
  });
  const progress = await prisma.progress.findMany({ where: { playerId } });
  const byChallenge = new Map(progress.map((row) => [row.challengeId, row]));

  return worlds.map((world) => {
    const challenges = world.levels.flatMap((level) => level.challenges);
    const cleared = challenges.filter((challenge) => {
      const row = byChallenge.get(challenge.id);
      return row?.status === "completed" || row?.status === "mastered";
    }).length;
    return {
      slug: world.slug,
      title: world.title,
      summary: world.summary,
      status: world.status,
      order: world.order,
      cleared,
      total: challenges.length,
      levels: world.levels.map((level) => {
        const challenge = level.challenges[0];
        const row = challenge ? byChallenge.get(challenge.id) : undefined;
        const state =
          row?.status === "mastered" ? "mastered" : row?.status === "completed" ? "cleared" : "open";
        return {
          slug: level.slug,
          title: level.title,
          summary: level.summary,
          challengeSlug: challenge?.slug ?? null,
          difficulty: challenge?.difficulty ?? null,
          state,
        };
      }),
    };
  });
}

export async function getChallengeView(playerId: string, slug: string) {
  const challenge = await prisma.challenge.findUnique({
    where: { slug },
    include: { level: { include: { world: true } }, skills: { include: { skill: true } } },
  });
  if (!challenge?.published) return null;

  const latest = await prisma.attempt.findFirst({
    where: { playerId, challengeId: challenge.id },
    orderBy: { createdAt: "desc" },
  });
  const progress = await prisma.progress.findUnique({
    where: { playerId_challengeId: { playerId, challengeId: challenge.id } },
  });

  return { challenge, latest, progress };
}
