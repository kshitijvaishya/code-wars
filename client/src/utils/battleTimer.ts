export function getRemainingBattleSeconds(endTime: string | null, now = Date.now()): number {
  if (!endTime) return 0;
  return Math.max(0, Math.ceil((new Date(endTime).getTime() - now) / 1000));
}
