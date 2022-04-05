import { Transaction } from "../models";
import dayjs from "dayjs";

export default {
  async getTransactions(params) {
    const forgeId = params?.forgeId?.toLowerCase();
    const expiry = params?.expiry;
    const underlyingToken = params?.underlyingToken?.toLowerCase();
    const market = params?.market?.toLowerCase();
    const filter = params?.filter?.toLowerCase() ?? "all";
    const skip = parseInt(params?.skip ?? 0);
    const limit = parseInt(params?.limit ?? 20);
    const endDate = parseInt(params?.endDate ?? 0);
    const id = `${forgeId}-${expiry}-${underlyingToken}`;

    const endTime = dayjs(endDate).endOf("day").toDate();

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

    if (endDate > 0) {
      filterStage.push({
        $match: { timestamp: { $lte: endTime } },
      });
    }

    const result = await Transaction.aggregate([
      { $match: { $or: [{ yieldContract: id }, { market }] } },
      ...filterStage,
      { $sort: { timestamp: -1 } },
      {
        $facet: {
          data: [{ $skip: skip }, { $limit: limit }, { $project: { _id: 0 } }],
          total: [{ $count: "total" }],
        },
      },
      { $replaceWith: { $mergeObjects: ["$$ROOT", { $first: "$total" }] } },
      { $set: { skip, limit } },
    ]);

    return result?.[0];
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
