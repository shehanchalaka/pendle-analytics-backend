import { Schema, model } from "mongoose";

const schema = new Schema({
  network: { type: String, index: true },
  id: { type: String, lowercase: true, index: true },
  user: { type: String, lowercase: true, index: true },
  token: { type: String, lowercase: true, index: true },
  totalReceived: { type: Number },
  totalSent: { type: Number },
  balance: { type: Number },
});

export default model("UserToken", schema);
