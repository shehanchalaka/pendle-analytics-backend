import { Market, Transaction } from "../models";
import { Price } from "../services";
import { getDataset, getDatasetWithNet } from "../utils/helpers";

export default {
  model() {
    return Market;
  },

  async findByAddress(address) {
    const fields = ["token0", "token1", "baseToken", "quoteToken"];

    const lookupStages = fields.map((field) => ({
      $lookup: {
        from: "tokens",
        let: { address: `$${field}` },
        pipeline: [
          { $match: { $expr: { $eq: ["$address", "$$address"] } } },
          { $project: { _id: 0 } },
        ],
        as: `${field}`,
      },
    }));

    const sets = fields.reduce(
      (a, b) => ({ ...a, [b]: { $first: `$${b}` } }),
      {}
    );
    const setStage = { $set: sets };

    const result = await Market.aggregate([
      { $match: { address } },
      ...lookupStages,
      setStage,
    ]);
    if (result.length === 0) throw new Error("Market not found");

    return result?.[0];
  },

  async findByBaseToken(address) {
    const fields = ["token0", "token1", "baseToken", "quoteToken"];

    const lookupStages = fields.map((field) => ({
      $lookup: {
        from: "tokens",
        let: { address: `$${field}` },
        pipeline: [
          { $match: { $expr: { $eq: ["$address", "$$address"] } } },
          { $project: { _id: 0 } },
        ],
        as: `${field}`,
      },
    }));

    const sets = fields.reduce(
      (a, b) => ({ ...a, [b]: { $first: `$${b}` } }),
      {}
    );
    const setStage = { $set: sets };

    const result = await Market.aggregate([
      { $match: { baseToken: address } },
      ...lookupStages,
      setStage,
    ]);
    if (result.length === 0) throw new Error("Market not found");

    return result?.[0];
  },

  async getStats(query) {
    const market = query?.market?.toLowerCase();

    const trades = await Transaction.aggregate([
      { $match: { market } },
      { $match: { action: "swap" } },
      {
        $group: {
          _id: null,
          tradingVolumeUSD: { $sum: "$amountUSD" },
          averageTradingVolumeUSD: { $avg: "$amountUSD" },
        },
      },
      { $project: { _id: 0 } },
    ]);

    const trade = trades?.[0];

    const results = await Transaction.aggregate([
      { $match: { market } },
      {
        $facet: {
          joins: [
            { $match: { action: "join" } },
            { $unwind: "$inputs" },
            {
              $group: {
                _id: "$inputs.token",
                joins: { $sum: "$inputs.amount" },
              },
            },
          ],
          exits: [
            { $match: { action: "exit" } },
            { $unwind: "$outputs" },
            {
              $group: {
                _id: "$outputs.token",
                exits: { $sum: "$outputs.amount" },
              },
            },
          ],
        },
      },
      { $set: { arr: { $concatArrays: ["$joins", "$exits"] } } },
      { $unwind: "$arr" },
      { $replaceRoot: { newRoot: "$arr" } },
      {
        $group: {
          _id: "$_id",
          joins: { $sum: "$joins" },
          exits: { $sum: "$exits" },
        },
      },
      {
        $lookup: {
          from: "tokens",
          let: { address: "$_id" },
          pipeline: [
            { $match: { $expr: { $eq: ["$address", "$$address"] } } },
            {
              $project: { _id: 0, address: 1, name: 1, symbol: 1, decimals: 1 },
            },
          ],
          as: "token",
        },
      },
      {
        $set: {
          token: { $first: "$token" },
          reserve: { $subtract: ["$joins", "$exits"] },
        },
      },
      { $project: { _id: 0 } },
    ]);

    const reserves = [];
    let tvl = 0;

    for (let item of results) {
      const res = await Price.getTokenPrice(item.token.address);
      reserves.push({
        ...item,
        price: res.price,
        reserveUSD: res.price * item.reserve,
      });
      tvl += res.price * item.reserve;
    }

    return { ...trade, reserves, tvl };
  },

  async getTradingHistory(query) {
    const market = query?.market?.toLowerCase();

    const _market = await Market.findOne({ address: market }).select("-_id");

    const result_daily = await Transaction.aggregate([
      { $match: { market } },
      {
        $group: {
          _id: { $dateToString: { date: "$timestamp", format: "%Y-%m-%d" } },
          value: { $sum: "$amountUSD" },
        },
      },
      { $set: { time: "$_id" } },
      { $sort: { time: 1 } },
      { $project: { _id: 0 } },
    ]);

    const result_hourly = await Transaction.aggregate([
      { $match: { market } },
      {
        $group: {
          _id: { $dateToString: { date: "$timestamp", format: "%Y-%m-%d-%H" } },
          value: { $sum: "$amountUSD" },
        },
      },
      { $set: { time: "$_id" } },
      { $sort: { time: 1 } },
      { $project: { _id: 0 } },
    ]);

    const daily = getDataset(result_daily, "daily");
    const hourly = getDataset(result_hourly, "hourly");

    return { market: _market, history: { daily, hourly } };
  },

  async getLiquidityHistory(query) {
    const market = query?.market?.toLowerCase();

    const _market = await Market.findOne({ address: market }).select("-_id");

    const result_daily = await Transaction.aggregate([
      { $match: { market } },
      {
        $facet: {
          in: [
            { $match: { action: "join" } },
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
            { $match: { action: "exit" } },
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

    const result_hourly = await Transaction.aggregate([
      { $match: { market } },
      {
        $facet: {
          in: [
            { $match: { action: "join" } },
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
            { $match: { action: "exit" } },
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

    const daily = getDatasetWithNet(result_daily, "daily");
    const hourly = getDatasetWithNet(result_hourly, "hourly");

    return { market: _market, history: { daily, hourly } };
  },
};
