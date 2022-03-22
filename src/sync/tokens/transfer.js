import { Contract } from "ethers";
import BigNumber from "bignumber.js";
import { PROVIDERS } from "../index";
import ERC20Abi from "../../abis/ERC20.json";
import { Transfer } from "../../models";
import { get } from "../../adapters/Covalent";

export async function syncTokenTransfers(network, address) {
  if (network === "mainnet") {
    await syncFromEthers(network, address);
  } else if (network === "avalanche") {
    await syncFromCovalent(network, address);
  }
}

export async function syncFromEthers(network, address) {
  const provider = PROVIDERS[network];
  const contract = new Contract(address, ERC20Abi, provider);
  const eventFilter = contract.filters.Transfer();
  const events = await contract.queryFilter(eventFilter);

  const symbol = await contract.symbol();
  const decimals = await contract.decimals();

  await Transfer.deleteMany({ token: new RegExp(address, "i") });

  const bulkQuery = events.map((event) => {
    const value = new BigNumber(event.args.value.toString())
      .div(BigNumber(10).pow(decimals))
      .toNumber();
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

export async function syncFromCovalent(network, address) {
  const provider = PROVIDERS[network];
  const endBlock = await provider.getBlockNumber();

  const events = await get({
    network,
    tokenAddress: address,
    startBlock: 6725186,
    endBlock,
  });

  await Transfer.deleteMany({ token: new RegExp(address, "i") });

  const bulkQuery = events.map((event) => {
    const decimals = event.sender_contract_decimals;

    const rawValue = event.decoded.params.find((t) => t.name === "value").value;
    const from = event.decoded.params.find((t) => t.name === "from").value;
    const to = event.decoded.params.find((t) => t.name === "to").value;

    const value = new BigNumber(rawValue)
      .div(BigNumber(10).pow(decimals))
      .toNumber();

    return {
      insertOne: {
        document: {
          network,
          token: event.sender_address.toLowerCase(),
          from,
          to,
          value,
        },
      },
    };
  });

  await Transfer.bulkWrite(bulkQuery);
  console.log(`Transfers synced: ${address}`);
}
