const fs = require("fs");
const path = require("path");
const baseline = require("../config/qaBaseline.json");

function getStatus() {
  const file = path.resolve(__dirname, "..", "..", "work", "qa-last-run.json");
  try {
    const local = JSON.parse(fs.readFileSync(file, "utf8"));
    return { ...baseline, ...local, source: "execução local" };
  } catch {
    return baseline;
  }
}

module.exports = { getStatus };
