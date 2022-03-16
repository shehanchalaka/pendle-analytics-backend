import { fetchAll, ANALYTICS_SUBGRAPH_URL } from "../index";
import query from "../queries/tokens";
import { Sync as SyncService } from "../../services";
import { Token } from "../../models";

export async function syncTokens(network, syncFromBeginning = false) {
  const url = ANALYTICS_SUBGRAPH_URL[network];
  const entity = "tokens";

  let lastId = "";
  if (!syncFromBeginning) {
    lastId = await SyncService.getLastIdOf(entity, network);
  }
  const result = await fetchAll(url, query, { lastId });
  await SyncService.updateLastIdOf(entity, network, result.lastId);

  const bwQuery = result.documents.map((doc) => ({
    updateOne: {
      filter: { address: doc.id },
      update: { ...doc, network, address: doc.id },
      upsert: true,
    },
  }));

  await Token.bulkWrite(bwQuery);
  console.log(`Synced ${entity}`);
}
