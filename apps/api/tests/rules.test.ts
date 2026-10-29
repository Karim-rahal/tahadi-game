import { describe, expect, it } from "vitest";
import {
  DEFAULT_SETTINGS,
  advanceTurn,
  canPass,
  computeScoreDelta,
  isEliminated,
  matchWinner,
  ownerForTurnIndex,
  whoAmIPoints,
} from "@darundi/shared";

describe("scoring", () => {
  it("fastest awards difficulty points when correct", () => {
    expect(computeScoreDelta(DEFAULT_SETTINGS, { type: "FASTEST", difficulty: "EASY", correct: true })).toBe(1);
    expect(computeScoreDelta(DEFAULT_SETTINGS, { type: "FASTEST", difficulty: "MEDIUM", correct: true })).toBe(2);
    expect(computeScoreDelta(DEFAULT_SETTINGS, { type: "FASTEST", difficulty: "HARD", correct: true })).toBe(3);
  });

  it("fastest wrong gives zero by default (no penalty)", () => {
    expect(computeScoreDelta(DEFAULT_SETTINGS, { type: "FASTEST", difficulty: "HARD", correct: false })).toBe(0);
  });

  it("true/false awards only on correct", () => {
    expect(computeScoreDelta(DEFAULT_SETTINGS, { type: "TRUE_FALSE", difficulty: "MEDIUM", correct: true })).toBe(2);
    expect(computeScoreDelta(DEFAULT_SETTINGS, { type: "TRUE_FALSE", difficulty: "MEDIUM", correct: false })).toBe(0);
  });

  it("enumerate awards pointsPerAnswer per correct", () => {
    expect(computeScoreDelta(DEFAULT_SETTINGS, { type: "ENUMERATE", difficulty: "EASY", correct: true })).toBe(1);
  });
});

describe("who am I — points decrease with clues", () => {
  it("is highest on the first clue and floors at minPoints", () => {
    // HARD max is 5, penalty 1/clue, floor 1
    expect(whoAmIPoints(DEFAULT_SETTINGS, "HARD", 1)).toBe(5);
    expect(whoAmIPoints(DEFAULT_SETTINGS, "HARD", 2)).toBe(4);
    expect(whoAmIPoints(DEFAULT_SETTINGS, "HARD", 3)).toBe(3);
    expect(whoAmIPoints(DEFAULT_SETTINGS, "HARD", 10)).toBe(1); // floored
  });

  it("computeScoreDelta uses cluesRevealed for WHO_AM_I", () => {
    expect(computeScoreDelta(DEFAULT_SETTINGS, { type: "WHO_AM_I", difficulty: "EASY", correct: true, cluesRevealed: 1 })).toBe(3);
    expect(computeScoreDelta(DEFAULT_SETTINGS, { type: "WHO_AM_I", difficulty: "EASY", correct: true, cluesRevealed: 3 })).toBe(1);
  });
});

describe("turns", () => {
  it("alternates A<->B", () => {
    expect(advanceTurn("A")).toBe("B");
    expect(advanceTurn("B")).toBe("A");
  });

  it("assigns true/false ownership strictly alternating from the starting team", () => {
    expect(ownerForTurnIndex("A", 0)).toBe("A");
    expect(ownerForTurnIndex("A", 1)).toBe("B");
    expect(ownerForTurnIndex("A", 2)).toBe("A");
    expect(ownerForTurnIndex("B", 0)).toBe("B");
    expect(ownerForTurnIndex("B", 1)).toBe("A");
  });
});

describe("enumerate state", () => {
  it("eliminates a team at the strike limit", () => {
    expect(isEliminated(DEFAULT_SETTINGS, { strikes: 2, passesUsed: 0 })).toBe(false);
    expect(isEliminated(DEFAULT_SETTINGS, { strikes: 3, passesUsed: 0 })).toBe(true);
  });
  it("allows passes up to the configured limit", () => {
    expect(canPass(DEFAULT_SETTINGS, { strikes: 0, passesUsed: 0 })).toBe(true);
    expect(canPass(DEFAULT_SETTINGS, { strikes: 0, passesUsed: 1 })).toBe(false);
  });
});

describe("winner", () => {
  it("picks the higher score and detects ties", () => {
    expect(matchWinner(5, 3)).toBe("A");
    expect(matchWinner(2, 9)).toBe("B");
    expect(matchWinner(4, 4)).toBe("TIE");
  });
});
