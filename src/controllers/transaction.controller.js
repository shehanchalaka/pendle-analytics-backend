import { Router } from "express";
import { Transaction } from "../services";

const router = Router();

router.get("/", async (req, res) => {
  try {
    const result = await Transaction.getTransactions(req.query);
    res.json(result);
  } catch (error) {
    res.send(error);
  }
});

router.get("/liquidity", async (req, res) => {
  try {
    const result = await Transaction.getLiquidityTransactions(req.query);
    res.json(result);
  } catch (error) {
    res.send(error);
  }
});

export default router;
