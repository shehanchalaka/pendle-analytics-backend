import { Transfer } from "../models";
import { syncTokenTransfers } from "../sync/tokens/transfer";

const NETWORK = {
  1: "mainnet",
  43114: "avalanche",
};

export default {
  async check(network, address) {
    // TODO replace this logic with checking last synced block number
    const found = await Transfer.findOne({
      network,
      token: new RegExp(address, "i"),
    });
    if (!found) {
      await syncTokenTransfers(network, address);
    }
  },

  async getToken(address, query) {
    const chainId = query.chainId ?? 1;
    const network = NETWORK[chainId];

    await this.check(network, address);

    let transfers = await Transfer.aggregate([
      { $match: { network } },
      { $match: { token: new RegExp(address, "i") } },
    ]);

    if (transfers.length === 0) {
      await syncTokenTransfers(network, address);
      transfers = await Transfer.aggregate([
        { $match: { network } },
        { $match: { token: new RegExp(address, "i") } },
      ]);
    }

    const map = {};

    transfers.forEach((t) => {
      if (!map[t.from]) {
        map[t.from] = {
          address: t.from,
          name: t.name,
          totalSent: t.value,
          totalReceived: 0,
          balance: 0 - t.value,
          totalTransacted: t.value,
        };
      } else {
        map[t.from].totalSent += t.value;
        map[t.from].balance -= t.value;
        map[t.from].totalTransacted += t.value;
      }

      if (!map[t.to]) {
        map[t.to] = {
          address: t.to,
          name: t.name,
          totalSent: 0,
          totalReceived: t.value,
          balance: t.value,
          totalTransacted: t.value,
        };
      } else {
        map[t.to].totalReceived += t.value;
        map[t.to].balance += t.value;
        map[t.to].totalTransacted += t.value;
      }
    });

    const result = Object.values(map).sort(
      (a, b) => b.totalTransacted - a.totalTransacted
    );

    return { result, total: result.length };
  },
};
