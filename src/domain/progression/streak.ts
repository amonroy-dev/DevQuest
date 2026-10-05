export function utcDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function previousUtcDate(isoDate: string): string {
  const date = new Date(`${isoDate}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() - 1);
  return date.toISOString().slice(0, 10);
}

export function nextStreak(count: number, lastPlayedOn: string | null, today: string): number {
  if (lastPlayedOn === today) return Math.max(count, 1);
  if (lastPlayedOn && lastPlayedOn === previousUtcDate(today)) return count + 1;
  return 1;
}
