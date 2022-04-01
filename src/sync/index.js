import { ethers } from "ethers";
import { ETHEREUM_RPC_URL, AVALANCHE_RPC_URL } from "../config";
import { syncMarketReserves } from "./marketReserves";
import { syncTokenPrices } from "./tokenPrices";

export const PROVIDERS = {
  mainnet: new ethers.providers.JsonRpcProvider(ETHEREUM_RPC_URL),
  avalanche: new ethers.providers.JsonRpcProvider(AVALANCHE_RPC_URL),
};

export async function syncBlockchain() {
  console.log("Syncing blockchain");
  await syncMarketReserves();
  await syncTokenPrices();
}
