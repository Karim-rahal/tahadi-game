import { Prisma } from "@prisma/client";
import {
  type GameSettings,
  type JudgeQuestionDto,
  type MatchSelection,
  type TeamSide,
  computeScoreDelta,
  matchWinner,
  otherTeam,
  whoAmIPoints,
  fastestPoints,
  trueFalsePoints,
  enumerateAnswerPoints,
  withSettingsDefaults,
} from "@darundi/shared";
import { prisma } from "../db";
import { badRequest, conflict, notFound } from "../lib/http";

type Tx = Prisma.TransactionClient;

/** Generic, interpretable inverse for undo. */
interface Inverse {
  createdScoreEvents?: { id: string; team: TeamSide; delta: number }[];
  deleteAttemptIds?: string[];
  deleteUsedAnswerIds?: string[];
  deleteStrikeIds?: string[];
  deletePassIds?: string[];
  gameQuestionRestore?: {
    id: string;
    status?: string;
    answeredCorrect?: boolean | null;
    answeredByTeam?: TeamSide | null;
    pointsAwarded?: number;
    cluesRevealed?: number;
    enumState?: unknown;
    enumActiveTeam?: TeamSide | null;
  };
  gameRestore?: { currentIndex?: number; status?: string };
}

async function nextSeq(tx: Tx, gameId: string): Promise<number> {
  const last = await tx.gameActionHistory.findFirst({
    where: { gameId },
    orderBy: { seq: "desc" },
    select: { seq: true },
  });
  return (last?.seq ?? 0) + 1;
}

async function recordHistory(
  tx: Tx,
  gameId: string,
  actionType: string,
  summary: string,
  payload: unknown,
  inverse: Inverse,
): Promise<void> {
  const seq = await nextSeq(tx, gameId);
  await tx.gameActionHistory.create({
    data: {
      gameId,
      seq,
      actionType,
      summary,
      payload: (payload ?? {}) as Prisma.InputJsonValue,
      inverse: inverse as unknown as Prisma.InputJsonValue,
    },
  });
}

/** Apply a score change and return the created ScoreEvent id. */
async function applyScore(
  tx: Tx,
  gameId: string,
  team: TeamSide,
  delta: number,
  reason: string,
  gameQuestionId?: string,
): Promise<{ id: string; team: TeamSide; delta: number }> {
  const ev = await tx.scoreEvent.create({
    data: { gameId, team, delta, reason, gameQuestionId },
  });
  await tx.team.update({
    where: { gameId_side: { gameId, side: team } },
    data: { score: { increment: delta } },
  });
  return { id: ev.id, team, delta };
}

/** Idempotency guard: returns true if this key was already processed. */
async function alreadyProcessed(
  tx: Tx,
  gameId: string,
  key: string | undefined,
  actionType: string,
): Promise<boolean> {
  if (!key) return false;
  try {
    await tx.idempotencyKey.create({ data: { gameId, key, actionType } });
    return false;
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") return true;
    throw e;
  }
}

/** Initialize per-type state when a question becomes active. */
async function activateQuestion(
  tx: Tx,
  gameId: string,
  gameQuestionId: string,
  type: string,
  startingTeam: TeamSide,
): Promise<void> {
  const data: Prisma.GameQuestionUpdateInput = { status: "ACTIVE", startedAt: new Date() };
  if (type === "WHO_AM_I") data.cluesRevealed = 1;
  if (type === "ENUMERATE") {
    data.enumState = { A: { strikes: 0, passesUsed: 0 }, B: { strikes: 0, passesUsed: 0 } };
    data.enumActiveTeam = startingTeam;
  }
  await tx.gameQuestion.update({ where: { id: gameQuestionId }, data });
}

type EnumState = Record<TeamSide, { strikes: number; passesUsed: number }>;
function readEnumState(raw: unknown): EnumState {
  const def: EnumState = { A: { strikes: 0, passesUsed: 0 }, B: { strikes: 0, passesUsed: 0 } };
  if (raw && typeof raw === "object") {
    const r = raw as Partial<EnumState>;
    return {
      A: { strikes: r.A?.strikes ?? 0, passesUsed: r.A?.passesUsed ?? 0 },
      B: { strikes: r.B?.strikes ?? 0, passesUsed: r.B?.passesUsed ?? 0 },
    };
  }
  return def;
}

