import { PriceHistory } from "../models";

export async function getPriceMap(token) {
  const tokens = await PriceHistory.find({
    token: { $regex: new RegExp(token, "i") },
  });
  const map = tokens.reduce((a, b) => {
    if (!a[b.timestamp]) {
      a[b.timestamp] = b.priceUSD;
    }
    return a;
  }, {});
  return map;
}
