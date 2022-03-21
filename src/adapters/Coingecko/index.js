import axios from "axios";

const BASE_URL_V3 = "https://api.coingecko.com/api/v3";

const NETWORK_TO_PLATFORM = {
  mainnet: "ethereum",
  avalanche: "avalanche",
};

export async function getPrice({ network, address }) {
  const platform = NETWORK_TO_PLATFORM[network];

  const result = await axios({
    baseURL: BASE_URL_V3,
    url: `/simple/token_price/${platform}`,
    params: {
      contract_addresses: address,
      vs_currencies: "usd",
      include_last_updated_at: true,
    },
  });
  const data = result.data;

  if (!data[address]) return { found: false };

  return {
    found: true,
    price: data[address].usd,
    lastUpdatedAt: data[address].last_updated_at,
  };
}
