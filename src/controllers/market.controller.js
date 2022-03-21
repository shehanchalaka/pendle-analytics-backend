import { Router } from "express";
import { Market } from "../services";

const router = Router();

router.get("/stats", async (req, res, next) => {
  try {
    const result = await Market.getStats(req.query);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

router.get("/trading-history", async (req, res, next) => {
  try {
    const result = await Market.getTradingHistory(req.query);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

router.get("/liquidity-history", async (req, res, next) => {
  try {
    const result = await Market.getLiquidityHistory(req.query);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

export default router;
