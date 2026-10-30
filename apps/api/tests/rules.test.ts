import { describe, expect, it } from "vitest";
import {
  ENUM_PASSES_PER_TEAM,
  ENUM_STRIKES_PER_TEAM,
  POINTS_PER_QUESTION,
  advanceTurn,
  computeAnswerPoints,
  matchWinner,
  ownerForTurnIndex,
  resolveEnumeration,
  type EnumTeamState,
} from "@darundi/shared";

const s = (strikes: number, passesUsed = 0): EnumTeamState => ({ strikes, passesUsed });

describe("universal scoring — every question is worth exactly one point", () => {
  it("awards exactly one point on a correct answer regardless of difficulty", () => {
    // Difficulty is not even a parameter anymore — the value is always 1.
    expect(computeAnswerPoints(true)).toBe(1);
    expect(POINTS_PER_QUESTION).toBe(1);
  });

  it("awards zero on an incorrect answer (no penalties)", () => {
    expect(computeAnswerPoints(false)).toBe(0);
  });
});

describe("fixed enumeration limits", () => {
  it("is three strikes and one pass per team", () => {
    expect(ENUM_STRIKES_PER_TEAM).toBe(3);
    expect(ENUM_PASSES_PER_TEAM).toBe(1);
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

describe("enumeration winner — Rule A: three strikes ends immediately", () => {
  it("Team A reaching 3 strikes → Team B wins", () => {
    const r = resolveEnumeration(s(3), s(0), false);
    expect(r).toEqual({ resolved: true, winner: "B", reason: "THREE_STRIKES_A" });
  });

  it("Team B reaching 3 strikes → Team A wins", () => {
    const r = resolveEnumeration(s(1), s(3), false);
    expect(r).toEqual({ resolved: true, winner: "A", reason: "THREE_STRIKES_B" });
  });

  it("three strikes wins even before the answer list is exhausted", () => {
    expect(resolveEnumeration(s(3, 1), s(2, 0), false).winner).toBe("B");
  });
});

describe("enumeration winner — Rule B: all answers completed", () => {
  it("does not resolve while answers remain and nobody has 3 strikes", () => {
    expect(resolveEnumeration(s(1), s(2), false)).toEqual({ resolved: false, winner: null, reason: null });
  });

  it("fewer strikes wins (A)", () => {
    expect(resolveEnumeration(s(1), s(2), true)).toEqual({ resolved: true, winner: "A", reason: "FEWER_STRIKES_A" });
  });

  it("fewer strikes wins (B)", () => {
    expect(resolveEnumeration(s(2), s(0), true)).toEqual({ resolved: true, winner: "B", reason: "FEWER_STRIKES_B" });
  });

  it("equal strikes → the team that did NOT use its pass wins (A unused, B used)", () => {
    expect(resolveEnumeration(s(1, 0), s(1, 1), true)).toEqual({ resolved: true, winner: "A", reason: "UNUSED_PASS_A" });
  });

  it("equal strikes → the team that did NOT use its pass wins (B unused, A used)", () => {
    expect(resolveEnumeration(s(1, 1), s(1, 0), true)).toEqual({ resolved: true, winner: "B", reason: "UNUSED_PASS_B" });
  });

  it("equal strikes and BOTH used their pass → tie, no point", () => {
    expect(resolveEnumeration(s(2, 1), s(2, 1), true)).toEqual({ resolved: true, winner: null, reason: "TIE" });
  });

  it("equal strikes and NEITHER used their pass → tie, no point", () => {
    expect(resolveEnumeration(s(0, 0), s(0, 0), true)).toEqual({ resolved: true, winner: null, reason: "TIE" });
  });

  it("completing all answers always resolves the question", () => {
    expect(resolveEnumeration(s(0), s(0), true).resolved).toBe(true);
  });
});

describe("match winner", () => {
  it("picks the higher score and detects ties", () => {
    expect(matchWinner(5, 3)).toBe("A");
    expect(matchWinner(2, 9)).toBe("B");
    expect(matchWinner(4, 4)).toBe("TIE");
  });
});
