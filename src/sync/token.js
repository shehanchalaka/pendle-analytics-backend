import { Contract } from "ethers";
import { provider } from "./index";
import ERC20 from "../abis/ERC20.json";
import { Token } from "../models";

export async function syncToken(address, type = "generic") {
  const contract = new Contract(address, ERC20, provider);
  const [name, symbol, decimals] = await Promise.all([
    contract.name(),
    contract.symbol(),
    contract.decimals(),
  ]);
  await Token.updateOne(
    { address },
    { name, symbol, decimals, type },
    { upsert: true }
  );
  console.log("Synced Token");
}
