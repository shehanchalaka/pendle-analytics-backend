import { Transaction } from "../models";
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
dayjs.extend(customParseFormat);

export default {
  async getTransactions(query) {
    console.log(query);

    const result = await Transaction.aggregate([
      { $match: { market: query.market } },
      { $match: { action: "join" } },
      {
        $lookup: {
          from: "markets",
          let: { market: "$market" },
          pipeline: [
            { $match: { $expr: { $eq: ["$address", "$$market"] } } },
            { $project: { _id: 0, address: 1, name: 1 } },
          ],
          as: "market",
        },
      },
      { $set: { market: { $first: "$market" } } },
      { $limit: 10 },
      { $project: { _id: 0 } },
    ]);

    return result;
  },

  async getLiquidityTransactions(query) {
    const endTime = query.endTime ?? new Date();
    const startTime =
      query?.startTime ?? dayjs(endTime).subtract(30, "days").toDate();

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

    const filled = fillMissingDates(result, startTime, endTime);

    return result;
  },
};

function fillMissingDates(data, startTime, endTime) {
  const map = data.reduce((a, b) => {
    if (!a[b.time]) {
      a[b.time] = b;
    }
    return a;
  }, {});

  const result = [...data];

  const end = dayjs(endTime);
  let time = dayjs(startTime);

  while (time.isBefore(end)) {
    let key = dayjs(time).format("YYYY-MM-DD");

    if (!map[key]) {
      result.push({ time: key, value: 0 });
    }

    time = time.add(1, "day");
  }

  return result.sort(
    (a, b) => dayjs(a.time).valueOf() - dayjs(b.time).valueOf()
  );
}
