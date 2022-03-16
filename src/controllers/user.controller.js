import { Router } from "express";
import { User } from "../services";

const router = Router();

router.get("/", async (req, res) => {
  try {
    const result = await User.getUsers(req.query);
    res.json(result);
  } catch (error) {
    res.send(error);
  }
});

router.get("/:address", async (req, res) => {
  try {
    const result = await User.getUser(req.params.address, req.query);
    res.json(result);
  } catch (error) {
    res.send(error);
  }
});

export default router;
