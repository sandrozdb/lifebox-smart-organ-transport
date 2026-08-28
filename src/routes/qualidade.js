const express = require("express");
const { getStatus } = require("../services/qaStatusService");
const router = express.Router();
router.get("/", (_req, res) => res.json(getStatus()));
module.exports = router;
