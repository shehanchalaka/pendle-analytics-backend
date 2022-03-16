import { Router } from "express";
import { Token } from "../services";

const router = Router();

router.get("/:address", async (req, res) => {
  try {
    const result = await Token.getToken(req.params.address, req.query);
    res.json(result);
  } catch (error) {
    res.send(error);
  }
});

export default router;
