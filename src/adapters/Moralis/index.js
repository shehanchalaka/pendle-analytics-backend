import axios from "axios";
import { MORALIS_API_KEY } from "../../config";
import BigNumber from "bignumber.js";

const NETWORKISH_TO_CHAIN = {
  mainnet: "eth",
  avalanche: "avalanche",
};

export async function getUserDetails({ network, address }) {
  const chain = NETWORKISH_TO_CHAIN[network];
  console.log(chain, address);
  const result = await axios({
    baseURL: "https://deep-index.moralis.io/api/v2",
    url: `${address}/erc20`,
    params: {
      chain,
    },
    headers: {
      "x-api-key": MORALIS_API_KEY,
    },
  });

  const mapped = result.data.map((t) => ({
    address: t.token_address,
    name: t.name,
    symbol: t.symbol,
    decimals: t.decimals,
    icon: t.logo,
    balance: new BigNumber(t.balance).div(new BigNumber(10).pow(t.decimals)),
  }));

  return mapped;
}
