import { Transaction, User } from "../models";
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
dayjs.extend(customParseFormat);

export default {
  async getUsers(query) {
    const result = await User.aggregate([
      {
        $lookup: {
          from: "transactions",
          let: { user: "$address" },
          pipeline: [
            { $match: { $expr: { $eq: ["$user", "$$user"] } } },
            { $project: { _id: 0, action: 1, amountUSD: 1 } },
          ],
          as: "transactions",
        },
      },
      {
        $set: {
          total: {
            $reduce: {
              input: "$transactions",
              initialValue: 0,
              in: { $add: ["$$value", "$$this.amountUSD"] },
            },
          },
          txCount: { $size: "$transactions" },
        },
      },
      { $sort: { total: -1 } },
      { $limit: 10 },
      { $project: { _id: 0, transactions: 0 } },
    ]);

    return result;
  },

  async getUser(address, query) {
    const result = await Transaction.aggregate([
      { $match: { user: new RegExp(address, "i") } },
      { $match: { $or: [{ action: "join" }, { action: "exit" }] } },
      {
        $group: {
          _id: "$market",
          // joins: {
          //   $sum: { $cond: [{ $eq: ["$action", "join"] }, "$amountUSD", 0] },
          // },
          // exits: {
          //   $sum: { $cond: [{ $eq: ["$action", "exit"] }, "$amountUSD", 0] },
          // },
          transactions: {
            $push: {
              hash: "$hash",
              timestamp: "$timestamp",
              action: "$action",
              amountUSD: "$amountUSD",
              inputs: "$inputs",
              outputs: "$outputs",
            },
          },
        },
      },
      // {
      //   $lookup: {
      //     from: "markets",
      //     let: { address: "$_id" },
      //     pipeline: [
      //       { $match: { $expr: { $eq: ["$address", "$$address"] } } },
      //       {
      //         $project: { _id: 0, address: 1, expiry: 1, name: 1, type: 1 },
      //       },
      //     ],
      //     as: "market",
      //   },
      // },
      // { $set: { market: { $first: "$market" } } },
      // { $project: { _id: 0 } },
    ]);
    return result;
  },
};
