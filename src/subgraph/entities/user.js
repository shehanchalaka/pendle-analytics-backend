import { fetchAll, ANALYTICS_SUBGRAPH_URL } from "../index";
import query from "../queries/users";
import { Sync as SyncService } from "../../services";
import { User } from "../../models";

export async function syncUsers(network, syncFromBeginning = false) {
  const url = ANALYTICS_SUBGRAPH_URL[network];
  const entity = "users";

  let lastId = "";
  if (!syncFromBeginning) {
    lastId = await SyncService.getLastIdOf(entity, network);
  }
  const result = await fetchAll(url, query, { lastId });

  const bwQuery = result.documents.map((doc) => ({
    updateOne: {
      filter: { address: doc.id },
      update: { ...doc, network, address: doc.id },
      upsert: true,
    },
  }));

  await User.bulkWrite(bwQuery);
  await SyncService.updateLastIdOf(entity, network, result.lastId);
  console.log(`Synced ${entity}`);
}
