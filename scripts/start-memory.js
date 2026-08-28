process.env.DB_DRIVER = "memory";
process.env.PORT = process.env.PORT || "3100";
require("../src/server");
