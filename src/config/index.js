require("dotenv").config();

export const {
  PORT = 8080,
  NODE_ENV = "development",

  DB_URL,

  ETHEREUM_START_BLOCK,
  AVALANCHE_START_BLOCK,

  ETHEREUM_RPC_URL,
  AVALANCHE_RPC_URL,

  ANALYTICS_MAINNET_SUBGRAPH_URL,
  ANALYTICS_AVALANCHE_SUBGRAPH_URL,

  RAW_DATA_MAINNET_SUBGRAPH_URL,
  RAW_DATA_ACALANCHE_SUBGRAPH_URL,

  PRICE_FEED_MAINNET_SUBGRAPH_URL,
  PRICE_FEED_AVALANCHE_SUBGRAPH_URL,

  TOKENS_MAINNET_SUBGRAPH_URL,
  TOKENS_AVALANCHE_SUBGRAPH_URL,

  COVALENT_API_KEY,

  MORALIS_API_KEY,
} = process.env;
