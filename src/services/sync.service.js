import { Sync } from "../models";

export default {
  async getLastIdOf(entity, network) {
    let found = await Sync.findOne({ network });
    if (!found) {
      found = await Sync.create({ network });
    }
    const key = `${network}-${entity}`;
    return found?.lastId?.[key] ?? "";
  },

  async updateLastIdOf(entity, network, lastId) {
    const key = `${network}-${entity}`;
    return await Sync.updateOne({ network }, { [`lastId.${key}`]: lastId });
  },
};
