import { fetchAll, ANALYTICS_SUBGRAPH_URL } from "../index";
import query from "../queries/transactions";
import { Sync as SyncService } from "../../services";
import { Transaction } from "../../models";

export async function syncTransactions(network, syncFromBeginning = false) {
  const url = ANALYTICS_SUBGRAPH_URL[network];
  const entity = "transactions";

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
        timestamp: 1000 * doc.timestamp,
        market: doc.market?.id,
        yieldContract: doc.yieldContract?.id,
        user: doc.user.id,
        inputs: doc.inputs.map((input) => ({
          ...input,
          token: input.token.id,
        })),
        outputs: doc.outputs.map((output) => ({
          ...output,
          token: output.token.id,
        })),
      },
      upsert: true,
    },
  }));

  await Transaction.bulkWrite(bwQuery);
  await SyncService.updateLastIdOf(entity, network, result.lastId);
  console.log(`Synced ${entity}`);
}
