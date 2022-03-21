import { Router } from "express";
import { Data } from "../services";

const router = Router();

router.get("/forge", async (req, res, next) => {
  try {
    const result = await Data.getForgeHistory(req.query);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

export default router;
