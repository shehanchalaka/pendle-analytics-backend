import { request } from "graphql-request";
import { syncTokens } from "./entities/token";
import { syncUsers } from "./entities/user";
import { syncYieldContracts } from "./entities/yieldContract";
import { syncMarkets } from "./entities/market";
import { syncTransactions } from "./entities/transaction";
import { syncUserTokens } from "./entities/userTokens";
import {
  ANALYTICS_MAINNET_SUBGRAPH_URL,
  ANALYTICS_AVALANCHE_SUBGRAPH_URL,
  TOKENS_MAINNET_SUBGRAPH_URL,
  TOKENS_AVALANCHE_SUBGRAPH_URL,
} from "../config";

export const ANALYTICS_SUBGRAPH_URL = {
  mainnet: ANALYTICS_MAINNET_SUBGRAPH_URL,
  avalanche: ANALYTICS_AVALANCHE_SUBGRAPH_URL,
};

export const TOKENS_SUBGRAPH_URL = {
  mainnet: TOKENS_MAINNET_SUBGRAPH_URL,
  avalanche: TOKENS_AVALANCHE_SUBGRAPH_URL,
};

export async function syncSubgraph() {
  const networks = ["mainnet", "avalanche"];

  for (let network of networks) {
    console.log(`\nSyncing ${network}\n`);

    await syncTokens(network);
    await syncUsers(network);
    await syncYieldContracts(network);
    await syncMarkets(network);
    await syncTransactions(network);
    await syncUserTokens(network);
  }

  console.log("✅ Syncing done!");
}

export async function fetchAll(url, query, variables = {}) {
  let documents = [];
  let lastId = variables.lastId ?? "";
  let allFound = false;

  while (!allFound) {
    const response = await request(url, query, { ...variables, lastId });
    const data = response?.data ?? [];
    documents = documents.concat(data);

    allFound = data.length < 1000;
    lastId = data?.[data.length - 1]?.id ?? lastId;
  }

  return { documents, lastId };
}
