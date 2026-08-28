const express = require("express");
const service = require("../services/telemetryService");
const router = express.Router();
router.post("/", async (req, res, next) => {
  try {
    res.status(201).json(await service.receive(req.body));
  } catch (e) {
    next(e);
  }
});
module.exports = router;
