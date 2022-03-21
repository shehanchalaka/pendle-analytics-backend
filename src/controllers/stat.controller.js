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

export default router;
