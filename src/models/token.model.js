import { Schema, model } from "mongoose";

const schema = new Schema({
  network: { type: String, index: true },
  address: { type: String, lowercase: true, index: true },
  name: { type: String },
  symbol: { type: String },
  decimals: { type: Number },
  type: { type: String, index: true },
  expiry: { type: Date },
  forgeId: { type: String },
  underlyingToken: { type: String, lowercase: true },
});

export default model("Token", schema);
