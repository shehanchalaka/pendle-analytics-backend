import { Transaction } from "../models";
import { Market, YieldContract } from "../services";
import { CHAIN_ID_TO_NETWORK } from "../utils/constants";
import { toUTC } from "../utils/helpers";

export default {
  async getStatsByNetwork(chainId, query) {
    const network = CHAIN_ID_TO_NETWORK[chainId] ?? "mainnet";

    const yieldContracts = await YieldContract.model().find({ network });
    const otMarkets = await Market.model().find({ network, type: "ot" });
    const ytMarkets = await Market.model().find({ network, type: "yt" });

    const forges = await Promise.allSettled(
      yieldContracts.map((t) =>
        YieldContract.getStats({
          forgeId: t.forgeId,
          expiry: toUTC(t.expiry),
          underlyingToken: t.underlyingToken,
        })
      )
    );

    let lockedVolumeUSD = 0;
    let mintVolumeUSD = 0;

    forges.forEach((item) => {
      if (item.status !== "fulfilled") return;

      const value = item.value;
      lockedVolumeUSD += value?.lockedVolumeUSD ?? 0;
      mintVolumeUSD += value?.mintVolumeUSD ?? 0;
    });

    const ot_markets = await Promise.allSettled(
      otMarkets.map((t) => Market.getStats({ market: t.address }))
    );

    let otTvl = 0;
    let otTradingVolumeUSD = 0;
    let otAverageTradeSizeUSD = 0;

    ot_markets.forEach((item) => {
      if (item.status !== "fulfilled") return;

      const value = item.value;
      otTvl += value?.tvl ?? 0;
      otTradingVolumeUSD += value?.tradingVolumeUSD ?? 0;
      otAverageTradeSizeUSD += value?.averageTradingVolumeUSD ?? 0;
    });

    otAverageTradeSizeUSD /= ot_markets.length;

    const yt_markets = await Promise.allSettled(
      ytMarkets.map((t) => Market.getStats({ market: t.address }))
    );

    let ytTvl = 0;
    let ytTradingVolumeUSD = 0;
    let ytAverageTradeSizeUSD = 0;

    yt_markets.forEach((item) => {
      if (item.status !== "fulfilled") return;

      const value = item.value;
      ytTvl += parseFloat(value?.tvl ?? 0);
      ytTradingVolumeUSD += value?.tradingVolumeUSD ?? 0;
      ytAverageTradeSizeUSD += value?.averageTradingVolumeUSD ?? 0;
    });

    ytAverageTradeSizeUSD /= yt_markets.length;

    return {
      forges: {
        lockedVolumeUSD,
        mintVolumeUSD,
      },
      otMarkets: {
        tvl: otTvl,
        tradingVolumeUSD: otTradingVolumeUSD,
        averageTradeSizeUSD: otAverageTradeSizeUSD,
      },
      ytMarkets: {
        tvl: ytTvl,
        tradingVolumeUSD: ytTradingVolumeUSD,
        averageTradeSizeUSD: ytAverageTradeSizeUSD,
      },
    };
  },

  async getAllForgesHistory(chainId, query) {
    const network = CHAIN_ID_TO_NETWORK[chainId] ?? "mainnet";

    const yieldContracts = await YieldContract.model().find({ network });

    const forges = await Promise.allSettled(
      yieldContracts.map((t) =>
        YieldContract.getHistoryChart({
          forgeId: t.forgeId,
          expiry: toUTC(t.expiry),
          underlyingToken: t.underlyingToken,
        })
      )
    );

    return forges;
  },

  async getAllTradingHistory(chainId, query) {
    const network = CHAIN_ID_TO_NETWORK[chainId] ?? "mainnet";
    const type = query?.type ?? undefined;

    const otMarkets = await Market.model().find({ network, type });

    const ot_markets = await Promise.allSettled(
      otMarkets.map((t) => Market.getTradingHistory({ market: t.address }))
    );

    const charts = [];

    ot_markets.forEach((market) => {
      if (market.value) {
        charts.push(market.value);
      }
    });

    return charts;
  },
};
