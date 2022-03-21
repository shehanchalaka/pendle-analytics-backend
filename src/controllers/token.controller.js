import { Router } from "express";
import { Token } from "../services";

const router = Router();

router.get("/:address", async (req, res, next) => {
  try {
    const result = await Token.getToken(req.params.address, req.query);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

export default router;