// ───────────────────────── Public engine API ─────────────────────────

export async function createGame(input: {
  teamAName: string;
  teamBName: string;
  selection: MatchSelection;
  settings: GameSettings;
  tokenHash: string;
}): Promise<string> {
  const { buildMatchPlan } = await import("./selection");
  const startingTeam = input.settings.startingTeam;
  const plan = await buildMatchPlan(input.selection, startingTeam);
  if (plan.length === 0) {
    throw badRequest("لا توجد أسئلة مطابقة للإعدادات المختارة");
  }

  const game = await prisma.gameSession.create({
    data: {
      status: "SETUP",
      tokenHash: input.tokenHash,
      settings: input.settings as unknown as Prisma.InputJsonValue,
      selection: input.selection as unknown as Prisma.InputJsonValue,
      startingTeam,
      currentIndex: 0,
      teams: {
        create: [
          { side: "A", name: input.teamAName },
          { side: "B", name: input.teamBName },
        ],
      },
      questions: {
        create: plan.map((p) => ({
          questionId: p.questionId,
          order: p.order,
          ownerTeam: p.ownerTeam ?? undefined,
          status: "PENDING",
        })),
      },
    },
  });
  return game.id;
}

export async function startGame(gameId: string): Promise<GameStateDto> {
  const game = await prisma.gameSession.findUniqueOrThrow({ where: { id: gameId } });
  if (game.status === "FINISHED") throw conflict("انتهت اللعبة");
  if (game.status === "ACTIVE") return getState(gameId);

  const first = await prisma.gameQuestion.findFirst({
    where: { gameId, status: "PENDING" },
    orderBy: { order: "asc" },
    include: { question: true },
  });
  await prisma.$transaction(async (tx) => {
    await tx.gameSession.update({
      where: { id: gameId },
      data: { status: "ACTIVE", currentIndex: first?.order ?? 0 },
    });
    if (first) {
      await activateQuestion(tx, gameId, first.id, first.question.type, game.startingTeam as TeamSide);
    }
  });
  return getState(gameId);
}

async function loadGameOrThrow(gameId: string) {
  const game = await prisma.gameSession.findUnique({
    where: { id: gameId },
    include: { teams: true },
  });
  if (!game) throw notFound("اللعبة غير موجودة");
  return game;
}

async function currentGameQuestion(gameId: string, currentIndex: number) {
  return prisma.gameQuestion.findFirst({
    where: { gameId, order: currentIndex },
    include: { question: { include: { clues: true, acceptedAnswers: true, category: true } }, usedAnswers: true },
  });
}

export async function nextQuestion(gameId: string, idempotencyKey?: string): Promise<GameStateDto> {
  const game = await loadGameOrThrow(gameId);
  if (game.status !== "ACTIVE") throw conflict("اللعبة ليست نشطة");

  await prisma.$transaction(async (tx) => {
    if (await alreadyProcessed(tx, gameId, idempotencyKey, "next")) return;
    const next = await tx.gameQuestion.findFirst({
      where: { gameId, status: "PENDING", order: { gt: game.currentIndex } },
      orderBy: { order: "asc" },
      include: { question: true },
    });
    if (!next) {
      // No more questions — leave pointer; caller may finish the game.
      return;
    }
    const prevIndex = game.currentIndex;
    await tx.gameSession.update({ where: { id: gameId }, data: { currentIndex: next.order } });
    await activeOrReactivate(tx, gameId, next.id, next.question.type, game.startingTeam as TeamSide);
    await recordHistory(tx, gameId, "next", `الانتقال إلى السؤال ${next.order + 1}`, { to: next.order }, {
      gameRestore: { currentIndex: prevIndex },
      gameQuestionRestore: { id: next.id, status: "PENDING" },
    });
  });
  return getState(gameId);
}

async function activeOrReactivate(
  tx: Tx,
  gameId: string,
  gameQuestionId: string,
  type: string,
  startingTeam: TeamSide,
): Promise<void> {
  await activateQuestion(tx, gameId, gameQuestionId, type, startingTeam);
}

