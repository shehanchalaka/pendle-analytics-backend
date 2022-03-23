import { Router } from "express";
import { Pendle } from "../services";

const router = Router();

router.get("/stats", async (req, res, next) => {
  try {
    const result = await Pendle.getPendleStats(req.query);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

router.get("/history-chart", async (req, res, next) => {
  try {
    const result = await Pendle.getPendleHistory(req.query);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

export default router;
