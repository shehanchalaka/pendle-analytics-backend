import express from "express";
import helmet from "helmet";
import cors from "cors";
import { DB_URL, PORT, NODE_ENV } from "./config";
import morgan from "morgan";
import mongoose from "mongoose";
import { setupRoutes } from "./controllers";
import { setupJobs } from "./jobs";
import { syncMarketReserves } from "./sync/marketReserves";

(async () => {
  await mongoose.connect(DB_URL);
  console.info("✅ Connected to Database");

  const app = express();

  app.use(helmet());
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  app.use(cors());
  app.use(morgan("dev"));

  await setupJobs();
  syncMarketReserves();

  app.get("/", (req, res) => {
    res.json({ status: "healthy", message: "Pendle analytics service" });
  });

  setupRoutes(app);

  app.listen(PORT, () => {
    console.log(`✅ App running on port ${PORT} in ${NODE_ENV} mode`);
  });
})();
