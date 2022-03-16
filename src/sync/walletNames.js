import { provider } from "./index";
import { ethers, Contract } from "ethers";
import ENS, { getEnsAddress } from "@ensdomains/ensjs";
import namehash from "eth-ens-namehash";
import ReverseRecordsAbi from "../abis/ReverseRecords.json";
import { User } from "../models";

export async function syncWalletNames(address) {
  const contract = new Contract(
    "0x3671aE578E63FdF66ad4F3E12CC0c0d71Ac7510C",
    ReverseRecordsAbi,
    provider
  );

  const users = await User.find({}).lean();
  const addresses = users.map((user) => user.address);

  const allnames = await contract.getNames(addresses);
  const validNames = allnames.filter((n) => namehash.normalize(n) === n);

  const bulkQuery = addresses.map((address, index) => ({
    updateOne: {
      filter: { address },
      update: { name: validNames[index] },
    },
  }));

  await User.bulkWrite(bulkQuery);
}
