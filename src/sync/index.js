import { ethers } from "ethers";
import { ETHEREUM_RPC_URL, AVALANCHE_RPC_URL } from "../config";

export const PROVIDERS = {
  mainnet: new ethers.providers.JsonRpcProvider(ETHEREUM_RPC_URL),
  avalanche: new ethers.providers.JsonRpcProvider(AVALANCHE_RPC_URL),
};
