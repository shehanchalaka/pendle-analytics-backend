import { Contract } from "ethers";
import BigNumber from "bignumber.js";
import { provider } from "../index";
import ERC20Abi from "../../abis/ERC20.json";
import { Transfer } from "../../models";

export async function syncTokenTransfers(network, address) {
  const contract = new Contract(address, ERC20Abi, provider);
  const eventFilter = contract.filters.Transfer();
  const events = await contract.queryFilter(eventFilter);

  const symbol = await contract.symbol();
  const decimals = await contract.decimals();

  await Transfer.deleteMany({ token: new RegExp(address, "i") });

  const bulkQuery = events.map((event) => {
    const value = new BigNumber(event.args.value.toString())
      .div(BigNumber(10).pow(decimals))
      .toString();
    return {
      insertOne: {
        document: {
          network,
          token: event.address,
          from: event.args.from,
          to: event.args.to,
          value,
        },
      },
    };
  });

  await Transfer.bulkWrite(bulkQuery);
  console.log(`Transfers synced: ${symbol}`);
}
