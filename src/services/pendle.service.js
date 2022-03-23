import { getPendleMarketData, getPendleHistory } from "../adapters/Coingecko";
import { Token } from "../services";
import { syncTokenTransfers } from "../sync/tokens/transfer";
import { CHAIN_ID_TO_NETWORK, PENDLE_TOKEN_ADDRESS } from "../utils/constants";

export default {
  async getPendleStats(query) {
    const chainId = query?.chainId ?? 1;
    const network = CHAIN_ID_TO_NETWORK[chainId];
    const address = PENDLE_TOKEN_ADDRESS[chainId];

    const marketData = await getPendleMarketData();

    return { ...marketData };
  },

  async getPendleHistory() {
    return await getPendleHistory();
  },
};
