import { Transaction } from "../models";
import { Price, YieldContract } from "../services";

export default {
  async getTransactions(query) {
    const forgeId = query?.forgeId?.toLowerCase();
    const expiry = query?.expiry;
    const underlyingToken = query?.underlyingToken?.toLowerCase();
    const market = query?.market?.toLowerCase();
    const filter = query?.filter?.toLowerCase() ?? "all";
    const id = `${forgeId}-${expiry}-${underlyingToken}`;

    const filterStage = [];
    if (filter === "mints") {
      filterStage.push({
        $match: { $or: [{ action: "mint" }, { action: "redeem" }] },
      });
    } else if (filter === "swaps") {
      filterStage.push({ $match: { $or: [{ action: "swap" }] } });
    } else if (filter === "liquidity") {
      filterStage.push({
        $match: { $or: [{ action: "join" }, { action: "exit" }] },
      });
    }

    const result = await Transaction.aggregate([
      { $match: { $or: [{ yieldContract: id }, { market }] } },
      ...filterStage,
      { $sort: { timestamp: -1 } },
      { $limit: 100 },
      { $project: { _id: 0 } },
    ]);

    return result;
  },

  async getLiquidityTransactions(query) {
    const endTime = query.endTime ?? new Date();

    const result = await Transaction.aggregate([
      { $match: { market: new RegExp(query.market, "i") } },
      { $match: { $or: [{ action: "join" }, { action: "exit" }] } },
      {
        $group: {
          _id: {
            $dateToString: {
              date: "$timestamp",
              format: "%Y-%m-%d",
              timezone: "Asia/Singapore",
            },
          },
          join: {
            $sum: { $cond: [{ $eq: ["$action", "join"] }, "$amountUSD", 0] },
          },
          exit: {
            $sum: { $cond: [{ $eq: ["$action", "exit"] }, "$amountUSD", 0] },
          },
        },
      },
      { $set: { time: "$_id", diff: { $subtract: ["$join", "$exit"] } } },
      { $sort: { time: 1 } },
      { $project: { _id: 0 } },
    ]);

    return result;
  },
};
