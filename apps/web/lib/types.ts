import type { GameSettings, JudgeQuestionDto, QuestionType, Difficulty, TeamSide } from "@darundi/shared";

export type { GameSettings, JudgeQuestionDto, QuestionType, Difficulty, TeamSide };

export interface GameState {
  id: string;
  status: "SETUP" | "ACTIVE" | "PAUSED" | "FINISHED";
  startingTeam: TeamSide;
  teams: { A: { name: string; score: number }; B: { name: string; score: number } };
  currentIndex: number;
  totalQuestions: number;
  answeredCount: number;
  winner: TeamSide | null;
  isTie: boolean;
  tiebreaker: boolean;
  settings: GameSettings;
  canUndo: boolean;
  current: JudgeQuestionDto | null;
  progress: { order: number; type: QuestionType; difficulty: Difficulty; status: string }[];
}

export interface CreateGameResult {
  gameId: string;
  resumeToken: string;
  state: GameState;
}
