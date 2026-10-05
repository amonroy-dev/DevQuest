import type { Prisma } from "@prisma/client";
import { isUnlocked, type UnlockRule } from "@/domain/progression/achievements";
import { levelForXp, rankForXp } from "@/domain/progression/progression";
import { nextStreak, utcDate } from "@/domain/progression/streak";
import { MASTERY_SCORE, attemptXp, xpGrant } from "@/domain/progression/xp";
import { grade, isAnswerError } from "@/domain/challenges/grade";
import type { AttemptView, Score } from "@/domain/challenges/types";
import { prisma } from "@/server/db";
import { logger } from "@/server/logger";

function asRule(value: Prisma.JsonValue): UnlockRule | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const rule = value as { type?: string; slug?: string; rankId?: string; count?: number };
  if (rule.type === "challenge_passed" && rule.slug) return { type: "challenge_passed", slug: rule.slug };
  if (rule.type === "rank" && rule.rankId) return { type: "rank", rankId: rule.rankId };
  if (rule.type === "streak" && typeof rule.count === "number") return { type: "streak", count: rule.count };
  return null;
}

export async function recordAttempt(userId: string, slug: string, rawAnswer: unknown) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { player: true },
  });
  if (!user?.player) {
    return { ok: false as const, error: "No player is attached to this account." };
  }

  const challenge = await prisma.challenge.findUnique({
    where: { slug },
    include: { skills: true },
  });
  if (!challenge?.published) {
    return { ok: false as const, error: "That mission is not available." };
  }

  let score: Score;
  try {
    score = grade(challenge.type, challenge.definition, challenge.rubric, rawAnswer);
  } catch (error) {
    if (isAnswerError(error)) {
      return { ok: false as const, error: "The answer was incomplete. Finish the mission, then submit it." };
    }
    throw error;
  }

  const player = user.player;
  const view = await prisma.$transaction(async (tx) => {
    const existing = await tx.progress.findUnique({
      where: { playerId_challengeId: { playerId: player.id, challengeId: challenge.id } },
    });
    const thisXp = attemptXp(challenge.xpBase, score.overall);
    const grant = xpGrant(existing?.xpAwarded ?? 0, thisXp);
    const bestScore = Math.max(existing?.bestScore ?? 0, score.overall);
    const alreadyCleared = existing?.status === "completed" || existing?.status === "mastered";
    const cleared = score.passed || alreadyCleared;
    const masteredNow = Boolean(existing?.masteredAt) || (score.passed && score.overall >= MASTERY_SCORE);
    const status = masteredNow ? "mastered" : cleared ? "completed" : "in_progress";
    const today = utcDate(new Date());
    const last = player.lastPlayedOn ? utcDate(player.lastPlayedOn) : null;
    const streak = nextStreak(player.streakCount, last, today);
    const totalXp = player.totalXp + grant;
    const level = levelForXp(totalXp);
    const rank = rankForXp(totalXp);

    await tx.attempt.create({
      data: {
        playerId: player.id,
        challengeId: challenge.id,
        answer: rawAnswer as Prisma.InputJsonValue,
        score: {
          ...score,
          xpGained: grant,
          totalXp,
          level,
          rankTitle: rank.title,
          mastered: masteredNow,
        },
        passed: score.passed,
      },
    });

    await tx.progress.upsert({
      where: { playerId_challengeId: { playerId: player.id, challengeId: challenge.id } },
      create: {
        playerId: player.id,
        challengeId: challenge.id,
        status,
        bestScore,
        attemptCount: 1,
        xpAwarded: grant,
        masteredAt: masteredNow ? new Date() : null,
      },
      update: {
        status,
        bestScore,
        attemptCount: { increment: 1 },
        xpAwarded: (existing?.xpAwarded ?? 0) + grant,
        masteredAt: masteredNow ? (existing?.masteredAt ?? new Date()) : null,
      },
    });

    if (grant > 0) {
      for (const link of challenge.skills) {
        await tx.playerSkill.update({
          where: { playerId_skillId: { playerId: player.id, skillId: link.skillId } },
          data: { xp: { increment: Math.round(grant * link.weight) } },
        });
      }
    }

    await tx.player.update({
      where: { id: player.id },
      data: {
        totalXp,
        level,
        rank: rank.id,
        streakCount: streak,
        lastPlayedOn: new Date(),
      },
    });

    const clearedRows = await tx.progress.findMany({
      where: { playerId: player.id, status: { in: ["completed", "mastered"] } },
      include: { challenge: { select: { slug: true } } },
    });
    const passedSlugs = new Set(clearedRows.map((row) => row.challenge.slug));
    const catalog = await tx.achievement.findMany();
    const owned = await tx.playerAchievement.findMany({
      where: { playerId: player.id },
      select: { achievementId: true },
    });
    const ownedIds = new Set(owned.map((row) => row.achievementId));

    for (const achievement of catalog) {
      if (ownedIds.has(achievement.id)) continue;
      const rule = asRule(achievement.unlockRule);
      if (!rule) continue;
      if (isUnlocked(rule, { passedSlugs, rankId: rank.id, streak })) {
        await tx.playerAchievement.create({
          data: { playerId: player.id, achievementId: achievement.id },
        });
      }
    }

    const attemptView: AttemptView = {
      ...score,
      xpGained: grant,
      totalXp,
      level,
      rankTitle: rank.title,
      mastered: masteredNow,
    };
    return attemptView;
  });

  logger.info("challenge_submitted", {
    userId,
    slug,
    passed: view.passed,
    overall: view.overall,
    xpGained: view.xpGained,
  });

  return { ok: true as const, data: view };
}
