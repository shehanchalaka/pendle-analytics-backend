import { Schema, model } from "mongoose";

const schema = new Schema({
  network: { type: String, index: true },
  block: { type: Number },
  timestamp: { type: Date },
  address: { type: String, index: true },
  name: { type: String },
  type: { type: String, index: true },
  token0: { type: String, index: true },
  token1: { type: String, index: true },
  baseToken: { type: String, index: true },
  quoteToken: { type: String, index: true },
  startTime: { type: Date },
  expiry: { type: Date },
});

export default model("Market", schema);
