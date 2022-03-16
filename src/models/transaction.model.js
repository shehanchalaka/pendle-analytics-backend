import { Schema, model } from "mongoose";

const TokenAmountSchema = new Schema(
  {
    token: { type: String },
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
  market: { type: String, index: true },
  yieldContract: { type: String, index: true },
  user: { type: String, index: true },
  action: { type: String, index: true },
  inputs: { type: [TokenAmountSchema] },
  outputs: { type: [TokenAmountSchema] },
  amountUSD: { type: Number },
});

export default model("Transaction", schema);
