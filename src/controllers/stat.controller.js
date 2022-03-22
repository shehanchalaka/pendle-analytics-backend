import { Router } from "express";
import { Stat } from "../services";

const router = Router();

router.get("/:chainId", async (req, res, next) => {
  try {
    const result = await Stat.getStatsByNetwork(req.params.chainId, req.query);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

router.get("/:chainId/forge-history", async (req, res, next) => {
  try {
    const result = await Stat.getAllForgesHistory(
      req.params.chainId,
      req.query
    );
    res.json(result);
  } catch (error) {
    next(error);
  }
});

router.get("/:chainId/trading-history", async (req, res, next) => {
  try {
    const result = await Stat.getAllTradingHistory(
      req.params.chainId,
      req.query
    );
    res.json(result);
  } catch (error) {
    next(error);
  }
});

export default router;
