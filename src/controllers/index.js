import errorHandler from "../middlewares/errorHandler";

export function setupRoutes(app) {
  app.use("/price", require("./price.controller").default);
  app.use("/transactions", require("./transaction.controller").default);
  app.use("/users", require("./user.controller").default);
  app.use("/tokens", require("./token.controller").default);
  app.use("/data", require("./data.controller").default);
  app.use("/stats", require("./stat.controller").default);
  app.use("/yield-contracts", require("./yieldContract.controller").default);
  app.use("/markets", require("./market.controller").default);

  // 404 handler
  app.use((req, res) => res.status(404).send("Not Found"));

  // error handler
  app.use(errorHandler);
}