export async function answerQuestion(
  gameId: string,
  input: { team: TeamSide; correct: boolean; cluesRevealed?: number; givenAnswer?: string; idempotencyKey?: string },
): Promise<GameStateDto> {
  const game = await loadGameOrThrow(gameId);
  if (game.status !== "ACTIVE") throw conflict("اللعبة ليست نشطة");
  const settings = withSettingsDefaults(game.settings);

  await prisma.$transaction(async (tx) => {
    if (await alreadyProcessed(tx, gameId, input.idempotencyKey, "answer")) return;
    const gq = await tx.gameQuestion.findFirst({
      where: { gameId, order: game.currentIndex },
      include: { question: true },
    });
    if (!gq) throw notFound("لا يوجد سؤال حالي");
    if (gq.status === "ANSWERED") throw conflict("تمت الإجابة على هذا السؤال");
    const type = gq.question.type;
    if (type === "ENUMERATE") throw badRequest("استخدم مسار «عدّد الإجابات» لهذا النوع");

    // Strict turn ownership for true/false.
    if (type === "TRUE_FALSE" && gq.ownerTeam && gq.ownerTeam !== input.team && !settings.trueFalse.allowSteal) {
      throw badRequest("هذا السؤال مخصّص للفريق صاحب الدور فقط");
    }

    const cluesRevealed = type === "WHO_AM_I" ? gq.cluesRevealed : undefined;
    const delta = computeScoreDelta(settings, {
      type: type as JudgeQuestionDto["type"],
      difficulty: gq.question.difficulty as never,
      correct: input.correct,
      cluesRevealed,
    });

    const attempt = await tx.answerAttempt.create({
      data: {
        gameQuestionId: gq.id,
        team: input.team,
        correct: input.correct,
        cluesRevealedAtAttempt: cluesRevealed,
        givenAnswer: input.givenAnswer,
      },
    });

    const created: Inverse["createdScoreEvents"] = [];
    if (delta !== 0) {
      created.push(await applyScore(tx, gameId, input.team, delta, `answer:${type}`, gq.id));
    }

    await tx.gameQuestion.update({
      where: { id: gq.id },
      data: {
        status: "ANSWERED",
        answeredCorrect: input.correct,
        answeredByTeam: input.team,
        pointsAwarded: delta,
        endedAt: new Date(),
      },
    });

    await recordHistory(
      tx,
      gameId,
      "answer",
      `${input.correct ? "إجابة صحيحة" : "إجابة خاطئة"} للفريق ${input.team}`,
      { team: input.team, correct: input.correct, delta },
      {
        createdScoreEvents: created,
        deleteAttemptIds: [attempt.id],
        gameQuestionRestore: {
          id: gq.id,
          status: "ACTIVE",
          answeredCorrect: null,
          answeredByTeam: null,
          pointsAwarded: 0,
        },
      },
    );
  });
  return getState(gameId);
}

export async function revealClue(gameId: string, idempotencyKey?: string): Promise<GameStateDto> {
  const game = await loadGameOrThrow(gameId);
  if (game.status !== "ACTIVE") throw conflict("اللعبة ليست نشطة");
  await prisma.$transaction(async (tx) => {
    if (await alreadyProcessed(tx, gameId, idempotencyKey, "clue")) return;
    const gq = await tx.gameQuestion.findFirst({
      where: { gameId, order: game.currentIndex },
      include: { question: { include: { clues: true } } },
    });
    if (!gq) throw notFound("لا يوجد سؤال حالي");
    if (gq.question.type !== "WHO_AM_I") throw badRequest("التلميحات متاحة في «من أنا؟» فقط");
    const total = gq.question.clues.length;
    if (gq.cluesRevealed >= total) throw conflict("لا توجد تلميحات إضافية");
    const prev = gq.cluesRevealed;
    await tx.gameQuestion.update({ where: { id: gq.id }, data: { cluesRevealed: prev + 1 } });
    await recordHistory(tx, gameId, "clue", `كشف التلميح ${prev + 1}`, { to: prev + 1 }, {
      gameQuestionRestore: { id: gq.id, cluesRevealed: prev },
    });
  });
  return getState(gameId);
}

