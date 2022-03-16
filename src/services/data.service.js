import { Transaction } from "../models";
import { fillMissingValues } from "../utils/helpers";

export default {
  async getForgeHistory(query) {
    const yieldContract = query.yieldContract;

    const result = await Transaction.aggregate([
      { $match: { yieldContract: new RegExp(yieldContract, "i") } },
      { $match: { $or: [{ action: "mint" }, { action: "redeem" }] } },
      {
        $group: {
          _id: { $dateToString: { date: "$timestamp", format: "%Y-%m-%d" } },
          mint: {
            $sum: { $cond: [{ $eq: ["$action", "mint"] }, "$amountUSD", 0] },
          },
          redeem: {
            $sum: { $cond: [{ $eq: ["$action", "redeem"] }, "$amountUSD", 0] },
          },
        },
      },
      { $set: { time: "$_id", diff: { $subtract: ["$mint", "$redeem"] } } },
      { $sort: { time: 1 } },
      { $project: { _id: 0 } },
    ]);

    const startTime = result?.[0]?.time;
    const endTime = result?.[result.length - 1]?.time;

    const x = fillMissingValues(
      result,
      { mint: 0, redeem: 0, diff: 0 },
      startTime,
      endTime
    );

    let runningTotal = 0;
    const xx = x.map((t) => {
      runningTotal += t.diff;
      return { ...t, netFlow: runningTotal };
    });

    return xx;
  },
};
