import { Schema, model } from "mongoose";

const schema = new Schema({
  network: { type: String, index: true },
  block: { type: Number },
  timestamp: { type: Date },
  token: { type: String, lowercase: true, index: true },
  from: { type: String, lowercase: true, index: true },
  to: { type: String, lowercase: true, index: true },
  value: { type: Number },
});

export default model("Transfer", schema);
