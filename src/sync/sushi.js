import { Market, Token } from "../models";
import SushiPairAbi from "../abis/SushiswapPair.json";

const markets = [
  {
    market: "0x0D8a21f2Ea15269B7470c347083ee1f85e6A723B", // POOL_OT_AUSDC_29_DEC_2022_X_USDC
    token0: "0x8fcb1783bF4b71A51F702aF0c266729C4592204a",
    token1: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", // USDC
  },
  {
    market: "0x8B758d7fD0fC58FCA8caA5e53AF2c7Da5F5F8De1", // POOL_OT_AUSDC_30_DEC_2021_X_USDC
    token0: "0x010a0288aF52ED61e32674D82bBc7dDBFA9a1324",
    token1: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", // USDC
  },
  {
    market: "0x2C80D72af9AB0bb9D98F607C817c6F512dd647e6", // POOL_OT_CDAI_30_DEC_2021_X_USDC
    token0: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", // USDC
    token1: "0xE55e3B62005a2035D48aC0C41A5A9c799F04892C", //
  },
  {
    market: "0x4556C4488CC16D5e9552cC1a99a529c1392E4fe9", // POOL_OT_CDAI_29_DEC_2022_X_USDC
    token0: "0x3D4e7F52efaFb9E0C70179B688FC3965a75BCfEa",
    token1: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", // USDC
  },
  {
    market: "0xb124C4e18A282143D362a066736FD60d22393Ef4", // POOL_OT_SLP_PENDLE_WETH_29_DEC_2022_X_PENDLE
    token0: "0x808507121B80c02388fAd14726482e061B8da827", // PENDLE
    token1: "0xbF682bd31a615123D28d611b38b0aE3d2b675C2C",
  },
  {
    market: "0x72972b21Ce425cFd67935E07C68e84300cE3F40F", // POOL_OT_SLP_USDC_WETH_29_DEC_2022_X_USDC
    token0: "0x322D6c69048330247165231EB7848A5C80a48878",
    token1: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", // USDC
  },
  {
    market: "0x4C5BE0fEa74c33455F81c85561146BdAF09633dA", // POOL_OT_WXBTRFLY_21_APR_2022_X_USDC
    token0: "0x189564397643D9e6173A002f1BA98da7d40a0FA6",
    token1: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", // USDC
  },
];

export async function syncSushiMarkets() {
  const bulkWriteQuery = markets.map((market) => ({
    updateOne: {
      filter: {
        hash: market.market,
      },
      update: {
        // hash: event.transactionHash,
        // block: event.blockNumber,
        // timestamp: block.timestamp,
        market: market.market,
        token0: market.token0,
        token1: market.token1,
        type: "ot",
      },
      upsert: true,
    },
  }));

  await Market.bulkWrite(bulkWriteQuery);
  console.log("Done syncing sushi markets");
}
