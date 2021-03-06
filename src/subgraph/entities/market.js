import { Contract } from "ethers";
import { fetchAll, ANALYTICS_SUBGRAPH_URL } from "../index";
import query from "../queries/markets";
import { Sync as SyncService } from "../../services";
import { Market } from "../../models";
import { PROVIDERS } from "../../sync";
import PendleMarketAbi from "../../abis/PendleMarket.json";

export async function syncMarkets(network, syncFromBeginning = false) {
  const url = ANALYTICS_SUBGRAPH_URL[network];
  const entity = "markets";

  let lastId = "";
  if (!syncFromBeginning) {
    lastId = await SyncService.getLastIdOf(entity, network);
  }
  const result = await fetchAll(url, query, { lastId });

  const bwQuery = result.documents.map((doc) => ({
    updateOne: {
      filter: { address: doc.id },
      update: {
        ...doc,
        network,
        timestamp: 1000 * doc.timestamp,
        expiry: 1000 * doc.expiry,
        startTime: 1000 * doc.startTime,
        token0: doc.token0.id,
        token1: doc.token1.id,
        baseToken: doc.baseToken.id,
        quoteToken: doc.quoteToken.id,
      },
      upsert: true,
    },
  }));

  await Market.bulkWrite(bwQuery);
  await SyncService.updateLastIdOf(entity, network, result.lastId);
  await syncHardcodedMarkets();
  await blacklistMarkets();
  await syncStartTimes();

  console.log(`Synced ${entity}`);
}

const HARDCODED_MARKETS = [
  {
    network: "mainnet",
    address: "0x37922c69b08babcceae735a31235c81f1d1e8e43",
    name: "PENDLE / WETH",
    type: "generic",
    baseToken: "0x808507121b80c02388fad14726482e061b8da827",
    quoteToken: "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2",
    token0: "0x808507121b80c02388fad14726482e061b8da827", // PENDLE
    token1: "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2", // WETH
  },
  {
    network: "mainnet",
    address: "0x397ff1542f962076d0bfe58ea045ffa2d347aca0",
    name: "USDC / WETH",
    type: "generic",
    baseToken: "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2",
    quoteToken: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
    token0: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48", // USDC
    token1: "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2", // WETH
  },
  {
    network: "avalanche",
    address: "0x3acd2ff1c3450bc8a9765afd8d0dea8e40822c86",
    name: "WAVAX / PENDLE",
    type: "generic",
    baseToken: "0xfb98b335551a418cd0737375a2ea0ded62ea213b",
    quoteToken: "0xb31f66aa3c1e785363f0875a1b74e27b85fd66c7",
    token0: "0xb31f66aa3c1e785363f0875a1b74e27b85fd66c7", // WAVAX
    token1: "0xfb98b335551a418cd0737375a2ea0ded62ea213b", // PENDLE
  },
];

async function syncHardcodedMarkets() {
  const bwQuery = HARDCODED_MARKETS.map((doc) => ({
    updateOne: {
      filter: { address: doc.address },
      update: doc,
      upsert: true,
    },
  }));
  await Market.bulkWrite(bwQuery);
}

const BLACKLISTED_MARKETS = [
  "0x3424ce4aa5159fa19a11e22d442e0451e8148558", // YT-wMEMO-23DEC2021 / USDC.e
  "0xfedaffb209d463fc247a4ebb0f694e4537e2a5a0", // OT-wMEMO-23DEC2021 / USDC.e
  "0x73a62de3b35126ae8f6a4547b9cbc170bc852001", // YT-cDAI-29DEC2022 / USDC
  "0x1e790169999eb3bf4bcd41c650ab417faa53138d", // OT-cDAI-29DEC2022 / USDC
  "0xbc1e38aa28d2f01f69ff5af64172c3ef67cf7274", // OT-SLP-29DEC2022 / PENDLE
];

async function blacklistMarkets() {
  const bwQuery = BLACKLISTED_MARKETS.map((address) => ({
    updateOne: {
      filter: { address: address },
      update: { blacklisted: true },
    },
  }));
  await Market.bulkWrite(bwQuery);
  console.log("Updated blacklisted markets");
}

export async function syncStartTimes() {
  const markets = await Market.find({ type: "yt" });
  const results = await Promise.all(
    markets.map((market) => getStartEpoch(market))
  );

  const bwQuery = results.map((result) => ({
    updateOne: {
      filter: { address: result.address },
      update: { startTime: 1000 * result.startEpoch },
    },
  }));
  await Market.bulkWrite(bwQuery);
}

async function getStartEpoch({ address, network }) {
  const provider = PROVIDERS[network];
  const contract = new Contract(address, PendleMarketAbi, provider);

  const start = await contract.start();
  const startEpoch = parseInt(start.toString());

  return { address, startEpoch };
}
