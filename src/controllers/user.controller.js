import { Router } from "express";
import { User } from "../services";

const router = Router();

router.get("/", async (req, res, next) => {
  try {
    const result = await User.getUsers(req.query);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

router.get("/report", async (req, res, next) => {
  try {
    const result = await User.getUsersReport(req.query);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

router.get("/:address", async (req, res, next) => {
  try {
    const result = await User.getUser({
      ...req.query,
      address: req.params.address,
    });
    res.json(result);
  } catch (error) {
    next(error);
  }
});

router.get("/:address/transactions", async (req, res, next) => {
  try {
    const result = await User.getUserTransactions({
      ...req.query,
      address: req.params.address,
    });
    res.json(result);
  } catch (error) {
    next(error);
  }
});

router.get("/:address/details", async (req, res, next) => {
  try {
    const result = await User.getUserAddtionalDetails({
      ...req.query,
      address: req.params.address,
    });
    res.json(result);
  } catch (error) {
    next(error);
  }
});

export default router;
