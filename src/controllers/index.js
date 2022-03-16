export function setupRoutes(app) {
  app.use("/price", require("./price.controller").default);
  app.use("/transactions", require("./transaction.controller").default);
  app.use("/users", require("./user.controller").default);
  app.use("/tokens", require("./token.controller").default);
  app.use("/data", require("./data.controller").default);

  // 404 handler
  app.use((req, res) => res.status(404).send("Not Found"));
}
