import { Agenda } from "agenda/es";
import mongoose from "mongoose";
import { DB_URL } from "../config";
import { syncSubgraph } from "../subgraph";
import { syncTokenPrices } from "../sync/tokenPrices";

const agenda = new Agenda({
  db: { address: DB_URL, options: { useUnifiedTopology: true } },
});

const SYNC_SUBGRAPH = "SYNC_SUBGRAPH";
const SYNC_TOKEN_PRICES = "SYNC_TOKEN_PRICES";

export async function setupJobs() {
  await mongoose.connection.db
    .collection("agendaJobs")
    .updateMany({ lockedAt: { $exists: true } }, { $set: { lockedAt: null } });

  agenda.define(
    SYNC_SUBGRAPH,
    { priority: "high", concurrency: 10 },
    handleSyncSubgraph
  );
  agenda.define(
    SYNC_TOKEN_PRICES,
    { priority: "high", concurrency: 10 },
    handleSyncTokenPrices
  );

  await agenda.start();

  await agenda.every("10 minutes", SYNC_SUBGRAPH);
  await agenda.every("5 minutes", SYNC_TOKEN_PRICES);
}

async function handleSyncSubgraph(job) {
  await syncSubgraph();
}

async function handleSyncTokenPrices(job) {
  console.log("sync token prices");
  await syncTokenPrices();
}
