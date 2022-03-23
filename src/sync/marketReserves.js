import { Market } from "../models";
import { getOTPoolInfo, getYTPoolInfo } from "../adapters/Pendle";

export async function syncMarketReserves() {
  const otMarkets = await Market.find({ type: "ot" });
  const ytMarkets = await Market.find({ type: "yt" });

  const promises = otMarkets.map((market) =>
    syncOtMarket({ address: market.address, network: market.network })
  );
  const results = await Promise.all(promises);

  const bwQuery = results.map((result) => ({
    updateOne: {
      filter: { address: result.address },
      update: {
        decimals: result.decimals,
        reserve0: result.reserve0,
        reserve1: result.reserve1,
        totalSupply: result.totalSupply,
      },
    },
  }));

  await Market.bulkWrite(bwQuery);
  console.log("Synced market reserves");
}

async function syncOtMarket({ address, network }) {
  const result = await getOTPoolInfo({ address, network });
  return { ...result, address };
}
