const express = require("express");
const iotState = require("../services/iotStateService");
const simulation = require("../services/simulationService");
const repository = require("../repositories");
const { object } = require("../utils/validation");

const router = express.Router();

router.get("/status", (req, res) =>
  res.json(iotState.snapshot(req.query.deviceId)),
);

router.put("/mode", async (req, res, next) => {
  try {
    object(req.body);
    const nextState = iotState.setMode(req.body.mode);
    if (nextState.mode === iotState.MODES.IOT) await simulation.stop();
    res.json(nextState);
  } catch (error) {
    next(error);
  }
});

router.put("/profile", async (req, res, next) => {
  try {
    object(req.body);
    const simulationState = simulation.status(),
      transport = await repository.getTransporte(simulationState.transporteId),
      executionActive = ["EM_ANDAMENTO", "ATENCAO", "CRITICO"].includes(
        transport?.status,
      ),
      frozenProfile = executionActive
        ? simulationState.logistics?.organProfile
        : null;
    res.json(iotState.setProfile(req.body.organCode, frozenProfile));
  } catch (error) {
    next(error);
  }
});

module.exports = router;
