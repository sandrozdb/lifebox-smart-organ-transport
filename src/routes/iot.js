const express = require("express");
const iotState = require("../services/iotStateService");
const simulation = require("../services/simulationService");
const { object } = require("../utils/validation");

const router = express.Router();

router.get("/status", (_req, res) => res.json(iotState.snapshot()));

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

module.exports = router;
