import { Router } from "express";
import { PriceHistory } from "../models";

const router = Router();

router.get("/", async (req, res) => {
  const found = await PriceHistory.findOne({
    token: { $regex: new RegExp(req.query.token, "i") },
    timestamp: { $lte: +req.query.timestamp },
  }).select("-_id priceUSD token timestamp");

  res.json({ result: found });
});

export default router;
