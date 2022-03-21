import { Transaction } from "../models";
import { Price } from "../services";
import { NETWORK } from "../utils/constants";

export default {
  async getStatsByNetwork(chainId, query) {
    const network = NETWORK[chainId] ?? "mainnet";
    const market = query?.market;

    const tradingVolumes = await Transaction.aggregate([
      { $match: { network } },
      { $match: { action: "swap" } },
      {
        $lookup: {
          from: "markets",
          let: { address: "$market" },
          pipeline: [
            { $match: { $expr: { $eq: ["$address", "$$address"] } } },
            { $project: { name: 1, type: 1 } },
          ],
          as: "market",
        },
      },
      { $set: { market: { $first: "$market" } } },
      {
        $group: {
          _id: "$market.type",
          amountUSD: { $sum: "$amountUSD" },
          average: { $avg: "$amountUSD" },
        },
      },
    ]);

    const forges = await Transaction.aggregate([
      { $match: { network } },
      {
        $facet: {
          mints: [
            { $match: { action: "mint" } },
            { $unwind: "$inputs" },
            { $sort: { timestamp: -1 } },
            {
              $group: {
                _id: "$inputs.token",
                amount: { $sum: "$inputs.amount" },
                price: { $first: "$inputs.price" },
                timestamp: { $first: "$timestamp" },
                action: { $first: "$action" },
              },
            },
          ],
          redeems: [
            { $match: { action: "redeem" } },
            { $unwind: "$outputs" },
            { $sort: { timestamp: -1 } },
            {
              $group: {
                _id: "$outputs.token",
                amount: { $sum: "$outputs.amount" },
                price: { $first: "$outputs.price" },
                timestamp: { $first: "$timestamp" },
                action: { $first: "$action" },
              },
            },
          ],
        },
      },
      { $set: { data: { $concatArrays: ["$mints", "$redeems"] } } },
      { $project: { mints: 0, redeems: 0 } },
      { $unwind: "$data" },
      { $replaceRoot: { newRoot: "$data" } },
      { $sort: { timestamp: -1 } },
      {
        $group: {
          _id: "$_id",
          mints: {
            $sum: { $cond: [{ $eq: ["$action", "mint"] }, "$amount", 0] },
          },
          redeems: {
            $sum: { $cond: [{ $eq: ["$action", "redeem"] }, "$amount", 0] },
          },
          price: { $first: "$price" },
          timestamp: { $max: "$timestamp" },
        },
      },
      { $set: { balance: { $subtract: ["$mints", "$redeems"] } } },
      {
        $set: {
          mintsUSD: { $multiply: ["$mints", "$price"] },
          redeemsUSD: { $multiply: ["$redeems", "$price"] },
          balanceUSD: { $multiply: ["$balance", "$price"] },
        },
      },
      {
        $group: {
          _id: null,
          mintsUSD: { $sum: "$mintsUSD" },
          redeemsUSD: { $sum: "$redeemsUSD" },
          balanceUSD: { $sum: "$balanceUSD" },
        },
      },
      { $project: { _id: 0 } },
    ]);

    const forge = forges?.[0];
    const otStats = tradingVolumes.find((t) => t._id === "ot");
    const ytStats = tradingVolumes.find((t) => t._id === "yt");

    const results = await Transaction.aggregate([
      {
        $facet: {
          joins: [
            { $match: { network } },
            { $match: { action: "join" } },
            { $unwind: "$inputs" },
            {
              $group: {
                _id: { market: "$market", token: "$inputs.token" },
                joins: { $sum: "$inputs.amount" },
              },
            },
          ],
          exits: [
            { $match: { network } },
            { $match: { action: "exit" } },
            { $unwind: "$outputs" },
            {
              $group: {
                _id: "$market",
                exits: { $sum: "$outputs.amount" },
              },
            },
          ],
        },
      },
      // { $set: { arr: { $concatArrays: ["$joins", "$exits"] } } },
      // { $unwind: "$arr" },
      // {
      //   $group: {
      //     _id: "$arr._id",
      //     joins: { $sum: "$arr.joins" },
      //     exits: { $sum: "$arr.exits" },
      //   },
      // },
      // { $set: { balance: { $subtract: ["$joins", "$exits"] } } },
    ]);

    let tvl = 0;

    // for (let result of results) {
    //   const res = await Price.getTokenPrice(result._id);
    //   tvl += res.price * result.balance;
    // }

    return { results, tvl };

    //   return {
    //     forges: {
    //       balanceUSD: forge.balanceUSD,
    //       totalMintedUSD: forge.mintsUSD,
    //     },
    //     otMarkets: {
    //       tradingVolumeUSD: otStats.amountUSD,
    //       averageTradeSizeUSD: otStats.average,
    //     },
    //     ytMarkets: {
    //       tradingVolumeUSD: ytStats.amountUSD,
    //       averageTradeSizeUSD: ytStats.average,
    //     },
    //   };
  },
};
