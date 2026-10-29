import { Router } from "express";
import { z } from "zod";
import {
  answerActionSchema,
  createGameSchema,
  enumerateAnswerSchema,
  revealClueSchema,
  scoreAdjustSchema,
  teamActionSchema,
} from "@darundi/shared";
import { prisma } from "../db";
import { asyncHandler, badRequest, forbidden, notFound, ok } from "../lib/http";
import {
  generateToken,
  hashToken,
  requireJudge,
  setSessionCookie,
  tokensMatch,
} from "../middleware/session";
import {
  adjustScore,
  answerQuestion,
  createGame,
  enumerateAnswer,
  enumeratePass,
  enumerateStrike,
  finishGame,
  getState,
  nextQuestion,
  revealClue,
  setStatus,
  skipQuestion,
  startGame,
  undo,
} from "../services/engine";

export const gamesRouter = Router();

/** Create a game. Returns a resume token; also sets the HttpOnly session cookie. */
gamesRouter.post(
  "/",
  asyncHandler(async (req, res) => {
    const body = createGameSchema.parse(req.body);
    const token = generateToken();
    const gameId = await createGame({
      teamAName: body.teamAName,
      teamBName: body.teamBName,
      selection: body.selection,
      settings: body.settings,
      tokenHash: hashToken(token),
    });
    setSessionCookie(res, token);
    const state = await getState(gameId);
    // resumeToken lets the client re-claim THIS game later (recovery hint).
    ok(res, { gameId, resumeToken: token, state }, 201);
  }),
);

/** Re-attach to a game by presenting its capability token. */
gamesRouter.post(
  "/:id/claim",
  asyncHandler(async (req, res) => {
    const schema = z.object({ token: z.string().min(10) });
    const { token } = schema.parse(req.body);
    const game = await prisma.gameSession.findUnique({ where: { id: req.params.id! } });
    if (!game) throw notFound("اللعبة غير موجودة");
    if (!tokensMatch(token, game.tokenHash)) throw forbidden("رمز غير صحيح");
    setSessionCookie(res, token);
    ok(res, await getState(game.id));
  }),
);

// All routes below require proof of the capability token.
gamesRouter.get("/:id", requireJudge, asyncHandler(async (req, res) => ok(res, await getState(req.params.id!))));

gamesRouter.post("/:id/start", requireJudge, asyncHandler(async (req, res) => ok(res, await startGame(req.params.id!))));

gamesRouter.post(
  "/:id/next-question",
  requireJudge,
  asyncHandler(async (req, res) => {
    const { idempotencyKey } = z.object({ idempotencyKey: z.string().optional() }).parse(req.body ?? {});
    ok(res, await nextQuestion(req.params.id!, idempotencyKey));
  }),
);

gamesRouter.post(
  "/:id/answer",
  requireJudge,
  asyncHandler(async (req, res) => {
    const body = answerActionSchema.parse(req.body);
    ok(res, await answerQuestion(req.params.id!, body));
  }),
);

gamesRouter.post(
  "/:id/clue",
  requireJudge,
  asyncHandler(async (req, res) => {
    const { idempotencyKey } = revealClueSchema.parse(req.body ?? {});
    ok(res, await revealClue(req.params.id!, idempotencyKey));
  }),
);

gamesRouter.post(
  "/:id/enumerate/answer",
  requireJudge,
  asyncHandler(async (req, res) => {
    const body = enumerateAnswerSchema.parse(req.body);
    if (!body.acceptedAnswerId && !body.manualText) throw badRequest("يلزم اختيار إجابة أو إدخال نص");
    ok(res, await enumerateAnswer(req.params.id!, body));
  }),
);

gamesRouter.post(
  "/:id/strike",
  requireJudge,
  asyncHandler(async (req, res) => {
    const body = teamActionSchema.parse(req.body);
    ok(res, await enumerateStrike(req.params.id!, body));
  }),
);

gamesRouter.post(
  "/:id/pass",
  requireJudge,
  asyncHandler(async (req, res) => {
    const body = teamActionSchema.parse(req.body);
    ok(res, await enumeratePass(req.params.id!, body));
  }),
);

gamesRouter.post(
  "/:id/skip",
  requireJudge,
  asyncHandler(async (req, res) => {
    const { idempotencyKey } = z.object({ idempotencyKey: z.string().optional() }).parse(req.body ?? {});
    ok(res, await skipQuestion(req.params.id!, idempotencyKey));
  }),
);

gamesRouter.post("/:id/undo", requireJudge, asyncHandler(async (req, res) => ok(res, await undo(req.params.id!))));

gamesRouter.post(
  "/:id/score",
  requireJudge,
  asyncHandler(async (req, res) => {
    const body = scoreAdjustSchema.parse(req.body);
    ok(res, await adjustScore(req.params.id!, body));
  }),
);

gamesRouter.post("/:id/pause", requireJudge, asyncHandler(async (req, res) => ok(res, await setStatus(req.params.id!, "PAUSED"))));
gamesRouter.post("/:id/resume", requireJudge, asyncHandler(async (req, res) => ok(res, await setStatus(req.params.id!, "ACTIVE"))));
gamesRouter.post("/:id/finish", requireJudge, asyncHandler(async (req, res) => ok(res, await finishGame(req.params.id!))));

gamesRouter.get(
  "/:id/history",
  requireJudge,
  asyncHandler(async (req, res) => {
    const history = await prisma.gameActionHistory.findMany({
      where: { gameId: req.params.id! },
      orderBy: { seq: "desc" },
      take: 100,
    });
    ok(res, history);
  }),
);

gamesRouter.get(
  "/:id/results",
  requireJudge,
  asyncHandler(async (req, res) => {
    const state = await getState(req.params.id!);
    const events = await prisma.scoreEvent.findMany({
      where: { gameId: req.params.id! },
      orderBy: { createdAt: "asc" },
    });
    ok(res, { ...state, scoreEvents: events });
  }),
);
