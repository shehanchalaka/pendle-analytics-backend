import { Schema, model } from "mongoose";

const schema = new Schema({
  network: { type: String, index: true },
  block: { type: Number },
  timestamp: { type: Date },
  address: { type: String, lowercase: true, index: true },
  name: { type: String },
  type: { type: String, index: true },
  token0: { type: String, lowercase: true, index: true },
  token1: { type: String, lowercase: true, index: true },
  baseToken: { type: String, lowercase: true, index: true },
  quoteToken: { type: String, lowercase: true, index: true },
  startTime: { type: Date },
  expiry: { type: Date },
  decimals: { type: Number },
  reserve0: { type: Number },
  reserve1: { type: Number },
  totalSupply: { type: Number },
  ytWeight: { type: Number },
  blacklisted: { type: Boolean, default: false },
});

export default model("Market", schema);
