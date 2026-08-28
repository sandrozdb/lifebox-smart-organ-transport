const express = require("express");
const service = require("../services/simulationService");
const {
  object,
  positiveId,
  nonEmptyString,
  enumValue,
} = require("../utils/validation");
const { SCENARIOS } = require("../../simulator/scenarios");

const router = express.Router();
router.get("/status", (_req, res) => res.json(service.status()));

router.post("/start", async (req, res, next) => {
  try {
    object(req.body);
    res.json(
      await service.start(
        positiveId(req.body.transporteId ?? 1, "transporteId"),
        req.body.rotaId,
        req.body.plan,
        req.body.result,
      ),
    );
  } catch (error) {
    next(error);
  }
});

router.post("/stop", async (_req, res, next) => {
  try {
    res.json(await service.stop());
  } catch (error) {
    next(error);
  }
});

router.post("/reset", async (req, res, next) => {
  try {
    object(req.body);
    res.json(
      await service.reset(
        positiveId(req.body.transporteId ?? 1, "transporteId"),
      ),
    );
  } catch (error) {
    next(error);
  }
});

router.post("/reotimizar/recomendar", async (req, res, next) => {
  try {
    object(req.body);
    const transporteId = positiveId(req.body.transporteId, "transporteId");
    const reason = nonEmptyString(req.body.reason, "reason", { max: 160 });
    res
      .status(201)
      .json(
        await service.recommendReoptimization(
          transporteId,
          reason,
          req.body.conditions || {},
        ),
      );
  } catch (error) {
    next(error);
  }
});

router.post("/reotimizar/aplicar", async (req, res, next) => {
  try {
    object(req.body);
    const transporteId = positiveId(req.body.transporteId, "transporteId");
    const recommendationId = nonEmptyString(
      req.body.recommendationId,
      "recommendationId",
      { max: 80 },
    );
    res.json(await service.applyReoptimization(transporteId, recommendationId));
  } catch (error) {
    next(error);
  }
});

router.post("/cenario", async (req, res, next) => {
  try {
    object(req.body);
    const cenario = enumValue(
      req.body.cenario,
      "cenario",
      Object.keys(SCENARIOS),
    );
    const transporteId =
      req.body.transporteId === undefined
        ? undefined
        : positiveId(req.body.transporteId, "transporteId");
    res.json(await service.scenario(cenario, transporteId));
  } catch (error) {
    next(error);
  }
});

module.exports = router;
