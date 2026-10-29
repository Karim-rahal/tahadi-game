"use client";

/**
 * Non-sensitive local recovery hints only. The authoritative game state lives
 * in PostgreSQL; this just lets the device offer "resume" and re-claim a game.
 * Wrapped in try/catch so private mode / blocked storage never breaks the app.
 */
const KEY = "darundi.games.v1";

export interface GameHint {
  gameId: string;
  token: string;
  teamA: string;
  teamB: string;
  createdAt: string;
}

export function listGameHints(): GameHint[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as GameHint[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveGameHint(hint: GameHint): void {
  try {
    const list = listGameHints().filter((g) => g.gameId !== hint.gameId);
    list.unshift(hint);
    localStorage.setItem(KEY, JSON.stringify(list.slice(0, 25)));
  } catch {
    /* ignore */
  }
}

export function getGameToken(gameId: string): string | null {
  return listGameHints().find((g) => g.gameId === gameId)?.token ?? null;
}

export function removeGameHint(gameId: string): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(listGameHints().filter((g) => g.gameId !== gameId)));
  } catch {
    /* ignore */
  }
}
