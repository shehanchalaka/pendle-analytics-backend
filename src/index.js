import express from "express";
import helmet from "helmet";
import cors from "cors";
import { DB_URL, PORT, NODE_ENV } from "./config";
import morgan from "morgan";
import mongoose from "mongoose";
import { setupRoutes } from "./controllers";
import { syncSubgraph } from "./subgraph";
import { sync } from "./sync";

(async () => {
  await mongoose.connect(DB_URL);
  console.info("✅ Connected to Database");

  const app = express();

  app.use(helmet());
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  app.use(cors());
  app.use(morgan("dev"));

  syncSubgraph();
  // sync();

  app.get("/", (req, res) => {
    res.json("You got me");
  });

  setupRoutes(app);

  app.listen(PORT, () => {
    console.log(`✅ App running on port ${PORT} in ${NODE_ENV} mode`);
  });
})();
