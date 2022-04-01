import { Market, Token } from "../models";
import { getOTPoolInfo, getYTPoolInfo } from "../adapters/Pendle";
import BigNumber from "bignumber.js";
import { RONE, pow10 } from "../utils/helpers";

export async function syncMarketReserves() {
  await Promise.all([syncOTMarketReserves(), syncYTMarketReserves()]);
}

export async function syncOTMarketReserves() {
  const otMarkets = await Market.find({ type: "ot" });

  const promises = otMarkets.map((market) =>
    syncOtMarket({ address: market.address, network: market.network })
  );
  const results = await Promise.all(promises);

  const bwQuery = results.map((result) => {
    const market = result.market;
    const token0 = result.token0;
    const token1 = result.token1;

    const reserve0 = new BigNumber(market.reserve0)
      .div(pow10(token0.decimals))
      .toString();
    const reserve1 = new BigNumber(market.reserve1)
      .div(pow10(token1.decimals))
      .toString();
    const totalSupply = new BigNumber(market.totalSupply)
      .div(pow10(market.decimals))
      .toString();

    return {
      updateOne: {
        filter: { network: market.network, address: market.address },
        update: {
          decimals: market.decimals,
          reserve0: reserve0,
          reserve1: reserve1,
          totalSupply: totalSupply,
        },
      },
    };
  });

  await Market.bulkWrite(bwQuery);
  console.log("Synced OT market reserves");
}

export async function syncYTMarketReserves() {
  const ytMarkets = await Market.find({ type: "yt" });

  const promises = ytMarkets.map((market) =>
    syncYtMarket({ address: market.address, network: market.network })
  );
  const results = await Promise.all(promises);

  const bwQuery = results.map((result) => {
    const market = result.market;
    const token0 = result.token0;
    const token1 = result.token1;

    const reserve0 = new BigNumber(market.ytBalance)
      .div(pow10(token0.decimals))
      .toString();
    const reserve1 = new BigNumber(market.tokenBalance)
      .div(pow10(token1.decimals))
      .toString();
    const totalSupply = new BigNumber(market.totalSupply)
      .div(pow10(market.decimals))
      .toString();
    const ytWeight = new BigNumber(market.ytWeight).div(RONE).toString();

    return {
      updateOne: {
        filter: { network: market.network, address: market.address },
        update: {
          decimals: market.decimals,
          reserve0: reserve0,
          reserve1: reserve1,
          totalSupply: totalSupply,
          ytWeight: ytWeight,
        },
      },
    };
  });

  await Market.bulkWrite(bwQuery);
  console.log("Synced YT market reserves");
}

async function syncOtMarket({ network, address }) {
  const market = await Market.findOne({ network, address });
  const token0 = await Token.findOne({ network, address: market.token0 });
  const token1 = await Token.findOne({ network, address: market.token1 });
  const result = await getOTPoolInfo({ address, network });

  return { market: { ...result, network, address }, token0, token1 };
}

async function syncYtMarket({ network, address }) {
  const market = await Market.findOne({ network, address });
  const token0 = await Token.findOne({ network, address: market.token0 });
  const token1 = await Token.findOne({ network, address: market.token1 });
  const result = await getYTPoolInfo({ address, network });

  return { market: { ...result, network, address }, token0, token1 };
}
