import { Schema, model } from "mongoose";

const schema = new Schema({
  network: { type: String, index: true },
  block: { type: Number },
  timestamp: { type: Date },
  token: { type: String, index: true },
  from: { type: String, index: true },
  to: { type: String, index: true },
  value: { type: Number },
});

export default model("Transfer", schema);
