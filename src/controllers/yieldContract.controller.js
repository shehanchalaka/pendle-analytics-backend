import { Router } from "express";
import { YieldContract } from "../services";

const router = Router();

router.get("/stats", async (req, res, next) => {
  try {
    const result = await YieldContract.getStats(req.query);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

router.get("/history-chart", async (req, res, next) => {
  try {
    const result = await YieldContract.getHistoryChart(req.query);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

export default router;