export async function enumerateAnswer(
  gameId: string,
  input: { team: TeamSide; acceptedAnswerId?: string; manualText?: string; idempotencyKey?: string },
): Promise<GameStateDto> {
  const game = await loadGameOrThrow(gameId);
  if (game.status !== "ACTIVE") throw conflict("اللعبة ليست نشطة");
  const settings = withSettingsDefaults(game.settings);

  await prisma.$transaction(async (tx) => {
    if (await alreadyProcessed(tx, gameId, input.idempotencyKey, "enumerate-answer")) return;
    const gq = await tx.gameQuestion.findFirst({
      where: { gameId, order: game.currentIndex },
      include: { question: { include: { acceptedAnswers: true } }, usedAnswers: true },
    });
    if (!gq) throw notFound("لا يوجد سؤال حالي");
    if (gq.question.type !== "ENUMERATE") throw badRequest("هذا ليس سؤال «عدّد الإجابات»");
    if (gq.enumActiveTeam && gq.enumActiveTeam !== input.team) {
      throw badRequest("ليس دور هذا الفريق");
    }

    let usedAnswerId: string | undefined;
    let createdUsedId: string | undefined;
    if (input.acceptedAnswerId) {
      const ans = gq.question.acceptedAnswers.find((a) => a.id === input.acceptedAnswerId);
      if (!ans) throw badRequest("إجابة غير موجودة في القائمة");
      const alreadyUsed = gq.usedAnswers.some((u) => u.acceptedAnswerId === ans.id);
      if (alreadyUsed) throw conflict("هذه الإجابة مستخدمة من قبل");
      const used = await tx.enumerationUsedAnswer.create({
        data: { gameQuestionId: gq.id, acceptedAnswerId: ans.id, team: input.team },
      });
      usedAnswerId = ans.id;
      createdUsedId = used.id;
    } else if (!input.manualText) {
      throw badRequest("يلزم اختيار إجابة أو إدخال نص");
    }

    const delta = enumerateAnswerPoints(settings);
    const created: Inverse["createdScoreEvents"] = [];
    if (delta !== 0) created.push(await applyScore(tx, gameId, input.team, delta, "enumerate:answer", gq.id));

    await tx.answerAttempt.create({
      data: {
        gameQuestionId: gq.id,
        team: input.team,
        correct: true,
        acceptedAnswerId: usedAnswerId,
        manualText: input.manualText,
      },
    });

    const nextTeam = nextEnumTeam(settings, readEnumState(gq.enumState), otherTeam(input.team));
    await tx.gameQuestion.update({ where: { id: gq.id }, data: { enumActiveTeam: nextTeam } });

    await recordHistory(
      tx,
      gameId,
      "enumerate-answer",
      `إجابة صحيحة للفريق ${input.team}`,
      { team: input.team, delta },
      {
        createdScoreEvents: created,
        deleteUsedAnswerIds: createdUsedId ? [createdUsedId] : [],
        gameQuestionRestore: { id: gq.id, enumActiveTeam: input.team },
      },
    );
  });
  return getState(gameId);
}

/** Next team to act in enumeration, skipping an eliminated team. */
function nextEnumTeam(settings: GameSettings, state: EnumState, preferred: TeamSide): TeamSide {
  const limit = settings.enumerate.strikesPerTeam;
  if (state[preferred].strikes < limit) return preferred;
  const other = otherTeam(preferred);
  if (state[other].strikes < limit) return other;
  return preferred; // both eliminated — judge will end the round
}

export async function enumerateStrike(
  gameId: string,
  input: { team: TeamSide; idempotencyKey?: string },
): Promise<GameStateDto> {
  const game = await loadGameOrThrow(gameId);
  if (game.status !== "ACTIVE") throw conflict("اللعبة ليست نشطة");
  const settings = withSettingsDefaults(game.settings);
  await prisma.$transaction(async (tx) => {
    if (await alreadyProcessed(tx, gameId, input.idempotencyKey, "strike")) return;
    const gq = await tx.gameQuestion.findFirst({ where: { gameId, order: game.currentIndex }, include: { question: true } });
    if (!gq) throw notFound("لا يوجد سؤال حالي");
    if (gq.question.type !== "ENUMERATE") throw badRequest("الأخطاء متاحة في «عدّد الإجابات» فقط");
    const state = readEnumState(gq.enumState);
    if (state[input.team].strikes >= settings.enumerate.strikesPerTeam) throw conflict("الفريق مُقصى أصلاً");

    const strike = await tx.strike.create({ data: { gameQuestionId: gq.id, team: input.team } });
    state[input.team].strikes += 1;
    const prevActive = gq.enumActiveTeam as TeamSide | null;
    const nextTeam = nextEnumTeam(settings, state, otherTeam(input.team));
    await tx.gameQuestion.update({ where: { id: gq.id }, data: { enumState: state as unknown as Prisma.InputJsonValue, enumActiveTeam: nextTeam } });

    await recordHistory(tx, gameId, "strike", `خطأ للفريق ${input.team}`, { team: input.team }, {
      deleteStrikeIds: [strike.id],
      gameQuestionRestore: { id: gq.id, enumState: readEnumStateRevert(state, input.team), enumActiveTeam: prevActive },
    });
  });
  return getState(gameId);
}

