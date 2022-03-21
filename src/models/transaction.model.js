import { Schema, model } from "mongoose";

const TokenAmountSchema = new Schema(
  {
    token: { type: String, lowercase: true },
    amount: { type: Number },
    amountUSD: { type: Number },
    price: { type: Number },
  },
  { _id: false }
);

const schema = new Schema({
  network: { type: String, index: true },
  id: { type: String, index: true },
  hash: { type: String },
  block: { type: Number },
  timestamp: { type: Date },
  market: { type: String, lowercase: true, index: true },
  yieldContract: { type: String, lowercase: true, index: true },
  user: { type: String, lowercase: true, index: true },
  action: { type: String, index: true },
  inputs: { type: [TokenAmountSchema] },
  outputs: { type: [TokenAmountSchema] },
  amountUSD: { type: Number },
});

export default model("Transaction", schema);
