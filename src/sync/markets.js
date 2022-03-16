import { ethers, Contract } from "ethers";
import { provider } from "./index";
import BigNumber from "bignumber.js";
import PendleRouterAbi from "../abis/PendleRouter.json";
import PendleMarketAbi from "../abis/PendleMarket.json";
import { Market, Token } from "../models";
import { getTokenMap } from "../services/token.service";
import { getMarketMap } from "../services/market.service";

const RONE = new BigNumber(2).pow(40);

export async function syncMarkets() {
  const pendleRouterAddress = "0x1b6d3E5Da9004668E14Ca39d1553E9a46Fe842B3";
  const contract = new Contract(pendleRouterAddress, PendleRouterAbi, provider);
  const eventFilter = contract.filters.MarketCreated();
  let events = await contract.queryFilter(eventFilter);

  const promises = events.map(async (event) => {
    const block = await event.getBlock();

    return {
      updateOne: {
        filter: {
          hash: event.transactionHash,
        },
        update: {
          hash: event.transactionHash,
          block: event.blockNumber,
          timestamp: block.timestamp,
          market: event.args.market,
          token0: event.args.xyt,
          token1: event.args.token,
          type: "yt",
        },
        upsert: true,
      },
    };
  });

  const bulkWriteQuery = await Promise.all(promises);

  await Market.bulkWrite(bulkWriteQuery);
  console.log("Done syncing markets");
}

export async function syncPriceHistory() {
  const marketAddress = "0xB26C86330FC7F97533051F2F8cD0a90C2E82b5EE";
  const contract = new Contract(marketAddress, PendleMarketAbi, provider);
  const eventFilter = contract.filters.Sync();
  let events = await contract.queryFilter(eventFilter);

  const tokenMap = await getTokenMap();
  const marketMap = await getMarketMap();

  const market = marketMap[marketAddress];
  const token0 = tokenMap[market.token0];
  const token1 = tokenMap[market.token1];
  const token0Decimals = new BigNumber(10).pow(token0.decimals);
  const token1ecimals = new BigNumber(10).pow(token1.decimals);

  const promises = events.map(async (event) => {
    const block = await event.getBlock();

    const ytPrice = 0;

    return {
      updateOne: {
        filter: {
          timestamp: block.timestamp,
          token: market.token0,
        },
        update: {
          timestamp: block.timestamp,
          token: market.token0,
          priceUSD: ytPrice,
        },
        upsert: true,
      },
    };
  });

  const bulkWriteQuery = await Promise.all(promises);
}
