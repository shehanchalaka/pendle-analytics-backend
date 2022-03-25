import { Router } from "express";
import { Token } from "../services";

const router = Router();

router.get("/holders", async (req, res, next) => {
  try {
    const result = await Token.getTokenHolders(req.query);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

export default router;
