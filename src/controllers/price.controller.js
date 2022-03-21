import { Router } from "express";
import { Price } from "../services";

const router = Router();

router.get("/:address", async (req, res, next) => {
  try {
    const result = await Price.getTokenPrice(req.params.address, req.query);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

export default router;
