import { ethers } from "ethers";
import { syncBlocks } from "./block";
import { syncToken } from "./token";
import {
  syncForges,
  syncYieldContracts,
  syncMints,
  syncRedeems,
} from "./forges";
import { syncMarkets, syncPriceHistory } from "./markets";
import { syncSushiMarkets } from "./sushi";
import { syncPendlePrice } from "./price/pendle";
import { syncWethPrice } from "./price/weth";
import { syncBtrflyPrice } from "./price/wxbtrfly";
import { syncTokenTransfers } from "./tokens/transfer";
import { syncWalletNames } from "./walletNames";
import { ETHEREUM_RPC_URL, AVALANCHE_RPC_URL } from "../config";

export const provider = new ethers.providers.JsonRpcProvider(ETHEREUM_RPC_URL);

export async function sync() {
  // console.log("Sync started!");
  // syncBlocks();
  // await syncWethPrice();
  // syncPendlePrice();
  // syncBtrflyPrice();
  // syncForgeData()
  // syncMarketData();
  // const tokens = [
  //   "0x8fcb1783bF4b71A51F702aF0c266729C4592204a",
  //   "0x010a0288af52ed61e32674d82bbc7ddbfa9a1324",
  //   "0x3D4e7F52efaFb9E0C70179B688FC3965a75BCfEa",
  // ];
  // const network = "avalanche";
  // for (let token of tokens) {
  // syncTokenTransfers(network, token);
  // }
  // syncWalletNames("0x220d867A4B85F5B2dA0A816F4B2eC5A41E712Ade");
  // console.log("✅ Syncing done!");
}

async function syncForgeData() {
  const forges = await syncForges();

  for (let forge of forges) {
    const tokens = await syncYieldContracts(forge.forgeAddress);

    for (let token of tokens) {
      await Promise.all([
        syncToken(token.ot, "ot"),
        syncToken(token.xyt, "yt"),
        syncToken(token.underlyingAsset),
        syncToken(token.yieldBearingAsset, "yieldBearing"),
      ]);
    }

    await syncMints(forge.forgeAddress);
    await syncRedeems(forge.forgeAddress);
  }
}

async function syncMarketData() {
  // syncMarkets();
  // syncPriceHistory();
  // syncSushiMarkets();
}
