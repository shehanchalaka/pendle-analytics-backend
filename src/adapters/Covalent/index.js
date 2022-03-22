import axios from "axios";
import { COVALENT_API_KEY } from "../../config";

const BASE_URL_V1 = "https://api.covalenthq.com/v1";
const MAX_BLOCK_RANGE = 1000000;

const NETWORKISH_TO_CHAIN_ID = {
  1: 1,
  43114: 43114,
  mainnet: 1,
  ethereum: 1,
  avalanche: 43114,
};

export async function get({ network, tokenAddress, startBlock, endBlock }) {
  const chainId = NETWORKISH_TO_CHAIN_ID[network];

  const results = [];
  for (let _start = startBlock; _start < endBlock; _start += MAX_BLOCK_RANGE) {
    const _end = Math.min(endBlock, _start + MAX_BLOCK_RANGE) - 1;

    const result = await batcher({
      chainId,
      tokenAddress,
      startBlock: _start,
      endBlock: _end,
    });
    results.push(...result);
  }
  return results;
}

export async function batcher({ chainId, tokenAddress, startBlock, endBlock }) {
  const result = await axios({
    baseURL: BASE_URL_V1,
    url: `/${chainId}/events/address/${tokenAddress}/`,
    params: {
      key: COVALENT_API_KEY,
      "starting-block": startBlock,
      "ending-block": endBlock,
    },
  });

  const items = result.data?.data?.items ?? [];
  const transfers = items.filter((t) => t.decoded.name === "Transfer");
  return transfers;
}