function readEnumStateRevert(state: EnumState, team: TeamSide): EnumState {
  const copy: EnumState = { A: { ...state.A }, B: { ...state.B } };
  copy[team].strikes = Math.max(0, copy[team].strikes - 1);
  return copy;
}

export async function enumeratePass(
  gameId: string,
  input: { team: TeamSide; idempotencyKey?: string },
): Promise<GameStateDto> {
  const game = await loadGameOrThrow(gameId);
  if (game.status !== "ACTIVE") throw conflict("اللعبة ليست نشطة");
  const settings = withSettingsDefaults(game.settings);
  await prisma.$transaction(async (tx) => {
    if (await alreadyProcessed(tx, gameId, input.idempotencyKey, "pass")) return;
    const gq = await tx.gameQuestion.findFirst({ where: { gameId, order: game.currentIndex }, include: { question: true } });
    if (!gq) throw notFound("لا يوجد سؤال حالي");
    if (gq.question.type !== "ENUMERATE") throw badRequest("التمرير متاح في «عدّد الإجابات» فقط");
    const state = readEnumState(gq.enumState);
    if (state[input.team].passesUsed >= settings.enumerate.passesPerTeam) throw conflict("لا تمريرات متبقية");

    const pass = await tx.pass.create({ data: { gameQuestionId: gq.id, team: input.team } });
    state[input.team].passesUsed += 1;
    const prevActive = gq.enumActiveTeam as TeamSide | null;
    const nextTeam = nextEnumTeam(settings, state, otherTeam(input.team));
    await tx.gameQuestion.update({ where: { id: gq.id }, data: { enumState: state as unknown as Prisma.InputJsonValue, enumActiveTeam: nextTeam } });
    await recordHistory(tx, gameId, "pass", `تمرير الفريق ${input.team}`, { team: input.team }, {
      deletePassIds: [pass.id],
      gameQuestionRestore: { id: gq.id, enumState: revertPass(state, input.team), enumActiveTeam: prevActive },
    });
  });
  return getState(gameId);
}

function revertPass(state: EnumState, team: TeamSide): EnumState {
  const copy: EnumState = { A: { ...state.A }, B: { ...state.B } };
  copy[team].passesUsed = Math.max(0, copy[team].passesUsed - 1);
  return copy;
}

export async function skipQuestion(gameId: string, idempotencyKey?: string): Promise<GameStateDto> {
  const game = await loadGameOrThrow(gameId);
  if (game.status !== "ACTIVE") throw conflict("اللعبة ليست نشطة");
  await prisma.$transaction(async (tx) => {
    if (await alreadyProcessed(tx, gameId, idempotencyKey, "skip")) return;
    const gq = await tx.gameQuestion.findFirst({ where: { gameId, order: game.currentIndex } });
    if (!gq) throw notFound("لا يوجد سؤال حالي");
    const prevStatus = gq.status;
    await tx.gameQuestion.update({ where: { id: gq.id }, data: { status: "SKIPPED", endedAt: new Date() } });
    await recordHistory(tx, gameId, "skip", `تخطّي السؤال ${gq.order + 1}`, { order: gq.order }, {
      gameQuestionRestore: { id: gq.id, status: prevStatus },
    });
  });
  return getState(gameId);
}

