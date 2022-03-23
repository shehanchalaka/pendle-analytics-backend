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

export async function getPendleMarketData() {
  const result = await axios({
    baseURL: BASE_URL_V3,
    url: "/coins/pendle",
  });
  const data = result.data;
  const marketData = data?.market_data;

  const currentPrice = marketData?.current_price?.usd ?? 0;
  const marketCap = marketData?.market_cap?.usd ?? 0;
  const totalSupply = marketData?.total_supply ?? 0;
  const circulatingSupply = marketData?.circulating_supply ?? 0;
  const tvl = marketData?.total_value_locked?.usd ?? 0;

  return { currentPrice, marketCap, totalSupply, circulatingSupply, tvl };
}

export async function getPendleHistory() {
  const result = await axios({
    baseURL: BASE_URL_V3,
    url: "coins/pendle/market_chart",
    params: {
      vs_currency: "usd",
      days: 1000,
    },
  });

  const priceChart = result.data?.prices?.map((dataPoint) => ({
    time: dataPoint[0] / 1000,
    value: dataPoint[1],
  }));

  return priceChart;
}
