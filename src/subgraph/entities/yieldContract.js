import { fetchAll, ANALYTICS_SUBGRAPH_URL } from "../index";
import query from "../queries/yieldContracts";
import { Sync as SyncService } from "../../services";
import { YieldContract } from "../../models";

export async function syncYieldContracts(network, syncFromBeginning = false) {
  const url = ANALYTICS_SUBGRAPH_URL[network];
  const entity = "yieldContract";

  let lastId = "";
  if (!syncFromBeginning) {
    lastId = await SyncService.getLastIdOf(entity, network);
  }
  const result = await fetchAll(url, query, { lastId });
  await SyncService.updateLastIdOf(entity, network, result.lastId);

  const bwQuery = result.documents.map((doc) => ({
    updateOne: {
      filter: { id: doc.id },
      update: {
        ...doc,
        network,
        timestamp: 1000 * doc.timestamp,
        expiry: 1000 * doc.expiry,
        underlyingToken: doc.underlyingToken.id,
        yieldBearingToken: doc.yieldBearingToken.id,
        ot: doc.ot.id,
        yt: doc.yt.id,
      },
      upsert: true,
    },
  }));

  await YieldContract.bulkWrite(bwQuery);
  console.log("Synced yield contracts");
}