export async function adjustScore(
  gameId: string,
  input: { team: TeamSide; delta: number; reason?: string },
): Promise<GameStateDto> {
  const game = await loadGameOrThrow(gameId);
  if (game.status === "FINISHED") throw conflict("انتهت اللعبة");
  await prisma.$transaction(async (tx) => {
    const created = [await applyScore(tx, gameId, input.team, input.delta, input.reason ?? "manual")];
    await recordHistory(tx, gameId, "adjust", `تعديل يدوي للفريق ${input.team} (${input.delta})`, input, {
      createdScoreEvents: created,
    });
  });
  return getState(gameId);
}

export async function undo(gameId: string): Promise<GameStateDto> {
  await loadGameOrThrow(gameId);
  await prisma.$transaction(async (tx) => {
    const last = await tx.gameActionHistory.findFirst({
      where: { gameId, undone: false },
      orderBy: { seq: "desc" },
    });
    if (!last) throw conflict("لا يوجد إجراء للتراجع عنه");
    const inv = last.inverse as unknown as Inverse;

    for (const ev of inv.createdScoreEvents ?? []) {
      await tx.team.update({
        where: { gameId_side: { gameId, side: ev.team } },
        data: { score: { decrement: ev.delta } },
      });
      await tx.scoreEvent.deleteMany({ where: { id: ev.id } });
    }
    if (inv.deleteAttemptIds?.length) await tx.answerAttempt.deleteMany({ where: { id: { in: inv.deleteAttemptIds } } });
    if (inv.deleteUsedAnswerIds?.length) await tx.enumerationUsedAnswer.deleteMany({ where: { id: { in: inv.deleteUsedAnswerIds } } });
    if (inv.deleteStrikeIds?.length) await tx.strike.deleteMany({ where: { id: { in: inv.deleteStrikeIds } } });
    if (inv.deletePassIds?.length) await tx.pass.deleteMany({ where: { id: { in: inv.deletePassIds } } });

    if (inv.gameQuestionRestore) {
      const r = inv.gameQuestionRestore;
      await tx.gameQuestion.update({
        where: { id: r.id },
        data: {
          ...(r.status !== undefined ? { status: r.status as never } : {}),
          ...(r.answeredCorrect !== undefined ? { answeredCorrect: r.answeredCorrect } : {}),
          ...(r.answeredByTeam !== undefined ? { answeredByTeam: r.answeredByTeam ?? null } : {}),
          ...(r.pointsAwarded !== undefined ? { pointsAwarded: r.pointsAwarded } : {}),
          ...(r.cluesRevealed !== undefined ? { cluesRevealed: r.cluesRevealed } : {}),
          ...(r.enumState !== undefined ? { enumState: r.enumState as Prisma.InputJsonValue } : {}),
          ...(r.enumActiveTeam !== undefined ? { enumActiveTeam: r.enumActiveTeam ?? null } : {}),
        },
      });
    }
    if (inv.gameRestore) {
      await tx.gameSession.update({
        where: { id: gameId },
        data: {
          ...(inv.gameRestore.currentIndex !== undefined ? { currentIndex: inv.gameRestore.currentIndex } : {}),
          ...(inv.gameRestore.status !== undefined ? { status: inv.gameRestore.status as never } : {}),
        },
      });
    }
    await tx.gameActionHistory.update({ where: { id: last.id }, data: { undone: true } });
  });
  return getState(gameId);
}

export async function setStatus(gameId: string, status: "PAUSED" | "ACTIVE"): Promise<GameStateDto> {
  const game = await loadGameOrThrow(gameId);
  if (game.status === "FINISHED") throw conflict("انتهت اللعبة");
  await prisma.gameSession.update({ where: { id: gameId }, data: { status } });
  return getState(gameId);
}

export async function finishGame(gameId: string): Promise<GameStateDto> {
  const game = await loadGameOrThrow(gameId);
  const a = game.teams.find((t) => t.side === "A")?.score ?? 0;
  const b = game.teams.find((t) => t.side === "B")?.score ?? 0;
  const w = matchWinner(a, b);
  await prisma.gameSession.update({
    where: { id: gameId },
    data: {
      status: "FINISHED",
      finishedAt: new Date(),
      winner: w === "TIE" ? null : w,
      isTie: w === "TIE",
    },
  });
  return getState(gameId);
}

// ───────────────────────── State projection ─────────────────────────

