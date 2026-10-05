export function attemptXp(xpBase: number, overall: number): number {
  const percent = Math.min(100, Math.max(0, overall));
  return Math.round((xpBase * percent) / 100);
}

export function xpGrant(alreadyAwarded: number, thisAttemptXp: number): number {
  return Math.max(0, thisAttemptXp - alreadyAwarded);
}

export const MASTERY_SCORE = 90;
