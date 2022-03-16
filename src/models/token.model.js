import { Schema, model } from "mongoose";

const schema = new Schema({
  network: { type: String, index: true },
  address: { type: String, index: true },
  name: { type: String },
  symbol: { type: String },
  decimals: { type: Number },
  type: { type: String, index: true },
  expiry: { type: Date },
});

export default model("Token", schema);