export interface GameStateDto {
  id: string;
  status: string;
  startingTeam: TeamSide;
  teams: { A: { name: string; score: number }; B: { name: string; score: number } };
  currentIndex: number;
  totalQuestions: number;
  answeredCount: number;
  winner: TeamSide | null;
  isTie: boolean;
  settings: GameSettings;
  canUndo: boolean;
  current: JudgeQuestionDto | null;
  progress: { order: number; type: string; difficulty: string; status: string }[];
}

export async function getState(gameId: string): Promise<GameStateDto> {
  const game = await prisma.gameSession.findUnique({
    where: { id: gameId },
    include: {
      teams: true,
      questions: { orderBy: { order: "asc" }, include: { question: { select: { type: true, difficulty: true } } } },
    },
  });
  if (!game) throw notFound("اللعبة غير موجودة");
  const settings = withSettingsDefaults(game.settings);

  const teamA = game.teams.find((t) => t.side === "A");
  const teamB = game.teams.find((t) => t.side === "B");
  const answeredCount = game.questions.filter((q) => q.status === "ANSWERED" || q.status === "SKIPPED").length;

  const undoable = await prisma.gameActionHistory.count({ where: { gameId, undone: false } });

  const current = await buildCurrentDto(gameId, game.currentIndex, settings);

  return {
    id: game.id,
    status: game.status,
    startingTeam: game.startingTeam as TeamSide,
    teams: {
      A: { name: teamA?.name ?? "الفريق أ", score: teamA?.score ?? 0 },
      B: { name: teamB?.name ?? "الفريق ب", score: teamB?.score ?? 0 },
    },
    currentIndex: game.currentIndex,
    totalQuestions: game.questions.length,
    answeredCount,
    winner: (game.winner as TeamSide | null) ?? null,
    isTie: game.isTie,
    settings,
    canUndo: undoable > 0,
    current,
    progress: game.questions.map((q) => ({
      order: q.order,
      type: q.question.type,
      difficulty: q.question.difficulty,
      status: q.status,
    })),
  };
}

async function buildCurrentDto(
  gameId: string,
  currentIndex: number,
  settings: GameSettings,
): Promise<JudgeQuestionDto | null> {
  const gq = await currentGameQuestion(gameId, currentIndex);
  if (!gq) return null;
  const q = gq.question;
  const usedByAnswerId = new Map(gq.usedAnswers.map((u) => [u.acceptedAnswerId, u.team as TeamSide]));

  const pointsAvailable =
    q.type === "WHO_AM_I"
      ? whoAmIPoints(settings, q.difficulty as never, gq.cluesRevealed)
      : q.type === "FASTEST"
        ? fastestPoints(settings, q.difficulty as never)
        : q.type === "TRUE_FALSE"
          ? trueFalsePoints(settings, q.difficulty as never)
          : enumerateAnswerPoints(settings);

  return {
    gameQuestionId: gq.id,
    questionId: q.id,
    order: gq.order,
    type: q.type as JudgeQuestionDto["type"],
    difficulty: q.difficulty as JudgeQuestionDto["difficulty"],
    categoryNameAr: q.category.nameAr,
    questionText: q.questionText,
    answerText: q.answerText,
    explanation: q.explanation,
    clues: q.clues.sort((a, b) => a.order - b.order).map((c) => ({ order: c.order, text: c.text })),
    cluesRevealed: gq.cluesRevealed,
    isTrue: q.isTrue,
    ownerTeam: (gq.ownerTeam as TeamSide | null) ?? null,
    enumActiveTeam: (gq.enumActiveTeam as TeamSide | null) ?? null,
    enumState: q.type === "ENUMERATE" ? readEnumState(gq.enumState) : null,
    acceptedAnswers: q.acceptedAnswers
      .sort((a, b) => a.order - b.order)
      .map((a) => ({
        id: a.id,
        text: a.text,
        used: usedByAnswerId.has(a.id),
        usedByTeam: usedByAnswerId.get(a.id) ?? null,
      })),
    minimumRequired: q.minimumRequired,
    reviewStatus: q.reviewStatus,
    reviewNotes: q.reviewNotes,
    sourceReference: q.sourceReference,
    flaggedForReview: q.flaggedForReview,
    acceptedAnswersIncomplete: q.acceptedAnswersIncomplete,
    pointsAvailable,
  };
}
