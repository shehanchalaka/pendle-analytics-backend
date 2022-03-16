import { Schema, model } from "mongoose";

const schema = new Schema(
  {
    network: { type: String, index: true },
    lastBlock: { type: Number },
    lastId: { type: Object },
  },
  { strict: false }
);

export default model("Sync", schema);
