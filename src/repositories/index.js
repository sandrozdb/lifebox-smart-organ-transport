const config = require("../config");
const { createMemoryRepository } = require("./memoryRepository");
module.exports =
  config.dbDriver === "memory"
    ? createMemoryRepository()
    : require("./mysqlRepository");
