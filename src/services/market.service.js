import { Market } from "../models";

export async function getMarketMap() {
  const markets = await Market.find({}).lean();
  const marketMap = markets.reduce((a, b) => {
    if (!a[b.market]) {
      a[b.market] = b;
    }
    return a;
  }, {});
  return marketMap;
}
