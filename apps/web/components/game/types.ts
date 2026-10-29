import type { GameState, JudgeQuestionDto, TeamSide } from "@/lib/types";

export interface GameActions {
  answer: (team: TeamSide, correct: boolean, opts?: { cluesRevealed?: number; givenAnswer?: string }) => Promise<void>;
  revealClue: () => Promise<void>;
  enumerateAnswer: (team: TeamSide, opts: { acceptedAnswerId?: string; manualText?: string }) => Promise<void>;
  strike: (team: TeamSide) => Promise<void>;
  pass: (team: TeamSide) => Promise<void>;
  skip: () => Promise<void>;
  start: () => Promise<void>;
  next: () => Promise<void>;
  undo: () => Promise<void>;
  adjust: (team: TeamSide, delta: number) => Promise<void>;
  pause: () => Promise<void>;
  resume: () => Promise<void>;
  finish: () => Promise<void>;
  report: (reason: string) => Promise<void>;
}

export interface ModeProps {
  q: JudgeQuestionDto;
  state: GameState;
  actions: GameActions;
  busy: boolean;
}
