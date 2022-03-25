import { getPendleMarketData, getPendleHistory } from "../adapters/Coingecko";
import { UserToken } from "../models";
import { CHAIN_ID_TO_NETWORK, PENDLE_TOKEN_ADDRESS } from "../utils/constants";

export default {
  async getPendleStats(query) {
    const chainId = query?.chainId ?? 1;
    const network = CHAIN_ID_TO_NETWORK[chainId];
    const address = PENDLE_TOKEN_ADDRESS[chainId];

    const marketData = await getPendleMarketData();

    const results = await UserToken.aggregate([
      { $match: { network } },
      { $match: { token: address } },
      { $match: { balance: { $gt: 0 } } },
      { $count: "holders" },
    ]);
    const holders = results?.[0]?.holders ?? 0;

    return { ...marketData, holders };
  },

  async getPendleHistory() {
    return await getPendleHistory();
  },
};
