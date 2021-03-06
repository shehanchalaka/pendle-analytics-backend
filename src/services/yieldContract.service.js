import { YieldContract, Transaction } from "../models";
import { Price } from "../services";
import { getDatasetWithNet } from "../utils/helpers";

export default {
  model() {
    return YieldContract;
  },

  async find(forgeId, expiry, underlyingToken) {
    const id = `${forgeId}-${expiry}-${underlyingToken}`;
    const found = await YieldContract.findOne({ id });
    if (!found) throw new Error("Yield contract not found");

    return found;
  },

  async getStats(query) {
    const forgeId = query?.forgeId?.toLowerCase();
    const expiry = query?.expiry;
    const underlyingToken = query?.underlyingToken?.toLowerCase();
    const id = `${forgeId}-${expiry}-${underlyingToken}`;

    const yieldContract = await this.find(forgeId, expiry, underlyingToken);

    const res = await Price.getTokenPrice(yieldContract.yieldBearingToken);
    const underlyingPrice = res.price ?? 0;

    const results = await Transaction.aggregate([
      { $match: { yieldContract: id } },
      {
        $facet: {
          mintVolume: [
            { $match: { action: "mint" } },
            { $unwind: "$inputs" },
            {
              $group: {
                _id: "$inputs.token",
                amount: { $sum: "$inputs.amount" },
              },
            },
          ],
          redeemVolume: [
            { $match: { action: "redeem" } },
            { $unwind: "$outputs" },
            {
              $group: {
                _id: "$outputs.token",
                amount: { $sum: "$outputs.amount" },
              },
            },
          ],
        },
      },
      {
        $set: {
          mintVolume: { $first: "$mintVolume" },
          redeemVolume: { $first: "$redeemVolume" },
        },
      },
      {
        $set: {
          token: "$mintVolume._id",
          mintVolume: "$mintVolume.amount",
          redeemVolume: "$redeemVolume.amount",
          lockedVolume: {
            $subtract: ["$mintVolume.amount", "$redeemVolume.amount"],
          },
        },
      },
      {
        $lookup: {
          from: "tokens",
          let: { address: "$token" },
          pipeline: [
            { $match: { $expr: { $eq: ["$address", "$$address"] } } },
            {
              $project: { _id: 0, address: 1, symbol: 1, name: 1, decimals: 1 },
            },
          ],
          as: "token",
        },
      },
      { $set: { token: { $first: "$token" } } },
    ]);

    const doc = results?.[0];

    return {
      ...doc,
      mintVolumeUSD: (doc.mintVolume ?? 0) * underlyingPrice,
      redeemVolumeUSD: (doc.redeemVolume ?? 0) * underlyingPrice,
      lockedVolumeUSD: (doc.lockedVolume ?? 0) * underlyingPrice,
    };
  },

  async getHistoryChart(query) {
    const forgeId = query?.forgeId?.toLowerCase();
    const expiry = query?.expiry;
    const underlyingToken = query?.underlyingToken?.toLowerCase();
    const id = `${forgeId}-${expiry}-${underlyingToken}`;

    const yieldContract = await YieldContract.findOne({ id }).select("-_id");

    const results_daily = await Transaction.aggregate([
      { $match: { yieldContract: id } },
      {
        $facet: {
          in: [
            { $match: { action: "mint" } },
            {
              $group: {
                _id: {
                  $dateToString: { date: "$timestamp", format: "%Y-%m-%d" },
                },
                in: { $sum: "$amountUSD" },
              },
            },
          ],
          out: [
            { $match: { action: "redeem" } },
            {
              $group: {
                _id: {
                  $dateToString: { date: "$timestamp", format: "%Y-%m-%d" },
                },
                out: { $sum: "$amountUSD" },
              },
            },
          ],
        },
      },
      { $set: { arr: { $concatArrays: ["$in", "$out"] } } },
      { $unwind: "$arr" },
      { $replaceRoot: { newRoot: "$arr" } },
      { $set: { time: "$_id" } },
      { $sort: { time: 1 } },
      { $project: { _id: 0 } },
    ]);

    const results_hourly = await Transaction.aggregate([
      { $match: { yieldContract: id } },
      {
        $facet: {
          in: [
            { $match: { action: "mint" } },
            {
              $group: {
                _id: {
                  $dateToString: { date: "$timestamp", format: "%Y-%m-%d-%H" },
                },
                in: { $sum: "$amountUSD" },
              },
            },
          ],
          out: [
            { $match: { action: "redeem" } },
            {
              $group: {
                _id: {
                  $dateToString: { date: "$timestamp", format: "%Y-%m-%d-%H" },
                },
                out: { $sum: "$amountUSD" },
              },
            },
          ],
        },
      },
      { $set: { arr: { $concatArrays: ["$in", "$out"] } } },
      { $unwind: "$arr" },
      { $replaceRoot: { newRoot: "$arr" } },
      { $set: { time: "$_id" } },
      { $sort: { time: 1 } },
      { $project: { _id: 0 } },
    ]);

    const daily = getDatasetWithNet(results_daily, "daily");
    const hourly = getDatasetWithNet(results_hourly, "hourly");

    return { yieldContract, history: { daily, hourly } };
  },
};
