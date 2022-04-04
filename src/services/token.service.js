import { Token, UserToken } from "../models";
import { CHAIN_ID_TO_NETWORK } from "../utils/constants";

export default {
  model() {
    return Token;
  },

  async getTokenHolders(params) {
    const address = params?.address?.toLowerCase();
    const chainId = params?.chainId ?? 1;
    const sortBy = params?.sortBy ?? "totalTransacted";
    const sortDirection = parseInt(params?.sortDirection ?? -1);
    const network = CHAIN_ID_TO_NETWORK[chainId];
    const skip = parseInt(params?.skip ?? 0);
    const limit = parseInt(params?.limit ?? 20);

    const sortStage = [{ $sort: { [sortBy]: sortDirection } }];

    const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

    const result = await UserToken.aggregate([
      { $match: { network } },
      { $match: { token: address } },
      { $match: { balance: { $gt: 0 } } },
      { $match: { user: { $ne: ZERO_ADDRESS } } },
      {
        $set: {
          address: "$user",
          totalTransacted: { $add: ["$totalReceived", "$totalSent"] },
          name: "",
        },
      },
      ...sortStage,
      {
        $facet: {
          data: [
            { $skip: skip },
            { $limit: limit },
            { $project: { _id: 0, id: 0, user: 0 } },
          ],
          total: [{ $count: "total" }],
        },
      },
      { $replaceWith: { $mergeObjects: ["$$ROOT", { $first: "$total" }] } },
      { $set: { skip, limit } },
    ]);

    return result?.[0];
  },

  async getTokenHoldersReport(params) {
    const address = params?.address?.toLowerCase();
    const chainId = params?.chainId ?? 1;
    const network = CHAIN_ID_TO_NETWORK[chainId];

    const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

    const result = await UserToken.aggregate([
      { $match: { network } },
      { $match: { token: address } },
      { $match: { balance: { $gt: 0 } } },
      { $match: { user: { $ne: ZERO_ADDRESS } } },
      {
        $set: {
          address: "$user",
          totalTransacted: { $add: ["$totalReceived", "$totalSent"] },
          name: "",
        },
      },
      { $sort: { balance: -1 } },
    ]);

    return result;
  },
};
