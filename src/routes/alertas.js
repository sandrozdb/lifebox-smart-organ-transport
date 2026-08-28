const express = require("express");
const repository = require("../repositories");
const router = express.Router();
router.patch("/:id/resolver", async (req, res, next) => {
  try {
    const alert = await repository.resolveAlerta(req.params.id);
    alert
      ? res.json(alert)
      : res.status(404).json({ erro: "Alerta não encontrado." });
  } catch (e) {
    next(e);
  }
});
module.exports = router;
