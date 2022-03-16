import { fetchAll, ANALYTICS_SUBGRAPH_URL } from "../index";
import query from "../queries/markets";
import { Sync as SyncService } from "../../services";
import { Market } from "../../models";

export async function syncMarkets(network, syncFromBeginning = false) {
  const url = ANALYTICS_SUBGRAPH_URL[network];
  const entity = "markets";

  let lastId = "";
  if (!syncFromBeginning) {
    lastId = await SyncService.getLastIdOf(entity, network);
  }
  const result = await fetchAll(url, query, { lastId });
  await SyncService.updateLastIdOf(entity, network, result.lastId);

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
  console.log(`Synced ${entity}`);
}
