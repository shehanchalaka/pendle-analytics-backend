import { Transaction, User, UserToken } from "../models";
import { CHAIN_ID_TO_NETWORK } from "../utils/constants";

export default {
  async getUsers(params) {
    const chainId = params?.chainId ?? 1;
    const sortBy = params?.sortBy ?? "total";
    const sortDirection = parseInt(params?.sortDirection ?? -1);
    const network = CHAIN_ID_TO_NETWORK[chainId];

    const sortStage = [{ $sort: { [sortBy]: sortDirection } }];

    const result = await User.aggregate([
      { $match: { network } },
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
      { $unwind: "$transactions" },
      {
        $group: {
          _id: { address: "$address", action: "$transactions.action" },
          amountUSD: { $sum: "$transactions.amountUSD" },
          txCount: { $sum: 1 },
        },
      },
      {
        $group: {
          _id: "$_id.address",
          total: { $sum: "$amountUSD" },
          txCount: { $sum: "$txCount" },
          mints: {
            $sum: {
              $cond: [{ $eq: ["$_id.action", "mint"] }, "$amountUSD", 0],
            },
          },
          redeems: {
            $sum: {
              $cond: [{ $eq: ["$_id.action", "redeem"] }, "$amountUSD", 0],
            },
          },
          swaps: {
            $sum: {
              $cond: [{ $eq: ["$_id.action", "swap"] }, "$amountUSD", 0],
            },
          },
          joins: {
            $sum: {
              $cond: [{ $eq: ["$_id.action", "join"] }, "$amountUSD", 0],
            },
          },
          exits: {
            $sum: {
              $cond: [{ $eq: ["$_id.action", "exit"] }, "$amountUSD", 0],
            },
          },
        },
      },
      ...sortStage,
      { $limit: 1000 },
      { $set: { address: "$_id" } },
      { $project: { _id: 0 } },
    ]);

    return result;
  },

  async getUser(params) {
    const address = params?.address?.toLowerCase();
    const chainId = params?.chainId ?? 1;
    const network = CHAIN_ID_TO_NETWORK[chainId];

    const transactions = await Transaction.aggregate([
      { $match: { network } },
      { $match: { user: address } },
    ]);

    const balances = await UserToken.aggregate([
      { $match: { network } },
      { $match: { user: address } },
      {
        $lookup: {
          from: "tokens",
          let: { address: "$token" },
          pipeline: [
            { $match: { $expr: { $eq: ["$address", "$$address"] } } },
            {
              $project: {
                _id: 0,
                address: 1,
                name: 1,
                symbol: 1,
                decimals: 1,
                type: 1,
              },
            },
          ],
          as: "token",
        },
      },
      { $sort: { balance: -1 } },
      { $set: { token: { $first: "$token" } } },
    ]);

    return { balances };
  },
};
