import { fetchAll, TOKENS_SUBGRAPH_URL } from "../index";
import query from "../queries/userTokens";
import { Sync as SyncService } from "../../services";
import { UserToken } from "../../models";

export async function syncUserTokens(network, syncFromBeginning = false) {
  const url = TOKENS_SUBGRAPH_URL[network];
  const entity = "userToken";

  let lastId = "";
  if (!syncFromBeginning) {
    lastId = await SyncService.getLastIdOf(entity, network);
  }
  const result = await fetchAll(url, query, { lastId });

  const bwQuery = result.documents.map((doc) => ({
    updateOne: {
      filter: { id: doc.id },
      update: {
        ...doc,
        network,
        user: doc.user.id,
        token: doc.token.id,
      },
      upsert: true,
    },
  }));

  await UserToken.bulkWrite(bwQuery);
  await SyncService.updateLastIdOf(entity, network, result.lastId);
  console.log(`Synced ${entity}`);
}
